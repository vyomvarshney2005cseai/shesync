import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Animated,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type RecordingOptions,
} from 'expo-audio';
import { ArrowLeft, Check, Mic, Square, Trash2, Lock, Download, PenLine, BookOpen } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore, type JournalSpeechLang } from '@/store/useSettingsStore';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { JournalAudioPlayer } from '@/components/journal/JournalAudioPlayer';
import { pauseAppLock } from '@/lib/appLock';
import { formatClock, shortDateLabel } from '@/lib/dates';
import {
  downloadSpeechPack,
  getSpeechSupport,
  liveText,
  loadSpeechModule,
  mergeFinal,
  type SpeechSupport,
} from '@/lib/speech';
import {
  deleteJournalAudio,
  discardTempRecording,
  journalAudioUri,
  keepRecording,
} from '@/lib/journalAudio';
import type { SymptomLog } from '@/types';

const MAX_SECONDS = 10 * 60;

/** Small mono AAC: about 0.5 MB a minute. */
const AUDIO_ONLY_PRESET: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
};

const LANGS: { id: JournalSpeechLang; label: string }[] = [
  { id: 'en-IN', label: 'English' },
  { id: 'hi-IN', label: 'हिन्दी' },
];

const PROMPTS = [
  'Where in my body do I feel tension right now?',
  'What drained my energy today, and what gave some back?',
  'What is one kind thing I can do for myself tonight?',
];

const BAR_SHAPE = [0.35, 0.6, 0.9, 0.5, 1, 0.7, 0.4, 0.85, 1, 0.65, 0.45, 0.8, 0.95, 0.55, 0.4, 0.75, 0.9, 0.5];

type Phase = 'idle' | 'starting' | 'recording' | 'stopping';

