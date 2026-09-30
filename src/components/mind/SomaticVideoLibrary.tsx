import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  Play,
  ExternalLink,
  Sparkles,
  Clock,
  Heart,
  Shield,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import type { YouTubeVideoSession } from '@/types';

export const SOMATIC_YOUTUBE_VIDEOS: YouTubeVideoSession[] = [
  {
    id: 'yt-vagus-reset',
    title: 'Vagus Nerve Exercises To Rewire Brain From Anxiety',
    channel: 'Sukie Baxter — Polyvagal Somatics',
    youtubeId: 'eFV0FfMc_uo',
    youtubeUrl: 'https://www.youtube.com/watch?v=eFV0FfMc_uo',
    duration: '09:45 min',
    category: 'vagus',
    tag: 'Vagus Nerve Reset',
    targetFocus: 'Calms acute sympathetic overdrive & restores parasympathetic tone',
    description:
      'A widely recommended guided practice stimulating the cranial vagus nerve with gentle suboccipital releases and eye-resting movements.',
  },
  {
    id: 'yt-cramps-pms',
    title: 'Yoga for Cramps and PMS | 20-Minute Home Yoga',
    channel: 'Yoga With Adriene',
    youtubeId: 'FXPGuNU-BYA',
    youtubeUrl: 'https://www.youtube.com/watch?v=FXPGuNU-BYA',
    duration: '20:30 min',
    category: 'pelvic',
    tag: 'Pelvic & Cramp Relief',
    targetFocus: 'Decompresses uterine spasming, lower-back ache & pelvic floor tension',
    description:
      'Adriene guides a gentle, restorative sequence using supportive household props to ease acute menstrual cramps and lower back ache.',
  },
  {
    id: 'yt-vagus-trauma',
    title: 'Vagus Nerve Reset To Release Trauma In The Body',
    channel: 'Sukie Baxter — Polyvagal Somatics',
    youtubeId: 'wILdKJ44kZY',
    youtubeUrl: 'https://www.youtube.com/watch?v=wILdKJ44kZY',
    duration: '11:28 min',
    category: 'pmdd',
    tag: 'Neuro-Calm & Release',
    targetFocus: 'Rapid emotional grounding for sudden luteal progesterone drops',
    description:
      'Polyvagal somatic exercises aimed at helping your nervous system decompress stored stress and alleviate high PMS/PMDD sensitivity.',
  },
  {
    id: 'yt-vagus-massage',
    title: 'Vagus Nerve Massage For Stress & Anxiety Relief',
    channel: 'Sukie Baxter — Polyvagal Somatics',
    youtubeId: 'ZakhFYR1NVU',
    youtubeUrl: 'https://www.youtube.com/watch?v=ZakhFYR1NVU',
    duration: '10:15 min',
    category: 'stress',
    tag: 'Cortisol Rescue',
    targetFocus: 'Hands-on somatic massage when morning cortisol or anxiety surges',
    description:
      'Immediate neck, sternocleidomastoid, and auricular branch somatic touch to quickly lower heart rate and reduce cortisol.',
  },
  {
    id: 'yt-restorative-care',
    title: '10-Minute Yoga For Self Care | Restorative Practice',
    channel: 'Yoga With Adriene',
    youtubeId: 'mQ6c6T58-vI',
    youtubeUrl: 'https://www.youtube.com/watch?v=mQ6c6T58-vI',
    duration: '10:48 min',
    category: 'pelvic',
    tag: 'Restorative Care',
    targetFocus: 'Gentle cyclical pacing during low energy follicular or late luteal days',
    description:
      'Calming restorative floor session designed to nourish the nervous system when high-strain workouts are contraindicated.',
  },
];

interface SomaticVideoLibraryProps {
  onVideoSelected?: (video: YouTubeVideoSession) => void;
}

