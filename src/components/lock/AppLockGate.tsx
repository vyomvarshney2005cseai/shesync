import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Modal, AppState, Platform, Alert, TouchableOpacity, Image } from 'react-native';
import { LockKeyhole } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useLockStore } from '@/store/useLockStore';
import { useAppStore } from '@/store/useAppStore';
import { PinPad } from './PinPad';
import {
  authenticateWithBiometrics,
  getBiometricInfo,
  isAppLockPaused,
  resumeAppLock,
  verifyPin,
} from '@/lib/appLock';

/**
 * Covers the whole app while it is locked. Locks on launch and the moment she
 * leaves the app (it goes to the background); on iOS the app-switcher preview
 * is hidden too. Rendered in a Modal so it also sits above modal screens.
 */
export function AppLockGate() {
  const enabled = useLockStore((s) => s.enabled);
  const locked = useLockStore((s) => s.locked);
  const signedIn = useAppStore((s) => s.isAuthenticated);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const lock = useLockStore.getState();
      if (!lock.enabled) return;
      if (state === 'background') {
        if (isAppLockPaused()) return;
        lock.setLocked(true);
      } else if (state === 'inactive') {
        // iOS: app switcher / notification centre. Hide content, don't lock yet.
        if (!isAppLockPaused()) setCovered(true);
      } else if (state === 'active') {
        setCovered(false);
        resumeAppLock();
      }
    });
    return () => sub.remove();
  }, []);

  if (!enabled || !signedIn) return null;
  return (
    <Modal visible={locked || covered} animationType="none" transparent={false} statusBarTranslucent onRequestClose={() => {}}>
      {locked ? <LockScreen /> : <PrivacyCover />}
    </Modal>
  );
}

function PrivacyCover() {
  return (
    <View style={styles.screen}>
      <Image source={require('@/../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

function LockScreen() {
  const pinLength = useLockStore((s) => s.pinLength);
  const biometrics = useLockStore((s) => s.biometrics);
  const blockedUntil = useLockStore((s) => s.blockedUntil);
  const failed = useLockStore((s) => s.failed);
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const [bioLabel, setBioLabel] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const prompted = useRef(false);

  const waitSecs = Math.max(0, Math.ceil((blockedUntil - now) / 1000));

  useEffect(() => {
    if (!blockedUntil || blockedUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [blockedUntil]);

  const tryBiometrics = useCallback(async () => {
    const ok = await authenticateWithBiometrics();
    if (ok) useLockStore.getState().recordSuccess();
  }, []);

  // Offer fingerprint / Face ID straight away (once per lock), when the app is in front.
  useEffect(() => {
    if (!biometrics) return;
    let cancelled = false;
    getBiometricInfo().then((info) => {
      if (cancelled || !info.ready) return;
      setBioLabel(info.label);
      const ask = () => {
        if (prompted.current) return;
        prompted.current = true;
        void tryBiometrics();
      };
      if (AppState.currentState === 'active') ask();
      else {
        const sub = AppState.addEventListener('change', (s) => {
          if (s === 'active') {
            sub.remove();
            ask();
          }
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [biometrics, tryBiometrics]);

  const submit = async (value: string) => {
    if (Date.now() < useLockStore.getState().blockedUntil) return;
    setChecking(true);
    const ok = await verifyPin(value);
    setChecking(false);
    if (ok) {
      useLockStore.getState().recordSuccess();
    } else {
      useLockStore.getState().recordFailure();
      setNow(Date.now());
      setErrorKey((k) => k + 1);
      setTimeout(() => setPin(''), 250);
    }
  };

  const forgot = () => {
    const title = 'Forgot your PIN?';
    const backedUp = !useAppStore.getState().isOfflineAccount;
    const msg =
      'To keep your data private, the only way past a forgotten PIN is to sign out. This removes SheSync data from this phone and turns the lock off.' +
      (backedUp ? ' If your account is backed up, everything comes back when you sign in again.' : '');
    const go = async () => {
      const { signOutAndClear } = await import('@/lib/sync');
      await signOutAndClear().catch(() => {});
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${msg}`)) void go();
      return;
    }
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void go() },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.iconRing}>
          <LockKeyhole size={26} color={Theme.colors.primary} />
        </View>
        <Text style={styles.title}>SheSync is locked</Text>
        <Text style={styles.sub}>
          {waitSecs > 0
            ? `Too many tries. Try again in ${waitSecs >= 60 ? `${Math.ceil(waitSecs / 60)} min` : `${waitSecs} s`}.`
            : failed > 0
            ? `Wrong PIN. ${Math.max(0, 5 - failed) > 0 ? `${5 - failed} tries before a short wait.` : 'Try again.'}`
            : `Enter your ${pinLength}-digit PIN`}
        </Text>
      </View>
      <PinPad
        length={pinLength}
        value={pin}
        onChange={setPin}
        onComplete={submit}
        disabled={checking || waitSecs > 0}
        errorKey={errorKey}
        biometricLabel={bioLabel ?? undefined}
        onBiometric={bioLabel ? () => void tryBiometrics() : undefined}
      />
      <TouchableOpacity onPress={forgot} style={styles.forgot} activeOpacity={0.7}>
        <Text style={styles.forgotText}>Forgot PIN?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = createStyles(() => ({
  screen: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: { width: 96, height: 96, opacity: 0.9 },
  top: { alignItems: 'center', marginBottom: 30 },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 6, textAlign: 'center', minHeight: 20 },
  forgot: { marginTop: 26, padding: 8 },
  forgotText: { fontSize: 14, fontWeight: '700', color: Theme.colors.primaryDark },
}));
