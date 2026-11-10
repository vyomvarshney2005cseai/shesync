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
import { addDaysToKey, daysAgoKey, shortDateLabel } from '@/lib/dates';
import { Theme, createStyles } from '@/constants/theme';
import type { PastCycleRecord } from '@/types';

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

  // Active selection target: 'start' or 'end'
  const [selectionTarget, setSelectionTarget] = useState<'start' | 'end'>('start');

  // Temporary staging for period currently being selected or edited
  const [activeStart, setActiveStart] = useState<string | null>(
    pastCycles[0]?.startDate ?? daysAgoKey(14)
  );
  const [activeEnd, setActiveEnd] = useState<string | null>(() => {
    if (pastCycles[0]?.endDate) return pastCycles[0].endDate;
    if (pastCycles[0]?.startDate) {
      const dur = pastCycles[0].periodDurationDays || 5;
      return addDaysToKey(pastCycles[0].startDate, dur - 1);
    }
    return daysAgoKey(9);
  });

  // Set of all logged period dates across all pastCycles: YYYY-MM-DD -> { cycleId, isStart, isEnd, isMiddle }
  const periodDateMap = useMemo(() => {
    const map = new Map<
      string,
      { cycleId: string; isStart: boolean; isEnd: boolean; isPeriod: boolean }
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

  // Handle date tap on calendar
  const handleDatePress = (dateStr: string) => {
    if (selectionTarget === 'start') {
      setActiveStart(dateStr);
      // If activeEnd is before new start, automatically set end to start + 4 days
      if (!activeEnd || activeEnd < dateStr) {
        setActiveEnd(addDaysToKey(dateStr, 4));
      }
      setSelectionTarget('end');
    } else {
      // Selecting end date
      if (activeStart && dateStr < activeStart) {
        // Tapped before start date: treat as new start date
        setActiveStart(dateStr);
        setSelectionTarget('end');
      } else {
        setActiveEnd(dateStr);
        setSelectionTarget('start');
      }
    }
  };

  // Quick duration presets (e.g. 4d, 5d, 6d, 7d)
  const applyDurationPreset = (days: number) => {
    if (!activeStart) return;
    const parts = activeStart.split('-').map(Number);
    const startObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const endObj = new Date(startObj.getTime() + (days - 1) * 86400000);
    const endStr = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`;
    setActiveEnd(endStr);
  };

  // Save current active start & end to pastCycles
  const handleSaveActiveRange = () => {
    if (!activeStart || !activeEnd) return;

    const startParts = activeStart.split('-').map(Number);
    const endParts = activeEnd.split('-').map(Number);
    const sDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const eDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    const dur = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / 86400000) + 1);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysAgo = Math.max(0, Math.round((todayMid.getTime() - sDate.getTime()) / 86400000));

    // Check if modifying cycle 1 or adding a cycle
    const updated = [...pastCycles];
    if (updated.length > 0) {
      updated[0] = {
        ...updated[0],
        startDate: activeStart,
        endDate: activeEnd,
        daysAgo,
        periodDurationDays: dur,
      };
    } else {
      updated.push({
        id: `cycle-${Date.now()}`,
        cycleNumber: 1,
        startDate: activeStart,
        endDate: activeEnd,
        daysAgo,
        lengthDays: 28,
        periodDurationDays: dur,
      });
    }

    // Re-sort cycles chronologically descending
    updated.sort((a, b) => (b.startDate > a.startDate ? 1 : -1));

    // Recalculate cycle length between consecutive starts
    for (let i = 0; i < updated.length - 1; i++) {
      const cCurrent = new Date(updated[i].startDate);
      const cPrevious = new Date(updated[i + 1].startDate);
      const diffDays = Math.round((cCurrent.getTime() - cPrevious.getTime()) / 86400000);
      if (diffDays > 10 && diffDays < 120) {
        updated[i + 1].lengthDays = diffDays;
      }
    }

    onCyclesChange(updated);
  };

  // Add another past period in the year
  const handleAddAnotherPeriod = () => {
    if (!activeStart || !activeEnd) return;

    const startParts = activeStart.split('-').map(Number);
    const endParts = activeEnd.split('-').map(Number);
    const sDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const eDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    const dur = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / 86400000) + 1);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysAgo = Math.max(0, Math.round((todayMid.getTime() - sDate.getTime()) / 86400000));

    const newRecord: PastCycleRecord = {
      id: `cycle-${Date.now()}`,
      cycleNumber: pastCycles.length + 1,
      startDate: activeStart,
      endDate: activeEnd,
      daysAgo,
      lengthDays: 28,
      periodDurationDays: dur,
    };

    const merged = [newRecord, ...pastCycles.filter((c) => c.startDate !== activeStart)];
    merged.sort((a, b) => (b.startDate > a.startDate ? 1 : -1));

    // Update cycle numbers & lengths
    merged.forEach((c, idx) => {
      c.cycleNumber = idx + 1;
      if (idx < merged.length - 1) {
        const curr = new Date(c.startDate);
        const prev = new Date(merged[idx + 1].startDate);
        const len = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (len >= 15 && len <= 100) {
          merged[idx + 1].lengthDays = len;
        }
      }
    });

    onCyclesChange(merged);
  };

  // Delete a specific logged cycle
  const handleDeleteCycle = (cycleId: string) => {
    const filtered = pastCycles.filter((c) => c.id !== cycleId);
    onCyclesChange(filtered);
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

  // Active duration calculation
  const activeDurationDays = useMemo(() => {
    if (!activeStart || !activeEnd) return 5;
    const s = new Date(activeStart);
    const e = new Date(activeEnd);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }, [activeStart, activeEnd]);

  return (
    <View style={styles.calendarContainer}>
      {/* Calendar Header with Year Selector & View Mode Switcher */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <CalendarIcon size={18} color={Theme.colors.primary} />
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {/* Year Stepper */}
        <View style={styles.yearStepper}>
          <TouchableOpacity
            style={styles.yearBtn}
            onPress={() => setSelectedYear((y) => y - 1)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={16} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity
            style={styles.yearBtn}
            onPress={() => setSelectedYear((y) => y + 1)}
            activeOpacity={0.7}
          >
            <ChevronRight size={16} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Toggle: Single Month vs Full Year Overview */}
      <View style={styles.viewModeToggleRow}>
        <TouchableOpacity
          style={[
            styles.viewModeBtn,
            viewMode === 'detail' && styles.viewModeBtnActive,
          ]}
          onPress={() => setViewMode('detail')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.viewModeBtnText,
              viewMode === 'detail' && styles.viewModeBtnTextActive,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeBtn,
            viewMode === 'fullYear' && styles.viewModeBtnActive,
          ]}
          onPress={() => setViewMode('fullYear')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.viewModeBtnText,
              viewMode === 'fullYear' && styles.viewModeBtnTextActive,
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
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
            <TouchableOpacity
              key={name}
              style={[
                styles.monthPill,
                isSelected && styles.monthPillSelected,
              ]}
              onPress={() => {
                setSelectedMonth(idx);
                setViewMode('detail');
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.monthPillText,
                  isSelected && styles.monthPillTextSelected,
                ]}
              >
                {name}
              </Text>
              {periodCount > 0 && (
                <View style={styles.periodCountBadge}>
                  <Text style={styles.periodCountBadgeText}>{periodCount}d</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ─── Mode 1: Month Interactive Detail ───────────────── */}
      {viewMode === 'detail' && (
        <View style={styles.monthDetailCard}>
          {/* Active Period Selection Bar */}
          <View style={styles.selectionActionBar}>
            <View style={styles.datesDisplayRow}>
              <TouchableOpacity
                style={[
                  styles.datePill,
                  selectionTarget === 'start' && styles.datePillActive,
                ]}
                onPress={() => setSelectionTarget('start')}
                activeOpacity={0.8}
              >
                <Text style={styles.datePillLabel}>Start</Text>
                <Text style={styles.datePillValue}>
                  {activeStart ? shortDateLabel(activeStart) : 'Tap Date'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dateArrowBox}>
                <Text style={styles.durationPillText}>
                  {activeDurationDays} Days
                </Text>
                <ChevronRight size={14} color={Theme.colors.textSecondary} />
              </View>

              <TouchableOpacity
                style={[
                  styles.datePill,
                  selectionTarget === 'end' && styles.datePillActive,
                ]}
                onPress={() => setSelectionTarget('end')}
                activeOpacity={0.8}
              >
                <Text style={styles.datePillLabel}>End</Text>
                <Text style={styles.datePillValue}>
                  {activeEnd ? shortDateLabel(activeEnd) : 'Tap Date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Helper Banner */}
            <View style={styles.instructionBox}>
              <Info size={13} color={Theme.colors.primary} />
              <Text style={styles.instructionText}>
                {selectionTarget === 'start'
                  ? 'Tap the day your period started'
                  : 'Tap the day it ended'}
              </Text>
            </View>

            {/* Duration Presets */}
            <View style={styles.presetsRow}>
              <Text style={styles.presetsLabel}>Length:</Text>
              {[3, 4, 5, 6, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.presetChip,
                    activeDurationDays === days && styles.presetChipActive,
                  ]}
                  onPress={() => applyDurationPreset(days)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      activeDurationDays === days && styles.presetChipTextActive,
                    ]}
                  >
                    {days}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Current Month Name & Navigation */}
          <View style={styles.calendarMonthHeader}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear((y) => y - 1);
                } else {
                  setSelectedMonth((m) => m - 1);
                }
              }}
            >
              <ChevronLeft size={18} color={Theme.colors.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.calendarMonthTitle}>
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </Text>

            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear((y) => y + 1);
                } else {
                  setSelectedMonth((m) => m + 1);
                }
              }}
            >
              <ChevronRight size={18} color={Theme.colors.textPrimary} />
            </TouchableOpacity>
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

              const isLogged = periodDateMap.has(dateStr);
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
                      isPredicted && !inActiveRange && styles.dayCellPredicted,
                      isToday && !inActiveRange && styles.dayCellToday,
                    ]}
                    onPress={() => handleDatePress(dateStr)}
                    activeOpacity={0.7}
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
                    {isStart && <Text style={styles.endpointLabel}>START</Text>}
                    {isEnd && !isStart && <Text style={styles.endpointLabel}>END</Text>}
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

          {/* Action Row: Apply & Add More */}
          <View style={styles.calendarActionsRow}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleSaveActiveRange}
              activeOpacity={0.85}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Set Period for Cycle 1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addPeriodBtn}
              onPress={handleAddAnotherPeriod}
              activeOpacity={0.85}
            >
              <Plus size={15} color={Theme.colors.primary} />
              <Text style={styles.addPeriodBtnText}>Save period</Text>
            </TouchableOpacity>
          </View>
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
                <TouchableOpacity
                  key={mName}
                  style={[
                    styles.miniMonthCard,
                    selectedMonth === mIdx && styles.miniMonthCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(mIdx);
                    setViewMode('detail');
                  }}
                  activeOpacity={0.8}
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
                </TouchableOpacity>
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
                <View>
                  <Text style={styles.cycleDateRange}>
                    {cycle.startDate}
                    {cycle.endDate ? ` → ${cycle.endDate}` : ''}
                  </Text>
                  <Text style={styles.cycleSubtext}>
                    {cycle.periodDurationDays}d period • {cycle.lengthDays}d cycle length
                    {cycle.daysAgo !== undefined ? ` • ${cycle.daysAgo}d ago` : ''}
                  </Text>
                </View>
              </View>

              {idx > 0 && (
                <TouchableOpacity
                  style={styles.deleteCycleBtn}
                  onPress={() => handleDeleteCycle(cycle.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color="#EF4444" />
                </TouchableOpacity>
              )}
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
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
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
    paddingVertical: 2,
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
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  viewModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  viewModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  viewModeBtnTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  monthScrollView: {
    marginBottom: 14,
  },
  monthScrollContent: {
    paddingRight: 10,
    gap: 6,
  },
  monthPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthPillSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  monthPillText: {
    fontSize: 13,
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
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  periodCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8436F',
  },
  monthDetailCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectionActionBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
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
    borderRadius: 10,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  datePillActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FDF2F8',
  },
  datePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  datePillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  dateArrowBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  presetChip: {
    paddingHorizontal: 9,
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
    fontSize: 11,
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
    marginBottom: 10,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarMonthTitle: {
    fontSize: 15,
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
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  weekendText: {
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  dayCellWrap: {
    width: '14.285%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCellEmpty: {
    width: 38,
    height: 40,
  },
  dayCell: {
    width: 38,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellInRange: {
    backgroundColor: 'rgba(236, 72, 153, 0.22)',
  },
  dayCellStart: {
    backgroundColor: Theme.colors.primary,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  dayCellEnd: {
    backgroundColor: '#A8436F',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
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
    fontSize: 13,
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
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  loggedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    marginTop: 2,
  },
  predictedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C084FC',
    marginTop: 2,
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
    gap: 6,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addPeriodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FDF2F8',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  addPeriodBtnText: {
    fontSize: 12,
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
    fontSize: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniMonthCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FDF2F8',
  },
  miniMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniMonthTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  miniPeriodBadge: {
    backgroundColor: '#FCE7F3',
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  miniPeriodBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A8436F',
  },
  miniMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 42,
    alignSelf: 'center',
    gap: 2,
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
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cycleHistoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
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
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cycleNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  cycleDateRange: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cycleSubtext: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  deleteCycleBtn: {
    padding: 6,
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
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
}));
