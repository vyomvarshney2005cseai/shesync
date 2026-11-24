import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { HeartCrack, Home, RotateCcw } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { reportError } from '@/lib/crashReporter';
import { Button } from '@/components/ds';

/**
 * Shown instead of a blank screen when something breaks. The error is
 * reported anonymously (if she allows crash reports) and she can try again.
 */
export function FriendlyError({
  error,
  retry,
  compact = false,
}: {
  error: Error;
  retry: () => void | Promise<void>;
  /** Small inline version for a single card. */
  compact?: boolean;
}) {
  const [details, setDetails] = useState(false);

  useEffect(() => {
    void reportError(error, { source: 'boundary' });
  }, [error]);

  if (compact) {
    return (
      <View style={styles.compact} accessibilityRole="alert">
        <Text style={styles.compactText}>This part couldn’t load.</Text>
        <Button variant="link" title="Try again" onPress={() => void retry()} testID="error-try-again" icon={<RotateCcw size={20} color={Theme.colors.primaryDark} />} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} accessibilityRole="alert">
      <View style={styles.icon}>
        <HeartCrack size={30} color={Theme.colors.primary} />
      </View>
      <Text style={styles.title}>Something went wrong on this screen</Text>
      <Text style={styles.body}>Your data is safe — nothing you logged was lost. Try again, or go back to Home.</Text>
      <Button variant="primary" title="Try again" onPress={() => void retry()} testID="error-try-again" icon={<RotateCcw size={20} color={Theme.colors.onPrimary} />} style={styles.primary} />
      <Button variant="secondary" title="Go to Home" onPress={() => router.replace('/')} icon={<Home size={20} color={Theme.colors.textPrimary} />} style={styles.secondary} />
      <Button variant="link" title={details ? 'Hide details' : 'Show details'} onPress={() => setDetails((d) => !d)} style={styles.detailsToggle} />
      {details ? (
        <Text style={styles.details} selectable>
          {error.name}: {error.message}
        </Text>
      ) : null}
    </ScrollView>
  );
}

/**
 * Keeps one broken card from blanking a whole screen. Use around Home cards
 * and other self-contained pieces.
 */
export class CardBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <FriendlyError error={this.state.error} retry={() => this.setState({ error: null })} compact />;
    }
    return this.props.children;
  }
}

const styles = createStyles(() => ({
  page: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: Theme.colors.background,
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: 340 },
  primary: { marginTop: 24 },
  primaryText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  secondary: { marginTop: 12 },
  secondaryText: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary },
  detailsToggle: { marginTop: 20 },
  detailsToggleText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textTertiary, textDecorationLine: 'underline' },
  details: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 340 },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Theme.colors.primaryLight,
  },
  compactText: { flex: 1, fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  compactBtnText: { fontSize: 14, fontWeight: '800', color: Theme.colors.primaryDark },
}));
