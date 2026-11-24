import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { LockKeyhole, ShieldCheck, ScanFace, KeyRound } from 'lucide-react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { AuthGate } from '@/components/common/AuthGate';
import { Button, SwitchRow } from '@/components/ds';
import { Card, Chip } from '@/components/common/ui';
import { PinPad } from '@/components/lock/PinPad';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useLockStore } from '@/store/useLockStore';
import {
  authenticateWithBiometrics,
  disableAppLock,
  enableAppLock,
  getBiometricInfo,
  verifyPin,
  type BiometricInfo,
} from '@/lib/appLock';

type Step =
  | { kind: 'overview' }
  | { kind: 'verify'; then: 'change' | 'off' }
  | { kind: 'new'; length: 4 | 6 }
  | { kind: 'confirm'; length: 4 | 6; first: string };

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

/** Profile → App lock: turn on, change the PIN, fingerprint / Face ID, turn off. */
export default function AppLockScreen() {
  const enabled = useLockStore((s) => s.enabled);
  const biometrics = useLockStore((s) => s.biometrics);
  const pinLength = useLockStore((s) => s.pinLength);
  const setBiometrics = useLockStore((s) => s.setBiometrics);
  const [step, setStep] = useState<Step>({ kind: 'overview' });
  const [pin, setPin] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState<BiometricInfo | null>(null);
  const [length, setLength] = useState<4 | 6>(4);

  useEffect(() => {
    getBiometricInfo().then(setBio);
  }, []);

  const go = (next: Step, message = '') => {
    setPin('');
    setHint(message);
    setStep(next);
  };

  const wrong = (message: string) => {
    setErrorKey((k) => k + 1);
    setHint(message);
    setTimeout(() => setPin(''), 250);
  };

  const onComplete = async (value: string) => {
    if (step.kind === 'new') {
      go({ kind: 'confirm', length: step.length, first: value }, 'Enter it once more to confirm.');
      return;
    }
    if (step.kind === 'confirm') {
      if (value !== step.first) {
        wrong('Those PINs didn’t match. Start again.');
        setTimeout(() => go({ kind: 'new', length: step.length }, 'Choose a new PIN.'), 700);
        return;
      }
      setBusy(true);
      try {
        await enableAppLock(value, enabled ? biometrics : !!bio?.ready);
        go({ kind: 'overview' });
        notify(
          enabled ? 'PIN changed' : 'App lock is on',
          enabled ? 'Use your new PIN next time.' : 'SheSync will lock every time you leave the app.'
        );
      } catch {
        wrong('Could not save the PIN. Please try again.');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step.kind === 'verify') {
      setBusy(true);
      const ok = await verifyPin(value);
      setBusy(false);
      if (!ok) return wrong('Wrong PIN. Try again.');
      if (step.then === 'change') go({ kind: 'new', length: pinLength }, 'Choose your new PIN.');
      else {
        await disableAppLock();
        go({ kind: 'overview' });
      }
    }
  };

  const verifyWithBiometrics = async (then: 'change' | 'off') => {
    const ok = await authenticateWithBiometrics('Confirm it’s you');
    if (!ok) return;
    if (then === 'change') go({ kind: 'new', length: pinLength }, 'Choose your new PIN.');
    else {
      await disableAppLock();
      go({ kind: 'overview' });
    }
  };

  const title =
    step.kind === 'new'
      ? enabled
        ? 'New PIN'
        : 'Choose a PIN'
      : step.kind === 'confirm'
      ? 'Confirm PIN'
      : step.kind === 'verify'
      ? 'Enter your PIN'
      : 'App lock';

  return (
    <AuthGate>
      <Screen>
        <ScreenHeader title={title} subtitle="Keep your health data private on this phone" fallbackHref="/(tabs)/profile" />

        {step.kind === 'overview' ? (
          <>
            <Card tone={enabled ? 'mint' : 'default'} style={styles.status}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIcon, enabled && styles.statusIconOn]}>
                  {enabled ? (
                    <ShieldCheck size={22} color={Theme.colors.strainOptimal} />
                  ) : (
                    <LockKeyhole size={22} color={Theme.colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>{enabled ? 'App lock is on' : 'App lock is off'}</Text>
                  <Text style={styles.statusSub}>
                    {enabled
                      ? `Locks the moment you leave SheSync. ${pinLength}-digit PIN${biometrics && bio?.ready ? ` or ${bio.label}` : ''}.`
                      : 'Ask for a PIN — or your fingerprint / Face ID — every time SheSync opens.'}
                  </Text>
                </View>
              </View>
            </Card>

            {!enabled ? (
              <>
                <Text style={styles.label}>PIN length</Text>
                <View style={styles.chips}>
                  <Chip label="4 digits" selected={length === 4} onPress={() => setLength(4)} />
                  <Chip label="6 digits" selected={length === 6} onPress={() => setLength(6)} />
                </View>
                <Button
                  title="Turn on app lock"
                  icon={<KeyRound size={18} color={themed('#FFFFFF')} />}
                  onPress={() => go({ kind: 'new', length }, `Choose a ${length}-digit PIN you’ll remember.`)}
                  fullWidth
                />
              </>
            ) : (
              <>
                {bio && (bio.ready || bio.notEnrolled) && (
                  <Card padding="none" style={styles.switchCard}>
                    <SwitchRow
                      icon={<ScanFace size={20} color={Theme.colors.primaryDark} />}
                      title={`Unlock with ${bio.label}`}
                      subtitle={bio.ready ? 'Your PIN still works as a backup.' : `Set up ${bio.label} in your phone settings first.`}
                      value={biometrics && bio.ready}
                      disabled={!bio.ready}
                      onValueChange={async (v) => {
                        if (v && !(await authenticateWithBiometrics(`Turn on ${bio.label}`))) return;
                        setBiometrics(v);
                      }}
                    />
                  </Card>
                )}
                <Button
                  title="Change PIN"
                  variant="secondary"
                  onPress={() =>
                    biometrics && bio?.ready
                      ? void verifyWithBiometrics('change')
                      : go({ kind: 'verify', then: 'change' }, 'Enter your current PIN.')
                  }
                  fullWidth
                />
                <Button
                  title="Turn off app lock"
                  variant="secondary"
                  style={{ marginTop: 12 }}
                  onPress={() =>
                    biometrics && bio?.ready
                      ? void verifyWithBiometrics('off')
                      : go({ kind: 'verify', then: 'off' }, 'Enter your PIN to turn the lock off.')
                  }
                  fullWidth
                />
              </>
            )}

            <Text style={styles.note}>
              Your PIN never leaves this phone — only a scrambled (hashed) copy is kept in the phone’s secure storage.
              After 5 wrong tries the lock waits a little longer between tries. Forgot it? You can sign out from the lock
              screen; backed-up data returns when you sign in again.
            </Text>
          </>
        ) : (
          <View style={styles.padWrap}>
            <Text style={styles.hint}>{hint}</Text>
            <PinPad
              length={step.kind === 'verify' ? pinLength : step.length}
              value={pin}
              onChange={setPin}
              onComplete={(v) => void onComplete(v)}
              disabled={busy}
              errorKey={errorKey}
            />
            <Button title="Cancel" variant="secondary" style={{ marginTop: 24 }} onPress={() => go({ kind: 'overview' })} />
          </View>
        )}
      </Screen>
    </AuthGate>
  );
}

const styles = createStyles(() => ({
  status: { marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primaryLight,
  },
  statusIconOn: { backgroundColor: Theme.colors.sageLight },
  statusTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  statusSub: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '800', color: Theme.colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  switchCard: { marginBottom: 16, overflow: 'hidden' },
  note: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 20 },
  padWrap: { alignItems: 'center', paddingTop: 12 },
  hint: { fontSize: 14, color: Theme.colors.textSecondary, marginBottom: 24, textAlign: 'center', minHeight: 20 },
}));
