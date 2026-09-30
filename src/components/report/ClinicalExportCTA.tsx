import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FileDown, Check, Loader } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { PrimaryButton } from '@/components/common/PrimaryButton';

interface ClinicalExportCTAProps {
  isGenerating: boolean;
  generatedAt?: string;
  onGenerate: () => void;
}

export const ClinicalExportCTA: React.FC<ClinicalExportCTAProps> = ({
  isGenerating,
  generatedAt,
  onGenerate,
}) => {
  const successOpacity = useSharedValue(0);

  useEffect(() => {
    if (generatedAt) {
      successOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    } else {
      successOpacity.value = 0;
    }
  }, [generatedAt]);

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Main CTA */}
      <PrimaryButton
        title={
          isGenerating
            ? 'Generating Clinical Report...'
            : generatedAt
            ? 'Clinical PDF Generated ✓'
            : 'Generate Clinical PDF for Doctor'
        }
        variant={generatedAt ? 'lilac' : 'dark'}
        icon={
          isGenerating ? (
            <Loader size={18} color="#FFFFFF" />
          ) : generatedAt ? (
            <Check size={18} color="#FFFFFF" />
          ) : (
            <FileDown size={18} color="#FFFFFF" />
          )
        }
        loading={isGenerating}
        onPress={onGenerate}
        fullWidth
        style={styles.ctaButton}
      />

      {/* Success message */}
      {generatedAt && (
        <Animated.View style={[styles.successBanner, successStyle]}>
          <Check size={16} color={Theme.colors.strainOptimal} />
          <View style={styles.successText}>
            <Text style={styles.successTitle}>Report Ready for Export</Text>
            <Text style={styles.successSubtitle}>
              Contains 90-day cycle trend, anomaly correlation, and biometric timeline.
              Share with your OB/GYN or endocrinologist.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Footer disclaimer */}
      <Text style={styles.disclaimer}>
        This report is generated from self-reported data and wearable biometrics. It is
        intended to supplement — not replace — clinical evaluation by a licensed
        physician.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingBottom: 40,
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: Theme.radius.xl,
  },
  successBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Theme.radius.lg,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successText: {
    flex: 1,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
    marginBottom: 2,
  },
  successSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: Theme.colors.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
});
