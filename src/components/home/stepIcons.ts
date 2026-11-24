import type { BrandIconName } from '@/components/icons/BrandIcon';
import type { BadgeTone } from '@/components/ds/IconBadge';
import type { SyncStepId } from '@/lib/syncDetails';

/** Icon and tone for each setup step (Details for Sync, Personalise card). */
export const STEP_ICON: Record<SyncStepId, { icon: BrandIconName; tone: BadgeTone }> = {
  questions: { icon: 'sparkle', tone: 'lilac' },
  period: { icon: 'calendar', tone: 'rose' },
  pain: { icon: 'pain', tone: 'peach' },
  flow: { icon: 'flow', tone: 'rose' },
  mood: { icon: 'mood', tone: 'amber' },
  safety: { icon: 'healthCheck', tone: 'mint' },
};
