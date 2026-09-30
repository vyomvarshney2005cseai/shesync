import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Rect,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { Theme } from '@/constants/theme';
import type { DailyDataPoint } from '@/types';

interface TrendChartProps {
  data: DailyDataPoint[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 16, bottom: 36, left: 36 };

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const effectiveWidth = Math.min(screenWidth, 520);
  const chartWidth = Math.max(260, effectiveWidth - 76); // accounting for screen padding + card padding
  const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const maxPain = 10;
  const xScale = (day: number) =>
    CHART_PADDING.left + ((day - 1) / 89) * plotWidth;
  const yScale = (val: number) =>
    CHART_PADDING.top + plotHeight - (val / maxPain) * plotHeight;

  // Build path for pain severity line
  const painPath = data
    .map((d, i) => {
      const x = xScale(d.day);
      const y = yScale(d.painSeverity);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Area fill path
  const areaPath = `${painPath} L ${xScale(data[data.length - 1].day)} ${yScale(0)} L ${xScale(data[0].day)} ${yScale(0)} Z`;

  // Find anovulatory gap regions
  const gapStart = data.findIndex((d) => d.isAnovulatory);
  const gapEnd = data.findLastIndex((d) => d.isAnovulatory);

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>90-Day Pain vs. Cycle Trend</Text>
      <Text style={styles.chartSubtitle}>
        Pain severity overlaid against cycle irregularity
      </Text>

      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Theme.colors.strainHigh} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={Theme.colors.strainHigh} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Y axis grid lines */}
        {[0, 2, 4, 6, 8, 10].map((val) => (
          <G key={`grid-${val}`}>
            <Line
              x1={CHART_PADDING.left}
              y1={yScale(val)}
              x2={chartWidth - CHART_PADDING.right}
              y2={yScale(val)}
              stroke={Theme.colors.cardBorder}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={CHART_PADDING.left - 8}
              y={yScale(val) + 4}
              textAnchor="end"
              fontSize={10}
              fill={Theme.colors.textTertiary}
            >
              {val}
            </SvgText>
          </G>
        ))}

        {/* Anovulatory gap highlight */}
        {gapStart >= 0 && gapEnd >= 0 && (
          <Rect
            x={xScale(data[gapStart].day)}
            y={CHART_PADDING.top}
            width={xScale(data[gapEnd].day) - xScale(data[gapStart].day)}
            height={plotHeight}
            fill="rgba(245, 158, 11, 0.08)"
            rx={4}
          />
        )}

        {/* Area under curve */}
        <Path d={areaPath} fill="url(#painGradient)" />

        {/* Pain line */}
        <Path
          d={painPath}
          stroke={Theme.colors.strainHigh}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Menstrual markers */}
        {data
          .filter((d) => d.isMenstrual)
          .map((d) => (
            <Circle
              key={`mens-${d.day}`}
              cx={xScale(d.day)}
              cy={yScale(0) + 8}
              r={2.5}
              fill={Theme.colors.primary}
            />
          ))}

        {/* X axis labels */}
        {[1, 15, 30, 45, 60, 75, 90].map((day) => (
          <SvgText
            key={`xlab-${day}`}
            x={xScale(day)}
            y={CHART_HEIGHT - 6}
            textAnchor="middle"
            fontSize={10}
            fill={Theme.colors.textTertiary}
          >
            D{day}
          </SvgText>
        ))}

        {/* Gap label */}
        {gapStart >= 0 && gapEnd >= 0 && (
          <SvgText
            x={(xScale(data[gapStart].day) + xScale(data[gapEnd].day)) / 2}
            y={CHART_PADDING.top + 14}
            textAnchor="middle"
            fontSize={9}
            fontWeight="bold"
            fill={Theme.colors.strainAmber}
          >
            45-Day Anovulatory Gap
          </SvgText>
        )}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.strainHigh }]} />
          <Text style={styles.legendText}>Pain Severity (0-10)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.primary }]} />
          <Text style={styles.legendText}>Menstrual Days</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.strainAmber, opacity: 0.4 }]} />
          <Text style={styles.legendText}>Anovulatory Gap</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textTertiary,
  },
});
