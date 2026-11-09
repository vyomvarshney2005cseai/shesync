import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { YourGoGirlChatView } from '@/components/yourgogirl/YourGoGirlChatView';

export default function YourGoGirlModalScreen() {
  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <YourGoGirlChatView showBackButton={true} />
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
