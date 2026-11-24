import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PainLogger } from '@/components/log/PainLogger';
import { LogSheet } from '@/components/log/LogSheet';

/**
 * /log-pain — opens the one check-in sheet on the Pain tab. During setup
 * ("Details for Sync", ?onboarding=true) it stays a single step.
 */
export default function LogPainScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  if (onboarding === 'true') return <PainLogger mode="onboarding" />;
  return <LogSheet initial="pain" />;
}
