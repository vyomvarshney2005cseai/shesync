import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ban, CloudUpload, Smartphone, X } from 'lucide-react-native';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { Theme, createStyles, themed } from '@/constants/theme';
import { PRIVACY_LINES } from '@/constants/privacy';
import { Button } from '@/components/ds';


const ICONS = { phone: Smartphone, backup: CloudUpload, never: Ban } as const;
const TINTS = {
  phone: { bg: '#EDE9FE', ink: '#6D28D9' },
  backup: { bg: '#E0F2FE', ink: '#0369A1' },
  never: { bg: '#FFE4E6', ink: '#BE123C' },
} as const;

export default function PrivacyScreen() {
  const close = () => (router.canGoBack() ? router.back() : router.replace('/welcome'));
  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.kicker}>YOUR PRIVACY</Text>
            <Button variant="secondary" size="sm" iconOnly onPress={close} accessibilityLabel="Close" icon={<X size={20} color={Theme.colors.textSecondary} />} style={styles.close} />
          </View>
          <Text style={styles.title}>Your body, your data</Text>

          {PRIVACY_LINES.map((l) => {
            const Icon = ICONS[l.id];
            const tint = TINTS[l.id];
            return (
              <View key={l.id} style={styles.line}>
                <View style={[styles.icon, { backgroundColor: themed(tint.bg) }]}>
                  <Icon size={20} color={themed(tint.ink)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineTitle}>{l.title}</Text>
                  <Text style={styles.lineText}>{l.text}</Text>
                </View>
              </View>
            );
          })}

          <Text style={styles.footer}>
            Delete everything any time: Profile → Delete account. Without an account, nothing is backed up at all.
          </Text>
          <Button variant="primary" title="Got it" onPress={close} style={styles.okBtn} />
        </ScrollView>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 24, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: Theme.colors.secondaryDark },
  close: { width: 36 },
  title: { fontSize: 28, fontWeight: '900', color: Theme.colors.textPrimary, marginTop: 8, marginBottom: 20, letterSpacing: -0.6 },
  line: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lineTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  lineText: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 4 },
  footer: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 8, textAlign: 'center' },
  okBtn: { marginTop: 20 },
  okText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
}));
