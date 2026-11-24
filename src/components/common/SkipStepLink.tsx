import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, type SyncStepId } from '@/lib/syncDetails';
import { Button } from '@/components/ds';

/**
 * "Skip for now" on a setup step: SheSync uses sensible defaults for it and
 * moves on. Home's "Personalise SheSync" card brings the step back later.
 */
export function SkipStepLink({ step, label = 'Skip for now' }: { step: SyncStepId; label?: string }) {
  const skipSyncStep = useAppStore((s) => s.skipSyncStep);
  return (
    <Button
      variant="secondary"
      title={label}
      onPress={() => {
        skipSyncStep(step);
        router.push(nextSyncHref(useAppStore.getState()));
      }}
      accessibilityHint="Uses sensible defaults for this step. You can do it later."
    />
  );
}

const styles = createStyles(() => ({
  text: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary },
}));
