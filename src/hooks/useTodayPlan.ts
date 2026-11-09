import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useFitnessStore } from '@/store/useFitnessStore';
import { recommendWorkout, type TodayPlan } from '@/lib/fitness';
import { recentSignals } from '@/lib/recent';

/** Today's recommended session, from cycle phase, strain and the user's preferred place to train. */
export function useTodayPlan(): TodayPlan {
  const phase = useAppStore((s) => s.cycle.phase);
  const strainLevel = useAppStore((s) => s.biometrics.strainLevel);
  const strainScore = useAppStore((s) => s.biometrics.strainScore);
  const logs = useAppStore((s) => s.symptomLogs);
  const place = useFitnessStore((s) => s.profile?.trainingPlace ?? 'home');

  return useMemo(() => {
    const sig = recentSignals(logs);
    return recommendWorkout({
      phase,
      strainLevel,
      strainScore,
      recentPain: sig.pain ?? undefined,
      recentFlow: sig.flow,
      place,
    });
  }, [phase, strainLevel, strainScore, logs, place]);
}
