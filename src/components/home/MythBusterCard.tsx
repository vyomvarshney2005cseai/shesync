import React, { useState } from 'react';
import { View, Text, Share, Platform } from 'react-native';
import { Share2, ExternalLink } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { mythForDate } from '@/constants/periodMyths';
import { openUrl } from '@/lib/openExternal';
import { pauseAppLock } from '@/lib/appLock';
import { Button, Card, IconBadge } from '@/components/ds';

/** One period myth a day: she guesses, then reveals the fact and its source. */
export function MythBusterCard() {
  const [myth] = useState(() => mythForDate());
  const [revealed, setRevealed] = useState(false);

  const share = async () => {
    const message = `Myth: ${myth.myth}\nFact: ${myth.fact} ${myth.why}\n\nSource: ${myth.source.name} — via SheSync`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as Navigator).share({ text: message });
      } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
      } else {
        pauseAppLock(); // the share sheet is not "leaving" SheSync
        await Share.share({ message });
      }
    } catch {
      // Cancelled or not supported — nothing to do.
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconBadge name="sparkle" tone="peach" size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.badgeText}>MYTH OR FACT?</Text>
          <Text style={styles.today}>Today’s myth-buster</Text>
        </View>
      </View>

      <Text style={styles.myth}>“{myth.myth}”</Text>

      {revealed ? (
        <View style={styles.factBox}>
          <Text style={styles.factLabel}>MYTH ✗ — HERE’S THE FACT</Text>
          <Text style={styles.fact}>{myth.fact}</Text>
          <Text style={styles.why}>{myth.why}</Text>
          <View style={styles.footer}>
            <Button
              variant="link"
              title={myth.source.name}
              onPress={() => openUrl(myth.source.url)}
              icon={<ExternalLink size={16} color={Theme.colors.primaryDark} />}
              accessibilityHint="Opens the source in your browser"
              style={styles.sourceBtn}
            />
            <Button
              variant="secondary"
              size="sm"
              title="Share"
              onPress={share}
              accessibilityLabel="Share this fact"
              icon={<Share2 size={16} color={Theme.colors.textPrimary} />}
            />
          </View>
        </View>
      ) : (
        <Button variant="secondary" title="Reveal the truth" onPress={() => setRevealed(true)} style={styles.revealBtn} />
      )}
    </Card>
  );
}

const styles = createStyles(() => ({
  card: { marginHorizontal: Theme.space.md, marginTop: Theme.space.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm, marginBottom: Theme.space.sm },
  badgeText: { ...Theme.type.caption, fontWeight: '800', color: Theme.colors.peachDark, letterSpacing: 0.6 },
  today: { ...Theme.type.bodySm, fontWeight: '600', color: Theme.colors.textSecondary },
  myth: { ...Theme.type.body, fontWeight: '700', color: Theme.colors.textPrimary },
  revealBtn: { marginTop: Theme.space.sm, alignSelf: 'flex-start' },
  factBox: {
    marginTop: Theme.space.sm,
    padding: Theme.space.sm,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.successLight,
    gap: 4,
  },
  factLabel: { ...Theme.type.caption, fontWeight: '800', color: Theme.colors.strainOptimal, letterSpacing: 0.6 },
  fact: { ...Theme.type.bodySm, fontWeight: '800', color: Theme.colors.textPrimary },
  why: { ...Theme.type.bodySm, color: Theme.colors.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Theme.space.xs, gap: Theme.space.xs },
  sourceBtn: { flex: 1, paddingHorizontal: 0 },
}));
