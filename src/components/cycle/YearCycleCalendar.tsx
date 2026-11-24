import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Info,
} from 'lucide-react-native';
import { addDaysToKey, shortDateLabel, todayKey } from '@/lib/dates';
import {
  MONTH_PART_LABEL,
  approximateLabel,
  approximateStart,
  nextRange,
  rangeDays,
  removePeriod,
  savePeriod,
  type MonthPart,
} from '@/lib/periodDates';
import { Theme, createStyles, themed } from '@/constants/theme';
import type { PastCycleRecord } from '@/types';
import { Button, Card, Chip } from '@/components/ds';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface YearCycleCalendarProps {
  pastCycles: PastCycleRecord[];
  onCyclesChange: (cycles: PastCycleRecord[]) => void;
  predictedNextStart?: string;
  predictedLength?: number;
}

export const YearCycleCalendar: React.FC<YearCycleCalendarProps> = ({
  pastCycles,
  onCyclesChange,
  predictedNextStart,
  predictedLength = 28,
}) => {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [viewMode, setViewMode] = useState<'detail' | 'fullYear'>('detail');

  // The range being picked: first tap = first day, second tap = last day.
  const [activeStart, setActiveStart] = useState<string | null>(null);
  const [activeEnd, setActiveEnd] = useState<string | null>(null);

  // "I don't remember exactly": month + early/mid/late + about how many days.
  const [approxOpen, setApproxOpen] = useState(false);
  const [approxMonth, setApproxMonth] = useState(0); // 0 = this month, 1 = last month…
  const [approxPart, setApproxPart] = useState<MonthPart>('mid');
  const [approxLen, setApproxLen] = useState(5);

  // Set of all logged period dates across all pastCycles: YYYY-MM-DD -> { cycleId, isStart, isEnd, isMiddle }
  const periodDateMap = useMemo(() => {
    const map = new Map<
      string,
      { cycleId: string; isStart: boolean; isEnd: boolean; isPeriod: boolean; approximate: boolean }
    >();

    pastCycles.forEach((c) => {
      if (!c.startDate) return;
      const startParts = c.startDate.split('-').map(Number);
      if (startParts.length !== 3) return;

      const dur = Math.max(1, c.periodDurationDays || 5);
      const startDateObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);

      for (let dayOffset = 0; dayOffset < dur; dayOffset++) {
        const d = new Date(startDateObj.getTime() + dayOffset * 86400000);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dt}`;

        map.set(dateStr, {
          cycleId: c.id,
          isStart: dayOffset === 0,
          isEnd: dayOffset === dur - 1,
          isPeriod: true,
          approximate: !!c.approximate,
        });
      }
    });

    return map;
  }, [pastCycles]);

  // Projected next period dates for future months
  const predictedDatesSet = useMemo(() => {
    const set = new Set<string>();
    if (!predictedNextStart) return set;
    const parts = predictedNextStart.split('-').map(Number);
    if (parts.length === 3) {
      const nextStart = new Date(parts[0], parts[1] - 1, parts[2]);
      for (let i = 0; i < 5; i++) {
        const d = new Date(nextStart.getTime() + i * 86400000);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        set.add(dateStr);
      }
    }
    return set;
  }, [predictedNextStart]);

  // Count of period days in each month of selected year
  const monthPeriodCount = useMemo(() => {
    const counts = Array(12).fill(0);
    periodDateMap.forEach((_, dateStr) => {
      const [y, m] = dateStr.split('-').map(Number);
      if (y === selectedYear && m >= 1 && m <= 12) {
        counts[m - 1] += 1;
      }
    });
    return counts;
  }, [periodDateMap, selectedYear]);

  // One calendar, one range: tap the first day, then the last day.
  const handleDatePress = (dateStr: string) => {
    if (dateStr > todayKey()) return; // a period can't be logged for the future
    const next = nextRange({ start: activeStart, end: activeEnd }, dateStr);
    setActiveStart(next.start);
    setActiveEnd(next.end);
  };

  // "It lasted 5 days": sets the last day from the first.
  const applyDurationPreset = (days: number) => {
    if (!activeStart) return;
    setActiveEnd(addDaysToKey(activeStart, days - 1));
  };

  const clearSelection = () => {
    setActiveStart(null);
    setActiveEnd(null);
  };

  // Saves the picked range. An overlapping saved period is replaced (an edit).
  const handleSavePeriod = () => {
    if (!activeStart || !activeEnd) return;
    onCyclesChange(savePeriod(pastCycles, { start: activeStart, end: activeEnd }, todayKey()));
    clearSelection();
  };

  const approxMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_SHORT[d.getMonth()] };
    });
  }, []);
  const approxStartKey = approximateStart(approxMonths[approxMonth].year, approxMonths[approxMonth].month, approxPart, todayKey());

  const handleSaveApproximate = () => {
    const start = approxStartKey;
    onCyclesChange(savePeriod(pastCycles, { start, end: addDaysToKey(start, approxLen - 1), approximate: true }, todayKey()));
    setApproxOpen(false);
    clearSelection();
  };

  // Delete a specific logged cycle
  const handleDeleteCycle = (cycleId: string) => {
    onCyclesChange(removePeriod(pastCycles, cycleId, todayKey()));
  };

  // Generate calendar days for a specific year and month
  const getMonthMatrix = (year: number, monthIdx: number) => {
    const firstDay = new Date(year, monthIdx, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon ...
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

    const cells: { dayNum: number | null; dateStr: string | null }[] = [];

    // Empty cells before day 1
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dayNum: null, dateStr: null });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr });
    }

    // Pad trailing empty cells so calendar rows are complete 7-day weeks
    const totalCells = Math.ceil(cells.length / 7) * 7;
    for (let i = cells.length; i < totalCells; i++) {
      cells.push({ dayNum: null, dateStr: null });
    }

    return cells;
  };

  const currentMonthMatrix = useMemo(
    () => getMonthMatrix(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const activeDurationDays = activeStart && activeEnd ? rangeDays(activeStart, activeEnd) : 0;

  return (
    <Card style={styles.calendarContainer}>
      {/* Calendar Header with Year Selector & View Mode Switcher */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <CalendarIcon size={18} color={Theme.colors.primary} />
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {/* Year Stepper */}
        <View style={styles.yearStepper}>
          <Button variant="tertiary" size="sm" iconOnly onPress={() => setSelectedYear((y) => y - 1)} accessibilityLabel="Previous year" icon={<ChevronLeft size={20} color={Theme.colors.textPrimary} />} />
          <Text style={styles.yearText}>{selectedYear}</Text>
          <Button variant="tertiary" size="sm" iconOnly onPress={() => setSelectedYear((y) => y + 1)} accessibilityLabel="Next year" icon={<ChevronRight size={20} color={Theme.colors.textPrimary} />} />
        </View>
      </View>

      {/* View Mode Toggle: Single Month vs Full Year Overview */}
      <View style={styles.viewModeToggleRow}>
        <Chip label="Month" selected={viewMode === 'detail'} onPress={() => setViewMode('detail')} accessibilityRole="tab" style={styles.viewModeBtn} />

        <Chip label="Year" selected={viewMode === 'fullYear'} onPress={() => setViewMode('fullYear')} accessibilityRole="tab" style={styles.viewModeBtn} />
      </View>

      {/* Horizontal Month Switcher (12 Months) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthScrollContent}
        style={styles.monthScrollView}
      >
        {MONTH_SHORT.map((name, idx) => {
          const isSelected = selectedMonth === idx;
          const periodCount = monthPeriodCount[idx];
          return (
            <Chip
              key={name}
              small
              label={periodCount > 0 ? `${name} · ${periodCount}d` : name}
              selected={isSelected}
              onPress={() => {
                setSelectedMonth(idx);
                setViewMode('detail');
              }}
              accessibilityLabel={`${MONTH_NAMES[idx]}${periodCount > 0 ? `, ${periodCount} period days` : ''}`}
            />
          );
        })}
      </ScrollView>

      {/* ─── Mode 1: Month Interactive Detail ───────────────── */}
      {viewMode === 'detail' && (
        <View style={styles.monthDetailCard}>
          {/* One range, one line: what is picked so far and what to tap next */}
          <View style={styles.selectionActionBar}>
            <View style={styles.rangeSummary} accessibilityLiveRegion="polite">
              <Text style={styles.rangeSummaryText}>
                {!activeStart
                  ? 'Tap the first day of your period'
                  : !activeEnd
                  ? `${shortDateLabel(activeStart)} → now tap the last day`
                  : `${shortDateLabel(activeStart)} – ${shortDateLabel(activeEnd)} · ${activeDurationDays} day${activeDurationDays === 1 ? '' : 's'}`}
              </Text>
              {activeStart ? (
                <Button variant="link" title="Clear" onPress={clearSelection} accessibilityLabel="Clear the picked dates" />
              ) : null}
            </View>

            {activeStart ? (
              <View style={styles.presetsRow}>
                <Text style={styles.presetsLabel}>Lasted:</Text>
                {[3, 4, 5, 6, 7].map((days) => (
                  <Chip key={days} small label={`${days}d`} selected={activeDurationDays === days} onPress={() => applyDurationPreset(days)} accessibilityLabel={`Lasted ${days} days`} accessibilityRole="radio" />
                ))}
              </View>
            ) : (
              <View style={styles.instructionBox}>
                <Info size={13} color={Theme.colors.primary} />
                <Text style={styles.instructionText}>Then tap the day it ended — both on this calendar.</Text>
              </View>
            )}
          </View>

          {/* Current Month Name & Navigation */}
          <View style={styles.calendarMonthHeader}>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              icon={<ChevronLeft size={20} color={Theme.colors.textPrimary} />}
              onPress={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear((y) => y - 1);
                } else {
                  setSelectedMonth((m) => m - 1);
                }
              }}
              accessibilityLabel="Previous month"
              testID="calendar-prev-month"
            />

            <Text style={styles.calendarMonthTitle}>
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </Text>

            <Button
              variant="secondary"
              size="sm"
              iconOnly
              icon={<ChevronRight size={20} color={Theme.colors.textPrimary} />}
              onPress={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear((y) => y + 1);
                } else {
                  setSelectedMonth((m) => m + 1);
                }
              }}
              accessibilityLabel="Next month"
              testID="calendar-next-month"
            />
          </View>

          {/* Day of Week Headers */}
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((label, idx) => (
              <Text
                key={label}
                style={[
                  styles.dayLabelText,
                  (idx === 0 || idx === 6) && styles.weekendText,
                ]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Monthly Date Grid */}
          <View style={styles.daysGrid}>
            {currentMonthMatrix.map((cell, idx) => {
              if (!cell.dayNum || !cell.dateStr) {
                return (
                  <View key={`empty-${idx}`} style={styles.dayCellWrap}>
                    <View style={styles.dayCellEmpty} />
                  </View>
                );
              }

              const dateStr = cell.dateStr;
              const isStart = activeStart === dateStr;
              const isEnd = activeEnd === dateStr;
              const inActiveRange =
                activeStart &&
                activeEnd &&
                dateStr >= activeStart &&
                dateStr <= activeEnd;

              const logged = periodDateMap.get(dateStr);
              const isLogged = !!logged;
              const isApprox = !!logged?.approximate;
              const isFuture = dateStr > todayKey();
              const isPredicted = predictedDatesSet.has(dateStr);
              const isToday =
                dateStr ===
                `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

              return (
                <View key={dateStr} style={styles.dayCellWrap}>
                  <TouchableOpacity
                    style={[
                      styles.dayCell,
                      inActiveRange && styles.dayCellInRange,
                      isStart && styles.dayCellStart,
                      isEnd && styles.dayCellEnd,
                      isLogged && !inActiveRange && styles.dayCellLogged,
                      isApprox && !inActiveRange && styles.dayCellApprox,
                      isPredicted && !inActiveRange && styles.dayCellPredicted,
                      isToday && !inActiveRange && styles.dayCellToday,
                    ]}
                    onPress={() => handleDatePress(dateStr)}
                    activeOpacity={0.7}
                    disabled={isFuture}
                    accessibilityRole="button"
                    accessibilityState={{ selected: !!(isStart || isEnd || inActiveRange) }}
                    testID={`day-${dateStr}`}
                    accessibilityLabel={`${shortDateLabel(dateStr)}${isStart ? ', first day' : ''}${isEnd ? ', last day' : ''}${isLogged ? (isApprox ? ', saved period, approximate' : ', saved period') : ''}`}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        inActiveRange && styles.dayCellTextInRange,
                        (isStart || isEnd) && styles.dayCellTextEndpoint,
                        isLogged && !inActiveRange && styles.dayCellTextLogged,
                        isToday && !inActiveRange && styles.dayCellTextToday,
                      ]}
                    >
                      {cell.dayNum}
                    </Text>

                    {/* Micro Indicators */}
                    {isStart && <Text style={styles.endpointLabel}>FIRST</Text>}
                    {isEnd && !isStart && <Text style={styles.endpointLabel}>LAST</Text>}
                    {isLogged && !inActiveRange && (
                      <View style={styles.loggedDot} />
                    )}
                    {isPredicted && !inActiveRange && (
                      <View style={styles.predictedDot} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Save the picked range */}
          <View style={styles.calendarActionsRow}>
            <Button
              title={activeStart && activeEnd ? 'Save this period' : 'Pick the first and last day'}
              onPress={handleSavePeriod}
              disabled={!(activeStart && activeEnd)}
              icon={<Check size={20} color={activeStart && activeEnd ? Theme.colors.onPrimary : Theme.colors.textTertiary} />}
              fullWidth
            />
          </View>

          {/* "I don't remember exactly" */}
          <Button variant="link" title={approxOpen ? 'Hide' : 'I don’t remember exactly'} onPress={() => setApproxOpen((o) => !o)} testID="approx-toggle" style={styles.approxToggle} />
          {approxOpen ? (
            <View style={styles.approxPanel}>
              <Text style={styles.approxTitle}>Roughly when did it start?</Text>
              <View style={styles.approxChips}>
                {approxMonths.map((m, i) => (
                  <Chip key={`${m.year}-${m.month}`} small label={m.label} selected={approxMonth === i} onPress={() => setApproxMonth(i)} testID={`approx-month-${i}`} accessibilityRole="radio" />
                ))}
              </View>
              <View style={styles.approxChips}>
                {(['early', 'mid', 'late'] as MonthPart[]).map((part) => (
                  <Chip key={part} small label={MONTH_PART_LABEL[part]} selected={approxPart === part} onPress={() => setApproxPart(part)} testID={`approx-${part}`} accessibilityRole="radio" />
                ))}
              </View>
              <Text style={styles.approxTitle}>About how many days?</Text>
              <View style={styles.approxChips}>
                {[3, 4, 5, 6, 7].map((d) => (
                  <Chip key={d} small label={`${d}d`} selected={approxLen === d} onPress={() => setApproxLen(d)} accessibilityLabel={`About ${d} days`} accessibilityRole="radio" />
                ))}
              </View>
              <Text style={styles.approxNote}>
                Saved as {approximateLabel(approxStartKey)}. Predictions use a wider margin until you log a period on the day.
              </Text>
              <Button variant="secondary" title="Save approximate period" onPress={handleSaveApproximate} testID="approx-save" icon={<Plus size={20} color={Theme.colors.textPrimary} />} fullWidth style={styles.addPeriodBtn} />
            </View>
          ) : null}
        </View>
      )}

      {/* ─── Mode 2: Full Year Overview (12 Months at a glance) ─ */}
      {viewMode === 'fullYear' && (
        <View style={styles.fullYearWrapper}>
          <Text style={styles.fullYearNotice}>
            Full 12-Month Year View for {selectedYear}. Tap any month to jump into detail.
          </Text>

          <View style={styles.miniMonthsGrid}>
            {MONTH_NAMES.map((mName, mIdx) => {
              const matrix = getMonthMatrix(selectedYear, mIdx);
              const pCount = monthPeriodCount[mIdx];
              return (
                <Card
                  key={mName}
                  padding="none"
                  tone={selectedMonth === mIdx ? 'rose' : 'default'}
                  style={styles.miniMonthCard}
                  onPress={() => {
                    setSelectedMonth(mIdx);
                    setViewMode('detail');
                  }}
                  accessibilityLabel={`${MONTH_NAMES[mIdx]} ${selectedYear}${pCount > 0 ? `, ${pCount} period days` : ''}`}
                  accessibilityHint="Opens this month"
                  accessibilityState={{ selected: selectedMonth === mIdx }}
                >
                  <View style={styles.miniMonthHeader}>
                    <Text style={styles.miniMonthTitle}>{MONTH_SHORT[mIdx]}</Text>
                    {pCount > 0 && (
                      <View style={styles.miniPeriodBadge}>
                        <Text style={styles.miniPeriodBadgeText}>{pCount}d</Text>
                      </View>
                    )}
                  </View>

                  {/* 7 Columns of mini dots */}
                  <View style={styles.miniMatrix}>
                    {matrix.map((c, cIdx) => {
                      if (!c.dayNum || !c.dateStr) {
                        return <View key={cIdx} style={styles.miniDotEmpty} />;
                      }
                      const hasPeriod = periodDateMap.has(c.dateStr);
                      return (
                        <View
                          key={cIdx}
                          style={[
                            styles.miniDot,
                            hasPeriod && styles.miniDotPeriod,
                          ]}
                        />
                      );
                    })}
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      )}

      {/* ─── Logged Cycles in Full Year Summary List ─────────── */}
      <View style={styles.historySection}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Saved periods ({pastCycles.length})</Text>
        </View>

        {pastCycles.map((cycle, idx) => {
          return (
            <View key={cycle.id || `c-${idx}`} style={styles.cycleHistoryCard}>
              <View style={styles.cycleCardLeft}>
                <View style={styles.cycleNumberBadge}>
                  <Text style={styles.cycleNumberText}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cycleDateRange}>
                    {cycle.approximate
                      ? `≈ Started ${approximateLabel(cycle.startDate)}`
                      : `${shortDateLabel(cycle.startDate)}${cycle.endDate ? ` – ${shortDateLabel(cycle.endDate)}` : ''}`}
                  </Text>
                  <Text style={styles.cycleSubtext}>
                    {cycle.periodDurationDays}d period • {cycle.lengthDays}d cycle
                    {cycle.approximate ? ' • approximate' : ''}
                  </Text>
                </View>
              </View>

              <Button
                variant="tertiary"
                size="sm"
                iconOnly
                onPress={() => handleDeleteCycle(cycle.id)}
                accessibilityLabel="Delete this period"
                icon={<Trash2 size={20} color={Theme.colors.danger} />}
              />
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Theme.colors.primary }]} />
          <Text style={styles.legendText}>Period Flow</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: '#C084FC', borderStyle: 'dashed' },
            ]}
          />
          <Text style={styles.legendText}>Predicted Next</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendApprox]} />
          <Text style={styles.legendText}>Approximate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: themed('#3B82F6') }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = createStyles(() => ({
  calendarContainer: { marginBottom: 20 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  yearStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  yearBtn: {
    padding: 4,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginHorizontal: 8,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    gap: Theme.space.xs,
    marginBottom: Theme.space.sm,
  },
  viewModeBtn: { flex: 1 },
  viewModeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  viewModeBtnTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  monthScrollView: {
    marginBottom: 16,
  },
  monthScrollContent: {
    paddingRight: 12,
    gap: 8,
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthPillSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  monthPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  periodCountBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  periodCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8436F',
  },
  monthDetailCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectionActionBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  datesDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  datePill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  datePillActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FDF2F8',
  },
  datePillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  datePillValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  dateArrowBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  rangeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  rangeSummaryText: { flex: 1, fontSize: 14, fontWeight: '800', color: Theme.colors.primaryDark },
  clearText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary, textDecorationLine: 'underline' },
  applyBtnOff: { opacity: 0.5 },
  dayCellApprox: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Theme.colors.primary, backgroundColor: 'transparent' },
  approxToggle: { alignSelf: 'center', marginTop: Theme.space.sm },
  approxToggleText: { fontSize: 14, fontWeight: '700', color: Theme.colors.secondaryDark, textDecorationLine: 'underline' },
  approxPanel: { marginTop: Theme.space.xs, backgroundColor: Theme.colors.secondaryLight, borderRadius: Theme.radius.lg, padding: Theme.space.md, gap: Theme.space.sm },
  approxTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  approxChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  approxNote: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary },
  legendApprox: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: Theme.colors.primary },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  dayLabelText: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  weekendText: {
    color: Theme.colors.textTertiary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  dayCellWrap: {
    width: '14.285%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dayCellEmpty: {
    width: 44,
    height: 40,
  },
  dayCell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayCellInRange: {
    backgroundColor: 'rgba(236, 72, 153, 0.22)',
  },
  dayCellStart: {
    backgroundColor: Theme.colors.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  dayCellEnd: {
    backgroundColor: '#A8436F',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  dayCellLogged: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  dayCellPredicted: {
    borderWidth: 1.5,
    borderColor: '#C084FC',
    borderStyle: 'dashed',
    backgroundColor: '#FAF5FF',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  dayCellTextInRange: {
    color: '#9D174D',
    fontWeight: '700',
  },
  dayCellTextEndpoint: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellTextLogged: {
    color: '#A8436F',
    fontWeight: '700',
  },
  dayCellTextToday: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  endpointLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  loggedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    marginTop: 4,
  },
  predictedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C084FC',
    marginTop: 4,
  },
  calendarActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addPeriodBtn: {
  },
  addPeriodBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  fullYearWrapper: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  fullYearNotice: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  miniMonthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  miniMonthCard: {
    width: '31%',
    padding: 8,
  },
  miniMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniMonthTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  miniPeriodBadge: {
    backgroundColor: '#FCE7F3',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  miniPeriodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8436F',
  },
  miniMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 42,
    alignSelf: 'center',
    gap: 4,
    height: 38,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  miniDotEmpty: {
    width: 4,
    height: 4,
  },
  miniDotPeriod: {
    backgroundColor: Theme.colors.primary,
  },
  historySection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cycleHistoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cycleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleNumberBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cycleNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  cycleDateRange: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cycleSubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  deleteCycleBtn: {
    padding: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
}));
