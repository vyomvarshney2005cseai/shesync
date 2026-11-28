import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { isOfflineAuthError, signUpWithSupabase } from '@/lib/supabaseService';
import { PasswordField, StrengthMeter } from '@/components/auth/PasswordField';
import { ROUTES } from '@/lib/routes';
import { ArrowLeft, User, Mail, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ds';

/**
 * Sign-up asks for name, email and password only. Focus areas are asked
 * later on Home, once she has seen what Unnmegh does. A guest who signs up
 * keeps everything she logged.
 */
export default function SignUpScreen() {
  const signup = useAppStore((s) => s.signup);
  const upgradeGuest = useAppStore((s) => s.upgradeGuest);
  const isGuest = useAppStore((s) => s.isGuest && s.isAuthenticated);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const clearError = () => {
    if (errorMsg) setErrorMsg('');
  };
  const matches = confirmPassword.length > 0 && confirmPassword === password;

  const handleSignUp = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const finish = (offline: boolean) => {
      if (isGuest) upgradeGuest(name.trim(), email.trim(), { offline });
      else signup(name.trim(), email.trim(), [], { offline });
      router.replace('/(tabs)');
    };

    try {
      await signUpWithSupabase(email.trim(), password, name.trim());
      finish(false);
    } catch (err: any) {
      if (isOfflineAuthError(err)) {
        // No server reachable (or none configured): create the account on this device.
        finish(true);
      } else {
        // The server answered (e.g. "User already registered"): show it instead of faking success.
        const msg = String(err?.message || '');
        setErrorMsg(
          /already registered|already exists/i.test(msg)
            ? 'An account with this email already exists. Please log in instead.'
            : msg || 'Sign up failed. Please try again.'
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
            keyboardShouldPersistTaps="handled"
          >
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              onPress={() => (router.canGoBack() ? router.back() : router.replace(isGuest ? '/(tabs)' : '/welcome'))}
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
              <Text style={styles.brandTitle}>Unnmegh</Text>
            </View>

            <View style={{ width: 36 }} />
          </View>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{isGuest ? 'Save your progress' : 'Join Unnmegh'}</Text>
            <Text style={styles.subtitle}>
              {isGuest ? 'Create an account to back up what you have logged. Nothing is lost.' : 'Three quick things and you’re in.'}
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR NAME</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ananya Sharma"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    clearError();
                  }}
                  autoComplete="name"
                  textContentType="name"
                  accessibilityLabel="Your name"
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    clearError();
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="Email address"
                />
              </View>
            </View>

            <PasswordField
              label="PASSWORD"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                clearError();
              }}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <StrengthMeter password={password} personal={[name, email]} />

            <PasswordField
              label="CONFIRM PASSWORD"
              placeholder="Type it again"
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                clearError();
              }}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            {confirmPassword ? (
              <View style={styles.matchRow}>
                {matches ? <CheckCircle2 size={14} color={themed('#15803D')} /> : null}
                <Text style={[styles.matchText, { color: themed(matches ? '#15803D' : '#B45309') }]}>
                  {matches ? 'Passwords match' : 'Passwords don’t match yet'}
                </Text>
              </View>
            ) : null}

            {/* Sign Up Submit Button */}
            <Button size="lg" fullWidth title={loading ? 'Creating account' : 'Create account'} loading={loading} onPress={handleSignUp} style={styles.submitButton} />

            <Text style={styles.agreeText}>By creating an account you agree to the Terms of Service and to how we handle your data.</Text>
            <Button variant="link" title="How we handle your data" onPress={() => router.push(ROUTES.privacy)} style={{ alignSelf: 'center' }} />
          </View>

          {/* Footer Link to Log In */}
          {!isGuest ? (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button variant="link" title="Log In" onPress={() => router.push('/login')} />
            </View>
          ) : null}
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -8 },
  matchText: { fontSize: 14, fontWeight: '700' },
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
    paddingBottom: 36,
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
  focusSection: {
    gap: 8,
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Theme.colors.feminismAccent,
    borderColor: Theme.colors.feminismAccent,
  },
  chipUnselected: {
    backgroundColor: '#FFF5F8',
    borderColor: '#FFD3E0',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextUnselected: {
    color: Theme.colors.textPrimary,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    marginTop: 4,
  },
  checkboxActive: {
    backgroundColor: Theme.colors.feminismAccent,
    borderColor: Theme.colors.feminismAccent,
  },
  agreeText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
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
