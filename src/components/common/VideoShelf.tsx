import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ExternalLink, Play } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { openUrl, youtubeThumb, youtubeUrl } from '@/lib/openExternal';

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
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {shown.map((v) => (
        <Pressable
          key={v.youtubeId}
          onPress={() => openUrl(youtubeUrl(v.youtubeId))}
          style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]}
          accessibilityRole="link"
          accessibilityLabel={`Watch ${v.title} by ${v.channel} on YouTube`}
        >
          <View style={styles.thumbWrap}>
            <Image source={{ uri: youtubeThumb(v.youtubeId) }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.playDot}>
              <Play size={12} color={themed('#FFFFFF')} fill={themed('#FFFFFF')} style={{ marginLeft: 1 }} />
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
        </Pressable>
      ))}
      <Text style={styles.footnote}>Videos open on YouTube. SheSync is not affiliated with these creators.</Text>
    </View>
  );
}

const styles = createStyles(() => ({
  filters: { gap: 8, paddingBottom: 12 },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  filterActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Theme.colors.textSecondary },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  thumbWrap: {
    width: 104,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  playDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthPill: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  lengthText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '800', color: Theme.colors.textPrimary, lineHeight: 17 },
  channel: { fontSize: 11, fontWeight: '600', color: Theme.colors.secondary, marginTop: 2 },
  why: { fontSize: 11, color: Theme.colors.textSecondary, marginTop: 3, lineHeight: 15 },
  footnote: { fontSize: 10, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: 2 },
}));
