import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  ExternalLink,
  FileText,
  HeartHandshake,
  MessageCircle,
  Phone,
  Plus,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { AuthGate } from '@/components/common/AuthGate';
import { Button, Card } from '@/components/ds';
import { Chip } from '@/components/common/ui';
import { Theme, createStyles, themed } from '@/constants/theme';
import {
  COUNSELLOR_SERVICES,
  GYNAE_SERVICES,
  VISIT_CHECKLIST,
  WOMEN_SAFETY_SERVICES,
  type CareService,
} from '@/constants/careContacts';
import { useAppStore } from '@/store/useAppStore';
import { assessReferral, REFERRAL_LEVEL_TEXT } from '@/lib/referral';
import { callNumber, openUrl } from '@/lib/openExternal';
import type { CareContact } from '@/types';
import { ROUTES } from '@/lib/routes';

const ROLE_LABEL: Record<CareContact['role'], string> = {
  gynaecologist: 'Gynaecologist',
  counsellor: 'Counsellor',
  other: 'Other',
};

/** Care Connect: gynaecologists, women's counsellors, safety helplines and her own care team. */
export default function CareConnectScreen() {
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const healthCheck = useAppStore((s) => s.healthCheck);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);
  const syncCompletedAt = useAppStore((s) => s.syncCompletedAt);
  const contacts = useAppStore((s) => s.careContacts);
  const addCareContact = useAppStore((s) => s.addCareContact);
  const removeCareContact = useAppStore((s) => s.removeCareContact);
  const generateClinicalPDF = useAppStore((s) => s.generateClinicalPDF);
  const isGenerating = useAppStore((s) => s.clinicalReport.isGenerating);

  const result = useMemo(
    () => assessReferral({ assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction }),
    [assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction]
  );

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CareContact['role']>('gynaecologist');
  const [formError, setFormError] = useState('');

  const saveContact = () => {
    const digits = phone.replace(/[^\d]/g, '');
    if (!name.trim()) return setFormError('Add a name, e.g. “Dr. Mehta (gynae)”.');
    if (digits.length < 3) return setFormError('Add a phone number.');
    addCareContact({ name, phone, role });
    setName('');
    setPhone('');
    setRole('gynaecologist');
    setFormError('');
    setAdding(false);
  };

  return (
    <AuthGate>
      <Screen>
        <ScreenHeader
          title="Care Connect"
          subtitle="Gynaecologists and women’s counsellors"
        />

        {/* Status from the sync result */}
        {syncCompletedAt ? (
          <Card
            tone={result.referable ? 'amber' : 'mint'}
            onPress={() => router.push(ROUTES.syncResult)}
            style={styles.status}
          >
            <Text style={[styles.statusLabel, { color: result.referable ? Theme.colors.strainAmber : Theme.colors.strainOptimal }]}>
              YOUR SYNC RESULT · {result.referable ? 'REFERABLE' : 'NOT REFERABLE'}
            </Text>
            <Text style={styles.statusTitle}>{REFERRAL_LEVEL_TEXT[result.level].title}</Text>
            {result.referable ? (
              <Text style={styles.statusSub}>Tell the doctor about: {result.reasons.map((r) => r.title.toLowerCase()).join('; ')}.</Text>
            ) : (
              <Text style={styles.statusSub}>You can still talk to a doctor or counsellor any time you want to.</Text>
            )}
          </Card>
        ) : null}

        {/* ── Gynaecologist ── */}
        <SectionTitle icon={<Stethoscope size={18} color={Theme.colors.primary} />} title="Talk to a gynaecologist" />
        {GYNAE_SERVICES.map((s) => (
          <ServiceCard key={s.id} service={s} tone="rose" />
        ))}
        <View style={[styles.card, styles.prepCard]}>
          <Text style={styles.cardTitle}>Before your visit</Text>
          {VISIT_CHECKLIST.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
          <Button
            title="Download my Unnmegh doctor report"
            icon={<FileText size={16} color={themed('#FFFFFF')} />}
            onPress={() => generateClinicalPDF()}
            loading={isGenerating}
            variant="primary"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </View>

        {/* ── Counsellors ── */}
        <SectionTitle
          icon={<HeartHandshake size={18} color={Theme.colors.secondary} />}
          title="Talk to a counsellor"
          sub={
            result.counsellorSuggested
              ? 'Your sync answers suggest a counsellor could really help. It is free and private.'
              : 'For stress, low mood, anxiety, PMS/PMDD, body image or relationships.'
          }
        />
        {COUNSELLOR_SERVICES.map((s) => (
          <ServiceCard key={s.id} service={s} tone="lilac" />
        ))}
        <Text style={styles.tip}>
          Tip: if you would feel more comfortable, it is okay to ask whether a woman counsellor is available.
        </Text>

        {/* ── Safety ── */}
        <SectionTitle icon={<ShieldAlert size={18} color={themed('#A33B55')} />} title="Women’s safety & emergencies" />
        {WOMEN_SAFETY_SERVICES.map((s) => (
          <ServiceCard key={s.id} service={s} tone="neutral" />
        ))}

        {/* ── Her own care team ── */}
        <SectionTitle
          icon={<UserRound size={18} color={Theme.colors.strainOptimal} />}
          title="My care team"
          sub="Save your own gynaecologist or counsellor here for one-tap calling."
        />
        {contacts.length === 0 && !adding ? (
          <Text style={styles.empty}>No saved contacts yet.</Text>
        ) : null}
        {contacts.map((c) => (
          <View key={c.id} style={[styles.card, styles.contactCard]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.cardMeta}>
                {ROLE_LABEL[c.role]} · {c.phone}
              </Text>
            </View>
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              onPress={() => callNumber(c.phone, c.name)}
              accessibilityLabel={`Call ${c.name}`}
              icon={<Phone size={20} color={Theme.colors.primary} />}
              style={styles.iconBtn}
            />
            <Button
              variant="secondary"
              size="sm"
              iconOnly
              onPress={() => removeCareContact(c.id)}
              accessibilityLabel={`Remove ${c.name}`}
              icon={<Trash2 size={20} color={Theme.colors.textTertiary} />}
              style={styles.iconBtn}
            />
          </View>
        ))}
        {adding ? (
          <View style={styles.card}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name, e.g. Dr. Mehta (gynae)"
              placeholderTextColor={Theme.colors.textTertiary}
              style={styles.input}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={Theme.colors.textTertiary}
              keyboardType="phone-pad"
              style={[styles.input, { marginTop: 8 }]}
            />
            <View style={styles.roleRow}>
              {(Object.keys(ROLE_LABEL) as CareContact['role'][]).map((r) => (
                <Chip key={r} label={ROLE_LABEL[r]} selected={role === r} onPress={() => setRole(r)} small />
              ))}
            </View>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <View style={styles.formRow}>
              <Button title="Cancel" variant="secondary" onPress={() => setAdding(false)} style={{ flex: 1 }} />
              <Button title="Save" onPress={saveContact} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <Button
            title="Add a doctor or counsellor"
            icon={<Plus size={16} color={Theme.colors.textPrimary} />}
            variant="secondary"
            onPress={() => setAdding(true)}
            fullWidth
          />
        )}

        <Text style={styles.footnote}>
          Numbers checked in November 2026. Services can change their hours — if a line does not connect, try another one
          here, or 112 in an emergency.
        </Text>
      </Screen>
    </AuthGate>
  );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionRow}>
        {icon}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

