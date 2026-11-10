import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, Chip, SectionHeader, uiStyles } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Theme, createStyles } from '@/constants/theme';
import { useFitnessStore } from '@/store/useFitnessStore';
import {
  ACTIVITY_FACTORS,
  GOAL_LABELS,
  minHealthyWeight,
  type ActivityLevel,
  type FitnessGoal,
  type TrainingPlace,
} from '@/lib/fitness';

const num = (s: string) => parseFloat(s.replace(',', '.'));

export default function FitnessSetup() {
  const existing = useFitnessStore((s) => s.profile);
  const saveProfile = useFitnessStore((s) => s.saveProfile);

  const [height, setHeight] = useState(existing ? String(existing.heightCm) : '');
  const [weight, setWeight] = useState(existing ? String(existing.weightKg) : '');
  const [age, setAge] = useState(existing ? String(existing.age) : '');
  const [activity, setActivity] = useState<ActivityLevel>(existing?.activity ?? 'light');
  const [goal, setGoal] = useState<FitnessGoal>(existing?.goal ?? 'fitness');
  const [target, setTarget] = useState(existing?.targetWeightKg ? String(existing.targetWeightKg) : '');
  const [place, setPlace] = useState<TrainingPlace>(existing?.trainingPlace ?? 'home');
  const [error, setError] = useState('');

  const h = num(height);
  const w = num(weight);
  const a = parseInt(age, 10);
  const minWeight = h >= 120 && h <= 220 ? minHealthyWeight(h) : null;
  const isMinor = Number.isFinite(a) && a < 18;

  const save = () => {
    if (!(h >= 120 && h <= 220)) return setError('Enter your height in cm (120–220).');
    if (!(w >= 30 && w <= 250)) return setError('Enter your weight in kg (30–250).');
    if (!(a >= 13 && a <= 90)) return setError('Enter your age (13–90).');
    let finalGoal = goal;
    let targetKg: number | undefined;
    if (goal === 'lose') {
      if (isMinor) return setError('SheSync does not set weight-loss targets for under-18s. Choose “Just get fitter” instead.');
      const t = num(target);
      if (!Number.isFinite(t)) return setError('Enter a goal weight, or choose another goal.');
      if (t >= w) return setError('Your goal weight should be below your current weight.');
      if (minWeight && t < minWeight)
        return setError(`For your height, the lowest healthy goal is ${minWeight} kg (BMI 18.5).`);
      targetKg = Math.round(t * 10) / 10;
    }
    if (finalGoal === 'lose' && minWeight && w < minWeight) finalGoal = 'maintain';
    saveProfile({
      heightCm: Math.round(h),
      weightKg: Math.round(w * 10) / 10,
      age: a,
      activity,
      goal: finalGoal,
      targetWeightKg: targetKg,
      trainingPlace: place,
    });
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Body profile" subtitle="Used only on this device to personalise your plan" fallbackHref="/fitness" />

      <Card>
        <View style={styles.row}>
          <Field label="Height (cm)" value={height} onChange={setHeight} placeholder="160" />
          <Field label="Weight (kg)" value={weight} onChange={setWeight} placeholder="58" decimal />
          <Field label="Age" value={age} onChange={setAge} placeholder="20" />
        </View>
        {isMinor ? (
          <Text style={[uiStyles.muted, { marginTop: 10 }]}>
            BMI bands in SheSync are for adults. Under 18, focus on fitness and strength — not weight targets.
          </Text>
        ) : null}
      </Card>

      <SectionHeader title="How active are you?" />
      <View style={{ gap: 8 }}>
        {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => setActivity(k)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activity === k }}
          >
            <Card tone={activity === k ? 'rose' : 'default'} style={styles.optionCard}>
              <Text style={[styles.optionTitle, activity === k && { color: Theme.colors.primaryDark }]}>
                {activity === k ? '● ' : '○ '}
                {ACTIVITY_FACTORS[k].label}
              </Text>
              <Text style={styles.optionHint}>{ACTIVITY_FACTORS[k].hint}</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Your goal" />
      <View style={uiStyles.wrap}>
        {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => (
          <Chip key={g} label={GOAL_LABELS[g]} selected={goal === g} onPress={() => setGoal(g)} />
        ))}
      </View>
      {goal === 'lose' ? (
        <Card style={{ marginTop: 12 }}>
          <Field label="Goal weight (kg)" value={target} onChange={setTarget} placeholder={minWeight ? `${Math.max(minWeight, w ? Math.round(w * 0.93) : 0)}` : '55'} decimal />
          <Text style={[uiStyles.muted, { marginTop: 8 }]}>
            {minWeight ? `Healthy range for your height starts at ${minWeight} kg. ` : ''}Even a 5–10% loss can ease PCOS
            symptoms and improve energy.
          </Text>
        </Card>
      ) : null}

      <SectionHeader title="Where do you usually train?" />
      <View style={uiStyles.wrap}>
        <Chip label="At home / outdoors" selected={place === 'home'} onPress={() => setPlace('home')} />
        <Chip label="At a gym" selected={place === 'gym'} onPress={() => setPlace('gym')} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="Save profile" onPress={save} fullWidth style={{ marginTop: 20 }} />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  decimal,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  decimal?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Theme.colors.textTertiary}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        style={uiStyles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = createStyles(() => ({
  row: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textSecondary, marginBottom: 6 },
  optionCard: { paddingVertical: 12 },
  optionTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  optionHint: { fontSize: 12, fontWeight: '500', color: Theme.colors.textSecondary, marginTop: 2, marginLeft: 18 },
  error: { color: Theme.colors.primaryDark, fontWeight: '700', marginTop: 16, fontSize: 13 },
}));
