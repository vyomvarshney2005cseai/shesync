// ============================================================
// 👍 / 👎 on YourGoGirl answers, to find gaps in the knowledge base.
//
// Sent anonymously to SheSync's own server (table `answer_feedback`):
// which answer (intent id), the rating, an optional reason and the reply
// language. Her question is sent only if she ticks "Include my question",
// and even then emails and phone numbers are removed first.
// ============================================================
import type { ChatLanguage } from '@/types';
import { appVersion, enqueueReport, platformName } from '@/lib/anonymousReports';
import { scrub } from '@/lib/scrub';

export type FeedbackRating = 'up' | 'down';
export type FeedbackReason = 'not_answered' | 'too_long' | 'not_for_me' | 'language' | 'wrong';

export const FEEDBACK_REASONS: FeedbackReason[] = ['not_answered', 'not_for_me', 'too_long', 'language', 'wrong'];

export const FEEDBACK_TEXT: Record<
  ChatLanguage,
  { helpful: string; thanks: string; whatMissing: string; includeQuestion: string; skip: string; reasons: Record<FeedbackReason, string> }
> = {
  en: {
    helpful: 'Helpful?',
    thanks: 'Thanks — this helps YourGoGirl get better.',
    whatMissing: 'What was missing?',
    includeQuestion: 'Include my question (no name)',
    skip: 'Skip',
    reasons: {
      not_answered: 'Didn’t answer my question',
      not_for_me: 'Not for my situation',
      too_long: 'Too long',
      language: 'Language was off',
      wrong: 'Something seems wrong',
    },
  },
  hinglish: {
    helpful: 'Kaam aaya?',
    thanks: 'Thanks — isse YourGoGirl aur better banegi.',
    whatMissing: 'Kya kami thi?',
    includeQuestion: 'Mera sawaal bhi bhejo (naam nahi)',
    skip: 'Skip',
    reasons: {
      not_answered: 'Mere sawaal ka jawab nahi mila',
      not_for_me: 'Meri situation ke liye nahi',
      too_long: 'Bahut lamba',
      language: 'Bhasha theek nahi thi',
      wrong: 'Kuch galat laga',
    },
  },
  hi: {
    helpful: 'क्या यह काम आया?',
    thanks: 'धन्यवाद — इससे YourGoGirl और बेहतर बनेगी।',
    whatMissing: 'क्या कमी थी?',
    includeQuestion: 'मेरा सवाल भी भेजें (नाम नहीं)',
    skip: 'छोड़ें',
    reasons: {
      not_answered: 'मेरे सवाल का जवाब नहीं मिला',
      not_for_me: 'मेरी स्थिति के लिए नहीं',
      too_long: 'बहुत लंबा',
      language: 'भाषा ठीक नहीं थी',
      wrong: 'कुछ ग़लत लगा',
    },
  },
};

/** Builds the row that is sent (exported for tests). */
export function feedbackRow(input: {
  intentId?: string;
  rating: FeedbackRating;
  reason?: FeedbackReason;
  lang?: ChatLanguage;
  question?: string;
}) {
  return {
    intent_id: (input.intentId || 'no_match').slice(0, 80),
    rating: input.rating,
    reason: input.reason ?? null,
    lang: input.lang ?? 'en',
    question: input.question ? scrub(input.question.trim(), 300) || null : null,
    app_version: appVersion(),
    platform: platformName(),
  };
}

export function sendAnswerFeedback(input: Parameters<typeof feedbackRow>[0]): Promise<void> {
  return enqueueReport('answer_feedback', feedbackRow(input)).catch(() => {});
}