function say(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

/**
 * Voice journal: records her voice and turns it into text on the phone.
 * - Speech mode (iOS 17+, Android 13+ with the offline voice pack): on-device
 *   speech recognition writes the words live while the audio is saved.
 * - Audio-only mode (older phones, Expo Go, web): records the audio; she
 *   adds a few words herself.
 * Audio stays on this phone; only the text is backed up.
 */
export default function VoiceJournalScreen() {
  const logSymptom = useAppStore((s) => s.logSymptom);
  const journalLang = useSettingsStore((s) => s.journalLang);
  const setJournalLang = useSettingsStore((s) => s.setJournalLang);

  const [checked, setChecked] = useState<{ lang: string; support: SpeechSupport } | null>(null);
  const support = checked?.lang === journalLang ? checked.support : null;
  const setSupport = (s: SpeechSupport) => setChecked({ lang: journalLang, support: s });
  const [useAudioOnly, setUseAudioOnly] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [speechLevel, setLevel] = useState(0); // 0..1 microphone level from the recogniser
  const [engine, setEngine] = useState<'speech' | 'audio'>('audio');
  const [committed, setCommitted] = useState('');
  const [interim, setInterim] = useState('');
  const [text, setText] = useState('');
  const [tempUri, setTempUri] = useState<string | null>(null);
  const [transcribed, setTranscribed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const recorder = useAudioRecorder(AUDIO_ONLY_PRESET);
  const recState = useAudioRecorderState(recorder, 150);
  const [pulse] = useState(() => new Animated.Value(1));
  const startedAt = useRef(0);
  const engineRef = useRef<'speech' | 'audio'>('audio');
  const savedRef = useRef(false);
  const tempRef = useRef<string | null>(null);
  const committedRef = useRef('');
  const stopRef = useRef<() => void>(() => {});

  const speechMode = support?.mode === 'speech' && !useAudioOnly;
  const needsModel = support?.mode === 'speech' && support.needsModel && !useAudioOnly;
  const recording = phase === 'recording';
  const meter = recState.metering;
  const level =
    engine === 'audio'
      ? recording && typeof meter === 'number'
        ? Math.max(0, Math.min(1, (meter + 55) / 50))
        : 0
      : speechLevel;

  // ─── Capabilities (per language) ─────────────────────────
  useEffect(() => {
    let alive = true;
    getSpeechSupport(journalLang).then((s) => {
      if (alive) setChecked({ lang: journalLang, support: s });
    });
    return () => {
      alive = false;
    };
  }, [journalLang]);

  // ─── Speech-recognition events ───────────────────────────
  useEffect(() => {
    let subs: { remove: () => void }[] = [];
    let alive = true;
    loadSpeechModule().then((mod) => {
      if (!mod || !alive) return;
      subs = [
        mod.addListener('start', () => setPhase('recording')),
        mod.addListener('result', (e) => {
          const t = e.results?.[0]?.transcript ?? '';
          if (e.isFinal) {
            committedRef.current = mergeFinal(committedRef.current, t);
            setCommitted(committedRef.current);
            setInterim('');
          } else setInterim(t);
        }),
        mod.addListener('volumechange', (e) => setLevel(Math.max(0, Math.min(1, (e.value + 2) / 12)))),
        mod.addListener('audioend', (e) => {
          if (e.uri) {
            tempRef.current = e.uri;
            setTempUri(e.uri);
          }
        }),
        mod.addListener('error', (e) => {
          setPhase((p) => (p === 'starting' ? 'idle' : p));
          if (e.error === 'aborted' || e.error === 'no-speech' || e.error === 'speech-timeout') return;
          if (e.error === 'language-not-supported' || e.error === 'service-not-allowed') {
            setChecked((c) => (c ? { lang: c.lang, support: { mode: 'speech', needsModel: true } } : c));
            setNotice('This phone needs the offline voice pack for this language first.');
          } else if (e.error === 'not-allowed') {
            setNotice('SheSync needs microphone and speech permission. You can turn them on in your phone’s settings.');
          } else if (e.error === 'network') {
            setNotice('Speech-to-text could not run on this phone. Record audio only, or type below.');
          } else {
            setNotice('Recording stopped unexpectedly. What was heard so far is kept.');
          }
        }),
        mod.addListener('end', () => {
          setPhase('idle');
          setLevel(0);
          setInterim('');
          const heard = committedRef.current.trim();
          if (heard) {
            setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${heard}` : heard));
            setTranscribed(true);
          }
          committedRef.current = '';
          setCommitted('');
        }),
      ];
    });
    return () => {
      alive = false;
      subs.forEach((s) => s.remove());
    };
  }, []);

  // ─── Timer, pulse and the 10-minute limit ────────────────
  useEffect(() => {
    if (!recording) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    const t = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(secs);
      if (secs >= MAX_SECONDS) stopRef.current();
    }, 250);
    return () => {
      loop.stop();
      clearInterval(t);
    };
  }, [recording, pulse]);

  const stop = useCallback(async () => {
    if (engineRef.current === 'speech') {
      setPhase('stopping');
      const mod = await loadSpeechModule();
      mod?.stop();
      return;
    }
    setPhase('stopping');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        tempRef.current = uri;
        setTempUri(uri);
      }
    } catch {
      setNotice('Could not finish the recording.');
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setLevel(0);
    setPhase('idle');
  }, [recorder]);

  useEffect(() => {
    stopRef.current = () => void stop();
  }, [stop]);

  // Leaving the app ends the recording (the app also locks).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' && phase === 'recording') void stop();
    });
    return () => sub.remove();
  }, [phase, stop]);

  // Leaving the screen without saving throws the recording away.
  useEffect(
    () => () => {
      loadSpeechModule().then((mod) => mod?.abort());
      if (!savedRef.current) void discardTempRecording(tempRef.current);
    },
    []
  );

  const start = async () => {
    setNotice('');
    // One recording per entry: a new one replaces the previous take.
    if (tempRef.current) {
      void discardTempRecording(tempRef.current);
      tempRef.current = null;
      setTempUri(null);
    }
    setPhase('starting');
    setSeconds(0);
    pauseAppLock(); // permission prompts are not "leaving" SheSync
    try {
      if (speechMode && !needsModel) {
        const mod = await loadSpeechModule();
        if (!mod) throw new Error('unavailable');
        const perm = await mod.requestPermissionsAsync();
        if (!perm.granted) {
          setPhase('idle');
          setNotice('SheSync needs microphone and speech permission to listen. You can turn them on in your phone’s settings.');
          return;
        }
        engineRef.current = 'speech';
        setEngine('speech');
        committedRef.current = '';
        startedAt.current = Date.now();
        mod.start({
          lang: journalLang,
          interimResults: true,
          continuous: true,
          requiresOnDeviceRecognition: true,
          addsPunctuation: true,
          iosTaskHint: 'dictation',
          volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
          recordingOptions: { persist: true, outputSampleRate: 16000, outputEncoding: 'pcmFormatInt16' },
        });
        return;
      }
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setPhase('idle');
        setNotice('SheSync needs microphone permission to record. You can turn it on in your phone’s settings.');
        return;
      }
      engineRef.current = 'audio';
      setEngine('audio');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      setPhase('recording');
    } catch {
      setPhase('idle');
      setNotice('The microphone could not start. Close other apps using it and try again.');
    }
  };

  const discard = () => {
    void discardTempRecording(tempRef.current);
    tempRef.current = null;
    setTempUri(null);
    setSeconds(0);
  };

  const getPack = async () => {
    setNotice('Opening the download…');
    const r = await downloadSpeechPack(journalLang);
    if (r === 'failed') setNotice('Could not start the download. You can record audio only for now.');
    else {
      setNotice(r === 'downloaded' ? 'Voice pack ready.' : 'Download started. Come back once it has finished.');
      const s = await getSpeechSupport(journalLang);
      setSupport(s);
    }
  };

  const handleSave = async () => {
    const body = text.trim();
    if (!body && !tempUri) {
      say('Nothing to save yet', 'Record your voice or write a few words first.');
      return;
    }
    setSaving(true);
    try {
      const audioFile = tempUri ? await keepRecording(tempUri) : null;
      savedRef.current = true;
      const length = seconds > 0 ? formatClock(seconds) : undefined;
      logSymptom({
        voiceJournal: true,
        transcript: body || undefined,
        transcriptSource: transcribed ? 'speech' : 'typed',
        audioFile: audioFile ?? undefined,
        audioDuration: audioFile || tempUri ? length : undefined,
        notes: `[Journal${length && (audioFile || tempUri) ? ` · ${length} audio` : ''}] ${body || '(voice note)'}`,
      });
      tempRef.current = null;
      router.back();
    } catch {
      setSaving(false);
      say('Could not save', 'Please try again.');
    }
  };

  const live = liveText(committed, interim);

  const modeBanner = (() => {
    if (!support) return null;
    if (speechMode && !needsModel)
      return {
        icon: <Lock size={14} color={Theme.colors.strainOptimal} />,
        text: 'Speech-to-text runs on this phone. Your voice never leaves it.',
        tone: styles.bannerOk,
      };
    if (support.mode === 'audio') {
      const why =
        support.reason === 'web'
          ? 'In the browser your voice is recorded for this visit only — only the text is saved. Speech-to-text works in the phone app.'
          : support.reason === 'not-in-build'
          ? 'This version of the app records audio only. Speech-to-text needs the full SheSync build (it isn’t in Expo Go).'
          : support.reason === 'old-phone'
          ? 'Speech-to-text on the phone needs Android 13 or newer. Your voice is still recorded and saved here.'
          : 'This phone can’t turn speech into text offline. Your voice is still recorded and saved here.';
      return { icon: <Mic size={14} color={Theme.colors.textSecondary} />, text: why, tone: styles.bannerInfo };
    }
    if (useAudioOnly)
      return {
        icon: <Mic size={14} color={Theme.colors.textSecondary} />,
        text: 'Recording audio only. Add a few words below.',
        tone: styles.bannerInfo,
      };
    return null;
  })();

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7} accessibilityLabel="Back">
            <ArrowLeft size={22} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Voice Journal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollWrapper} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {support?.mode === 'speech' && (
            <View style={styles.langRow}>
              <Text style={styles.langLabel}>I’ll speak in</Text>
              {LANGS.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setJournalLang(l.id)}
                  disabled={phase !== 'idle'}
                  style={[styles.langChip, journalLang === l.id && styles.langChipOn]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langChipText, journalLang === l.id && styles.langChipTextOn]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {needsModel ? (
            <View style={styles.packCard}>
              <Text style={styles.packTitle}>One-time download</Text>
              <Text style={styles.packText}>
                To turn speech into text without the internet, this phone needs its offline{' '}
                {journalLang === 'hi-IN' ? 'Hindi' : 'English (India)'} voice pack from Google.
              </Text>
              <View style={styles.packRow}>
                <TouchableOpacity style={styles.packBtn} onPress={getPack} activeOpacity={0.85}>
                  <Download size={15} color={themed('#FFFFFF')} />
                  <Text style={styles.packBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.packGhost} onPress={() => setUseAudioOnly(true)} activeOpacity={0.8}>
                  <Text style={styles.packGhostText}>Record audio only</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            modeBanner && (
              <View style={[styles.banner, modeBanner.tone]}>
                {modeBanner.icon}
                <Text style={styles.bannerText}>{modeBanner.text}</Text>
              </View>
            )
          )}

          {/* Recorder */}
          <View style={styles.recordCard}>
            <Text style={styles.statusText}>
              {phase === 'starting'
                ? 'Starting the microphone…'
                : recording
                ? speechMode
                  ? 'Listening — speak naturally'
                  : 'Recording'
                : phase === 'stopping'
                ? 'Finishing…'
                : tempUri
                ? 'Recording ready'
                : 'Tap the mic and talk it through'}
            </Text>
            <Text style={styles.timerText}>{formatClock(seconds)}</Text>

            <View style={styles.waveform} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {BAR_SHAPE.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: recording ? 6 + h * (8 + level * 52) : 6 + h * 6,
                      backgroundColor: recording ? Theme.colors.primary : Theme.colors.cardBorder,
                    },
                  ]}
                />
              ))}
            </View>

            <Animated.View style={[styles.pulseHalo, recording && { transform: [{ scale: pulse }], backgroundColor: themed('rgba(201, 87, 140, 0.2)') }]}>
              <TouchableOpacity
                style={[styles.recordBtn, recording && styles.recordBtnActive, (needsModel || !support) && styles.recordBtnOff]}
                onPress={recording ? () => void stop() : () => void start()}
                disabled={!support || needsModel || phase === 'starting' || phase === 'stopping'}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
              >
                {phase === 'starting' || phase === 'stopping' ? (
                  <ActivityIndicator color={themed('#FFFFFF')} />
                ) : recording ? (
                  <Square size={26} color={themed('#FFFFFF')} />
                ) : (
                  <Mic size={30} color={themed('#FFFFFF')} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {recording && speechMode && (
              <Text style={[styles.liveText, !live && styles.liveEmpty]}>{live || 'Your words will appear here…'}</Text>
            )}

            {tempUri && phase === 'idle' && (
              <View style={styles.takeRow}>
                <View style={{ flex: 1 }}>
                  <JournalAudioPlayer uri={tempUri} />
                </View>
                <TouchableOpacity onPress={discard} style={styles.iconBtn} accessibilityLabel="Delete this recording">
                  <Trash2 size={18} color={Theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          </View>

          {/* Words */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <PenLine size={17} color={Theme.colors.secondary} />
              <Text style={styles.sectionTitle}>{transcribed ? 'Your words (edit if needed)' : 'Your reflection'}</Text>
            </View>
            <TextInput
              style={styles.input}
              multiline
              value={text}
              onChangeText={setText}
              placeholder={speechMode ? 'What you say appears here — or type it.' : 'How does your body feel today? What is on your mind?'}
              placeholderTextColor={Theme.colors.textTertiary}
            />
            <View style={styles.prompts}>
              {PROMPTS.map((q) => (
                <TouchableOpacity
                  key={q}
                  onPress={() => setText((t) => (t ? `${t}\n\n${q} ` : `${q} `))}
                  activeOpacity={0.8}
                  style={styles.prompt}
                >
                  <Text style={styles.promptText}>＋ {q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (saving || recording) && styles.saveOff]}
            activeOpacity={0.85}
            onPress={() => void handleSave()}
            disabled={saving || recording || phase !== 'idle'}
          >
            <Check size={20} color={themed('#FFFFFF')} />
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save journal entry'}</Text>
          </TouchableOpacity>

          <PastEntries />
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

/** Her last journal entries: read, listen, delete. */
function PastEntries() {
  const logs = useAppStore((s) => s.symptomLogs);
  const deleteLog = useAppStore((s) => s.deleteSymptomLog);
  const entries = useMemo(() => logs.filter((l) => l.voiceJournal).slice(0, 20), [logs]);
  if (!entries.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <BookOpen size={17} color={Theme.colors.primaryDark} />
        <Text style={styles.sectionTitle}>Past entries</Text>
      </View>
      {entries.map((e) => (
        <PastEntry
          key={e.id}
          entry={e}
          onDelete={() => {
            const go = () => {
              deleteLog(e.id);
              void deleteJournalAudio(e.audioFile);
            };
            if (Platform.OS === 'web') {
              if (window.confirm('Delete this journal entry?')) go();
            } else {
              Alert.alert('Delete this entry?', 'The text and the recording are removed.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: go },
              ]);
            }
          }}
        />
      ))}
    </View>
  );
}

function PastEntry({ entry, onDelete }: { entry: SymptomLog; onDelete: () => void }) {
  const [uri, setUri] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    journalAudioUri(entry.audioFile).then((u) => alive && setUri(u));
    return () => {
      alive = false;
    };
  }, [entry.audioFile]);

  const body = entry.transcript || entry.notes?.replace(/^\[Journal[^\]]*\]\s*/, '') || '';
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.entry}>
      <View style={styles.entryHead}>
        <Text style={styles.entryDate}>
          {shortDateLabel(entry.date)} · {time}
          {entry.transcriptSource === 'speech' ? ' · spoken' : ''}
        </Text>
        <TouchableOpacity onPress={onDelete} style={styles.iconBtnSm} accessibilityLabel="Delete entry">
          <Trash2 size={15} color={Theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>
      {body ? (
        <TouchableOpacity onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
          <Text style={styles.entryText} numberOfLines={open ? undefined : 3}>
            {body}
          </Text>
        </TouchableOpacity>
      ) : null}
      {uri ? (
        <View style={{ marginTop: 8 }}>
          <JournalAudioPlayer uri={uri} compact />
        </View>
      ) : entry.audioFile ? (
        <Text style={styles.entryNote}>Recording is on the phone it was made on.</Text>
      ) : null}
    </View>
  );
}

const styles = createStyles(() => ({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  scrollWrapper: { flex: 1, width: '100%' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 226, 235, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 17, fontWeight: '800', color: Theme.colors.textPrimary },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
  },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langLabel: { fontSize: 13, fontWeight: '700', color: Theme.colors.textSecondary, marginRight: 2 },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.card,
  },
  langChipOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  langChipText: { fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary },
  langChipTextOn: { color: '#FFFFFF' },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
  },
  bannerOk: { backgroundColor: Theme.colors.sageLight, borderColor: '#BFE3D8' },
  bannerInfo: { backgroundColor: Theme.colors.backgroundAlt, borderColor: Theme.colors.cardBorder },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: Theme.colors.textPrimary },
  packCard: {
    padding: 14,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.secondaryLight,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
    gap: 8,
  },
  packTitle: { fontSize: 14.5, fontWeight: '800', color: Theme.colors.textPrimary },
  packText: { fontSize: 13, lineHeight: 19, color: Theme.colors.textPrimary },
  packRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  packBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.radius.full,
  },
  packBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  packGhost: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
  },
  packGhostText: { fontSize: 13, fontWeight: '800', color: Theme.colors.secondaryDark },
  recordCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary, letterSpacing: 0.3 },
  timerText: { fontSize: 44, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -1, marginVertical: 2 },
  waveform: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 70, gap: 5, marginVertical: 8 },
  waveBar: { width: 4, borderRadius: 2 },
  pulseHalo: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.glowing,
  },
  recordBtnActive: { backgroundColor: Theme.colors.strainHigh },
  recordBtnOff: { opacity: 0.45 },
  liveText: { marginTop: 12, fontSize: 14, lineHeight: 21, color: Theme.colors.textPrimary, textAlign: 'center' },
  liveEmpty: { color: Theme.colors.textTertiary, fontStyle: 'italic' },
  takeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, alignSelf: 'stretch' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.backgroundMuted,
  },
  iconBtnSm: { padding: 6 },
  notice: { marginTop: 12, fontSize: 12.5, lineHeight: 18, color: Theme.colors.textSecondary, textAlign: 'center' },
  section: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  input: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 14,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    lineHeight: 21,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  prompts: { gap: 8, marginTop: 12 },
  prompt: {
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  promptText: { fontSize: 12.5, color: Theme.colors.textPrimary, lineHeight: 17 },
  saveButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Theme.shadows.glowing,
  },
  saveOff: { opacity: 0.55 },
  saveButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  entry: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder },
  entryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryDate: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  entryText: { fontSize: 13.5, lineHeight: 20, color: Theme.colors.textPrimary, marginTop: 4 },
  entryNote: { fontSize: 12, color: Theme.colors.textTertiary, marginTop: 6, fontStyle: 'italic' },
}));
