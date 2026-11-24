import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { HeartHandshake, MessageCircle, Phone, Siren, Sparkles, UserPlus, X } from 'lucide-react-native';
import { AuthGate } from '@/components/common/AuthGate';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { Grounding } from '@/components/sos/Grounding';
import { HapticBreathing } from '@/components/sos/HapticBreathing';
import { reduceMotionNow } from '@/lib/motion';
import { Theme, createStyles, themed } from '@/constants/theme';
import { callNumber, composeSms, CRISIS_LINES } from '@/lib/openExternal';
import { pauseAppLock } from '@/lib/appLock';
import { ROUTES } from '@/lib/routes';
import { isValidPhone, useSafetyStore } from '@/store/useSafetyStore';
import { Button, Chip } from '@/components/ds';

const HELP_TEXT = "Hey, I'm having a really hard time right now. Can you call me or come over?";
/** A crisis call should not end at a lock screen: no app lock for 30 minutes. */
const CALL_GRACE_MS = 30 * 60_000;

export default function SOSScreen() {
  return (
    <AuthGate>
      <SOS />
    </AuthGate>
  );
}

function SOS() {
  const trusted = useSafetyStore((s) => s.trusted);
  const setTrusted = useSafetyStore((s) => s.setTrusted);
  const [tab, setTab] = useState<'breathe' | 'ground'>('breathe');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(trusted?.name ?? '');
  const [phone, setPhone] = useState(trusted?.phone ?? '');
  const [formError, setFormError] = useState('');
  const [reachOut, setReachOut] = useState(false);
  const [calmer, setCalmer] = useState(false);
  const scroller = useRef<React.ElementRef<typeof ScrollView>>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/mind' as never);
  };

  const call = (number: string, label: string) => {
    pauseAppLock(CALL_GRACE_MS);
    void callNumber(number, label);
  };

  const saveTrusted = () => {
    if (!name.trim()) return setFormError('Add their name.');
    if (!isValidPhone(phone)) return setFormError('Add a phone number, e.g. +91 98765 43210.');
    setTrusted({ name, phone });
    setEditing(false);
    setFormError('');
  };

  const showForm = editing || !trusted;

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView ref={scroller} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <View style={styles.heart}>
              <HeartHandshake size={24} color={Theme.colors.strainHigh} />
            </View>
            <Button variant="secondary" size="sm" iconOnly onPress={close} accessibilityLabel="Close SOS" icon={<X size={20} color={Theme.colors.textSecondary} />} style={styles.close} />
          </View>
          <Text style={styles.title}>You’re not alone</Text>
          <Text style={styles.sub}>This feeling is real, and it will pass. Pick one thing that helps right now.</Text>

          {/* ── One-tap people ───────────────────────── */}
          <View style={[styles.card, reachOut && styles.cardReach]}>
            {reachOut ? (
              <Text style={styles.reachText}>Talking to someone helps. You don’t have to explain everything — just say you need them.</Text>
            ) : null}

            {trusted && !editing ? (
              <>
                <Button
                  size="lg"
                  fullWidth
                  title={`Call ${trusted.name}`}
                  onPress={() => call(trusted.phone, trusted.name)}
                  icon={<Phone size={20} color={Theme.colors.onPrimary} />}
                />
                <View style={styles.row}>
                  <Button
                    variant="secondary"
                    title={`Text ${trusted.name}`}
                    onPress={() => {
                      pauseAppLock(CALL_GRACE_MS);
                      void composeSms(HELP_TEXT, trusted.phone);
                    }}
                    icon={<MessageCircle size={18} color={Theme.colors.textPrimary} />}
                    style={{ flex: 1 }}
                  />
                  <Button variant="link" title="Change" onPress={() => setEditing(true)} style={styles.linkBtn} />
                </View>
              </>
            ) : null}

            {showForm ? (
              <View style={styles.form}>
                <View style={styles.formHead}>
                  <UserPlus size={16} color={Theme.colors.secondaryDark} />
                  <Text style={styles.formTitle}>Someone you trust</Text>
                </View>
                <Text style={styles.formSub}>A friend, sister, parent or partner — one tap calls them from here. Saved only on this phone.</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Name, e.g. Didi"
                  placeholderTextColor={Theme.colors.textTertiary}
                  style={styles.input}
                  accessibilityLabel="Trusted person's name"
                  maxLength={40}
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone, e.g. +91 98765 43210"
                  placeholderTextColor={Theme.colors.textTertiary}
                  style={styles.input}
                  keyboardType="phone-pad"
                  accessibilityLabel="Trusted person's phone number"
                  maxLength={20}
                />
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <View style={styles.row}>
                  <Button title="Save" onPress={saveTrusted} size="sm" />
                  {editing ? (
                    <>
                      <Button variant="link" title="Cancel" onPress={() => setEditing(false)} style={styles.linkBtn} />
                      <Button
                        variant="link"
                        title="Remove"
                        onPress={() => {
                          setTrusted(null);
                          setName('');
                          setPhone('');
                          setEditing(false);
                        }}
                        style={styles.linkBtn}
                      />
                    </>
                  ) : null}
                </View>
              </View>
            ) : null}

            <Button
              size="lg"
              fullWidth
              variant="secondary"
              title={`Call Tele-MANAS ${CRISIS_LINES.teleManas.number} · free, 24×7`}
              accessibilityLabel="Call Tele-MANAS 14416, free and open 24 hours, trained counsellors in your language"
              onPress={() => call(CRISIS_LINES.teleManas.number, CRISIS_LINES.teleManas.label)}
              icon={<Phone size={20} color={Theme.colors.textPrimary} />}
            />
          </View>

          {/* ── Calm the body ────────────────────────── */}
          <View style={styles.tabs}>
            {(
              [
                ['breathe', 'Breathe'],
                ['ground', '5-4-3-2-1'],
              ] as const
            ).map(([id, label]) => (
              <Chip key={id} label={label} selected={tab === id} onPress={() => setTab(id)} accessibilityRole="tab" style={styles.tab} />
            ))}
          </View>
          <View style={styles.card}>
            {tab === 'breathe' ? (
              <HapticBreathing />
            ) : (
              <Grounding
                onFinished={(feel) => {
                  if (feel === 'same') {
                    setReachOut(true);
                    setCalmer(false);
                    scroller.current?.scrollTo({ y: 0, animated: !reduceMotionNow() });
                  } else {
                    setReachOut(false);
                    setCalmer(true);
                  }
                }}
              />
            )}
            {calmer && tab === 'ground' ? (
              <Text style={styles.calmer}>That’s your nervous system settling. Stay here a minute, sip some water, and be gentle with yourself.</Text>
            ) : null}
          </View>

          {/* ── More ─────────────────────────────────── */}
          <View style={styles.moreRow}>
            <Button
              variant="secondary"
              title="Talk to YourGoGirl"
              onPress={() => router.push(ROUTES.yourGoGirl)}
              icon={<Sparkles size={20} color={Theme.colors.textPrimary} />}
              style={styles.moreBtn}
            />
            <Button variant="secondary" title="Message a friend" onPress={() => void composeSms(HELP_TEXT)} icon={<MessageCircle size={20} color={Theme.colors.textPrimary} />} style={styles.moreBtn} />
          </View>

          <Button
            variant="danger"
            title={`In immediate danger? Call ${CRISIS_LINES.emergency.number}`}
            accessibilityLabel={`In immediate danger? Call ${CRISIS_LINES.emergency.number}, India emergency`}
            onPress={() => call(CRISIS_LINES.emergency.number, CRISIS_LINES.emergency.label)}
            icon={<Siren size={18} color={Theme.colors.danger} />}
            fullWidth
            style={styles.emergency}
          />
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heart: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center' },
  close: { width: 36 },
  title: { fontSize: 24, fontWeight: '900', color: Theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.5 },
  sub: { fontSize: 16, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 8, marginBottom: 16 },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    gap: 12,
  },
  cardReach: { borderColor: Theme.colors.strainHigh, borderWidth: 2 },
  reachText: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: Theme.colors.strainHigh },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16 },
  roseBtn: { backgroundColor: Theme.colors.primary },
  darkBtn: { backgroundColor: '#2A2238' },
  bigBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  bigBtnSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
  },
  smallBtnText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  saveBtn: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 12 },
  link: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary, textDecorationLine: 'underline' },
  form: { gap: 8 },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  formSub: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary },
  input: {
    minHeight: 48,
    backgroundColor: Theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  error: { fontSize: 14, fontWeight: '700', color: Theme.colors.strainHigh },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 12 },
  tab: { flex: 1 },
  tabOn: { backgroundColor: Theme.colors.secondary },
  tabText: { fontSize: 14, fontWeight: '800', color: Theme.colors.textSecondary },
  tabTextOn: { color: '#FFFFFF' },
  calmer: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, textAlign: 'center' },
  moreRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  moreBtn: { flex: 1 },
  moreText: { fontSize: 14, fontWeight: '800', color: Theme.colors.primaryDark },
  emergency: { marginTop: 16 },
  emergencyText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary, textAlign: 'center' },
}));
