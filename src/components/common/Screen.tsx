import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { createStyles } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Extra content rendered outside the scroll view (floating buttons, modals). */
  overlay?: React.ReactNode;
  contentStyle?: ViewStyle;
  scroll?: boolean;
}

/** Standard page shell for the wellness dashboards: background, safe area and centred column. */
export function Screen({ children, overlay, contentStyle, scroll = true }: ScreenProps) {
  const body = <View style={[styles.column, contentStyle]}>{children}</View>;
  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {overlay}
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },
  column: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16 },
}));
