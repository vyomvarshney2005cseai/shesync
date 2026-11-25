import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { isOfflineAuthError, signInWithSupabase } from '@/lib/supabaseService';
import { emailParam } from '@/lib/linkParams';
import { pullCloudData } from '@/lib/sync';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PasswordField } from '@/components/auth/PasswordField';
import { ArrowLeft, Mail, CheckCircle2, Info } from 'lucide-react-native';
import { Button, CheckRow } from '@/components/ds';

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const currentUserName = useAppStore((s) => s.userName);

  // Profile's "Sign in to back up" passes her email along.
  const params = useLocalSearchParams<{ email?: string }>();
  const rememberedEmail = useSettingsStore((s) => s.rememberedEmail);
  const setRememberedEmail = useSettingsStore((s) => s.setRememberedEmail);
  const guestWithData = useAppStore((s) => s.isGuest && s.isAuthenticated && (s.symptomLogs.length > 0 || s.pastCycles.length > 0));
  const [email, setEmail] = useState(emailParam(params.email) || rememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const handleLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter the email you signed up with');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Remember (or forget) the email on this phone only after a good sign-in.
    const remember = () => setRememberedEmail(rememberEmail ? cleanEmail : '');

    const goNext = () => {
      // Always land on Home: unfinished "Details for Sync" are shown there.
      router.replace('/(tabs)');
    };

    try {
      const res = await signInWithSupabase(cleanEmail, password);
      const name = res.user?.user_metadata?.full_name || currentUserName || cleanEmail.split('@')[0];
      login(cleanEmail, name);
      remember();
      // Bring back her saved data on this phone (waits a few seconds at most).
      await pullCloudData();
      goNext();
    } catch (err: any) {
      if (isOfflineAuthError(err)) {
        // No server reachable (or none configured): sign in on this device only.
        login(cleanEmail, currentUserName || cleanEmail.split('@')[0], { offline: true });
        remember();
        goNext();
      } else {
        // The server answered: wrong password, unconfirmed email, etc. Never let these through.
        const msg = String(err?.message || '');
        setErrorMsg(
          /invalid login credentials/i.test(msg)
            ? 'Email or password is incorrect.'
            : /email not confirmed/i.test(msg)
            ? 'Please confirm your email first — check your inbox for the link.'
            : msg || 'Login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.outerCenterWrapper}>
          <ScrollView
            style={styles.scrollWrapper}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              icon={<ArrowLeft size={20} color={Theme.colors.textPrimary} />}
              style={styles.backButton}
            />

            <View style={styles.brandRow}>
              <Image
                source={require('@/../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>SheSync</Text>
            </View>

            <View style={{ width: 36 }} />
          </View>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue.</Text>
          </View>

          {guestWithData ? (
            <View style={styles.guestNote}>
              <Info size={16} color={Theme.colors.secondaryDark} />
              <Text style={styles.guestNoteText}>
                You’re using SheSync without an account. Logging in opens that account instead of what you logged here — to keep it,{' '}
                <Text style={styles.guestLink} onPress={() => router.replace('/signup')}>
                  create an account
                </Text>
                .
              </Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <PasswordField
              label="PASSWORD"
              placeholder="Enter your password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errorMsg) setErrorMsg('');
              }}
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={handleLogin}
              labelRight={
                <Button
                  variant="link"
                  title="Forgot?"
                  accessibilityLabel="Forgot password?"
                  onPress={() =>
                    router.push({
                      pathname: '/forgot-password',
                      params: email ? { email } : undefined,
                    })
                  }
                />
              }
            />

            {/* Remember email */}
            <CheckRow label="Remember my email on this phone" checked={rememberEmail} onToggle={() => setRememberEmail(!rememberEmail)} style={styles.rememberRow} />

            {/* Log In Button */}
            <Button size="lg" fullWidth title={loading ? 'Logging in' : 'Log In'} loading={loading} onPress={handleLogin} style={styles.submitButton} />
          </View>

          {/* Footer Link to Sign Up */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don’t have an account yet?</Text>
            <Button variant="link" title="Sign Up" onPress={() => router.push('/signup')} />
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
  guestNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  guestNoteText: { flex: 1, fontSize: 14, lineHeight: 20, color: Theme.colors.secondaryDark },
  guestLink: { fontWeight: '800', textDecorationLine: 'underline' },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF4F7',
  },
  outerCenterWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: { width: 38 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    gap: 16,
  },
  errorBanner: {
    backgroundColor: '#FFE4E8',
    padding: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFA6BA',
  },
  errorText: {
    fontSize: 14,
    color: Theme.colors.primaryDark,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primaryDark,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFD7E3',
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    minHeight: 48,
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  eyeButton: {
    padding: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFADC4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: Theme.colors.feminismAccent,
    borderColor: Theme.colors.feminismAccent,
  },
  rememberText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.feminismAccent,
  },
}));
