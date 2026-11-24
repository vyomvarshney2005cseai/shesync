import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MoodLogger } from '@/components/log/MoodLogger';
import { LogSheet } from '@/components/log/LogSheet';

/**
 * /log-mood — opens the one check-in sheet on the Mood tab. During setup
 * ("Details for Sync", ?onboarding=true) it stays a single step.
 */
export default function LogMoodScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  if (onboarding === 'true') return <MoodLogger mode="onboarding" />;
  return <LogSheet initial="mood" />;
}
