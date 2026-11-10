import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { YourGoGirlChatView } from '@/components/yourgogirl/YourGoGirlChatView';
import { createStyles } from '@/constants/theme';

export default function YourGoGirlModalScreen() {
  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <YourGoGirlChatView showBackButton={true} />
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}));
