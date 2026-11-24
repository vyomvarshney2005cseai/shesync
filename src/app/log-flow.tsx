import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { FlowLogger } from '@/components/log/FlowLogger';
import { LogSheet } from '@/components/log/LogSheet';

/**
 * /log-flow — opens the one check-in sheet on the Flow tab. During setup
 * ("Details for Sync", ?onboarding=true) it stays a single step.
 */
export default function LogFlowScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  if (onboarding === 'true') return <FlowLogger mode="onboarding" />;
  return <LogSheet initial="flow" />;
}
