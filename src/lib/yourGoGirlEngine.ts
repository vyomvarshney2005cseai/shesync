import type {
  BiometricSnapshot,
  ChatLanguage,
  CounsellorMode,
  CyclePrediction,
  CycleData,
  FineTuningSettings,
  SymptomLog,
  YourGoGirlAction,
  YourGoGirlMessage,
} from '@/types';
import { recentSignals } from '@/lib/recent';
import type { ChatLanguageSetting } from '@/store/useSettingsStore';
import { HINGLISH, HINGLISH_QUESTIONS } from '@/lib/yourGoGirlHinglish';
import { HINDI, HINDI_QUESTIONS } from '@/lib/yourGoGirlHindi';
import {
  ENGINE_TEXT,
  QUICK_TOPIC_LABELS,
  TOPIC_NAMES,
  resolveLanguage,
  toMatchText,
  translateActionLabel,
} from '@/lib/yourGoGirlLang';
import { buildDoctorQuestions, doctorQuestionsText, type DoctorPrepInput } from '@/lib/doctorVisitPrep';
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
 * Hindi typed in Devanagari is read through English keywords
 * (yourGoGirlLang.ts), and replies come in English, Hinglish or Hindi.
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
  /** Her language setting (Auto answers in the language she writes in). */
  language?: ChatLanguageSetting;
  /** Language of YourGoGirl's previous reply (used on Auto for "ok", "thanks"…). */
  previousLang?: ChatLanguage;
  /** Her logs and referral answers, for doctor-visit prep. */
  getDoctorPrepInput?: () => DoctorPrepInput;
}

export interface QuickPromptTopic {
  id: string;
  label: string;
  prompt: string;
  category: YourGoGirlMessage['category'];
  emoji: string;
}

export const DOCTOR_PREP_PROMPT = 'Help me prepare questions for my doctor visit';

export const QUICK_PROMPT_TOPICS: QuickPromptTopic[] = [
  { id: 'doctor_prep', label: 'Doctor visit prep', prompt: DOCTOR_PREP_PROMPT, category: 'disturbances', emoji: '🩺' },
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
  const norm = normalise(toMatchText(text));

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
    text: normalise(toMatchText(text)),
  };
}

function nowStamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function translateQuestion(q: string, lang: ChatLanguage): string {
  if (lang === 'hinglish') return HINGLISH_QUESTIONS[q] ?? q;
  if (lang === 'hi') return HINDI_QUESTIONS[q] ?? q;
  return q;
}

/** Same reply, in her language: words from the translation, everything else from English. */
function localise(intent: Intent | null, english: Reply, rctx: ReplyCtx, lang: ChatLanguage): Reply {
  const actions = english.actions?.map((a) => ({ ...a, label: translateActionLabel(a.label, lang) }));
  if (lang === 'en' || !intent) return { ...english, actions };
  const table = lang === 'hi' ? HINDI : HINGLISH;
  const words = table[intent.id]?.(rctx);
  if (!words) return { ...english, actions };
  return {
    urgent: english.urgent,
    actions,
    text: words.text ?? english.text,
    why: english.why !== undefined ? words.why ?? english.why : undefined,
    steps: english.steps !== undefined ? words.steps ?? english.steps : undefined,
    doctor: english.doctor !== undefined ? words.doctor ?? english.doctor : undefined,
    affirmation: english.affirmation !== undefined ? words.affirmation ?? english.affirmation : undefined,
  };
}

function toMessage(
  intent: Intent | null,
  reply: Reply,
  ctx: CounsellorContext,
  lang: ChatLanguage,
  extraFollowUps: { query: string; label?: string }[] = []
): YourGoGirlMessage {
  const all = [...(intent?.followUps ?? []).map((q) => ({ query: q, label: undefined as string | undefined })), ...extraFollowUps];
  const seen = new Set<string>();
  const followUps = all.filter((f) => (seen.has(f.query) ? false : (seen.add(f.query), true))).slice(0, 4);
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sender: 'bot',
    timestamp: nowStamp(),
    createdAt: new Date().toISOString(),
    lang,
    category: intent?.topic ?? 'general',
    mode: ctx.mode,
    intentId: intent?.id,
    urgent: reply.urgent,
    text: reply.text,
    biologicalWhy: reply.why,
    gentleActionSteps: reply.steps,
    whenToSeeDoctor: reply.doctor,
    affirmation: reply.affirmation,
    followUpSuggestions: followUps.length ? followUps.map((f) => f.label ?? translateQuestion(f.query, lang)) : undefined,
    followUpQueries: followUps.length ? followUps.map((f) => f.query) : undefined,
    actions: reply.actions,
  };
}

