import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share, Platform } from 'react-native';
import { Lightbulb, Share2, ExternalLink } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { mythForDate } from '@/constants/periodMyths';
import { openUrl } from '@/lib/openExternal';
import { pauseAppLock } from '@/lib/appLock';

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
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Lightbulb size={14} color={Theme.colors.peachDark} />
          <Text style={styles.badgeText}>MYTH OR FACT?</Text>
        </View>
        <Text style={styles.today}>Today’s myth-buster</Text>
      </View>

      <Text style={styles.myth}>“{myth.myth}”</Text>

      {revealed ? (
        <View style={styles.factBox}>
          <Text style={styles.factLabel}>MYTH ✗ — HERE’S THE FACT</Text>
          <Text style={styles.fact}>{myth.fact}</Text>
          <Text style={styles.why}>{myth.why}</Text>
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => openUrl(myth.source.url)} style={styles.sourceBtn} activeOpacity={0.7}>
              <ExternalLink size={12} color={Theme.colors.textSecondary} />
              <Text style={styles.source} numberOfLines={1}>
                {myth.source.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={share} style={styles.shareBtn} activeOpacity={0.8} accessibilityLabel="Share this fact">
              <Share2 size={13} color={Theme.colors.primaryDark} />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(true)} activeOpacity={0.85}>
          <Text style={styles.revealText}>Reveal the truth</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = createStyles(() => ({
  card: {
    marginHorizontal: 20,
    marginTop: 18,
    padding: 16,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.peach,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: Theme.colors.peachDark, letterSpacing: 0.6 },
  today: { fontSize: 11, fontWeight: '600', color: Theme.colors.textTertiary },
  myth: { fontSize: 15.5, lineHeight: 22, fontWeight: '700', color: Theme.colors.textPrimary },
  revealBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.obsidian,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radius.full,
  },
  revealText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  factBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.sageLight,
    gap: 4,
  },
  factLabel: { fontSize: 10, fontWeight: '800', color: Theme.colors.strainOptimal, letterSpacing: 0.6 },
  fact: { fontSize: 14.5, fontWeight: '800', color: Theme.colors.textPrimary, lineHeight: 20 },
  why: { fontSize: 13, lineHeight: 19, color: Theme.colors.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  sourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  source: { fontSize: 11, color: Theme.colors.textSecondary, textDecorationLine: 'underline', flexShrink: 1 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.card,
  },
  shareText: { fontSize: 12, fontWeight: '800', color: Theme.colors.primaryDark },
}));
