import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FileDown, Check } from 'lucide-react-native';
import { reduceMotionNow } from '@/lib/motion';
import { Theme, createStyles } from '@/constants/theme';
import { Button, SkeletonCard } from '@/components/ds';

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
      successOpacity.value = reduceMotionNow() ? 1 : withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    } else {
      successOpacity.value = 0;
    }
  }, [generatedAt, successOpacity]);

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Main CTA */}
      <Button
        title={
          isGenerating
            ? 'Preparing report…'
            : generatedAt
            ? 'Report ready'
            : 'Download doctor report (PDF)'
        }
        variant={generatedAt ? 'secondary' : 'primary'}
        icon={
          generatedAt ? (
            <Check size={20} color={Theme.colors.strainOptimal} />
          ) : (
            <FileDown size={20} color={Theme.colors.onPrimary} />
          )
        }
        loading={isGenerating}
        onPress={onGenerate}
        fullWidth
        style={styles.ctaButton}
      />

      {/* While the PDF is being prepared: a grey preview of the report, no spinner. */}
      {isGenerating ? <SkeletonCard lines={3} label="Preparing your report" /> : null}

      {/* Success message */}
      {generatedAt && !isGenerating && (
        <Animated.View style={[styles.successBanner, successStyle]}>
          <Check size={16} color={Theme.colors.strainOptimal} />
          <View style={styles.successText}>
            <Text style={styles.successTitle}>Report ready</Text>
            <Text style={styles.successSubtitle}>
              Includes your 90-day cycle and pain trend and the patterns above. Share it with your gynaecologist.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Footer disclaimer */}
      <Text style={styles.disclaimer}>
        Made from what you logged in SheSync. It supports — but does not replace — a doctor’s
        assessment.
      </Text>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    marginTop: 24,
    paddingBottom: 40,
  },
  ctaButton: {
    paddingVertical: 20,
    borderRadius: Theme.radius.xl,
  },
  successBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successText: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.strainOptimal,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
  },
  disclaimer: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
}));
