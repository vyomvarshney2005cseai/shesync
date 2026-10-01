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
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { FeministQuoteCard } from '@/components/common/FeministQuoteCard';
import { useAppStore } from '@/store/useAppStore';
import { signUpWithSupabase } from '@/lib/supabaseService';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';

const FOCUS_TAGS = [
  'Cycle Syncing',
  'Hormonal Balance',
  'PCOS & PMDD Support',
  'Somatic Calm',
  'Sleep & HRV Recovery',
];

export default function SignUpScreen() {
  const signup = useAppStore((s) => s.signup);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    'Cycle Syncing',
    'PCOS & PMDD Support',
  ]);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleFocus = (tag: string) => {
    setSelectedFocus((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSignUp = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
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
    if (!agreedToTerms) {
      setErrorMsg('Please agree to terms and privacy');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await signUpWithSupabase(email.trim(), password, name.trim());
      signup(name.trim(), email.trim());
      router.replace('/assessment');
    } catch (err: any) {
      // If error (e.g. rate limit, unconfigured email provider, etc.)
      setErrorMsg(err?.message || 'Sign up encountered an issue.');
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

            <View style={{ width: 36 }} />
          </View>

          {/* Inspiring Feminism Quote Card */}
          <FeministQuoteCard
            initialQuoteId="4"
            category="empowerment"
            variant="rose"
          />

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Join SheSync</Text>
            <Text style={styles.subtitle}>
              Take charge of your hormonal health, somatic therapy, and daily empowerment.
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
                  placeholder="e.g. Maya Chen"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMsg) setErrorMsg('');
                  }}
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
                    if (errorMsg) setErrorMsg('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD (MIN 6 CHARACTERS)</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Theme.colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={Theme.colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Personalized Focus Chips */}
            <View style={styles.focusSection}>
              <Text style={styles.inputLabel}>WHAT WOULD YOU LIKE TO SYNC?</Text>
              <View style={styles.chipsContainer}>
                {FOCUS_TAGS.map((tag) => {
                  const isSelected = selectedFocus.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleFocus(tag)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      {isSelected ? (
                        <Check size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                      ) : null}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Terms and Privacy Checkbox */}
            <TouchableOpacity
              style={styles.agreeRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
                {agreedToTerms && <CheckCircle2 size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.agreeText}>
                I agree to the Terms of Service & Privacy Policy. My health data remains encrypted.
              </Text>
            </TouchableOpacity>

            {/* Sign Up Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              activeOpacity={0.88}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Account...' : 'Sign Up & Begin My Journey'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link to Log In */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.footerLink}> Log In</Text>
            </TouchableOpacity>
          </View>
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
    ...Theme.shadows.soft,
    gap: 16,
  },
  errorBanner: {
    backgroundColor: '#FFE4E8',
    padding: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFA6BA',
  },
  errorText: {
    fontSize: 13,
    color: Theme.colors.primaryDark,
    fontWeight: '600',
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
  eyeButton: {
    padding: 6,
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
    paddingVertical: 7,
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
    fontSize: 12,
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
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#FFADC4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Theme.colors.feminismAccent,
    borderColor: Theme.colors.feminismAccent,
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: Theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Theme.shadows.card,
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
});
