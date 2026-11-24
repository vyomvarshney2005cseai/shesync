import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { Card, Chip, uiStyles } from '@/components/common/ui';
import { Theme, createStyles } from '@/constants/theme';
import { Button, IconBadge } from '@/components/ds';
import { FOCUS_AREAS } from '@/constants/focusAreas';
import { useAppStore } from '@/store/useAppStore';
import { todayKey } from '@/lib/dates';

/** Pick the areas SheSync should focus on. `mode="home"` shows it once, after setup. */
export function FocusAreasCard({ mode = 'home' }: { mode?: 'home' | 'profile' }) {
  const focusAreas = useAppStore((s) => s.focusAreas);
  const snoozedUntil = useAppStore((s) => s.focusPromptSnoozedUntil);
  const setFocusAreas = useAppStore((s) => s.setFocusAreas);
  const snooze = useAppStore((s) => s.snoozeFocusPrompt);
  const [picked, setPicked] = useState<string[]>(focusAreas);
  const [saved, setSaved] = useState(false);

  if (mode === 'home' && (focusAreas.length > 0 || (snoozedUntil && snoozedUntil > todayKey()))) return null;

  const toggle = (a: string) => {
    setSaved(false);
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  };
  const changed = picked.length !== focusAreas.length || picked.some((p) => !focusAreas.includes(p));

  return (
    <Card tone={mode === 'home' ? 'lilac' : 'default'} style={mode === 'home' ? styles.home : undefined}>
      <View style={[uiStyles.row, { gap: Theme.space.sm }]}>
        <IconBadge name="sparkle" tone="lilac" size={36} />
        <Text style={styles.title}>{mode === 'home' ? 'What should SheSync help you with most?' : 'What you want help with'}</Text>
      </View>
      <Text style={[uiStyles.muted, { marginTop: 4 }]}>
        {mode === 'home' ? 'Pick any — your tips and doctor report focus on these. You can change them in Profile.' : 'Your tips and doctor report focus on these.'}
      </Text>
      <View style={[uiStyles.wrap, { marginTop: 12 }]}>
        {FOCUS_AREAS.map((a) => (
          <Chip key={a} label={a} small selected={picked.includes(a)} onPress={() => toggle(a)} color={Theme.colors.secondary} />
        ))}
      </View>
      <View style={[uiStyles.row, { gap: 12, marginTop: 16 }]}>
        <Button
          title={saved && !changed ? 'Saved' : 'Save'}
          variant="primary"
          onPress={() => {
            setFocusAreas(picked);
            setSaved(true);
          }}
          disabled={!picked.length || (!changed && mode === 'profile')}
          style={{ flex: 1 }}
        />
        {mode === 'home' ? <Button title="Not now" variant="secondary" onPress={() => snooze(7)} style={{ flex: 1 }} /> : null}
      </View>
    </Card>
  );
}

const styles = createStyles(() => ({
  home: { marginHorizontal: Theme.space.md, marginTop: Theme.space.md },
  title: { flex: 1, ...Theme.type.title, fontSize: 16, lineHeight: 22, color: Theme.colors.textPrimary },
}));