function ServiceCard({ service, tone }: { service: CareService; tone: 'rose' | 'lilac' | 'neutral' }) {
  const accent = tone === 'rose' ? Theme.colors.primary : tone === 'lilac' ? Theme.colors.secondaryDark : themed('#A33B55');
  return (
    <View style={styles.card}>
      <View style={styles.serviceHead}>
        <Text style={[styles.cardTitle, { flex: 1 }]}>{service.name}</Text>
        {service.free ? (
          <View style={styles.freePill}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardMeta}>{service.hours}</Text>
      <Text style={styles.cardBody}>{service.what}</Text>
      <View style={styles.actions}>
        {service.call ? (
          <Button size="sm" title={service.callLabel ?? `Call ${service.call}`} onPress={() => callNumber(service.call!, service.name)} icon={<Phone size={16} color={Theme.colors.onPrimary} />} />
        ) : null}
        {service.whatsapp ? (
          <Button variant="secondary" size="sm" title="WhatsApp" onPress={() => openUrl(`https://wa.me/${service.whatsapp}`)} icon={<MessageCircle size={16} color={Theme.colors.textPrimary} />} />
        ) : null}
        {service.url ? (
          <Button
            variant={service.call ? 'secondary' : 'primary'}
            size="sm"
            title={service.urlLabel ?? 'Open'}
            onPress={() => openUrl(service.url!)}
            accessibilityHint="Opens in your browser"
            icon={<ExternalLink size={16} color={service.call ? Theme.colors.textPrimary : Theme.colors.onPrimary} />}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = createStyles(() => ({
  status: { marginBottom: 4 },
  statusRef: { backgroundColor: '#FFF3E6', borderColor: '#F4D6B5' },
  statusOk: { backgroundColor: '#E9F6F0', borderColor: '#BFE3D4' },
  statusLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  statusTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 4 },
  statusSub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  sectionHead: { marginTop: 24, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.3 },
  sectionSub: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: 12,
  },
  prepCard: { backgroundColor: '#FFF9F4', borderColor: '#F6E3D3' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  cardMeta: { fontSize: 12, fontWeight: '700', color: Theme.colors.textTertiary, marginTop: 4 },
  cardBody: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
  freePill: { backgroundColor: '#E7F5F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.radius.full },
  freeText: { fontSize: 12, fontWeight: '800', color: '#276C5C', letterSpacing: 0.6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.full,
  },
  actionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  actionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  actionOutlineText: { fontWeight: '800', fontSize: 14 },
  bulletRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.peachDark, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 14, color: Theme.colors.textPrimary, lineHeight: 20 },
  tip: { fontSize: 14, color: Theme.colors.textSecondary, lineHeight: 20, marginTop: 4, paddingHorizontal: 4 },
  empty: { fontSize: 14, color: Theme.colors.textTertiary, marginBottom: 12 },
  iconBtn: { width: 38 },
  input: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  formError: { color: '#A33B55', fontSize: 14, marginTop: 8, fontWeight: '600' },
  formRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  footnote: { fontSize: 12, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: 20, lineHeight: 16 },
}));
