import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Check, ExternalLink, Phone, TriangleAlert } from 'lucide-react-native';
import { AuthGate } from '@/components/common/AuthGate';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, Chip, SectionHeader, uiStyles } from '@/components/common/ui';
import { PadChangeTimer } from '@/components/padcare/PadChangeTimer';
import { PadNotes } from '@/components/padcare/PadNotes';
import { Theme, createStyles, themed } from '@/constants/theme';
import {
  CHEMICALS_NOTE,
  DOCTOR_SIGNS,
  HEAVY_FLOW_TIP,
  HYGIENE_TIPS,
  PAD_CARE_SOURCES,
  PAD_CHECKLIST,
  PRODUCT_GUIDES,
  PRODUCT_ORDER,
  URGENT_SIGN,
  type PeriodProduct,
} from '@/constants/padCare';
import { shortGapCount } from '@/lib/padCare';
import { recentSignals } from '@/lib/recent';
import { daysSinceKey } from '@/lib/dates';
import { callNumber, CRISIS_LINES, openUrl } from '@/lib/openExternal';
import { useAppStore } from '@/store/useAppStore';
import { usePadCareStore } from '@/store/usePadCareStore';
import { router } from 'expo-router';
import { ROUTES } from '@/lib/routes';
import { Button, CheckRow } from '@/components/ds';

export default function PadCareScreen() {
  return (
    <AuthGate>
      <PadCareDashboard />
    </AuthGate>
  );
}

