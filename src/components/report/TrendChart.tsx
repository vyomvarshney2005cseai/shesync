import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { Theme, createStyles, themed } from '@/constants/theme';
import { shortDateLabel } from '@/lib/dates';
import type { DailyDataPoint } from '@/types';

interface TrendChartProps {
  data: DailyDataPoint[];
}

const CHART_HEIGHT = 200;
const PAD = { top: 20, right: 16, bottom: 36, left: 36 };

/**
 * 90-day pain chart drawn only from days the user actually logged pain.
 * Period days come from saved cycles and logged flow; shaded spans are
 * saved cycles longer than 35 days.
 */
export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(260, Math.min(screenWidth, 520) - 76);
  const plotWidth = chartWidth - PAD.left - PAD.right;
  const plotHeight = CHART_HEIGHT - PAD.top - PAD.bottom;
  const n = Math.max(2, data.length);

  const x = (day: number) => PAD.left + ((day - 1) / (n - 1)) * plotWidth;
  const y = (val: number) => PAD.top + plotHeight - (val / 10) * plotHeight;

  const logged = data.filter((d) => d.painSeverity !== null);
  const painPath = logged.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.day)} ${y(d.painSeverity as number)}`).join(' ');

  // Contiguous long-cycle spans.
  const spans: { start: number; end: number }[] = [];
  data.forEach((d) => {
    if (!d.isAnovulatory) return;
    const last = spans[spans.length - 1];
    if (last && last.end === d.day - 1) last.end = d.day;
    else spans.push({ start: d.day, end: d.day });
  });

  const xLabels = [1, 31, 61, 90].filter((d) => d <= data.length);

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>90-Day Pain vs. Cycle Trend</Text>
      <Text style={styles.chartSubtitle}>
        {logged.length >= 2
          ? `${logged.length} days of logged pain, with your period days marked`
          : 'Log pain on a few days and your real trend will appear here'}
      </Text>

      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {[0, 2, 4, 6, 8, 10].map((val) => (
          <G key={`grid-${val}`}>
            <Line
              x1={PAD.left}
              y1={y(val)}
              x2={chartWidth - PAD.right}
              y2={y(val)}
              stroke={Theme.colors.cardBorder}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText x={PAD.left - 8} y={y(val) + 4} textAnchor="end" fontSize={10} fill={Theme.colors.textTertiary}>
              {val}
            </SvgText>
          </G>
        ))}

        {spans.map((s) => (
          <Rect
            key={`span-${s.start}`}
            x={x(s.start)}
            y={PAD.top}
            width={Math.max(2, x(s.end) - x(s.start))}
            height={plotHeight}
            fill={themed('rgba(245, 158, 11, 0.10)')}
            rx={4}
          />
        ))}

        {logged.length >= 2 && (
          <Path d={painPath} stroke={Theme.colors.strainHigh} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {logged.map((d) => (
          <Circle key={`p-${d.day}`} cx={x(d.day)} cy={y(d.painSeverity as number)} r={3.5} fill={Theme.colors.strainHigh} />
        ))}

        {data
          .filter((d) => d.isMenstrual)
          .map((d) => (
            <Circle key={`mens-${d.day}`} cx={x(d.day)} cy={y(0) + 8} r={2.5} fill={Theme.colors.primary} />
          ))}

        {xLabels.map((day) => (
          <SvgText
            key={`xlab-${day}`}
            x={x(day)}
            y={CHART_HEIGHT - 6}
            textAnchor={day === 1 ? 'start' : day === data.length ? 'end' : 'middle'}
            fontSize={10}
            fill={Theme.colors.textTertiary}
          >
            {day === data.length ? 'Today' : shortDateLabel(data[day - 1].dateKey)}
          </SvgText>
        ))}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.strainHigh }]} />
          <Text style={styles.legendText}>Logged pain (0–10)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.primary }]} />
          <Text style={styles.legendText}>Period days</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.strainAmber, opacity: 0.4 }]} />
          <Text style={styles.legendText}>Cycle longer than 35 days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  chartTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.3 },
  chartSubtitle: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2, marginBottom: 14 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: Theme.colors.textTertiary },
}));
