import React, { useState } from 'react';
import { Pressable, View, Text, Image, ScrollView, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ArrowRight, ShieldCheck, Smartphone, UserPlus, LogIn } from 'lucide-react-native';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useStoresHydrated } from '@/store/hydration';
import { reduceMotionNow } from '@/lib/motion';
import { Theme, createStyles, themed } from '@/constants/theme';
import { ROUTES } from '@/lib/routes';
import { Button, Card, ScreenSkeleton } from '@/components/ds';

/** Three real app screens, one promise each. */
const SLIDES = [
  {
    image: require('@/../assets/images/welcome-1.jpg'),
    title: 'Know what’s coming',
    text: 'Your next period, energy and mood — a few days ahead, worked out from your own logs.',
  },
  {
    image: require('@/../assets/images/welcome-2.jpg'),
    title: 'Ask anything, in your language',
    text: 'Periods, pain, mood or exams — in English, Hinglish or हिन्दी. It tells you clearly when to see a doctor.',
  },
  {
    image: require('@/../assets/images/welcome-3.jpg'),
    title: 'Private by default',
    text: 'Lock it with a PIN or Face ID, and use it without an account — your data stays on your phone.',
  },
];

const MAX_WIDTH = 440;

export default function WelcomeScreen() {
  const hydrated = useStoresHydrated();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);
  const startGuest = useAppStore((s) => s.startGuest);
  const welcomeSeen = useSettingsStore((s) => s.welcomeSeen);
  const setWelcomeSeen = useSettingsStore((s) => s.setWelcomeSeen);
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = Math.min(windowWidth, MAX_WIDTH);

  // null = follow the saved choice; true/false once she taps something.
  const [showTour, setShowTour] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);
  const scroller = React.useRef<React.ElementRef<typeof ScrollView>>(null);

  if (!hydrated) return <ScreenSkeleton label="Loading" />;
  if (isAuthenticated) {
    return <Redirect href={isAssessmentCompleted ? '/(tabs)' : '/assessment'} />;
  }

  const tour = showTour ?? !welcomeSeen;

  const finishTour = () => {
    setWelcomeSeen(true);
    setShowTour(false);
  };

  const goTo = (i: number) => {
    setIndex(i);
    scroller.current?.scrollTo({ x: i * pageWidth, animated: !reduceMotionNow() });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (i !== index) setIndex(Math.max(0, Math.min(SLIDES.length - 1, i)));
  };

  if (tour) {
    const last = index === SLIDES.length - 1;
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.column, { width: pageWidth }]}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Image source={require('@/../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brand}>SheSync</Text>
            </View>
            <Button variant="tertiary" size="sm" title="Skip" onPress={finishTour} accessibilityLabel="Skip the tour" testID="tour-skip" />
          </View>

          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            {SLIDES.map((s, i) => (
              <View key={i} style={[styles.slide, { width: pageWidth }]} accessibilityLabel={`${i + 1} of ${SLIDES.length}. ${s.title}. ${s.text}`}>
                <View style={styles.phone}>
                  <Image source={s.image} style={styles.phoneImage} resizeMode="cover" accessibilityIgnoresInvertColors />
                </View>
                <Text style={styles.slideTitle}>{s.title}</Text>
                <Text style={styles.slideText}>{s.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.bottom}>
            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => goTo(i)} style={styles.dotHit} accessibilityRole="button" accessibilityLabel={`Slide ${i + 1} of ${SLIDES.length}`} accessibilityState={{ selected: i === index }}>
                  <View style={[styles.dot, i === index && styles.dotOn]} />
                </Pressable>
              ))}
            </View>
            <Button
              variant="primary"
              title={last ? 'Get started' : 'Next'}
              onPress={() => (last ? finishTour() : goTo(index + 1))}
              iconRight={<ArrowRight size={20} color={Theme.colors.onPrimary} />}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.startContent, { width: pageWidth }]} bounces={false}>
        <View style={styles.startHead}>
          <Image source={require('@/../assets/images/logo.png')} style={styles.startLogo} resizeMode="contain" />
          <Text style={styles.startTitle}>Welcome to SheSync</Text>
          <Text style={styles.startSub}>Your period & wellbeing companion</Text>
        </View>

        <Card
          tone="inverse"
          style={styles.tryBtn}
          onPress={() => {
            setWelcomeSeen(true);
            startGuest();
            router.replace('/(tabs)');
          }}
          accessibilityLabel="Try without an account. Everything stays on this phone."
          testID="try-without-account"
        >
          <View style={styles.tryIcon}>
            <Smartphone size={20} color={Theme.colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tryTitle}>Try without an account</Text>
            <Text style={styles.trySub}>Everything stays on this phone. Create an account any time to back it up.</Text>
          </View>
          <ArrowRight size={18} color={themed('#FFFFFF')} />
        </Card>

        <Button variant="secondary" title="Create an account" onPress={() => router.push('/signup')} icon={<UserPlus size={20} color={Theme.colors.textPrimary} />} style={styles.outlineBtn} />

        <Button variant="link" title="I already have an account · Log in" onPress={() => router.push('/login')} icon={<LogIn size={18} color={Theme.colors.primaryDark} />} style={styles.loginRow} />

        <Button variant="secondary" title="What stays on your phone, what is backed up, and what we never do" onPress={() => router.push(ROUTES.privacy)} icon={<ShieldCheck size={20} color={Theme.colors.textPrimary} />} iconRight={<ArrowRight size={20} color={Theme.colors.textPrimary} />} style={styles.privacyRow} />

        <Button
          variant="link"
          title="See the 3-step tour"
          onPress={() => {
            setIndex(0);
            setShowTour(true);
          }}
          style={styles.tourAgain}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
  safeArea: { flex: 1, backgroundColor: '#FFEBF2', alignItems: 'center' },
  column: { flex: 1, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 8 },
  brand: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.3 },
  skip: { fontSize: 16, fontWeight: '700', color: Theme.colors.textSecondary },
  slide: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 8 },
  phone: {
    width: '78%',
    maxWidth: 300,
    aspectRatio: 0.62,
    borderRadius: 24,
    borderWidth: 6,
    borderColor: '#2A2238',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  phoneImage: { width: '100%', height: '100%' },
  slideTitle: { fontSize: 24, fontWeight: '900', color: '#1F1530', textAlign: 'center', marginTop: 24, letterSpacing: -0.5 },
  slideText: { fontSize: 16, lineHeight: 20, color: '#4B4358', textAlign: 'center', marginTop: 8 },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dotHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(70, 55, 90, 0.25)' },
  dotOn: { width: 26, backgroundColor: '#1F1530' },
  nextText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  startContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24, alignSelf: 'center' },
  startHead: { alignItems: 'center', marginBottom: 28 },
  startLogo: { width: 64, height: 64, borderRadius: 16 },
  startTitle: { fontSize: 24, fontWeight: '900', color: '#1F1530', marginTop: 16, letterSpacing: -0.5 },
  startSub: { fontSize: 14, color: '#4B4358', marginTop: 4 },
  tryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  tryTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  trySub: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  outlineBtn: { marginTop: 12 },
  outlineText: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  loginText: { fontSize: 14, color: Theme.colors.textSecondary },
  loginLink: { fontWeight: '800', color: Theme.colors.primaryDark },
  privacyRow: { marginTop: 28 },
  privacyText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '700', color: Theme.colors.secondaryDark },
  tourAgain: { alignSelf: 'center', marginTop: 16 },
  tourAgainText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textTertiary, textDecorationLine: 'underline' },
}));