export const SomaticVideoLibrary: React.FC<SomaticVideoLibraryProps> = ({
  onVideoSelected,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoSession>(
    SOMATIC_YOUTUBE_VIDEOS[0]
  );
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredVideos =
    activeFilter === 'all'
      ? SOMATIC_YOUTUBE_VIDEOS
      : SOMATIC_YOUTUBE_VIDEOS.filter((v) => v.category === activeFilter);

  const handleOpenYouTube = async (url: string, title: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
        return;
      }
      await Linking.openURL(url);
    } catch {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
      } else {
        Alert.alert(
          'Open YouTube',
          `Opening "${title}" on YouTube.`,
          [{ text: 'OK', onPress: () => Linking.openURL(url) }]
        );
      }
    }
  };

  const handleSelect = (video: YouTubeVideoSession) => {
    setSelectedVideo(video);
    if (onVideoSelected) {
      onVideoSelected(video);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Badge */}
      <View style={styles.sectionHeader}>
        <View style={styles.badgeRow}>
          <View style={styles.ytBadge}>
            <View style={styles.ytPlayIconTriangle} />
            <Text style={styles.ytBadgeText}>YouTube Somatic Therapy</Text>
          </View>
          <View style={styles.liveTag}>
            <Sparkles size={12} color={Theme.colors.secondary} />
            <Text style={styles.liveTagText}>Cycle Calibrated</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Somatic & Vagus Video Sessions</Text>
        <Text style={styles.sectionSubtitle}>
          Evidence-based polyvagal exercises and somatic flows on YouTube to downregulate
          strain and calm acute cycle symptoms.
        </Text>
      </View>

      {/* Featured Video Player Card */}
      <View style={styles.featuredCard}>
        {/* Thumbnail Preview Area */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{
              uri: `https://img.youtube.com/vi/${selectedVideo.youtubeId}/hqdefault.jpg`,
            }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          {/* Gradient Tint Overlay */}
          <View style={styles.thumbnailOverlay} />

          {/* Duration Badge */}
          <View style={styles.durationPill}>
            <Clock size={12} color="#FFFFFF" />
            <Text style={styles.durationText}>{selectedVideo.duration}</Text>
          </View>

          {/* Center Play Button Overlay */}
          <TouchableOpacity
            style={styles.playOverlayButton}
            activeOpacity={0.85}
            onPress={() =>
              handleOpenYouTube(selectedVideo.youtubeUrl, selectedVideo.title)
            }
          >
            <View style={styles.playButtonInner}>
              <Play size={26} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Video Info */}
        <View style={styles.featuredBody}>
          <View style={styles.featuredTagRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{selectedVideo.tag}</Text>
            </View>
            <Text style={styles.channelText}>{selectedVideo.channel}</Text>
          </View>

          <Text style={styles.featuredTitle}>{selectedVideo.title}</Text>
          <Text style={styles.featuredDescription}>{selectedVideo.description}</Text>

          {/* Biological Target Cue */}
          <View style={styles.targetCallout}>
            <Activity size={14} color={Theme.colors.secondary} />
            <Text style={styles.targetCalloutText}>
              Target: {selectedVideo.targetFocus}
            </Text>
          </View>

          {/* Big Action CTA: Watch on YouTube */}
          <TouchableOpacity
            style={styles.watchButton}
            activeOpacity={0.88}
            onPress={() =>
              handleOpenYouTube(selectedVideo.youtubeUrl, selectedVideo.title)
            }
          >
            <View style={styles.watchButtonContent}>
              <View style={styles.redYtPill}>
                <View style={styles.smallTriangle} />
              </View>
              <Text style={styles.watchButtonText}>Watch Guided Video on YouTube</Text>
              <ExternalLink size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'vagus', label: 'Vagus Nerve' },
            { id: 'pelvic', label: 'Pelvic & Cramps' },
            { id: 'pmdd', label: 'PMDD Neuro-Calm' },
            { id: 'stress', label: 'Cortisol Rescue' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.75}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Curated Video Playlist Cards */}
      <View style={styles.playlistWrapper}>
        <Text style={styles.playlistHeader}>Explore Curated Somatic Sessions:</Text>
        {filteredVideos.map((video) => {
          const isCurrent = video.id === selectedVideo.id;
          return (
            <TouchableOpacity
              key={video.id}
              activeOpacity={0.85}
              style={[
                styles.videoItemCard,
                isCurrent && styles.videoItemCardSelected,
              ]}
              onPress={() => handleSelect(video)}
            >
              {/* Mini Thumbnail */}
              <View style={styles.miniThumbWrap}>
                <Image
                  source={{
                    uri: `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`,
                  }}
                  style={styles.miniThumb}
                  resizeMode="cover"
                />
                <View style={styles.miniPlayIcon}>
                  <Play size={12} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
                </View>
              </View>

              {/* Text Info */}
              <View style={styles.videoItemInfo}>
                <View style={styles.videoItemTop}>
                  <Text style={styles.videoItemTag}>{video.tag}</Text>
                  <Text style={styles.videoItemDuration}>{video.duration}</Text>
                </View>

                <Text style={styles.videoItemTitle} numberOfLines={2}>
                  {video.title}
                </Text>

                <Text style={styles.videoItemChannel} numberOfLines={1}>
                  {video.channel}
                </Text>
              </View>

              {/* Open Link Button */}
              <TouchableOpacity
                style={styles.directLinkBtn}
                onPress={() => handleOpenYouTube(video.youtubeUrl, video.title)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ExternalLink size={16} color={Theme.colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ytBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  ytPlayIconTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderBottomWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: '#FFFFFF',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
  },
  ytBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.secondaryDark,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.2)',
    ...Theme.shadows.card,
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 190,
    backgroundColor: '#1E1B2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 15, 30, 0.35)',
  },
  durationPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playOverlayButton: {
    position: 'absolute',
    alignSelf: 'center',
  },
  playButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glowing,
  },
  featuredBody: {
    padding: 16,
  },
  featuredTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: Theme.colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.secondaryDark,
  },
  channelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  targetCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
    marginBottom: 16,
  },
  targetCalloutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    flex: 1,
  },
  watchButton: {
    backgroundColor: '#FF0000',
    borderRadius: Theme.radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  watchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  redYtPill: {
    width: 20,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 0,
    borderBottomWidth: 3,
    borderTopWidth: 3,
    borderLeftColor: '#FF0000',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
  },
  watchButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  playlistWrapper: {
    marginTop: 4,
  },
  playlistHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  videoItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  videoItemCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFF8FA',
  },
  miniThumbWrap: {
    width: 80,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  miniThumb: {
    width: '100%',
    height: '100%',
  },
  miniPlayIcon: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoItemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  videoItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  videoItemTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.secondary,
    textTransform: 'uppercase',
  },
  videoItemDuration: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textTertiary,
  },
  videoItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    lineHeight: 17,
    marginBottom: 2,
  },
  videoItemChannel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  directLinkBtn: {
    padding: 8,
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 8,
  },
});
