import React, { useMemo, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { ExternalLink, Play } from 'lucide-react-native';
import { Theme, createStyles, themed, fixedColor } from '@/constants/theme';
import { openUrl, youtubeThumb, youtubeUrl } from '@/lib/openExternal';
import { Card, Chip } from '@/components/ds';

export interface ShelfVideo {
  youtubeId: string;
  title: string;
  channel: string;
  category: string;
  length?: string;
  why: string;
}

interface VideoShelfProps {
  videos: ShelfVideo[];
  categories: { id: string; label: string }[];
  initialCategory?: string;
}

/** Filterable list of curated YouTube videos; tapping opens YouTube. */
export function VideoShelf({ videos, categories, initialCategory = 'all' }: VideoShelfProps) {
  const [category, setCategory] = useState(initialCategory);
  const shown = useMemo(
    () => (category === 'all' ? videos : videos.filter((v) => v.category === category)),
    [category, videos]
  );

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {[{ id: 'all', label: 'All' }, ...categories].map((c) => {
          const active = c.id === category;
          return (
            <Chip key={c.id} small label={c.label} selected={active} onPress={() => setCategory(c.id)} accessibilityRole="radio" />
          );
        })}
      </ScrollView>

      {shown.map((v) => (
        <Card
          padding="none"
          key={v.youtubeId}
          onPress={() => openUrl(youtubeUrl(v.youtubeId))}
          accessibilityRole="link"
          accessibilityLabel={`Watch ${v.title} by ${v.channel} on YouTube`}
          style={styles.item}
        >
          <View style={styles.thumbWrap}>
            <Image source={{ uri: youtubeThumb(v.youtubeId) }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.playDot}>
              <Play size={12} color={fixedColor('#FFFFFF')} fill={fixedColor('#FFFFFF')} style={{ marginLeft: 1 }} />
            </View>
            {v.length ? (
              <View style={styles.lengthPill}>
                <Text style={styles.lengthText}>{v.length}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {v.title}
            </Text>
            <Text style={styles.channel} numberOfLines={1}>
              {v.channel}
            </Text>
            <Text style={styles.why} numberOfLines={2}>
              {v.why}
            </Text>
          </View>
          <ExternalLink size={15} color={Theme.colors.primary} />
        </Card>
      ))}
      <Text style={styles.footnote}>Videos open on YouTube. SheSync is not affiliated with these creators.</Text>
    </View>
  );
}

const styles = createStyles(() => ({
  filters: { gap: 8, paddingBottom: 12 },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  filterActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  filterText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  thumbWrap: {
    width: 104,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    // Grey placeholder until the thumbnail loads.
    backgroundColor: Theme.colors.skeleton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  playDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    // YouTube red, a shade deeper so the white play mark reads; the same in both modes.
    backgroundColor: fixedColor('#CC0000'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthPill: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: fixedColor('rgba(15,23,42,0.82)'), // scrim over the photo, same in both modes
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lengthText: { color: fixedColor('#FFFFFF'), fontSize: 14, fontWeight: '700' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary, lineHeight: 20 },
  channel: { fontSize: 14, fontWeight: '600', color: Theme.colors.secondary, marginTop: 4 },
  why: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  footnote: { fontSize: 12, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: 4 },
}));
