import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ThumbsDown, ThumbsUp, Check } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { FEEDBACK_REASONS, FEEDBACK_TEXT, sendAnswerFeedback, type FeedbackReason } from '@/lib/answerFeedback';
import { useAppStore } from '@/store/useAppStore';
import type { ChatLanguage, YourGoGirlMessage } from '@/types';
import { Button, CheckRow } from '@/components/ds';

/**
 * 👍 / 👎 under one YourGoGirl answer. 👍 is sent straight away; 👎 asks
 * what was missing (one tap) and sends once — on a reason, on Skip, or when
 * she leaves the chat.
 */
export function AnswerFeedback({ msg, question, lang }: { msg: YourGoGirlMessage; question?: string; lang: ChatLanguage }) {
  const rate = useAppStore((s) => s.rateYourGoGirlMessage);
  const t = FEEDBACK_TEXT[lang];
  const [askReason, setAskReason] = useState(false);
  const [includeQuestion, setIncludeQuestion] = useState(false);
  const pending = useRef(false);

  // A 👎 left without a reason is still counted when she leaves.
  useEffect(
    () => () => {
      if (pending.current) {
        pending.current = false;
        void sendAnswerFeedback({ intentId: msg.intentId, rating: 'down', lang: msg.lang });
      }
    },
    [msg.intentId, msg.lang]
  );

  const finishDown = (reason?: FeedbackReason) => {
    pending.current = false;
    setAskReason(false);
    rate(msg.id, 'down', reason);
    void sendAnswerFeedback({
      intentId: msg.intentId,
      rating: 'down',
      reason,
      lang: msg.lang,
      question: includeQuestion ? question : undefined,
    });
  };

  if (msg.feedback && !askReason) {
    return (
      <View style={styles.row}>
        <Check size={13} color={Theme.colors.strainOptimal} />
        <Text style={styles.thanks}>{t.thanks}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>{t.helpful}</Text>
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          onPress={() => {
            rate(msg.id, 'up');
            void sendAnswerFeedback({ intentId: msg.intentId, rating: 'up', lang: msg.lang });
          }}
          testID="answer-helpful"
          accessibilityLabel="Helpful"
          icon={<ThumbsUp size={20} color={Theme.colors.textSecondary} />}
          style={styles.thumb}
        />
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          onPress={() => {
            pending.current = true;
            setAskReason(true);
          }}
          testID="answer-not-helpful"
          accessibilityLabel="Not helpful"
          icon={<ThumbsDown size={20} color={askReason ? themed('#FFFFFF') : Theme.colors.textSecondary} />}
        />
      </View>
      {askReason ? (
        <View style={styles.reasons}>
          <Text style={styles.reasonTitle}>{t.whatMissing}</Text>
          <View style={styles.reasonList}>
            {FEEDBACK_REASONS.map((r) => (
              <Button variant="secondary" title={t.reasons[r]} key={r} onPress={() => finishDown(r)} testID={`answer-reason-${r}`} />
            ))}
          </View>
          {question ? (
            <CheckRow label={t.includeQuestion} checked={includeQuestion} onToggle={() => setIncludeQuestion((v) => !v)} />
          ) : null}
          <Button variant="link" title={t.skip} onPress={() => finishDown()} style={styles.skip} />
        </View>
      ) : null}
    </View>
  );
}

const styles = createStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.textTertiary },
  thumb: { width: 30 },
  thumbOn: { backgroundColor: Theme.colors.primary },
  thanks: { flex: 1, fontSize: 14, color: Theme.colors.textSecondary },
  reasons: { marginTop: 8, backgroundColor: Theme.colors.backgroundAlt, borderRadius: 16, padding: 12, gap: 8 },
  reasonTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  reasonList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  includeText: { fontSize: 14, color: Theme.colors.textSecondary },
  skip: { alignSelf: 'flex-start' },
  skipText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textTertiary, textDecorationLine: 'underline' },
}));
