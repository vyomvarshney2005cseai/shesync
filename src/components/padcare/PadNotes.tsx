import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Star, Trash2 } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { Card, Chip, uiStyles } from '@/components/common/ui';
import { Button } from '@/components/ds';
import { PRODUCT_GUIDES, PRODUCT_ORDER, type PeriodProduct } from '@/constants/padCare';
import { noteScore, type SkinReaction } from '@/lib/padCare';
import { usePadCareStore } from '@/store/usePadCareStore';
import { shortDateLabel } from '@/lib/dates';

const SKIN_OPTIONS: { id: SkinReaction; label: string }[] = [
  { id: 'fine', label: 'Skin fine' },
  { id: 'mild', label: 'Slight itch' },
  { id: 'irritated', label: 'Rash / burning' },
];

function Rating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const gold = themed('#F59E0B');
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={[uiStyles.row, { gap: 4 }]}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${n} of 5`}
            accessibilityState={{ selected: value === n }}
          >
            <Star size={22} color={n <= value ? gold : Theme.colors.textTertiary} fill={n <= value ? gold : 'transparent'} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Private ratings of pads and brands she has tried, to find what suits her body. */
export function PadNotes() {
  const notes = usePadCareStore((s) => s.notes);
  const addNote = usePadCareStore((s) => s.addNote);
  const removeNote = usePadCareStore((s) => s.removeNote);
  const currentProduct = usePadCareStore((s) => s.product);

  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState<PeriodProduct>(currentProduct);
  const [comfort, setComfort] = useState(0);
  const [protection, setProtection] = useState(0);
  const [skin, setSkin] = useState<SkinReaction>('fine');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ranked = useMemo(() => [...notes].sort((a, b) => noteScore(b) - noteScore(a)), [notes]);
  const best = ranked.find((n) => n.skin !== 'irritated');
  const anyIrritation = notes.some((n) => n.skin === 'irritated');

  const save = () => {
    if (!brand.trim()) return setError('Add the brand or product name.');
    if (!comfort || !protection) return setError('Rate comfort and leak protection.');
    addNote({ brand, product, comfort, protection, skin, note });
    setBrand('');
    setComfort(0);
    setProtection(0);
    setSkin('fine');
    setNote('');
    setError(null);
  };

  return (
    <Card>
      <TextInput
        value={brand}
        onChangeText={setBrand}
        placeholder="Brand / product, e.g. “XYZ cotton XL”"
        placeholderTextColor={Theme.colors.textTertiary}
        style={uiStyles.input}
        accessibilityLabel="Brand or product name"
        maxLength={60}
      />
      <View style={[uiStyles.wrap, { marginTop: 12 }]}>
        {PRODUCT_ORDER.map((p) => (
          <Chip key={p} label={PRODUCT_GUIDES[p].label} small selected={product === p} onPress={() => setProduct(p)} color={Theme.colors.secondary} />
        ))}
      </View>
      <Rating label="Comfort" value={comfort} onChange={setComfort} />
      <Rating label="No leaks" value={protection} onChange={setProtection} />
      <View style={[uiStyles.wrap, { marginTop: 12 }]}>
        {SKIN_OPTIONS.map((o) => (
          <Chip
            key={o.id}
            label={o.label}
            small
            selected={skin === o.id}
            onPress={() => setSkin(o.id)}
            color={o.id === 'irritated' ? Theme.colors.strainHigh : o.id === 'mild' ? Theme.colors.strainAmber : Theme.colors.strainOptimal}
          />
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional), e.g. “good for nights, a bit thick”"
        placeholderTextColor={Theme.colors.textTertiary}
        style={[uiStyles.input, { marginTop: 12 }]}
        accessibilityLabel="Note"
        maxLength={140}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Save my rating" variant="primary" onPress={save} fullWidth style={{ marginTop: 12 }} />
      <Text style={[uiStyles.muted, { marginTop: 8, textAlign: 'center' }]}>Private — saved only on this phone.</Text>

      {best && notes.length > 1 ? (
        <View style={styles.bestBox}>
          <Text style={styles.bestLabel}>YOUR BEST SO FAR</Text>
          <Text style={styles.bestName}>{best.brand}</Text>
          <Text style={uiStyles.muted}>
            {PRODUCT_GUIDES[best.product].label} · comfort {best.comfort}/5 · no leaks {best.protection}/5
          </Text>
        </View>
      ) : null}

      {ranked.map((n) => (
        <View key={n.id} style={styles.noteRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.noteBrand}>{n.brand}</Text>
            <Text style={uiStyles.muted}>
              {PRODUCT_GUIDES[n.product].label} · comfort {n.comfort}/5 · no leaks {n.protection}/5 ·{' '}
              {SKIN_OPTIONS.find((o) => o.id === n.skin)?.label.toLowerCase()} · {shortDateLabel(n.date)}
            </Text>
            {n.note ? <Text style={styles.noteText}>“{n.note}”</Text> : null}
          </View>
          <Button variant="secondary" size="sm" iconOnly onPress={() => removeNote(n.id)} accessibilityLabel={`Delete rating for ${n.brand}`} icon={<Trash2 size={20} color={Theme.colors.textTertiary} />} />
        </View>
      ))}

      {anyIrritation ? (
        <Text style={[uiStyles.body, { marginTop: 12 }]}>
          Rash or burning from a pad? Try a fragrance-free one with a softer top layer and change more often. If it lasts more
          than a few days, see a doctor.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = createStyles(() => ({
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  ratingLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  error: { fontSize: 14, fontWeight: '700', color: Theme.colors.primaryDark, marginTop: 8 },
  bestBox: {
    marginTop: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
  },
  bestLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: '#047857' },
  bestName: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 4 },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
    marginTop: 8,
  },
  noteBrand: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  noteText: { fontSize: 14, color: Theme.colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
}));
