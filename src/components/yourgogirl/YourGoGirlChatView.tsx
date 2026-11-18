import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import {
  Sparkles,
  Send,
  Heart,
  Brain,
  ArrowLeft,
  CheckCircle2,
  Flame,
  Compass,
  AlertTriangle,
  Stethoscope,
  Phone,
  ChevronRight,
  EllipsisVertical,
  FileDown,
  Trash2,
  Copy,
  Share2,
} from 'lucide-react-native';
import { router, type Href } from 'expo-router';
import { callNumber, openUrl } from '@/lib/openExternal';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore, type ChatLanguageSetting } from '@/store/useSettingsStore';
import { usePcosStore } from '@/store/usePcosStore';
import {
  QUICK_PROMPT_TOPICS,
  generateYourGoGirlResponse,
  createInitialWelcomeMessage,
  quickTopicLabel,
  displayQuestion,
} from '@/lib/yourGoGirlEngine';
import { LANGUAGE_OPTIONS, UI } from '@/lib/yourGoGirlLang';
import { chatFileName, chatToText, messageToText } from '@/lib/chatExport';
import { saveTextFile } from '@/lib/files';
import { pauseAppLock } from '@/lib/appLock';
import type { ChatLanguage, CounsellorMode, YourGoGirlAction, YourGoGirlMessage } from '@/types';
import type { DoctorPrepInput } from '@/lib/doctorVisitPrep';

async function shareText(text: string) {
  try {
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? (navigator as Partial<Navigator>) : undefined;
      if (nav?.share) await nav.share({ text });
      else if (nav?.clipboard) {
        await nav.clipboard.writeText(text);
        window.alert('Copied — paste it into a note or message.');
      }
      return;
    }
    pauseAppLock(); // the share sheet is not "leaving" SheSync
    await Share.share({ message: text });
  } catch {
    // Cancelled.
  }
}

async function copyText(text: string) {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
  } catch {
    // Not available.
  }
}

function runAction(a: YourGoGirlAction) {
  if (a.kind === 'call') callNumber(a.value, a.label);
  else if (a.kind === 'url') openUrl(a.value);
  else if (a.kind === 'share') void shareText(a.value);
  else router.push(a.value as Href);
}

