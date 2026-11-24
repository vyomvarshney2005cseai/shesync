import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { BRAND_ICONS, type BrandIconName, type Paint, type Shape } from './brandIconData';

export type { BrandIconName } from './brandIconData';

/** Rendered stroke width in px, the same at every size. */
const STROKE_PX = 1.75;
const ACCENT_OPACITY = 0.18;

/**
 * One of SheSync's own duotone icons.
 *   <BrandIcon name="padCare" color={Theme.colors.primary} />
 * `color` is the outline (currentColor), `accent` the soft fill (defaults to `color`).
 * With `label` it is announced as an image; without, screen readers skip it.
 */
export function BrandIcon({
  name,
  size = 24,
  color = Theme.colors.textPrimary,
  accent,
  label,
}: {
  name: BrandIconName;
  size?: number;
  color?: string;
  accent?: string;
  label?: string;
}) {
  const fillColor = accent ?? color;
  const sw = (STROKE_PX * 24) / size;
  const paintProps = (paint: Paint = 'stroke') => ({
    fill: paint === 'accent' || paint === 'both' ? fillColor : paint === 'solid' ? color : 'none',
    fillOpacity: paint === 'accent' || paint === 'both' ? ACCENT_OPACITY : 1,
    stroke: paint === 'accent' || paint === 'solid' ? 'none' : color,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  });
  const a11y = label
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label, 'aria-label': label, role: 'img' as const }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const, 'aria-hidden': true };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...a11y}>
      {(BRAND_ICONS[name].shapes as Shape[]).map((s, i) => {
        const props = paintProps(s.paint);
        if ('p' in s) return <Path key={i} d={s.p} fillRule={s.evenOdd ? 'evenodd' : 'nonzero'} {...props} />;
        if ('c' in s) return <Circle key={i} cx={s.c[0]} cy={s.c[1]} r={s.c[2]} {...props} />;
        if ('r' in s) return <Rect key={i} x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4]} {...props} />;
        return <Ellipse key={i} cx={s.e[0]} cy={s.e[1]} rx={s.e[2]} ry={s.e[3]} {...props} />;
      })}
    </Svg>
  );
}
