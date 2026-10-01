import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '@/constants/theme';
import { FEMINIST_QUOTES, Quote, getRandomQuote } from '@/constants/quotes';
import { Quote as QuoteIcon, Sparkles, RefreshCw } from 'lucide-react-native';

interface FeministQuoteCardProps {
  initialQuoteId?: string;
  category?: Quote['category'];
  variant?: 'light' | 'rose' | 'glass';
  showNewQuoteButton?: boolean;
}

export function FeministQuoteCard({
  initialQuoteId,
  category,
  variant = 'rose',
  showNewQuoteButton = true,
}: FeministQuoteCardProps) {
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => {
    if (initialQuoteId) {
      const found = FEMINIST_QUOTES.find((q) => q.id === initialQuoteId);
      if (found) return found;
    }
    return getRandomQuote();
  });

  const [isRotating, setIsRotating] = useState(false);

  const handleNextQuote = () => {
    setIsRotating(true);
    const next = getRandomQuote(currentQuote.id);
    setCurrentQuote(next);
    setTimeout(() => setIsRotating(false), 300);
  };

  return (
    <View style={[styles.card, variant === 'glass' ? styles.glassCard : styles.roseCard]}>
      {/* Header Tag */}
      <View style={styles.headerRow}>
        <View style={styles.tagBadge}>
          <Sparkles size={13} color={Theme.colors.feminismAccent} style={{ marginRight: 5 }} />
          <Text style={styles.tagText}>
            {currentQuote.category === 'feminism' ? 'FEMINIST WISDOM' : 'WOMEN EMPOWERMENT'}
          </Text>
        </View>

        {showNewQuoteButton && (
          <TouchableOpacity
            style={styles.shuffleButton}
            onPress={handleNextQuote}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RefreshCw size={14} color={Theme.colors.primaryDark} />
            <Text style={styles.shuffleText}>New Quote</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quote Body */}
      <View style={styles.quoteRow}>
        <QuoteIcon
          size={18}
          color={Theme.colors.feminismAccent}
          style={styles.quoteIcon}
        />
        <Text style={styles.quoteText}>
          &ldquo;{currentQuote.quote}&rdquo;
        </Text>
      </View>

      {/* Author Details */}
      <View style={styles.authorRow}>
        <View style={styles.authorLine} />
        <View style={styles.authorContent}>
          <Text style={styles.authorName}>{currentQuote.author}</Text>
          {currentQuote.role && (
            <Text style={styles.authorRole}>{currentQuote.role}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.radius.lg,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    ...Theme.shadows.soft,
  },
  roseCard: {
    backgroundColor: '#FFF1F5',
    borderColor: '#FFD7E3',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#FFE2EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE3EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.feminismAccent,
    letterSpacing: 0.8,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#FFD7E3',
  },
  shuffleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primaryDark,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quoteIcon: {
    marginRight: 6,
    marginTop: 2,
    opacity: 0.8,
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    fontStyle: 'italic',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  authorLine: {
    width: 18,
    height: 2,
    backgroundColor: Theme.colors.feminismAccent,
    borderRadius: 1,
  },
  authorContent: {
    flex: 1,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  authorRole: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
});