function confirmAction(title: string, body: string, action: string, cancel: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${body}`)) onYes();
    return;
  }
  Alert.alert(title, body, [
    { text: cancel, style: 'cancel' },
    { text: action, style: 'destructive', onPress: onYes },
  ]);
}

interface YourGoGirlChatViewProps {
  showBackButton?: boolean;
}

function makeUserMessage(trimmed: string): YourGoGirlMessage {
  return {
    id: `user-${Date.now()}`,
    sender: 'user',
    text: trimmed,
    category: 'general',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

/** A short note from YourGoGirl (e.g. after switching language). */
function makeBotNote(text: string, lang: ChatLanguage): YourGoGirlMessage {
  return {
    id: `bot-note-${Date.now()}`,
    sender: 'bot',
    text,
    lang,
    category: 'general',
    createdAt: new Date().toISOString(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

const SWITCH_NAMES: Record<ChatLanguageSetting, Record<ChatLanguage, string>> = {
  auto: { en: 'the language you write in', hinglish: 'usi language (jismein aap likhogi)', hi: 'उसी भाषा (जिसमें आप लिखेंगी)' },
  en: { en: 'English', hinglish: 'English', hi: 'English' },
  hinglish: { en: 'Hinglish', hinglish: 'Hinglish', hi: 'Hinglish' },
  hi: { en: 'हिन्दी', hinglish: 'हिन्दी', hi: 'हिन्दी' },
};

export const YourGoGirlChatView: React.FC<YourGoGirlChatViewProps> = ({
  showBackButton = false,
}) => {
  const userName = useAppStore((s) => s.userName);
  const cycle = useAppStore((s) => s.cycle);
  const biometrics = useAppStore((s) => s.biometrics);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const fineTuningSettings = useAppStore((s) => s.fineTuningSettings);
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);
  const messages = useAppStore((s) => s.yourGoGirlMessages);
  // One built-in style: warm and practical (the mode picker was removed).
  const mode: CounsellorMode = 'empathetic_counsellor';
  const addMessage = useAppStore((s) => s.addYourGoGirlMessage);
  const clearChat = useAppStore((s) => s.clearYourGoGirlChat);
  const deleteMessage = useAppStore((s) => s.deleteYourGoGirlMessage);
  const language = useSettingsStore((s) => s.chatLanguage);
  const setLanguage = useSettingsStore((s) => s.setChatLanguage);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<YourGoGirlMessage | null>(null);
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const lastBotLang = useMemo(
    () => [...messages].reverse().find((m) => m.sender === 'bot' && m.lang)?.lang,
    [messages]
  );
  // Labels follow her choice; on Auto they follow YourGoGirl's last reply.
  const uiLang: ChatLanguage = language === 'auto' ? lastBotLang ?? 'en' : language;
  const ui = UI[uiLang];

  useEffect(() => {
    if (!messages || messages.length === 0) {
      addMessage(createInitialWelcomeMessage(userName, language === 'auto' ? 'en' : language));
    }
  }, [messages, userName, language, addMessage]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, [messages?.length, isTyping]);

  const getDoctorPrepInput = (): DoctorPrepInput => {
    const s = useAppStore.getState();
    const pcos = usePcosStore.getState();
    const latest = pcos.checkins[0];
    return {
      symptomLogs: s.symptomLogs,
      sleepLogs: s.sleepLogs,
      pastCycles: s.pastCycles,
      cyclePrediction: s.cyclePrediction,
      healthCheck: s.healthCheck,
      assessmentAnswers: s.assessmentAnswers,
      sleepTarget: s.fineTuningSettings.dailySleepTargetHours || 8,
      pcosDiagnosed: pcos.diagnosed === 'yes',
      pcosSigns: !!latest && (latest.acne >= 2 || latest.bodyHair >= 2),
    };
  };

  /** `shown` is what appears in her bubble; `query` is what YourGoGirl reads (chips send English wording). */
  const handleSendMessage = async (shown?: string, query?: string) => {
    const trimmed = (shown ?? inputText).trim();
    if (!trimmed || isTyping) return;

    if (shown === undefined) {
      setInputText('');
    }

    addMessage(makeUserMessage(trimmed));
    setIsTyping(true);

    // The topic of YourGoGirl's last answer lets "tell me more" continue it.
    const lastIntentId = [...messages].reverse().find((m) => m.sender === 'bot')?.intentId;

    try {
      const botReply = await generateYourGoGirlResponse((query ?? trimmed).trim(), {
        userName,
        cycle,
        biometrics,
        symptomLogs,
        fineTuningSettings,
        mode,
        cyclePrediction,
        lastIntentId,
        language,
        // A tapped chip keeps the current language even though it sends English wording.
        previousLang: query ? uiLang : lastBotLang,
        getDoctorPrepInput,
      });
      addMessage(botReply);
    } finally {
      setIsTyping(false);
    }
  };

  const changeLanguage = (next: ChatLanguageSetting) => {
    if (next === language) return;
    setLanguage(next);
    const lang: ChatLanguage = next === 'auto' ? uiLang : next;
    addMessage(makeBotNote(UI[lang].switched(SWITCH_NAMES[next][lang]), lang));
  };

  const exportChat = async () => {
    setMenuOpen(false);
    try {
      await saveTextFile(chatFileName(), chatToText(messages, userName), 'text/plain');
    } catch {
      if (Platform.OS !== 'web') Alert.alert('Could not export', 'Please try again.');
    }
  };

  const deleteAll = () => {
    setMenuOpen(false);
    confirmAction(ui.confirmDeleteAllTitle, ui.confirmDeleteAllBody, ui.delete, ui.cancel, clearChat);
  };

  // Helper to render bold segments wrapped in **...**
  const renderFormattedText = (raw: string, isUser: boolean, textStyle?: object) => {
    const parts = raw.split(/(\*\*[\s\S]*?\*\*)/g);
    return (
      <Text style={[textStyle ?? styles.messageText, isUser && styles.userMessageText]}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text
                key={idx}
                style={[styles.boldText, isUser && styles.userBoldText]}
              >
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={idx}>{part}</Text>;
        })}
      </Text>
    );
  };

  const cycleSubtitle = cycle.hasCycleData
    ? uiLang === 'hi'
      ? `दिन ${cycle.currentDay} · ${cycle.phase}`
      : `Day ${cycle.currentDay} · ${cycle.phase} phase`
    : ui.subtitleNoCycle;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top Counsellor Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            {showBackButton && (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                activeOpacity={0.7}
                accessibilityLabel="Back"
              >
                <ArrowLeft size={20} color={Theme.colors.textPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.avatarRing}>
              <View style={styles.avatarCore}>
                <Sparkles size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.titleCol}>
              <Text style={styles.botName}>YourGoGirl</Text>
              <Text style={styles.botSubtitle} numberOfLines={1}>
                {cycleSubtitle}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.resetBtn}
            activeOpacity={0.7}
            accessibilityLabel="Chat options: export or delete"
          >
            <EllipsisVertical size={17} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Reply language */}
        <View style={styles.langRow} accessibilityRole="radiogroup">
          <Text style={styles.langLabel}>{ui.language}</Text>
          {LANGUAGE_OPTIONS.map((o) => {
            const on = language === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => changeLanguage(o.id)}
                style={[styles.langChip, on && styles.langChipOn]}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.langChipText, on && styles.langChipTextOn]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Chat Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Topic Starter Cards */}
        <View style={styles.topicsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScroll}
          >
            {QUICK_PROMPT_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicCard, topic.id === 'doctor_prep' && styles.topicCardPrep]}
                onPress={() => handleSendMessage(displayQuestion(topic.prompt, uiLang), topic.prompt)}
                activeOpacity={0.8}
              >
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                <Text style={styles.topicLabel}>{quickTopicLabel(topic, uiLang)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Conversation Messages */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const words = UI[msg.lang ?? uiLang];
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.botRow,
              ]}
            >
              {!isUser && (
                <View style={styles.msgAvatar}>
                  <Heart size={14} color="#FFFFFF" />
                </View>
              )}

              <Pressable
                onLongPress={() => setSelected(msg)}
                delayLongPress={350}
                accessibilityHint="Press and hold for copy and delete"
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.botBubble,
                ]}
              >
                {!isUser && msg.urgent && (
                  <View style={styles.urgentBanner}>
                    <AlertTriangle size={14} color="#A33B55" />
                    <Text style={styles.urgentText}>{words.urgent}</Text>
                  </View>
                )}

                {renderFormattedText(msg.text, isUser)}

                {/* Biological Why Card (for Bot responses) */}
                {!isUser && msg.biologicalWhy && (
                  <View style={styles.bioCard}>
                    <View style={styles.bioCardHeader}>
                      <Brain size={14} color={Theme.colors.secondary} />
                      <Text style={styles.bioCardTitle}>{words.why}</Text>
                    </View>
                    <Text style={styles.bioCardBody}>{msg.biologicalWhy}</Text>
                  </View>
                )}

                {/* Gentle Actionable Counselling Steps */}
                {!isUser &&
                  msg.gentleActionSteps &&
                  msg.gentleActionSteps.length > 0 && (
                    <View style={styles.stepsCard}>
                      <View style={styles.stepsHeader}>
                        <Compass size={14} color={Theme.colors.primaryDark} />
                        <Text style={styles.stepsTitle}>{words.help}</Text>
                      </View>
                      {msg.gentleActionSteps.map((step, i) => (
                        <View key={i} style={styles.stepRow}>
                          <CheckCircle2
                            size={14}
                            color={Theme.colors.strainOptimal}
                            style={{ marginTop: 2 }}
                          />
                          {renderFormattedText(step, false, styles.stepText)}
                        </View>
                      ))}
                    </View>
                  )}

                {/* When to see a doctor */}
                {!isUser && msg.whenToSeeDoctor && (
                  <View style={styles.doctorCard}>
                    <View style={styles.stepsHeader}>
                      <Stethoscope size={14} color="#9A5A2E" />
                      <Text style={styles.doctorTitle}>{words.doctor}</Text>
                    </View>
                    {renderFormattedText(msg.whenToSeeDoctor, false, styles.doctorText)}
                  </View>
                )}

                {/* Action buttons (call a helpline, open a screen, share) */}
                {!isUser && msg.actions && msg.actions.length > 0 && (
                  <View style={styles.actionsRow}>
                    {msg.actions.map((a) => (
                      <TouchableOpacity
                        key={`${a.kind}-${a.label}`}
                        style={[styles.actionBtn, a.kind === 'call' && styles.actionBtnCall]}
                        onPress={() => runAction(a)}
                        activeOpacity={0.8}
                      >
                        {a.kind === 'call' ? (
                          <Phone size={13} color="#FFFFFF" />
                        ) : a.kind === 'share' ? (
                          <Share2 size={13} color={Theme.colors.primaryDark} />
                        ) : (
                          <ChevronRight size={13} color={Theme.colors.primaryDark} />
                        )}
                        <Text style={[styles.actionText, a.kind === 'call' && styles.actionTextCall]}>{a.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Empowering Affirmation Banner */}
                {!isUser && msg.affirmation && (
                  <View style={styles.affirmationBox}>
                    <Flame size={13} color={Theme.colors.primary} />
                    <Text style={styles.affirmationText}>
                      &ldquo;{msg.affirmation}&rdquo;
                    </Text>
                  </View>
                )}

                {/* Follow-Up Counselling Suggestions */}
                {!isUser &&
                  msg.followUpSuggestions &&
                  msg.followUpSuggestions.length > 0 && (
                    <View style={styles.followUpContainer}>
                      <Text style={styles.followUpHeader}>{words.youCouldAsk}</Text>
                      <View style={styles.followUpList}>
                        {msg.followUpSuggestions.map((sugg, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.followUpChip}
                            onPress={() => handleSendMessage(sugg, msg.followUpQueries?.[idx] ?? sugg)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.followUpChipText}>{sugg}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                <Text
                  style={[
                    styles.timestampText,
                    isUser && styles.userTimestampText,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <View style={[styles.messageRow, styles.botRow]}>
            <View style={styles.msgAvatar}>
              <Heart size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={styles.typingText}>{ui.typing}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Input Composer */}
      <View style={styles.composerBar}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={ui.placeholder}
          placeholderTextColor={Theme.colors.textTertiary}
          multiline
          maxLength={600}
          onSubmitEditing={() => handleSendMessage()}
          onKeyPress={(e) => {
            // Web: Enter sends, Shift+Enter adds a new line.
            const ne = e.nativeEvent as { key?: string; shiftKey?: boolean };
            if (Platform.OS === 'web' && ne.key === 'Enter' && !ne.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
          accessibilityLabel="Send"
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chat menu: export / delete all */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => void exportChat()} activeOpacity={0.8}>
              <FileDown size={18} color={Theme.colors.primaryDark} />
              <Text style={styles.menuText}>{ui.menuExport}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={deleteAll} activeOpacity={0.8}>
              <Trash2 size={18} color="#C0392B" />
              <Text style={[styles.menuText, styles.menuDanger]}>{ui.menuDeleteAll}</Text>
            </TouchableOpacity>
            <Text style={styles.menuTip}>{ui.menuTip}</Text>
          </View>
        </Pressable>
      </Modal>

      {/* One message: copy / delete */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSelected(null)}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetPreview} numberOfLines={3}>
              {selected ? messageToText(selected) : ''}
            </Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (selected) void copyText(messageToText(selected));
                setSelected(null);
              }}
              activeOpacity={0.8}
            >
              <Copy size={18} color={Theme.colors.primaryDark} />
              <Text style={styles.menuText}>{ui.copy}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (selected) deleteMessage(selected.id);
                setSelected(null);
              }}
              activeOpacity={0.8}
            >
              <Trash2 size={18} color="#C0392B" />
              <Text style={[styles.menuText, styles.menuDanger]}>{ui.deleteOne}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuCancel]} onPress={() => setSelected(null)} activeOpacity={0.8}>
              <Text style={styles.menuCancelText}>{ui.cancel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = createStyles(() => ({
  keyboardContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder,
    ...Theme.shadows.soft,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    backgroundColor: '#FFE4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Theme.colors.strainOptimal,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  aiPill: {
    backgroundColor: Theme.colors.secondaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.secondaryDark,
    letterSpacing: 0.5,
  },
  botSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  resetBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  bioSyncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFF5F8',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFD8E4',
  },
  bioSyncText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    flex: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  langLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textSecondary, marginRight: 2 },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  langChipOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  langChipText: { fontSize: 11.5, fontWeight: '700', color: Theme.colors.textPrimary },
  langChipTextOn: { color: '#FFFFFF' },
  topicCardPrep: { borderColor: 'rgba(154, 90, 46, 0.35)', backgroundColor: '#FFF6EC' },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 34, 54, 0.25)',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'web' ? 70 : 110,
    paddingHorizontal: 14,
  },
  menuCard: {
    width: 270,
    maxWidth: '92%',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.lg,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.glowing,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  menuText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary, flexShrink: 1 },
  menuDanger: { color: '#C0392B' },
  menuTip: { fontSize: 11.5, color: Theme.colors.textTertiary, paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(43, 34, 54, 0.35)', justifyContent: 'flex-end', alignItems: 'center' },
  sheetCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 14,
    paddingBottom: 26,
  },
  sheetPreview: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
    paddingHorizontal: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.cardBorder,
  },
  menuCancel: { justifyContent: 'center' },
  menuCancelText: { fontSize: 14, fontWeight: '800', color: Theme.colors.textSecondary, textAlign: 'center', flex: 1 },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  topicsWrapper: {
    marginBottom: 4,
  },
  topicsHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.7,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  topicsScroll: {
    gap: 8,
    paddingRight: 12,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  topicEmoji: {
    fontSize: 15,
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '88%',
    borderRadius: Theme.radius.xl,
    padding: 15,
  },
  userBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 6,
    ...Theme.shadows.soft,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.textPrimary,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  userBoldText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bioCard: {
    marginTop: 12,
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: Theme.radius.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  bioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bioCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.secondaryDark,
    letterSpacing: 0.5,
  },
  bioCardBody: {
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textPrimary,
  },
  stepsCard: {
    marginTop: 10,
    backgroundColor: '#FFF5F8',
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE0EA',
    gap: 7,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stepsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primaryDark,
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.textPrimary,
  },
  affirmationBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  affirmationText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#92400E',
  },
  followUpContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFF0F5',
  },
  followUpHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 6,
  },
  followUpList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  followUpChip: {
    backgroundColor: Theme.colors.backgroundAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: '#FFD6E4',
  },
  followUpChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
  },
  timestampText: {
    fontSize: 10,
    color: Theme.colors.textTertiary,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestampText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDECEF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3C4CF',
  },
  urgentText: { flex: 1, fontSize: 12, fontWeight: '800', color: '#A33B55' },
  doctorCard: {
    marginTop: 10,
    backgroundColor: '#FFF6EC',
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F6DDBF',
    gap: 4,
  },
  doctorTitle: { fontSize: 10, fontWeight: '800', color: '#9A5A2E', letterSpacing: 0.5 },
  doctorText: { fontSize: 12.5, lineHeight: 18, color: Theme.colors.textPrimary },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(201, 87, 140, 0.25)',
  },
  actionBtnCall: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  actionText: { fontSize: 12, fontWeight: '800', color: Theme.colors.primaryDark },
  actionTextCall: { color: '#FFFFFF' },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
}));