function PadCareDashboard() {
  const logs = useAppStore((s) => s.symptomLogs);
  const product = usePadCareStore((s) => s.product);
  const changes = usePadCareStore((s) => s.changes);
  const checklist = usePadCareStore((s) => s.checklist);
  const toggleChecklist = usePadCareStore((s) => s.toggleChecklist);
  const [guideFor, setGuideFor] = useState<PeriodProduct>(product);

  const flow = useMemo(() => recentSignals(logs).flow, [logs]);
  const heavy = flow === 'heavy' || flow === 'severe';
  // Counted over the 24 hours before the latest change, and only shown while
  // that change is from today or yesterday — old clusters are not news.
  const shortGaps = useMemo(() => {
    const latest = changes[0];
    if (!latest || daysSinceKey(latest.date) > 1) return 0;
    return shortGapCount(changes, latest.at);
  }, [changes]);
  const guide = PRODUCT_GUIDES[guideFor];
  const ticked = PAD_CHECKLIST.filter((c) => checklist.includes(c.id)).length;
  const amberText = themed('#92400E');

  return (
    <Screen>
      <ScreenHeader
        title="Pad Care"
        subtitle="Change reminders, choosing a safer pad, and hygiene basics"
        badge="Period Care"
      />

      {heavy ? (
        <Card tone="rose" style={{ marginBottom: 12 }}>
          <Text style={[uiStyles.strong, { color: Theme.colors.textRose }]}>You logged heavy flow</Text>
          <Text style={[uiStyles.body, { marginTop: 4 }]}>{HEAVY_FLOW_TIP}</Text>
        </Card>
      ) : null}

      <PadChangeTimer flow={flow} />

      {shortGaps >= 3 ? (
        <Card tone="amber" style={{ marginTop: 12 }}>
          <View style={[uiStyles.row, { gap: 8 }]}>
            <TriangleAlert size={16} color={amberText} />
            <Text style={[uiStyles.strong, { color: amberText, fontSize: 14, flex: 1 }]}>Many changes close together</Text>
          </View>
          <Text style={[uiStyles.body, { color: amberText, marginTop: 4 }]}>
            You changed within 2 hours of the last change {shortGaps} times in the past day. If you were soaking through each
            time, that is heavy bleeding — please check with a doctor.
          </Text>
        </Card>
      ) : null}

      {/* ── Wear time guide ─────────────────────────── */}
      <SectionHeader title="How long can I wear it?" subtitle="Tap a product to see its safe wear time" />
      <Card>
        <View style={uiStyles.wrap}>
          {PRODUCT_ORDER.map((p) => (
            <Chip key={p} label={PRODUCT_GUIDES[p].label} small selected={guideFor === p} onPress={() => setGuideFor(p)} />
          ))}
        </View>
        <Text style={styles.wearTime}>{guide.wearTime}</Text>
        <View style={styles.list}>
          {guide.tips.map((t) => (
            <View key={t} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{t}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* ── Choosing a pad ──────────────────────────── */}
      <SectionHeader title="Choosing a pad" subtitle="Tick what the pad you use now has" />
      <Card>
        {PAD_CHECKLIST.map((item) => {
          const on = checklist.includes(item.id);
          return (
            <CheckRow key={item.id} label={item.title} detail={item.why} checked={on} onToggle={() => toggleChecklist(item.id)} />
          );
        })}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>
            Your pad ticks {ticked} of {PAD_CHECKLIST.length}
          </Text>
          <Text style={uiStyles.muted}>
            {ticked >= 6
              ? 'Looks like a good pick.'
              : ticked >= 4
              ? 'Decent — check the unticked points next time you buy.'
              : 'Worth comparing a few other packs next time you buy.'}
          </Text>
        </View>
      </Card>

      <Card tone="amber" style={{ marginTop: 12 }}>
        <Text style={[uiStyles.strong, { color: amberText, fontSize: 14 }]}>{CHEMICALS_NOTE.title}</Text>
        <Text style={[uiStyles.body, { color: amberText, marginTop: 4 }]}>{CHEMICALS_NOTE.body}</Text>
      </Card>

      {/* ── Personal ratings ────────────────────────── */}
      <SectionHeader title="My pad ratings" subtitle="Rate the pads you try and see which suits you best" />
      <PadNotes />

      {/* ── Hygiene ─────────────────────────────────── */}
      <SectionHeader title="Hygiene basics" />
      <Card>
        {HYGIENE_TIPS.map((t) => (
          <View key={t} style={styles.listRow}>
            <Check size={14} color={themed('#047857')} style={{ marginTop: 4 }} />
            <Text style={styles.listText}>{t}</Text>
          </View>
        ))}
      </Card>

      {/* ── Doctor ──────────────────────────────────── */}
      <SectionHeader title="When to see a doctor" />
      <Card tone="rose">
        {DOCTOR_SIGNS.map((t) => (
          <View key={t} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{t}</Text>
          </View>
        ))}
        <View style={styles.urgentBox}>
          <Text style={styles.urgentLabel}>GET HELP NOW</Text>
          <Text style={[styles.listText, { marginTop: 4 }]}>{URGENT_SIGN}</Text>
          <Button
            variant="danger"
            size="sm"
            title={`Call ${CRISIS_LINES.emergency.number}`}
            onPress={() => callNumber(CRISIS_LINES.emergency.number, CRISIS_LINES.emergency.label)}
            accessibilityLabel="Call 112 emergency services"
            icon={<Phone size={16} color={Theme.colors.danger} />}
          />
        </View>
      </Card>

      <Button variant="secondary" title="Too unwell for class today? Make a polite leave note in a minute →" onPress={() => router.push(ROUTES.leaveNote)} style={styles.leaveRow} />

      {/* ── Sources ─────────────────────────────────── */}
      <Text style={styles.sourcesTitle}>Sources</Text>
      {PAD_CARE_SOURCES.map((s) => (
        <Button variant="link" title={s.label} key={s.url} onPress={() => openUrl(s.url)} icon={<ExternalLink size={20} color={Theme.colors.primaryDark} />} />
      ))}
      <Text style={styles.disclaimer}>
        General information, not medical advice. SheSync does not rank or endorse brands. Your ratings stay on this phone.
      </Text>
    </Screen>
  );
}

const styles = createStyles(() => ({
  wearTime: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary, marginTop: 12, lineHeight: 20 },
  list: { marginTop: 8, gap: 4 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  bullet: { fontSize: 14, fontWeight: '900', color: Theme.colors.primary, width: 10 },
  listText: { fontSize: 14, color: Theme.colors.textPrimary, flex: 1, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 77, 141, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  checkTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  scoreBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder },
  scoreText: { fontSize: 16, fontWeight: '800', color: Theme.colors.primaryDark },
  urgentBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  urgentLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1, color: '#B91C1C' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  callText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  sourcesTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.textSecondary, marginTop: 24, marginBottom: 4 },
  sourceText: { fontSize: 14, color: Theme.colors.textSecondary, textDecorationLine: 'underline', flex: 1 },
  leaveRow: { marginTop: 20 },
  leaveText: { fontSize: 14, fontWeight: '700', color: Theme.colors.secondaryDark, lineHeight: 20 },
  disclaimer: { fontSize: 14, color: Theme.colors.textTertiary, marginTop: 12, lineHeight: 20 },
}));