// ─── Doctor-visit prep ──────────────────────────────────────
const DOCTOR_PREP_RE =
  /\b(doctor|gynaecologist|gyn\w*|clinic|appointment|visit)\b.{0,40}\b(questions?|prepare|prep|ready)\b|\b(questions?|what (should|do|can) i ask|what to ask|prepare|prep)\b.{0,30}\b(doctor|gynaecologist|gyn\w*|appointment|visit)\b/;

const PREP_TEXT: Record<ChatLanguage, { intro: (generalOnly: boolean) => string; why: string; doctor: string }> = {
  en: {
    intro: (g) =>
      g
        ? 'Here are 5 good questions to take to your gynaecologist. Log a few days of pain, flow and mood (or finish Details for Sync) and I’ll make them about you.'
        : 'Here are **5 questions** to take to your gynaecologist, picked from your own logs and health check. Write the answers down in the visit.',
    why: 'Doctors give better answers to specific questions. Each one shows which of your data it comes from — I don’t diagnose.',
    doctor: 'Take your SheSync doctor report (Report tab → PDF) so the doctor can see your dates, pain and flow.',
  },
  hinglish: {
    intro: (g) =>
      g
        ? 'Gynaecologist ke liye yeh 5 acche sawaal hain. Kuch din dard, flow aur mood log karo (ya Details for Sync poora karo), phir main inhe aapke hisaab se banaungi.'
        : 'Yeh rahe gynaecologist ke liye **5 sawaal**, aapke apne logs aur health check se chune hue. Visit mein jawab likh lena.',
    why: 'Specific sawaalon par doctor better jawab dete hain. Har sawaal batata hai ki woh aapke kis data se aaya — main diagnose nahi karti.',
    doctor: 'Apni SheSync doctor report (Report tab → PDF) saath le jao taaki doctor aapki dates, dard aur flow dekh sakein.',
  },
  hi: {
    intro: (g) =>
      g
        ? 'स्त्री रोग विशेषज्ञ के लिए ये 5 अच्छे सवाल हैं। कुछ दिन दर्द, फ़्लो और मूड लॉग करें (या Details for Sync पूरा करें), फिर मैं इन्हें आपके हिसाब से बनाऊँगी।'
        : 'ये रहे स्त्री रोग विशेषज्ञ के लिए **5 सवाल**, आपके अपने लॉग और हेल्थ चेक से चुने हुए। मुलाक़ात में जवाब लिख लें।',
    why: 'ठीक-ठीक सवालों पर डॉक्टर बेहतर जवाब देते हैं। हर सवाल बताता है कि वह आपके किस डेटा से आया — मैं बीमारी तय नहीं करती।',
    doctor: 'अपनी SheSync डॉक्टर रिपोर्ट (Report टैब → PDF) साथ ले जाएँ ताकि डॉक्टर आपकी तारीख़ें, दर्द और फ़्लो देख सकें।',
  },
};

function doctorPrepMessage(ctx: CounsellorContext, lang: ChatLanguage): YourGoGirlMessage | null {
  const input = ctx.getDoctorPrepInput?.();
  if (!input) return null;
  const prep = buildDoctorQuestions(input, lang);
  const words = PREP_TEXT[lang];
  const actions: YourGoGirlAction[] = [
    { label: translateActionLabel('Share these questions', lang), kind: 'share', value: doctorQuestionsText(prep, lang) },
    { label: translateActionLabel('Open doctor report', lang), kind: 'route', value: '/(tabs)/report' },
    { label: translateActionLabel('Open Care Connect', lang), kind: 'route', value: '/care' },
  ];
  const msg = toMessage(
    null,
    {
      text: words.intro(prep.generalOnly),
      steps: prep.questions.map((q, i) => `**${i + 1}. ${q.question}**\n${q.because}`),
      why: words.why,
      doctor: words.doctor,
      actions,
    },
    ctx,
    lang,
    [{ query: 'When should I see a gynaecologist?' }, { query: 'Which painkiller is safe for period pain?' }]
  );
  return { ...msg, intentId: 'doctor_prep', category: 'disturbances' };
}

