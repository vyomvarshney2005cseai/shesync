import type {
  BiometricSnapshot,
  CounsellorMode,
  CyclePrediction,
  CycleData,
  FineTuningSettings,
  SymptomLog,
  YourGoGirlMessage,
} from '@/types';
import { recentSignals } from '@/lib/recent';
import {
  FALLBACK_SUGGESTIONS,
  INTENTS,
  SAFETY_INTENTS,
  type Intent,
  type Reply,
  type ReplyCtx,
} from '@/lib/yourGoGirlKnowledge';

/**
 * YourGoGirl — built-in counsellor (works offline, no API key, nothing leaves
 * the phone). Each message is matched against the knowledge base in
 * yourGoGirlKnowledge.ts:
 *   1. Safety triggers first (self-harm, abuse, emergency bleeding, …).
 *   2. Every other intent is scored by weighted keywords + similarity to
 *      its example questions; the best match above a threshold answers.
 *   3. "Tell me more" / "why?" continue the previous topic.
 *   4. Otherwise she gets an honest "I'm not sure" with topic suggestions.
 */

export interface CounsellorContext {
  userName: string;
  cycle: CycleData;
  biometrics: BiometricSnapshot;
  symptomLogs: SymptomLog[];
  fineTuningSettings: FineTuningSettings;
  mode: CounsellorMode;
  cyclePrediction?: CyclePrediction;
  /** Intent of YourGoGirl's previous reply, for "tell me more" follow-ups. */
  lastIntentId?: string;
}

export interface QuickPromptTopic {
  id: string;
  label: string;
  prompt: string;
  category: YourGoGirlMessage['category'];
  emoji: string;
}

export const QUICK_PROMPT_TOPICS: QuickPromptTopic[] = [
  { id: 'cramps', label: 'Period cramps', prompt: 'How can I reduce period cramps?', category: 'menstruation', emoji: '🫖' },
  { id: 'late', label: 'Late period', prompt: 'My period is late. What should I do?', category: 'disturbances', emoji: '📅' },
  { id: 'next', label: 'Next period', prompt: 'When is my next period?', category: 'disturbances', emoji: '🔮' },
  { id: 'mood', label: 'Mood swings', prompt: 'I get mood swings and cry easily before my period', category: 'emotional', emoji: '💜' },
  { id: 'focus', label: 'Brain fog', prompt: 'I can’t focus on studying', category: 'focus', emoji: '🌫️' },
  { id: 'motivation', label: 'No motivation', prompt: 'I have zero motivation today', category: 'motivation', emoji: '🔋' },
  { id: 'heavy', label: 'Heavy flow', prompt: 'How do I know if my bleeding is too heavy?', category: 'menstruation', emoji: '🩸' },
  { id: 'pcos', label: 'PCOS', prompt: 'What is PCOS?', category: 'disturbances', emoji: '🌸' },
  { id: 'calm', label: 'Calm me down', prompt: 'Help me calm down with a breathing exercise', category: 'emotional', emoji: '🌿' },
];

export const COUNSELLOR_MODES: { id: CounsellorMode; label: string; subtitle: string }[] = [
  { id: 'empathetic_counsellor', label: 'Warm Counsellor', subtitle: 'Kind, gentle support' },
  { id: 'focus_motivation', label: 'Focus Coach', subtitle: 'Brain fog, motivation & study' },
  { id: 'cycle_disturbances', label: 'Cycle Guide', subtitle: 'Periods, PCOS, flow & pain' },
  { id: 'somatic_cbt', label: 'Calm & CBT', subtitle: 'Breathing & reframing thoughts' },
];

// ─── Text helpers ───────────────────────────────────────────

const STOPWORDS = new Set(
  'a an the i me my im i\'m am is are was were be been being to of in on at for with and or but so if do does did doing have has had having it its this that these those you your we our they them he she her his what which who whom how why when where can could should would will just very really too also about from as by up down out into than then there here not no yes ok okay please pls plz hai hain ho kya mujhe mera meri mere main nahi'.split(
    ' '
  )
);

