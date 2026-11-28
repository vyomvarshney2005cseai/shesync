import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Theme, createStyles, themed } from '@/constants/theme';
import { sendPasswordResetEmail } from '@/lib/supabaseService';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';
import { Button } from '@/components/ds';
import { emailParam } from '@/lib/linkParams';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam(params.email));
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSendResetEmail = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await sendPasswordResetEmail(trimmedEmail);
      setIsSubmitted(true);
      startCooldownTimer();
    } catch (err: any) {
      const message =
        err?.message ||
        'Failed to send password reset email. Please check the address and try again.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const startCooldownTimer = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
                <Text style={styles.brandTitle}>Unnmegh</Text>
              </View>

              <View style={{ width: 38 }} />
            </View>

            {/* Header Icon & Intro */}
            <View style={styles.iconCircleWrapper}>
              <View style={styles.iconCircle}>
                <KeyRound size={28} color={Theme.colors.feminismAccent} />
              </View>
            </View>

            <View style={styles.headerBlock}>
              <Text style={styles.title}>
                {isSubmitted ? 'Check Your Email' : 'Reset Password'}
              </Text>
              <Text style={styles.subtitle}>
                {isSubmitted
                  ? 'We have sent a secure password reset link to your email address.'
                  : 'Enter your registered email address below. We will send you a secure link to reset your password via Supabase.'}
              </Text>
            </View>

            {/* Main Content Box */}
            <View style={styles.formContainer}>
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={Theme.colors.primaryDark} style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {!isSubmitted ? (
                <>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>REGISTERED EMAIL ADDRESS</Text>
                    <View style={styles.inputWrapper}>
                      <Mail size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor={Theme.colors.textTertiary}
                        value={email}
                        onChangeText={(val) => {
                          setEmail(val);
                          if (errorMsg) setErrorMsg('');
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        editable={!loading}
                      />
                    </View>
                  </View>

                  {/* Info Notice */}
                  <View style={styles.infoBox}>
                    <ShieldCheck size={18} color={Theme.colors.primaryDark} style={{ marginRight: 8, marginTop: 1 }} />
                    <Text style={styles.infoBoxText}>
                      Your password reset request is handled end-to-end securely by Supabase. Your credentials remain private and encrypted.
                    </Text>
                  </View>

                  {/* Send Reset Email Button */}
                  <Button
                    size="lg"
                    fullWidth
                    title={loading ? 'Sending reset link' : 'Send Reset Link'}
                    loading={loading}
                    onPress={handleSendResetEmail}
                    icon={<Send size={20} color={loading ? Theme.colors.textTertiary : Theme.colors.onPrimary} />}
                    style={styles.submitButton}
                  />
                </>
              ) : (
                /* Success State */
                <View style={styles.successWrapper}>
                  <View style={styles.successPill}>
                    <CheckCircle2 size={20} color={themed('#059669')} style={{ marginRight: 8 }} />
                    <Text style={styles.successPillText}>Reset Link Dispatched</Text>
                  </View>

                  <View style={styles.emailHighlightBox}>
                    <Text style={styles.emailHighlightLabel}>Email sent to:</Text>
                    <Text style={styles.emailHighlightValue}>{email}</Text>
                  </View>

                  <Text style={styles.instructionStep}>
                    1. Open your inbox and look for an email from Unnmegh.
                  </Text>
                  <Text style={styles.instructionStep}>
                    2. Click the password reset link inside to enter a new password.
                  </Text>
                  <Text style={styles.instructionStep}>
                    3. If you don’t see it within a couple minutes, please check your spam or promotions folder.
                  </Text>

                  {/* Resend Action */}
                  <Button
                    variant="secondary"
                    fullWidth
                    title={resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : loading ? 'Sending' : 'Resend reset email'}
                    loading={loading}
                    disabled={resendCooldown > 0}
                    onPress={handleSendResetEmail}
                    icon={<RefreshCw size={18} color={resendCooldown > 0 || loading ? Theme.colors.textTertiary : Theme.colors.textPrimary} />}
                    style={styles.resendButton}
                  />

                  {/* Return to Login */}
                  <Button variant="tertiary" title="Back to Log In" onPress={() => router.replace('/login')} fullWidth />
                </View>
              )}
            </View>

            {/* Footer Back Link */}
            {!isSubmitted && (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Remember your password?</Text>
                <Button variant="link" title="Log In" onPress={() => router.back()} />
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createStyles(() => ({
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
  iconCircleWrapper: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBF1',
    borderWidth: 1.5,
    borderColor: '#FFD3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E8',
    padding: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFA6BA',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.primaryDark,
    fontWeight: '600',
    lineHeight: 20,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F8',
    padding: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFE0E9',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: { marginTop: 4 },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },
  successWrapper: {
    alignItems: 'stretch',
    gap: 12,
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.full,
    alignSelf: 'center',
    marginBottom: 4,
  },
  successPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  emailHighlightBox: {
    backgroundColor: '#FFF8FA',
    borderWidth: 1,
    borderColor: '#FFD7E3',
    borderRadius: Theme.radius.md,
    padding: 12,
    alignItems: 'center',
  },
  emailHighlightLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  emailHighlightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  instructionStep: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  resendButton: {
    marginTop: 8,
  },
  resendButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
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
