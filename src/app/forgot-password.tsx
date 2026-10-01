import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Theme } from '@/constants/theme';
import { sendPasswordResetEmail } from '@/lib/supabaseService';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || '');
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft size={20} color={Theme.colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.brandRow}>
                <Image
                  source={require('@/../assets/images/shesync-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitle}>SheSync</Text>
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
                  <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                    activeOpacity={0.88}
                    onPress={handleSendResetEmail}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    ) : (
                      <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.submitButtonText}>
                      {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Success State */
                <View style={styles.successWrapper}>
                  <View style={styles.successPill}>
                    <CheckCircle2 size={20} color="#059669" style={{ marginRight: 8 }} />
                    <Text style={styles.successPillText}>Reset Link Dispatched</Text>
                  </View>

                  <View style={styles.emailHighlightBox}>
                    <Text style={styles.emailHighlightLabel}>Email sent to:</Text>
                    <Text style={styles.emailHighlightValue}>{email}</Text>
                  </View>

                  <Text style={styles.instructionStep}>
                    1. Open your inbox and look for an email from SheSync.
                  </Text>
                  <Text style={styles.instructionStep}>
                    2. Click the password reset link inside to enter a new password.
                  </Text>
                  <Text style={styles.instructionStep}>
                    3. If you don't see it within a couple minutes, please check your spam or promotions folder.
                  </Text>

                  {/* Resend Action */}
                  <TouchableOpacity
                    style={[
                      styles.resendButton,
                      (resendCooldown > 0 || loading) && styles.resendButtonDisabled,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleSendResetEmail}
                    disabled={resendCooldown > 0 || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Theme.colors.primaryDark} style={{ marginRight: 6 }} />
                    ) : (
                      <RefreshCw size={16} color={resendCooldown > 0 ? Theme.colors.textTertiary : Theme.colors.primaryDark} style={{ marginRight: 6 }} />
                    )}
                    <Text
                      style={[
                        styles.resendButtonText,
                        resendCooldown > 0 && { color: Theme.colors.textTertiary },
                      ]}
                    >
                      {resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : 'Resend Reset Email'}
                    </Text>
                  </TouchableOpacity>

                  {/* Return to Login */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    activeOpacity={0.88}
                    onPress={() => router.replace('/login')}
                  >
                    <Text style={styles.submitButtonText}>Back to Log In</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Footer Back Link */}
            {!isSubmitted && (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Remember your password?</Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.footerLink}> Log In</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Theme.radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.soft,
  },
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
    ...Theme.shadows.soft,
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 21,
    marginTop: 6,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#FFE2EB',
    ...Theme.shadows.soft,
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
    fontSize: 13,
    color: Theme.colors.primaryDark,
    fontWeight: '600',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
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
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
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
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: Theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Theme.shadows.card,
  },
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
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  emailHighlightValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  instructionStep: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFD3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.md,
    marginTop: 6,
  },
  resendButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  resendButtonText: {
    fontSize: 13,
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
});
