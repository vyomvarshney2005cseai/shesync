// Soft colour tones for icon badges, pills and chips — token pairs that keep
// at least 4.5:1 contrast in light and dark mode (checked in tests/unit/round8).
import { Theme } from '@/constants/theme';

export type BadgeTone = 'rose' | 'lilac' | 'mint' | 'amber' | 'sky' | 'peach' | 'neutral' | 'danger';

/** Icon colour + soft background for each tone (all pairs ≥ 4.5:1 in both modes). */
export function badgeColors(tone: BadgeTone): { fg: string; bg: string } {
  const c = Theme.colors;
  switch (tone) {
    case 'lilac':
      return { fg: c.secondary, bg: c.secondaryLight };
    case 'mint':
      return { fg: c.strainOptimal, bg: c.successLight };
    case 'amber':
      return { fg: c.strainAmber, bg: c.warningLight };
    case 'sky':
      return { fg: c.strainTeal, bg: c.infoLight };
    case 'peach':
      return { fg: c.peachDark, bg: c.peach };
    case 'neutral':
      return { fg: c.textSecondary, bg: c.backgroundMuted };
    case 'danger':
      return { fg: c.danger, bg: c.dangerLight };
    default:
      return { fg: c.primary, bg: c.primaryLight };
  }
}
