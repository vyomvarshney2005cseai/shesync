import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, MessageCircleHeart, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

export const YourGoGirlHomeCard: React.FC = () => {
  const userName = useAppStore((s) => s.userName);
  const cycle = useAppStore((s) => s.cycle);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push('/your-go-girl' as any)}
      >
        <View style={styles.topBadgeRow}>
          <View style={styles.pill}>
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.pillText}>YOURGOGIRL • AI WOMEN COUNSELLOR</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>24/7 Safe Space</Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.iconCircle}>
            <MessageCircleHeart size={26} color={Theme.colors.primary} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>
              Talk to YourGoGirl, {userName || 'Maya'} 💜
            </Text>
            <Text style={styles.subtitle}>
              Feeling low motivation, brain fog, cramps, or cycle disturbances on Day{' '}
              {cycle.currentDay}? Get compassionate, hormone-aware counselling right now.
            </Text>
          </View>
        </View>

        <View style={styles.topicTagsRow}>
          {[
            '🔋 Loss of Motivation',
            '🌫️ Loss of Focus',
            '🌸 Irregular Cycles',
            '🫖 Period Cramps',
          ].map((tag) => (
            <View key={tag} style={styles.topicTag}>
              <Text style={styles.topicTagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Open YourGoGirl Counsellor Chat</Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFF0F5',
    borderRadius: Theme.radius.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FFB8D0',
    ...Theme.shadows.soft,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.colors.strainOptimal,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD1E0',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Theme.colors.textSecondary,
  },
  topicTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  topicTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: '#FFD8E4',
  },
  topicTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
  },
  ctaRow: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
