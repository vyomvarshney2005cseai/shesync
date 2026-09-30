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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { FeministQuoteCard } from '@/components/common/FeministQuoteCard';
import { useAppStore } from '@/store/useAppStore';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn as LogInIcon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const currentUserName = useAppStore((s) => s.userName);

  const [email, setEmail] = useState('maya@shesync.app');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);

  const handleLogin = () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email or username');
      return;
    }
    // Perform login in store
    login(email.trim(), currentUserName || 'Maya');
    if (!isAssessmentCompleted) {
      router.replace('/assessment');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleDemoLogin = () => {
    login('maya@shesync.app', 'Maya');
    if (!isAssessmentCompleted) {
      router.replace('/assessment');
    } else {
      router.replace('/(tabs)');
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
            initialQuoteId="1"
            category="feminism"
            variant="rose"
          />

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Reconnect with your cycle, biometrics, and inner sanctuary.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL OR USERNAME</Text>
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
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Theme.colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
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

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <CheckCircle2 size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberText}>Keep me logged in securely</Text>
            </TouchableOpacity>

            {/* Log In Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.88}
              onPress={handleLogin}
            >
              <LogInIcon size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Log In</Text>
            </TouchableOpacity>

            {/* Quick Demo One-Tap */}
            <TouchableOpacity
              style={styles.demoButton}
              activeOpacity={0.8}
              onPress={handleDemoLogin}
            >
              <Sparkles size={16} color={Theme.colors.feminismAccent} style={{ marginRight: 6 }} />
              <Text style={styles.demoButtonText}>One-Tap Demo Login (Maya • PCOS)</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link to Sign Up */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don’t have an account yet?</Text>
            <TouchableOpacity
              onPress={() => router.push('/signup')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.footerLink}> Sign Up</Text>
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
    paddingBottom: 32,
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
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 12,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
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
  },
  checkboxActive: {
    backgroundColor: Theme.colors.feminismAccent,
    borderColor: Theme.colors.feminismAccent,
  },
  rememberText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
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
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFD3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.md,
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
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
