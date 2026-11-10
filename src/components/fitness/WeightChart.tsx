import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Theme, createStyles, themed } from '@/constants/theme';
import { shortDateLabel } from '@/lib/dates';
import type { WeightEntry } from '@/store/useFitnessStore';

const H = 150;
const PAD = { top: 14, right: 12, bottom: 24, left: 36 };

/** Line chart of logged weights (oldest → newest) with an optional target line. */
export function WeightChart({ entries, target }: { entries: WeightEntry[]; target?: number }) {
  const width = Math.max(260, Math.min(Dimensions.get('window').width, 520) - 66);
  const pts = [...entries].reverse().slice(-30); // oldest first, last 30
  if (pts.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Log your weight on two or more days to see your trend.</Text>
      </View>
    );
  }
  const values = pts.map((p) => p.kg).concat(target ? [target] : []);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (pts.length - 1)) * plotW;
  const y = (v: number) => PAD.top + plotH - ((v - min) / Math.max(1, max - min)) * plotH;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.kg)}`).join(' ');
  const ticks = [min, (min + max) / 2, max];

  return (
    <Svg width={width} height={H}>
      {ticks.map((t) => (
        <React.Fragment key={t}>
          <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={Theme.colors.cardBorder} strokeDasharray="4,4" />
          <SvgText x={PAD.left - 6} y={y(t) + 4} fontSize={10} textAnchor="end" fill={Theme.colors.textTertiary}>
            {t.toFixed(0)}
          </SvgText>
        </React.Fragment>
      ))}
      {target ? (
        <>
          <Line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} stroke={themed('#10B981')} strokeWidth={1.5} strokeDasharray="6,4" />
          <SvgText x={width - PAD.right} y={y(target) - 4} fontSize={10} textAnchor="end" fill={themed('#047857')}>
            Goal {target} kg
          </SvgText>
        </>
      ) : null}
      <Path d={d} stroke={Theme.colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <Circle key={p.date} cx={x(i)} cy={y(p.kg)} r={3} fill={Theme.colors.primary} />
      ))}
      <SvgText x={PAD.left} y={H - 6} fontSize={10} fill={Theme.colors.textTertiary}>
        {shortDateLabel(pts[0].date)}
      </SvgText>
      <SvgText x={width - PAD.right} y={H - 6} fontSize={10} textAnchor="end" fill={Theme.colors.textTertiary}>
        {shortDateLabel(pts[pts.length - 1].date)}
      </SvgText>
    </Svg>
  );
}

const styles = createStyles(() => ({
  empty: {
    height: 90,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  emptyText: { fontSize: 12, color: Theme.colors.textSecondary, textAlign: 'center' },
}));