export function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\b(im)\b/g, "i'm")
    .replace(/\b(cant)\b/g, "can't")
    .replace(/\b(dont)\b/g, "don't")
    .replace(/\b(didnt)\b/g, "didn't")
    .replace(/\b(wont)\b/g, "won't")
    .replace(/\b(hasnt)\b/g, "hasn't")
    .replace(/\b(havent)\b/g, "haven't")
    .replace(/\b(u)\b/g, 'you')
    .replace(/\b(r)\b/g, 'are')
    .replace(/\b(pls|plz)\b/g, 'please')
    .replace(/\b(prds?|preiods?|peroids?|periodss|periods)\b/g, 'period')
    .replace(/\bcycles\b/g, 'cycle')
    .replace(/\b(gyno|gynec|gynaec|gynac|gynecologist|gynaecologist|gynacologist)\b/g, 'gynaecologist')
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stem(w: string): string {
  return w
    .replace(/'s$/, '')
    .replace(/(ing|edly|ed|ly|es|s)$/, '')
    .replace(/(.)\1$/, '$1');
}

function tokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.split(' ')) {
    const w = raw.replace(/^'+|'+$/g, '');
    if (w.length < 2 || STOPWORDS.has(w)) continue;
    out.add(stem(w));
  }
  return out;
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((t) => {
    if (b.has(t)) shared += 1;
  });
  const sim = shared / Math.sqrt(a.size * b.size);
  // One shared word ("help", "feel") is weak evidence on its own.
  return shared === 1 ? sim * 0.5 : sim;
}

// Example token sets are built once.
const EXAMPLE_TOKENS = new Map<string, Set<string>[]>(
  INTENTS.map((i) => [i.id, i.examples.map((e) => tokens(normalise(e)))])
);

const MODE_TOPICS: Record<CounsellorMode, string[]> = {
  empathetic_counsellor: ['emotional'],
  focus_motivation: ['focus', 'motivation'],
  cycle_disturbances: ['disturbances', 'menstruation'],
  somatic_cbt: ['emotional'],
};

export interface MatchResult {
  intent: Intent | null;
  score: number;
  runnerUp: Intent | null;
}

const MATCH_THRESHOLD = 2.4;

/** Scores every intent and returns the best match (null if nothing fits). */
export function matchIntent(text: string, mode: CounsellorMode = 'empathetic_counsellor'): MatchResult {
  const norm = normalise(text);

  for (const intent of SAFETY_INTENTS) {
    if (intent.trigger?.some((re) => re.test(norm))) return { intent, score: 99, runnerUp: null };
  }

  const userTokens = tokens(norm);
  let best: { intent: Intent; score: number } | null = null;
  let second: { intent: Intent; score: number } | null = null;

  for (const intent of INTENTS) {
    if (intent.safety) continue;
    let score = 0;
    for (const [re, weight] of intent.keywords) if (re.test(norm)) score += weight;
    const sims = EXAMPLE_TOKENS.get(intent.id) ?? [];
    let bestSim = 0;
    for (const ex of sims) bestSim = Math.max(bestSim, similarity(userTokens, ex));
    score += bestSim * 4;
    if (MODE_TOPICS[mode]?.includes(intent.topic)) score += 0.3;

    if (!best || score > best.score) {
      second = best;
      best = { intent, score };
    } else if (!second || score > second.score) {
      second = { intent, score };
    }
  }

  if (!best || best.score < MATCH_THRESHOLD) return { intent: null, score: best?.score ?? 0, runnerUp: null };
  const runnerUp =
    second && second.score >= MATCH_THRESHOLD && second.score >= best.score * 0.75 && second.intent.topic !== best.intent.topic
      ? second.intent
      : null;
  return { intent: best.intent, score: best.score, runnerUp };
}

// ─── Context ────────────────────────────────────────────────

function buildReplyCtx(text: string, ctx: CounsellorContext): ReplyCtx {
  const sig = recentSignals(ctx.symptomLogs);
  const p = ctx.cyclePrediction;
  const hasCycleData = !!ctx.cycle.hasCycleData;
  return {
    name: (ctx.userName || '').trim().split(' ')[0],
    hasCycleData,
    day: ctx.cycle.currentDay,
    phase: ctx.cycle.phase,
    phaseLabel: ctx.cycle.label,
    isIrregular: ctx.cycle.isIrregular,
    nextPeriodDate: hasCycleData ? p?.nextPeriodDate : undefined,
    daysUntilNext: hasCycleData ? p?.daysUntilNextPeriod : undefined,
    ovulationWindow: hasCycleData ? p?.ovulationWindow : undefined,
    fertileWindow: hasCycleData ? p?.fertileWindow : undefined,
    cycleLength: hasCycleData ? p?.predictedCycleLength : undefined,
    recentPain: sig.pain,
    recentFlow: sig.flow,
    recentMood: sig.mood,
    mode: ctx.mode,
    text: normalise(text),
  };
}

function nowStamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toMessage(intent: Intent | null, reply: Reply, ctx: CounsellorContext, extraFollowUps: string[] = []): YourGoGirlMessage {
  const followUps = [...(intent?.followUps ?? []), ...extraFollowUps].filter((f, i, arr) => arr.indexOf(f) === i).slice(0, 4);
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: 'bot',
    timestamp: nowStamp(),
    category: intent?.topic ?? 'general',
    mode: ctx.mode,
    intentId: intent?.id,
    urgent: reply.urgent,
    text: reply.text,
    biologicalWhy: reply.why,
    gentleActionSteps: reply.steps,
    whenToSeeDoctor: reply.doctor,
    affirmation: reply.affirmation,
    followUpSuggestions: followUps.length ? followUps : undefined,
    actions: reply.actions,
  };
}

const CONTINUE_RE = /^(yes|yeah|yep|yup|ok|okay|sure|haan|ha|han|tell me more|more|go on|continue|and|then|explain( more)?|why|how|what else|what next)\b/;

/** Builds YourGoGirl's reply to one message. Pure and synchronous (used by tests). */
export function buildYourGoGirlReply(userText: string, ctx: CounsellorContext): YourGoGirlMessage {
  const text = userText.trim();
  const rctx = buildReplyCtx(text, ctx);
  const { intent, runnerUp } = matchIntent(text, ctx.mode);

  if (intent) {
    const reply = intent.reply(rctx);
    const extra = runnerUp ? [runnerUp.examples[0] ? capitalise(runnerUp.examples[0]) : ''].filter(Boolean) : [];
    if (runnerUp && !intent.safety) {
      reply.text += `\n\nYou also mentioned something about **${TOPIC_NAMES[runnerUp.topic] ?? 'another topic'}** — tap below if you want to talk about that too.`;
    }
    return toMessage(intent, reply, ctx, extra);
  }

  // Short follow-ups like "tell me more" or "why?" continue the last topic.
  const norm = normalise(text);
  if (ctx.lastIntentId && CONTINUE_RE.test(norm) && norm.split(' ').length <= 6) {
    const last = INTENTS.find((i) => i.id === ctx.lastIntentId);
    if (last && last.followUps.length) {
      return toMessage(
        last,
        { text: `Happy to go deeper. Here's what I can tell you more about — pick one, or ask in your own words:` },
        ctx
      );
    }
  }

  return toMessage(
    null,
    {
      text: `I want to make sure I give you the right answer${rctx.name ? `, ${rctx.name}` : ''}, and I'm not sure I understood. Could you tell me a bit more — is it about your **period or cycle**, your **body**, your **mood**, or **studying and focus**?\n\nI'm a built-in guide for periods, cycle health and wellbeing. For anything outside that — or if you're worried about your health — a doctor or counsellor is the right person, and Care Connect can help you reach one.`,
      actions: [{ label: 'Open Care Connect', kind: 'route', value: '/care' }],
    },
    ctx,
    FALLBACK_SUGGESTIONS
  );
}

const TOPIC_NAMES: Record<string, string> = {
  menstruation: 'periods & pain',
  disturbances: 'your cycle',
  emotional: 'how you’re feeling',
  focus: 'focus & studying',
  motivation: 'motivation',
  body: 'your body',
  general: 'SheSync',
  safety: 'your safety',
};

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Async wrapper used by the chat screen (a short pause feels more natural). */
export async function generateYourGoGirlResponse(userText: string, ctx: CounsellorContext): Promise<YourGoGirlMessage> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return buildYourGoGirlReply(userText, ctx);
}

export function createInitialWelcomeMessage(
  userName: string,
  _cycle?: CycleData,
  _biometrics?: BiometricSnapshot
): YourGoGirlMessage {
  const name = (userName || '').trim().split(' ')[0];
  return {
    id: 'welcome-yourgogirl',
    sender: 'bot',
    timestamp: nowStamp(),
    category: 'general',
    mode: 'empathetic_counsellor',
    intentId: 'about_bot',
    text: `Hi${name ? ` ${name}` : ''}, I'm **YourGoGirl** 💜 Ask me anything about periods, your cycle, mood or focus — in your own words (Hinglish is fine).\n\nI'm not a doctor, but I'll tell you clearly when something needs one.`,
    followUpSuggestions: [
      'How can I reduce period cramps?',
      'When is my next period?',
      'I feel anxious all the time',
      'I can’t focus on studying',
    ],
  };
}
