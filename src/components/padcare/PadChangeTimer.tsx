import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Bell, BellOff, Moon, RotateCcw } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { Card, Chip, Stepper, uiStyles } from '@/components/common/ui';
import { Button, SwitchRow } from '@/components/ds';
import { PRODUCT_GUIDES, PRODUCT_ORDER } from '@/constants/padCare';
import {
  HOUR_MS,
  clockLabel,
  formatElapsed,
  reminderHours,
  suggestedHours,
  timerStatus,
  type WearMode,
} from '@/lib/padCare';
import {
  ensureReminderPermission,
  openNotificationSettings,
  remindersSupported,
  syncPadReminders,
} from '@/lib/padReminders';
import { pauseAppLock } from '@/lib/appLock';
import { usePadCareStore } from '@/store/usePadCareStore';
import { todayKey } from '@/lib/dates';
import type { FlowIntensity } from '@/types';

const SIZE = 190;
const STROKE = 13;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/**
 * Pad change timer. Stores when the product went on (not a countdown), so it
 * stays right when the app is closed. Reminders are local notifications.
 */
export function PadChangeTimer({ flow }: { flow: FlowIntensity | null }) {
  const product = usePadCareStore((s) => s.product);
  const intervalHours = usePadCareStore((s) => s.intervalHours);
  const remindersOn = usePadCareStore((s) => s.remindersOn);
  const active = usePadCareStore((s) => s.active);
  const changes = usePadCareStore((s) => s.changes);
  const setProduct = usePadCareStore((s) => s.setProduct);
  const setIntervalHours = usePadCareStore((s) => s.setIntervalHours);
  const setRemindersOn = usePadCareStore((s) => s.setRemindersOn);
  const startWear = usePadCareStore((s) => s.startWear);
  const stopWear = usePadCareStore((s) => s.stopWear);

  const [now, setNow] = useState(0);
  const [permissionNote, setPermissionNote] = useState<string | null>(null);

  const since = active?.since;
  useEffect(() => {
    if (since == null) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [since]);

  const guide = PRODUCT_GUIDES[product];
  const suggestion = suggestedHours(product, flow);
  const today = todayKey();
  const todays = changes.filter((c) => c.date === today);
  // `now` is 0 for the first frame; treat that as "just now" rather than 1970.
  const clock = now || since || 0;
  const status = active ? timerStatus(active, intervalHours, clock) : null;
  const statusColor = status ? themed(status.color) : Theme.colors.textTertiary;
  const target = active ? reminderHours(active.product, active.mode, intervalHours) : intervalHours;

  const begin = (mode: WearMode) => {
    const t = Date.now();
    startWear(t, mode);
    setNow(t);
    syncPadReminders();
  };

  const stop = () => {
    stopWear();
    syncPadReminders();
  };

  const toggleReminders = async (on: boolean) => {
    setPermissionNote(null);
    if (!on) {
      setRemindersOn(false);
      syncPadReminders();
      return;
    }
    // The permission prompt briefly sends the app to the background; don't lock for it.
    pauseAppLock();
    const result = await ensureReminderPermission();
    if (result === 'granted') {
      setRemindersOn(true);
      syncPadReminders();
    } else if (result === 'denied') {
      setPermissionNote('Notifications are off for SheSync. Turn them on in your phone settings, then try again.');
    }
  };

  return (
    <Card>
      <Text style={uiStyles.label}>What are you using?</Text>
      <View style={[uiStyles.wrap, { marginTop: 8 }]}>
        {PRODUCT_ORDER.map((p) => (
          <Chip
            key={p}
            label={PRODUCT_GUIDES[p].label}
            small
            selected={product === p}
            onPress={() => {
              setProduct(p);
              if (active) syncPadReminders();
            }}
          />
        ))}
      </View>

      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={themed('rgba(255, 77, 141, 0.12)')} strokeWidth={STROKE} fill="none" />
          {status ? (
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={statusColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={C * (1 - status.fraction)}
              strokeLinecap="round"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ) : null}
        </Svg>
        <View style={styles.ringCenter} pointerEvents="none">
          {active && status ? (
            <>
              <Text style={[styles.statusLabel, { color: statusColor }]}>{status.label.toUpperCase()}</Text>
              <Text style={styles.elapsed} accessibilityLabel={`Worn for ${formatElapsed(clock - active.since)}`}>
                {formatElapsed(clock - active.since)}
              </Text>
              <Text style={styles.ringSub}>
                {active.mode === 'night' ? 'overnight · ' : ''}since {clockLabel(active.since)}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.statusLabel, { color: Theme.colors.textTertiary }]}>TIMER OFF</Text>
              <Text style={styles.idleText}>Start when you put on a fresh {guide.noun}</Text>
            </>
          )}
        </View>
      </View>

      {status ? (
        <Text style={[styles.hint, status.id === 'over' && { color: statusColor, fontWeight: '800' }]}>{status.hint}</Text>
      ) : (
        <Text style={styles.hint}>{guide.wearTime}</Text>
      )}

      <Button
        title={active ? 'I just changed' : `Start — fresh ${guide.noun} on`}
        icon={<RotateCcw size={16} color={themed('#FFFFFF')} />}
        onPress={() => begin('day')}
        fullWidth
        style={{ marginTop: 16 }}
      />
      <View style={styles.btnRow}>
        <Button
          title={active?.mode === 'night' ? 'Restart night' : 'Going to sleep'}
          variant="secondary"
          icon={<Moon size={15} color={Theme.colors.textPrimary} />}
          onPress={() => begin('night')}
          style={{ flex: 1 }}
        />
        {active ? (
          <Button title="Period over" variant="secondary" onPress={stop} style={{ flex: 1 }} />
        ) : null}
      </View>
      {product === 'tampon' ? (
        <Text style={[uiStyles.muted, { marginTop: 8 }]}>Sleeping longer than 8 hours? Use a pad at night instead of a tampon.</Text>
      ) : null}

      <View style={styles.divider} />

      <View style={[uiStyles.row, { justifyContent: 'space-between', gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={uiStyles.strong}>Remind me every</Text>
          <Text style={uiStyles.muted}>
            Daytime · up to {guide.maxDayHours} h for a {guide.noun}
          </Text>
        </View>
        <Stepper
          label="Reminder interval"
          value={intervalHours}
          onChange={(v) => {
            setIntervalHours(v);
            if (active?.mode === 'day') syncPadReminders();
          }}
          min={1}
          max={guide.maxDayHours}
          step={0.5}
          format={(v) => `${v} h`}
        />
      </View>
      {suggestion !== intervalHours ? (
        <Button
          variant="link"
          title={`Suggested${flow === 'heavy' || flow === 'severe' ? ' for your heavy flow today' : ''}: every ${suggestion} h · tap to use`}
          onPress={() => {
            setIntervalHours(suggestion);
            if (active?.mode === 'day') syncPadReminders();
          }}
          style={styles.suggestion}
        />
      ) : null}

      <SwitchRow
        bare
        style={{ marginTop: 8 }}
        icon={remindersOn ? <Bell size={20} color={Theme.colors.primary} /> : <BellOff size={20} color={Theme.colors.textTertiary} />}
        title="Phone reminders"
        subtitle={
          !remindersSupported
            ? 'Available in the phone app. On the web, keep this page open.'
            : remindersOn
            ? active
              ? `Next at ${clockLabel(active.since + target * HOUR_MS)}`
              : 'On — start the timer to schedule one'
            : 'Off'
        }
        value={remindersOn && remindersSupported}
        onValueChange={toggleReminders}
        disabled={!remindersSupported}
      />
      {permissionNote ? (
        <Button
          variant="link"
          title={`${permissionNote} Tap to open settings.`}
          onPress={() => {
            pauseAppLock();
            openNotificationSettings();
          }}
          style={styles.permissionNote}
        />
      ) : null}

      <Text style={[uiStyles.muted, { marginTop: 16, textAlign: 'center' }]}>
        {todays.length
          ? `${todays.length} change${todays.length === 1 ? '' : 's'} logged today · last at ${clockLabel(todays[0].at)}`
          : 'No changes logged today yet'}
      </Text>
    </Card>
  );
}

const styles = createStyles(() => ({
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  ringCenter: { position: 'absolute', alignItems: 'center', width: SIZE - 44 },
  statusLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textAlign: 'center' },
  elapsed: { fontSize: 40, fontWeight: '900', color: Theme.colors.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  ringSub: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },
  idleText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  hint: { fontSize: 14, color: Theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  divider: { height: 1, backgroundColor: Theme.colors.cardBorder, marginVertical: 16 },
  suggestion: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  suggestionText: { fontSize: 14, fontWeight: '700', color: Theme.colors.primaryDark },
  permissionNote: { marginTop: 12, },
  permissionText: { fontSize: 14, color: '#92400E', lineHeight: 20 },
}));