const CONTINUE_RE = /^(yes|yeah|yep|yup|ok|okay|sure|haan|ha|han|tell me more|more|go on|continue|and|then|explain( more)?|why|how|what else|what next)\b/;

/** Builds YourGoGirl's reply to one message. Pure and synchronous (used by tests). */
export function buildYourGoGirlReply(userText: string, ctx: CounsellorContext): YourGoGirlMessage {
  const text = userText.trim();
  const lang = resolveLanguage(ctx.language ?? 'en', text, ctx.previousLang);
  const rctx = buildReplyCtx(text, ctx);
  const { intent, runnerUp } = matchIntent(text, ctx.mode);
  const say = ENGINE_TEXT[lang];

  // Safety always wins; then doctor-visit prep (it needs her data, so it is not a knowledge-base intent).
  if (!intent?.safety && DOCTOR_PREP_RE.test(rctx.text)) {
    const prep = doctorPrepMessage(ctx, lang);
    if (prep) return prep;
  }

  if (intent) {
    const reply = localise(intent, intent.reply(rctx), rctx, lang);
    const extra: { query: string; label?: string }[] = [];
    if (runnerUp && !intent.safety) {
      const topic = TOPIC_NAMES[lang][runnerUp.topic] ?? TOPIC_NAMES[lang].general;
      reply.text += `\n\n${say.alsoMentioned(topic)}`;
      if (runnerUp.examples[0]) {
        extra.push({
          query: capitalise(runnerUp.examples[0]),
          label: lang === 'en' ? capitalise(runnerUp.examples[0]) : say.askAbout(topic),
        });
      }
    }
    return toMessage(intent, reply, ctx, lang, extra);
  }

  // Short follow-ups like "tell me more" or "why?" continue the last topic.
  const norm = normalise(text);
  if (ctx.lastIntentId && CONTINUE_RE.test(norm) && norm.split(' ').length <= 6) {
    const last = INTENTS.find((i) => i.id === ctx.lastIntentId);
    if (last && last.followUps.length) {
      return toMessage(last, { text: say.goDeeper }, ctx, lang);
    }
  }

  return toMessage(
    null,
    {
      text: say.notSure(rctx.name),
      actions: [{ label: translateActionLabel('Open Care Connect', lang), kind: 'route', value: '/care' }],
    },
    ctx,
    lang,
    FALLBACK_SUGGESTIONS.map((q) => ({ query: q }))
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Async wrapper used by the chat screen (a short pause feels more natural). */
export async function generateYourGoGirlResponse(userText: string, ctx: CounsellorContext): Promise<YourGoGirlMessage> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return buildYourGoGirlReply(userText, ctx);
}

export function createInitialWelcomeMessage(userName: string, lang: ChatLanguage = 'en'): YourGoGirlMessage {
  const name = (userName || '').trim().split(' ')[0];
  const followUps = [
    'How can I reduce period cramps?',
    'When is my next period?',
    DOCTOR_PREP_PROMPT,
    'I can’t focus on studying',
  ];
  return {
    id: 'welcome-yourgogirl',
    sender: 'bot',
    timestamp: nowStamp(),
    createdAt: new Date().toISOString(),
    lang,
    category: 'general',
    mode: 'empathetic_counsellor',
    intentId: 'about_bot',
    text: ENGINE_TEXT[lang].welcome(name),
    followUpSuggestions: followUps.map((q) => translateQuestion(q, lang)),
    followUpQueries: followUps,
  };
}

/** Quick topic chip label in her language. */
export function quickTopicLabel(topic: QuickPromptTopic, lang: ChatLanguage): string {
  if (lang === 'en') return topic.label;
  return QUICK_TOPIC_LABELS[topic.id]?.[lang] ?? topic.label;
}

/** A question in her language (for chips that send English wording to the matcher). */
export function displayQuestion(q: string, lang: ChatLanguage): string {
  return translateQuestion(q, lang);
}
