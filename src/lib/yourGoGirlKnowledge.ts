/**
 * YourGoGirl built-in knowledge base.
 *
 * Every answer here is written in plain language and follows mainstream
 * guidance (NHS / FIGO / WHO-style advice): what is normal, what helps at
 * home, and the specific signs that mean "see a doctor". YourGoGirl never
 * diagnoses; red-flag answers point to real help (Care Connect, helplines).
 *
 * Matching: each intent has weighted keyword patterns plus example questions.
 * The engine (yourGoGirlEngine.ts) scores all intents and picks the best.
 * `followUps` must be questions that other intents answer — this is checked
 * by the YourGoGirl test script.
 */
import type { CounsellorMode, CounsellorTopic, CyclePhase, YourGoGirlAction } from '@/types';

export interface ReplyCtx {
  name: string;
  hasCycleData: boolean;
  day: number;
  phase: CyclePhase;
  phaseLabel: string;
  isIrregular: boolean;
  nextPeriodDate?: string;
  daysUntilNext?: number;
  ovulationWindow?: string;
  fertileWindow?: string;
  cycleLength?: number;
  recentPain: number | null;
  recentFlow: string;
  recentMood: number | null;
  mode: CounsellorMode;
  /** Normalised user text, for small wording tweaks inside a reply. */
  text: string;
}

export interface Reply {
  text: string;
  why?: string;
  steps?: string[];
  doctor?: string;
  affirmation?: string;
  urgent?: boolean;
  actions?: YourGoGirlAction[];
}

export interface Intent {
  id: string;
  topic: CounsellorTopic;
  /** Safety intents are checked first and win whenever their trigger matches. */
  safety?: boolean;
  trigger?: RegExp[];
  keywords: [RegExp, number][];
  examples: string[];
  reply: (c: ReplyCtx) => Reply;
  followUps: string[];
}

// ─── Shared actions ────────────────────────────────────────
const CALL_TELEMANAS: YourGoGirlAction = { label: 'Call Tele-MANAS 14416', kind: 'call', value: '14416' };
const CALL_112: YourGoGirlAction = { label: 'Emergency 112', kind: 'call', value: '112' };
const CALL_181: YourGoGirlAction = { label: 'Women Helpline 181', kind: 'call', value: '181' };
const CALL_NCW: YourGoGirlAction = { label: 'NCW 14490', kind: 'call', value: '14490' };
const CARE: YourGoGirlAction = { label: 'Open Care Connect', kind: 'route', value: '/care' };
const LOG_PERIOD: YourGoGirlAction = { label: 'Add period dates', kind: 'route', value: '/log-cycle' };
const LOG_PAIN: YourGoGirlAction = { label: 'Log pain', kind: 'route', value: '/log-pain' };
const LOG_FLOW: YourGoGirlAction = { label: 'Log flow', kind: 'route', value: '/log-flow' };
const BREATHE: YourGoGirlAction = { label: 'Start a breathing exercise', kind: 'route', value: '/games/breathe' };
const STUDY: YourGoGirlAction = { label: 'Open Study Focus', kind: 'route', value: '/study' };
const FITNESS: YourGoGirlAction = { label: 'Open Fitness', kind: 'route', value: '/fitness' };

const hi = (c: ReplyCtx) => (c.name ? `, ${c.name}` : '');

/** One sentence about where she is in her cycle, or '' if unknown. */
function phaseLine(c: ReplyCtx): string {
  if (!c.hasCycleData || c.day <= 0) return '';
  switch (c.phase) {
    case 'menstrual':
      return `You're on day ${c.day} — your period days.`;
    case 'follicular':
      return `You're on day ${c.day}, after your period (follicular phase), when energy usually climbs.`;
    case 'ovulatory':
      return `You're on day ${c.day}, around your likely ovulation window.`;
    case 'luteal':
      return `You're on day ${c.day}, in the luteal phase — the 1–2 weeks before a period, when PMS symptoms show up for many people.`;
    default:
      return `You're on day ${c.day} of a longer-than-usual cycle.`;
  }
}

// ============================================================
// SAFETY — always checked first
// ============================================================
const SAFETY: Intent[] = [
  {
    id: 'crisis_selfharm',
    topic: 'safety',
    safety: true,
    trigger: [
      /\b(suicid\w*|kill (my ?self)|end (my life|it all)|want(ed)? to die|wanna die|wish i (was|were) dead|better off dead|no reason to (live|go on)|don'?t want to (live|be alive|exist|wake up))\b/,
      /\b(self[- ]?harm\w*|hurt(ing)? myself|cut(ting)? myself|harm(ing)? myself)\b/,
      /\b(marna chahti|mar jaun|mar jana|khudkushi|jeena nahi)\b/,
    ],
    keywords: [],
    examples: [],
    reply: (c) => ({
      urgent: true,
      text: `I'm really glad you told me${hi(c)}. What you're feeling matters, and you don't have to carry it alone.\n\nPlease talk to a real person right now. **Tele-MANAS (14416)** is free, confidential and open 24×7 in your language. If you feel you might act on these thoughts, or you're in danger, call **112** or go to the nearest hospital.`,
      steps: [
        'If you can, message or call someone you trust — a friend, sister, parent or teacher — and tell them you need them with you right now.',
        'Move away from anything you could use to hurt yourself, and stay somewhere with other people around.',
        'Breathe slowly with me: in for 4 counts, out for 6 counts, ten times. You only have to get through the next few minutes.',
      ],
      actions: [CALL_TELEMANAS, CALL_112, CARE],
    }),
    followUps: ['Walk me through a quick grounding exercise', 'I want to talk to a counsellor'],
  },
  {
    id: 'abuse_violence',
    topic: 'safety',
    safety: true,
    trigger: [
      /\b(hits? me|beats? me|beating me|slaps? me|abus(e|es|ed|ing|ive)|domestic violence|harass\w*|stalk\w*|molest\w*|rap(e|ed)|sexual(ly)? assault\w*|forced me|forces me|touch(ed|es) me (without|inappropriately)|unsafe at home|threaten\w* (me|to))\b/,
    ],
    keywords: [],
    examples: [],
    reply: () => ({
      urgent: true,
      text: `I'm so sorry this is happening. **It is not your fault**, and you deserve to be safe.\n\nIf you are in danger right now, call **112**. For help and advice, **Women Helpline 181** (24×7, free) can connect you to police, a doctor, counselling, legal aid and a One Stop Centre.`,
      steps: [
        'Call 112 if you are in immediate danger.',
        'Call 181 to talk through options — you decide what happens next.',
        'Women 18+ can also call the NCW helpline 14490 (24×7) to register a complaint and get support.',
        'If it is safe, tell one trusted person and keep a private note of dates, messages or photos.',
      ],
      actions: [CALL_112, CALL_181, CALL_NCW],
    }),
    followUps: ['I want to talk to a counsellor', 'Walk me through a quick grounding exercise'],
  },
  {
    id: 'emergency_bleeding',
    topic: 'safety',
    safety: true,
    trigger: [
      /\b(soak\w*|fill\w*|chang\w*|leak\w*)\b.{0,40}\b(every|each|in an?|within|in one)\s*(1\s*)?(hour|hr)\b/,
      /\b(faint\w*|passed out|pass out|black(ed)? out|collaps\w*|chakkar)\b.{0,60}\b(bleed\w*|period\w*|flow|blood)\b/,
      /\b(bleed\w*|period\w*|flow|blood)\b.{0,60}\b(faint\w*|passed out|pass out|black(ed)? out|collaps\w*|chakkar|can'?t breathe|breathless)\b/,
      /\bwon'?t stop bleeding\b|\bbleeding (a lot|heavily) (and|with) (dizzy|faint)/,
    ],
    keywords: [],
    examples: [],
    reply: (c) => ({
      urgent: true,
      text: `${c.name ? `${c.name}, this` : 'This'} needs medical care **today**. Soaking through a pad or tampon every hour for more than 2 hours, or feeling faint, dizzy or breathless while bleeding, can mean you're losing too much blood.\n\nPlease go to the nearest hospital emergency, or call **112** if you feel faint. Don't drive yourself.`,
      steps: [
        'Lie down with your legs raised if you feel dizzy.',
        'Sip water or ORS while you wait for help.',
        'Tell the doctor how many pads you used in the last few hours, and if there is any chance you could be pregnant.',
      ],
      actions: [CALL_112, CARE],
    }),
    followUps: ['How do I know if my bleeding is too heavy?'],
  },
  {
    id: 'pregnancy_emergency',
    topic: 'safety',
    safety: true,
    trigger: [
      /\b(pregnan\w*|positive test|missed (my )?period)\b.{0,80}\b(severe|sharp|one side|one-sided|shoulder|bleed\w*|spotting|faint\w*|dizzy)\b/,
      /\b(severe|sharp|one side|one-sided|bleed\w*|spotting)\b.{0,80}\b(pregnan\w*|positive test)\b/,
    ],
    keywords: [],
    examples: [],
    reply: () => ({
      urgent: true,
      text: `If you might be pregnant and you have **strong or one-sided tummy pain, pain in the tip of your shoulder, bleeding, or you feel faint**, please see a doctor **today** or go to a hospital emergency.\n\nThese signs need to be checked quickly to rule out an ectopic pregnancy (a pregnancy outside the womb). It may well be something else — but it's important to be sure.`,
      steps: ['Call 112 if the pain is severe or you feel faint.', 'Do not wait to see if it settles.', 'Tell the doctor the date of your last period.'],
      actions: [CALL_112, CARE],
    }),
    followUps: ['When should I take a pregnancy test?'],
  },
  {
    id: 'fever_pelvic',
    topic: 'safety',
    safety: true,
    trigger: [
      /\b(tampon|menstrual cup|cup)\b.{0,80}\b(fever|temperature|rash|vomit\w*|dizzy|confus\w*)\b/,
      /\b(fever|high temperature)\b.{0,80}\b(tampon|menstrual cup|pelvic|lower (belly|tummy|abdomen)|discharge)\b/,
      /\b(pelvic|lower (belly|tummy|abdomen)|discharge)\b.{0,60}\b(fever|high temperature)\b/,
    ],
    keywords: [],
    examples: [],
    reply: (c) => {
      const tampon = /tampon|cup/.test(c.text);
      return {
        urgent: true,
        text: tampon
          ? `**Take the tampon or cup out now, and get medical help today.** A fever, rash, vomiting, dizziness or confusion while using one can be toxic shock syndrome — rare, but serious and treatable when caught early. Tell the doctor you were using a tampon or cup.`
          : `A **fever with lower-tummy pain or unusual discharge** can be an infection of the womb or tubes (pelvic inflammatory disease). Please see a doctor **today** — it needs antibiotics, and early treatment protects your fertility.`,
        steps: ['Call 112 or go to emergency if you feel very unwell, confused or faint.', 'Drink fluids and rest until you are seen.'],
        actions: [CALL_112, CARE],
      };
    },
    followUps: ['Pads, tampons or a menstrual cup — which is best?'],
  },
  {
    id: 'severe_sudden_pain',
    topic: 'safety',
    safety: true,
    trigger: [
      /\b(sudden\w*)\b.{0,40}\b(severe|sharp|bad|terrible|unbearable|intense)\b.{0,30}\b(pain|cramp\w*|ache)\b/,
      /\bworst pain (of my life|ever)\b/,
      /\b(severe|sharp|unbearable)\b.{0,30}\bpain\b.{0,40}\b(one side|right side|left side)\b.{0,60}\b(vomit\w*|fever|faint\w*)\b/,
    ],
    keywords: [],
    examples: [],
    reply: () => ({
      urgent: true,
      text: `**Sudden, severe tummy or pelvic pain should be checked today** — especially with vomiting, fever, fainting, or pain on one side. It can be something like a twisted or burst ovarian cyst, appendicitis, or (if pregnancy is possible) an ectopic pregnancy.\n\nPlease go to a hospital emergency or call **112**.`,
      steps: ['Don’t eat or drink much until a doctor has seen you, in case you need a procedure.', 'Ask someone to go with you.'],
      actions: [CALL_112, CARE],
    }),
    followUps: ['When should I see a gynaecologist?'],
  },
];

// ============================================================
// GENERAL
// ============================================================
const GENERAL: Intent[] = [
  {
    id: 'greeting',
    topic: 'general',
    keywords: [[/^(hi+|hey+|hello+|hii+|namaste|hola|yo|good (morning|afternoon|evening))\b/, 3]],
    examples: ['hi', 'hello', 'hey there', 'good morning'],
    reply: (c) => ({
      text: `Hi${hi(c)}! 💜 I'm here. ${phaseLine(c) || ''}\n\nWhat's on your mind — your period, your body, your mood, or studying and focus? You can type it in your own words.`.replace('  ', ' '),
    }),
    followUps: ['How can I reduce period cramps?', 'When is my next period?', 'I feel low and unmotivated', 'I can’t focus on studying'],
  },
  {
    id: 'thanks',
    topic: 'general',
    keywords: [[/\b(thanks?|thank you|thx|ty|shukriya|dhanyavaad)\b/, 3], [/\b(helpful|that helped|feel better)\b/, 2]],
    examples: ['thank you', 'thanks that helped', 'thanks a lot'],
    reply: (c) => ({
      text: `You're so welcome${hi(c)}. 🌸 I'm glad I could help. Come back any time — even just to vent.`,
      affirmation: 'I am allowed to take up space and ask for help.',
    }),
    followUps: ['Help me calm down with a breathing exercise', 'What should I eat during my period?'],
  },
  {
    id: 'bye',
    topic: 'general',
    keywords: [[/^(bye+|good ?night|gn|see you|ok bye|tata)\b/, 3]],
    examples: ['bye', 'good night'],
    reply: (c) => ({ text: `Take care${hi(c)} 💜 Rest well, drink some water, and be gentle with yourself today.` }),
    followUps: [],
  },
  {
    id: 'about_bot',
    topic: 'general',
    keywords: [
      [/\bwho are you\b|\bwhat are you\b|\bare you (a )?(real|human|bot|ai|doctor)\b|\bwhat can you do\b|\bhow do you work\b/, 4],
      [/\byourgogirl\b/, 1],
    ],
    examples: ['who are you', 'what can you do', 'are you a doctor', 'are you a real person'],
    reply: () => ({
      text: `I'm **YourGoGirl** — SheSync's built-in guide. I can explain periods and cycle health (cramps, late or irregular periods, PCOS, heavy flow, discharge, hygiene), help with mood, anxiety, motivation and study focus, and walk you through calming exercises.\n\nI'm **not a doctor** and I don't diagnose. When something you describe needs a real doctor or counsellor, I'll say so clearly — and Care Connect has free helplines and ways to reach a gynaecologist.`,
      why: 'Your chat stays on this phone. I use your logged cycle day and symptoms to make answers more personal.',
      actions: [CARE],
    }),
    followUps: ['What is a normal menstrual cycle?', 'What is PCOS?', 'I feel anxious all the time'],
  },
  {
    id: 'app_help',
    topic: 'general',
    keywords: [
      [/\bhow (do|can) i (log|add|track|record|save)\b/, 4],
      [/\b(log|track|add)\b.{0,15}\b(period|cycle|pain|flow|mood|dates?)\b/, 2],
      [/\b(doctor report|pdf|export|report tab|use (this|the) app|how to use)\b/, 3],
    ],
    examples: ['how do i log my period', 'how to use this app', 'how do i add my period dates', 'where is my doctor report'],
    reply: () => ({
      text: `Here's where things live in SheSync:\n\n• **Period dates** — Home → Log Period (or the calendar). Tick the first and last day of each period.\n• **Pain, flow, mood** — Home → Quick check-in buttons. Logging even 10 seconds a day makes predictions and advice much better.\n• **Doctor report** — the Report tab makes a PDF of your last 90 days to show a gynaecologist.\n• **Care Connect** — free helplines and ways to find a gynaecologist or counsellor.`,
      actions: [LOG_PERIOD, LOG_PAIN, CARE],
    }),
    followUps: ['When is my next period?', 'When should I see a gynaecologist?'],
  },
];

// ============================================================
// CYCLE & PERIODS
// ============================================================
const CYCLE: Intent[] = [
  {
    id: 'cycle_basics',
    topic: 'disturbances',
    keywords: [
      [/\bnormal\b.{0,30}\b(cycle|period|menstrual)\b|\b(cycle|period)\b.{0,30}\bnormal\b/, 3],
      [/\bhow long (is|should)\b.{0,25}\b(cycle|period)\b/, 3],
      [/\b\d{2}\s*days?\b.{0,25}\b(cycle|normal)\b/, 2],
      [/\bmenstrual cycle\b/, 1],
    ],
    examples: ['what is a normal menstrual cycle', 'is a 32 day cycle normal', 'how long should my cycle be', 'how many days is a normal period'],
    reply: (c) => ({
      text: `A cycle is counted from the **first day of one period to the first day of the next**. For adults, anything from **24 to 38 days** is normal, and the length can vary by up to about a week from month to month. Bleeding usually lasts **up to 7–8 days**.\n\nIn the first 2–3 years after periods start, cycles are often more irregular — that's common.${c.hasCycleData && c.cycleLength ? `\n\nFrom your saved dates, your cycles average about **${c.cycleLength} days**.` : ''}`,
      why: 'The cycle has two halves: before ovulation (follicular — this part changes length the most) and after ovulation (luteal — usually 12–14 days).',
      doctor: 'See a gynaecologist if your cycles are often shorter than 24 or longer than 38 days, change by much more than a week, you bleed for more than 8 days, or you have no period for 3 months.',
      actions: c.hasCycleData ? undefined : [LOG_PERIOD],
    }),
    followUps: ['What are the phases of the menstrual cycle?', 'Why are my periods irregular?', 'When is my next period?'],
  },
  {
    id: 'next_period',
    topic: 'disturbances',
    keywords: [
      [/\b(when|which day)\b.{0,30}\b(next|my)\b.{0,10}\b(period|periods|mc|chums)\b/, 5],
      [/\bnext period\b|\bperiod due\b|\bpredict\w*\b.{0,15}\bperiod\b|\bkab aayega\b|\bkab aayenge\b/, 4],
    ],
    examples: ['when is my next period', 'when will my period come', 'when is my period due', 'predict my next period'],
    reply: (c) => {
      if (!c.hasCycleData || !c.nextPeriodDate) {
        return {
          text: `I can predict it once you add your last period dates${hi(c)}. Tick the start and end days of your last 1–3 periods on the calendar — it takes about a minute.`,
          actions: [LOG_PERIOD],
        };
      }
      const d = c.daysUntilNext ?? 0;
      const when =
        d > 1 ? `in about **${d} days** (around **${c.nextPeriodDate}**)` : d === 1 ? `**tomorrow** (around ${c.nextPeriodDate})` : d === 0 ? `**around today**` : `— it's about **${Math.abs(d)} day${Math.abs(d) > 1 ? 's' : ''} late**`;
      return {
        text: `Based on your saved dates, your next period is due ${when}.${c.isIrregular ? '\n\nYour cycles vary quite a bit, so treat this as a rough window of a few days either side.' : ''}`,
        why: 'Predictions use the average of your recent cycle lengths. Stress, illness, travel and big changes in sleep or food can shift a period by several days.',
        steps:
          d >= 0 && d <= 5
            ? ['Keep a pad or cup in your bag this week.', 'If you usually get cramps, keep a heat pad ready and eat regular meals.', 'Log the day it starts so the next prediction gets sharper.']
            : ['Log your period the day it starts — each cycle makes predictions more accurate.'],
        actions: d < 0 ? [LOG_PERIOD] : undefined,
      };
    },
    followUps: ['My period is late. What should I do?', 'What phase am I in right now?', 'When do I ovulate?'],
  },
  {
    id: 'my_phase',
    topic: 'disturbances',
    keywords: [
      [/\b(what|which)\b.{0,15}\b(phase|cycle day|day of (my )?cycle)\b.{0,15}\b(am i|i am|i'm)\b/, 5],
      [/\bmy (current )?phase\b|\bwhat phase\b|\bwhich phase\b/, 4],
    ],
    examples: ['what phase am i in right now', 'which day of my cycle is it', 'what is my current phase'],
    reply: (c) => {
      if (!c.hasCycleData) {
        return { text: 'Add your last period dates and I can tell you your cycle day and phase every day.', actions: [LOG_PERIOD] };
      }
      const tips: Record<string, string[]> = {
        menstrual: ['Rest is productive today — lighter workouts, stretching or walks.', 'Iron-rich food (dal, rajma, spinach, eggs) with vitamin C helps replace what you lose.'],
        follicular: ['Great time for harder workouts and new learning — energy usually rises.', 'Plan tougher study topics for these days.'],
        ovulatory: ['Energy and mood are often at their best.', 'If you are avoiding pregnancy, this is the most fertile time.'],
        luteal: ['PMS (bloating, cravings, low mood) can show up — keep meals regular and sleep steady.', 'Swap some intense workouts for strength, yoga or walks if you feel drained.'],
        irregular: ['Keep logging — longer cycles are common with stress or PCOS.', 'If you have had no period for 3 months, see a gynaecologist.'],
      };
      return {
        text: `${phaseLine(c)}${c.nextPeriodDate && (c.daysUntilNext ?? 0) >= 0 ? ` Your next period is due around **${c.nextPeriodDate}**.` : ''}`,
        steps: tips[c.phase] ?? tips.irregular,
      };
    },
    followUps: ['What are the phases of the menstrual cycle?', 'Can I exercise during my period?'],
  },
  {
    id: 'phases_explained',
    topic: 'disturbances',
    keywords: [
      [/\bphases?\b.{0,25}\b(cycle|menstrual|period)\b|\b(cycle|menstrual)\b.{0,10}\bphases?\b/, 4],
      [/\b(luteal|follicular|ovulatory)\b/, 3],
      [/\bwhat happens\b.{0,20}\b(period|menstruat\w*|cycle)\b|\bexplain\b.{0,20}\b(cycle|menstrua\w*)\b|\bhow does (the |my )?(period|cycle|menstruation) work\b/, 5],
    ],
    examples: ['what are the phases of the menstrual cycle', 'what is the luteal phase', 'explain follicular phase'],
    reply: () => ({
      text: `There are four phases:\n\n1. **Period (menstrual)** — days 1 to about 5. The womb lining sheds. Energy can be low.\n2. **Follicular** — after your period until ovulation. Oestrogen rises; energy, mood and focus usually improve.\n3. **Ovulation** — an egg is released, roughly 14 days *before* the next period (not always on day 14). This is the most fertile time.\n4. **Luteal** — after ovulation until your period, usually 12–14 days. Progesterone rises then falls, which can bring PMS: bloating, cravings, tender breasts, low or irritable mood.`,
      why: 'The follicular phase is the one that changes length — that is why some cycles are 25 days and others 35.',
    }),
    followUps: ['When do I ovulate?', 'What phase am I in right now?', 'What helps with PMS?'],
  },
  {
    id: 'ovulation',
    topic: 'disturbances',
    keywords: [
      [/\bovulat\w*\b/, 4],
      [/\bfertile\b|\bfertility window\b|\begg white\b|\bsafe days\b|\bmost likely to get pregnant\b/, 4],
    ],
    examples: ['when do i ovulate', 'what is my fertile window', 'signs of ovulation', 'what are safe days'],
    reply: (c) => ({
      text: `Ovulation usually happens about **14 days before your next period** — so in a 28-day cycle it's around day 14, in a 35-day cycle around day 21. The **fertile window** is the 5 days before ovulation plus the day of ovulation.${c.hasCycleData && c.ovulationWindow ? `\n\nFrom your dates, your likely ovulation window is **${c.ovulationWindow}**.` : ''}`,
      steps: [
        'Signs: clear, stretchy "egg-white" discharge, a mild one-sided twinge, slightly higher energy or libido.',
        'Ovulation test strips (from a chemist) can confirm it.',
        '"Safe days" are not reliable contraception — cycles shift, and sperm can live up to 5 days.',
      ],
      doctor: 'If you are trying to get pregnant and it has not happened after 12 months (6 months if you are over 35), or your periods are very irregular, see a gynaecologist.',
      actions: c.hasCycleData ? undefined : [LOG_PERIOD],
    }),
    followUps: ['When should I take a pregnancy test?', 'Why are my periods irregular?'],
  },
  {
    id: 'late_period',
    topic: 'disturbances',
    keywords: [
      [/\b(late|delay\w*|missed|skipped|overdue)\b.{0,25}\b(period|periods|mc|cycle)\b|\b(period|periods|mc)\b.{0,25}\b(late|delay\w*|missed|not (come|came|coming)|hasn'?t come|didn'?t come|skipped)\b/, 5],
      [/\b(period|periods|mc)\b.{0,20}\b(nahi aay\w*|nahi aaye|late ho)\b|\bnahi aaye\b/, 5],
      [/\bno period\b/, 3],
      [/\b(period|mc)\b.{0,20}\b(stopped|stop|absent|gone|disappeared)\b/, 5],
    ],
    examples: [
      'my period is late',
      'my periods are delayed by 10 days',
      'i missed my period',
      'period not came this month',
      'periods nahi aaye',
      'my period is late and the test is negative',
    ],
    reply: (c) => ({
      text: `A late period is very common${hi(c)}, and usually there's a simple reason.\n\n**If there is any chance you could be pregnant, take a home pregnancy test first** — it's most reliable from the day your period was due, or 3 weeks after sex. If it's negative and your period still hasn't come, test again in a week.${c.hasCycleData && (c.daysUntilNext ?? 0) < 0 ? `\n\nBy your saved dates, you're about **${Math.abs(c.daysUntilNext ?? 0)} days** past the predicted start.` : ''}`,
      why: 'Your period comes about 2 weeks after ovulation. Stress, illness, travel, poor sleep, sudden weight change, over-exercising, thyroid problems or PCOS can delay ovulation — and the period waits with it.',
      steps: [
        'Take a pregnancy test if there is any chance.',
        'Think back: exams, stress, illness, travel, a big diet or exercise change?',
        'Keep logging — one late period on its own is usually not a worry.',
      ],
      doctor: 'See a gynaecologist if you have missed 3 periods in a row (with a negative test), your periods have become irregular, or you also have weight changes, extra facial hair, acne, or feel very tired.',
      actions: [CARE],
    }),
    followUps: ['When should I take a pregnancy test?', 'Can stress delay my period?', 'What is PCOS?'],
  },
  {
    id: 'stress_period',
    topic: 'disturbances',
    keywords: [
      [/\b(stress|exam\w*|tension|anxiety|travel\w*)\b.{0,30}\b(delay\w*|late|affect\w*|stop\w*|miss\w*)\b.{0,20}\b(period|cycle|mc)\b/, 7],
      [/\b(stress|exam\w*|tension|travel\w*)\b.{0,40}\b(period|cycle|mc)\b.{0,15}\b(late|delay\w*|irregular|miss\w*)\b/, 7],
      [/\bcan stress\b/, 4],
    ],
    examples: ['can stress delay my period', 'does exam stress affect periods', 'can travel make my period late'],
    reply: () => ({
      text: `Yes — stress really can delay a period. Big stress (exams, moving, illness, grief, very little sleep) signals the brain to **pause or delay ovulation**, and the period then comes late. It can also make a period come early or be lighter or heavier than usual.\n\nIt usually settles within a cycle or two once things calm down.`,
      why: 'The hypothalamus (in the brain) controls the hormones that trigger ovulation, and it responds to stress hormones like cortisol.',
      steps: ['Keep sleep regular — same wake-up time every day helps most.', 'Eat proper meals; skipping food adds to the stress signal.', 'Do something calming daily, even 5 minutes of slow breathing.'],
      doctor: 'If you have missed 3 periods in a row, or your cycles stay irregular for months, see a gynaecologist — it may not just be stress.',
      actions: [BREATHE],
    }),
    followUps: ['Help me calm down with a breathing exercise', 'My period is late. What should I do?'],
  },
  {
    id: 'pregnancy_test',
    topic: 'disturbances',
    keywords: [
      [/\bpregnancy test\b|\bpreg(a|-)?news\b|\bupt\b|\bhcg\b/, 5],
      [/\b(could|can|might|am) i (be )?pregnant\b|\bchance of pregnancy\b|\bcan i get pregnant\b/, 5],
      [/\bunprotected\b/, 3],
      [/\btest\b.{0,20}\bnegative\b|\bnegative test\b/, 3],
    ],
    examples: [
      'when should i take a pregnancy test',
      'could i be pregnant',
      'test is negative but no period',
      'can i get pregnant during my period',
    ],
    reply: (c) => {
      const duringPeriod = /during (my )?(period|periods)/.test(c.text);
      return {
        text: duringPeriod
          ? `It's less likely, but **yes, it's possible to get pregnant from sex during or just after a period** — especially with shorter cycles, because sperm can live up to 5 days and you might ovulate early.`
          : `Most home pregnancy tests are accurate **from the first day of a missed period**. If you don't know when your period is due, test **at least 3 weeks after** the sex you're worried about.`,
        steps: [
          'Use first-morning urine for the most reliable result.',
          'Negative but still no period? Test again in a week.',
          'If you had unprotected sex in the last 3 days, an emergency contraceptive pill (from a chemist) works best the sooner you take it.',
        ],
        doctor: 'See a doctor if the test is positive (to confirm and plan care), or if you have one-sided pain, bleeding or feel faint.',
        actions: [CARE],
      };
    },
    followUps: ['My period is late. What should I do?', 'How does the emergency pill work?'],
  },
  {
    id: 'emergency_pill',
    topic: 'disturbances',
    keywords: [[/\b(emergency (pill|contracepti\w*)|morning after|i-?pill|ipill|unwanted 72|plan b)\b/, 7]],
    examples: ['how does the emergency pill work', 'is ipill safe', 'morning after pill'],
    reply: () => ({
      text: `An **emergency contraceptive pill** (like i-pill / Unwanted-72) can prevent pregnancy after unprotected sex or a contraception accident. It works by delaying ovulation, so **the sooner you take it the better** — ideally within 24 hours, and within 72 hours.\n\nIt is **not** an abortion pill and won't affect an existing pregnancy.`,
      steps: [
        'Your next period may come a few days early or late.',
        'If your period is more than 7 days late after taking it, do a pregnancy test.',
        'It is for emergencies — regular contraception is more reliable. A doctor can help you choose one.',
      ],
      doctor: 'See a doctor if you vomit within 3 hours of taking it, have severe tummy pain afterwards, or your period is very late.',
      actions: [CARE],
    }),
    followUps: ['When should I take a pregnancy test?', 'Do birth control pills affect periods?'],
  },
  {
    id: 'irregular',
    topic: 'disturbances',
    keywords: [
      [/\birregular\b|\bunpredictable\b|\bnot regular\b/, 5],
      [/\btwice a month\b|\btwo periods\b|\bcomes? early\b|\bevery (2|two) weeks\b/, 4],
      [/\b(time pe|time par|time se|samay par)\b.{0,15}\b(nahi|nhi)\b/, 5],
      [/\bcycle\b.{0,20}\b(chang\w*|different every|keeps chang\w*|varies)\b/, 3],
    ],
    examples: ['why are my periods irregular', 'my cycle is unpredictable', 'i get my period twice a month', 'my cycle length keeps changing'],
    reply: (c) => ({
      text: `Irregular periods are common, especially in the first few years after periods start and during stressful times. Cycles count as irregular when the length often changes by **more than about a week**, or periods come **more often than every 24 days or less often than every 38 days**.${c.isIrregular ? '\n\nYour saved cycles do look irregular, so it is worth keeping an eye on this.' : ''}`,
      why: 'Common reasons: stress, big weight change, over-exercising, thyroid problems, PCOS, high prolactin, or hormonal contraception.',
      steps: ['Log every period start — 3 months of dates helps a doctor a lot.', 'Keep sleep, meals and exercise steady.', 'Note other signs: acne, extra facial hair, weight change, hair fall, feeling cold or very tired.'],
      doctor: 'See a gynaecologist if it has been irregular for more than 3–6 months, you go 3 months without a period, or you notice acne, extra hair growth or weight change. Simple blood tests (thyroid, hormones) and an ultrasound can find the cause.',
      actions: [LOG_PERIOD, CARE],
    }),
    followUps: ['What is PCOS?', 'Can thyroid problems affect periods?', 'When should I see a gynaecologist?'],
  },
  {
    id: 'pcos',
    topic: 'disturbances',
    keywords: [[/\bpco(s|d)\b|\bpolycystic\b|\bcysts? (on|in) (my )?ovar\w*\b/, 6]],
    examples: ['what is pcos', 'do i have pcod', 'what are the symptoms of pcos', 'polycystic ovaries'],
    reply: () => ({
      text: `**PCOS (polycystic ovary syndrome — also called PCOD in India)** is a common hormone condition, affecting roughly 1 in 10 women. The ovaries don't release an egg regularly, so periods become irregular.\n\nA doctor diagnoses it when you have **2 of these 3**: irregular or missed periods; signs of higher androgens (extra facial/body hair, acne, scalp hair thinning — or high levels on a blood test); and many small follicles on an ultrasound.`,
      why: 'Insulin resistance is common in PCOS and pushes the ovaries to make more androgens, which disturbs ovulation. It runs in families.',
      steps: [
        'It is manageable: regular movement and balanced meals (protein + fibre, fewer sugary drinks) improve symptoms for many people — even without big weight loss.',
        'Treatment depends on your goals: regular periods, skin/hair, or pregnancy later.',
        'Having PCOS does not mean you can’t have children — many people with PCOS conceive, sometimes with help.',
      ],
      doctor: 'See a gynaecologist for proper testing (blood tests + ultrasound) rather than self-diagnosing — thyroid problems and other conditions can look similar.',
      actions: [CARE],
    }),
    followUps: ['What should I eat if I have PCOS?', 'How can I reduce facial hair and acne?', 'When should I see a gynaecologist?'],
  },
  {
    id: 'pcos_diet',
    topic: 'disturbances',
    keywords: [
      [/\bpco(s|d)\b.{0,30}\b(diet|eat|food|exercise|workout|weight|lose)\b|\b(diet|eat|food|exercise|weight)\b.{0,30}\bpco(s|d)\b/, 7],
    ],
    examples: ['what should i eat if i have pcos', 'best exercise for pcos', 'how to lose weight with pcod'],
    reply: () => ({
      text: `With PCOS, the aim is **steady blood sugar**, not a crash diet.`,
      steps: [
        'Build each meal around protein + fibre: dal, chana, rajma, paneer, eggs, curd, vegetables, whole grains (millets, brown rice, oats).',
        'Cut down sugary drinks, sweets and refined maida — swap, don’t ban.',
        'Eat regular meals; skipping meals often leads to bigger cravings later.',
        'Move most days: brisk walking plus 2 strength sessions a week improves insulin sensitivity.',
        'Even a 5–10% weight loss (if you are above a healthy weight) can make periods more regular.',
      ],
      why: 'Muscles use glucose better after exercise, and fibre/protein slow how fast sugar enters the blood — both lower insulin, which lowers androgens.',
      doctor: 'A gynaecologist or dietitian can tailor this, and check things like blood sugar and thyroid.',
      actions: [FITNESS],
    }),
    followUps: ['What is PCOS?', 'Can I exercise during my period?'],
  },
  {
    id: 'thyroid',
    topic: 'disturbances',
    keywords: [[/\bthyroid\b|\bhypothyroid\w*\b|\bhyperthyroid\w*\b|\btsh\b/, 6]],
    examples: ['can thyroid problems affect periods', 'thyroid and irregular periods'],
    reply: () => ({
      text: `Yes. Thyroid hormones help regulate your cycle. An **underactive thyroid** can cause heavier, longer or irregular periods, tiredness, feeling cold and weight gain. An **overactive thyroid** can cause light or missed periods, weight loss, a fast heartbeat and anxiety.`,
      steps: ['A simple blood test (TSH) checks it.', 'Thyroid problems are common in India and very treatable.'],
      doctor: 'Ask a doctor for a thyroid test if your periods have changed along with tiredness, weight change, hair fall or feeling unusually hot or cold.',
      actions: [CARE],
    }),
    followUps: ['Why are my periods irregular?', 'Why do I feel so tired during my period?'],
  },
  {
    id: 'spotting',
    topic: 'disturbances',
    keywords: [
      [/\bspotting\b|\bspot(s|ted)?\b.{0,20}\b(between|before|after)\b/, 5],
      [/\bbleed\w*\b.{0,20}\b(between periods|after sex|mid ?cycle)\b/, 6],
      [/\bbrown discharge\b|\bpink discharge\b/, 4],
    ],
    examples: ['i have spotting between periods', 'brown discharge before my period', 'bleeding after sex', 'spotting in the middle of my cycle'],
    reply: () => ({
      text: `Light spotting can be harmless: brown spotting a day or two **before** a period, a little mid-cycle spotting around **ovulation**, or spotting in the first few months of a **new pill or hormonal coil**.`,
      why: 'Brown blood is just older blood that has taken longer to leave the body.',
      steps: ['Log the days you spot so you can see a pattern.', 'If you might be pregnant, take a test — light bleeding can happen in early pregnancy.'],
      doctor: '**Always see a doctor for bleeding after sex**, bleeding between periods that keeps happening, or any bleeding with pain, fever or unusual discharge.',
      actions: [LOG_FLOW, CARE],
    }),
    followUps: ['Is brown period blood normal?', 'When should I see a gynaecologist?'],
  },
  {
    id: 'blood_colour',
    topic: 'menstruation',
    keywords: [
      [/\b(brown|dark|black|pink|bright red|watery)\b.{0,20}\b(blood|period|flow)\b/, 5],
      [/\bclots?\b/, 4],
      [/\b(colou?r)\b.{0,20}\b(blood|period)\b/, 4],
    ],
    examples: ['is brown period blood normal', 'are blood clots normal during periods', 'why is my period blood dark', 'period blood colour meaning'],
    reply: () => ({
      text: `Period blood changes colour and that's normal: **bright red** on heavier days, **dark red or brown** at the start and end (older blood), sometimes **pink** when it mixes with discharge. **Small clots** (smaller than a ₹2 coin) on heavy days are normal too.`,
      doctor: 'See a gynaecologist if you often pass clots bigger than about 2.5 cm (a ₹2 coin), have grey or green discharge with a bad smell, or your bleeding is heavy enough to soak a pad every 1–2 hours.',
      actions: [LOG_FLOW],
    }),
    followUps: ['How do I know if my bleeding is too heavy?', 'Is white discharge normal?'],
  },
  {
    id: 'heavy_bleeding',
    topic: 'menstruation',
    keywords: [
      [/\bheavy\b.{0,20}\b(flow|period|bleed\w*|periods)\b|\b(flow|period|bleeding)\b.{0,15}\bheavy\b/, 5],
      [/\btoo much blood\b|\bflood\w*\b|\bmenorrhagia\b|\bdouble pad\b|\btwo pads\b|\bleak\w* through\b/, 4],
      [/\b(how much|too much)\b.{0,20}\b(bleed\w*|blood)\b|\b(bleed\w*|blood)\b.{0,20}\btoo much\b/, 5],
    ],
    examples: [
      'how do i know if my bleeding is too heavy',
      'my periods are very heavy',
      'i use two pads at night',
      'heavy flow and clots',
    ],
    reply: (c) => ({
      text: `Your periods may be **heavy** if you:\n• change a pad or tampon every **1–2 hours**\n• need **two products** together (or extra pads at night)\n• bleed through to clothes or bedding\n• bleed for **more than 7 days**\n• pass clots bigger than a **₹2 coin**\n• feel tired, dizzy or short of breath during periods\n\nHeavy periods are common — and **treatable**, so you don't have to just put up with them.${c.recentFlow === 'heavy' || c.recentFlow === 'severe' ? '\n\nYou logged heavy flow recently, so please keep an eye on these signs.' : ''}`,
      steps: [
        'Eat iron-rich food (dal, rajma, chana, green leafy vegetables, jaggery, eggs, meat) with vitamin C (lemon, amla, orange) to help absorption.',
        'Log your flow each day — the number of pads on your heaviest day helps the doctor most.',
        'A heat pad and an anti-inflammatory painkiller (if safe for you) can reduce cramps and, a little, the flow.',
      ],
      doctor: 'See a gynaecologist if any of the signs above apply, and ask for an iron (haemoglobin/ferritin) test. Go to emergency today if you soak a pad every hour for 2+ hours or feel faint.',
      actions: [LOG_FLOW, CARE],
    }),
    followUps: ['Why do I feel so tired during my period?', 'What should I eat during my period?', 'When should I see a gynaecologist?'],
  },
  {
    id: 'period_length',
    topic: 'menstruation',
    keywords: [
      [/\bperiod\b.{0,25}\b(last\w*|going on|for)\b.{0,15}\b(\d+|ten|eight|nine|two|long)\b.{0,10}\bdays?\b/, 5],
      [/\b(long|longer|short|shorter|only (2|two|1|one) days?)\b.{0,15}\bperiods?\b/, 4],
      [/\bperiod won'?t (end|stop)\b|\bperiod not stopping\b/, 5],
    ],
    examples: ['my period has lasted 10 days', 'my period only lasts 2 days', 'why is my period so long', 'period not stopping'],
    reply: () => ({
      text: `A period usually lasts **2 to 7 days**; up to 8 days can still be normal. Short, light periods (2–3 days) are often normal for that person, especially if they are regular.`,
      why: 'Length depends on how thick the womb lining became that cycle, and hormone balance.',
      doctor: 'See a gynaecologist if bleeding lasts more than 8 days, if this is a sudden change for you, or if your periods have become very light along with irregular or missed cycles.',
      actions: [LOG_FLOW, CARE],
    }),
    followUps: ['How do I know if my bleeding is too heavy?', 'Why are my periods irregular?'],
  },
  {
    id: 'first_period',
    topic: 'menstruation',
    keywords: [
      [/\bfirst period\b|\bmenarche\b|\bstart(ed)? (my )?period(s)? for the first time\b/, 6],
      [/\b(haven'?t|have not|not) (got|gotten|started)\b.{0,15}\bperiods?\b(?!.{0,15}(this|last) month)/, 4],
      [/\bwhen do (periods|girls)\b/, 4],
    ],
    examples: ['i got my first period', 'when do periods start', 'i am 15 and have not got my period yet', 'first period what to do'],
    reply: () => ({
      text: `Getting your first period is a normal part of growing up 🌸 — most girls start between **10 and 15** (often around 12). The first few years can be irregular: periods may skip months or come close together, and that's usually fine while your body settles.`,
      steps: [
        'Pads are the easiest to start with — change every 4–6 hours (sooner if full).',
        'Keep a spare pad and underwear in your school bag.',
        'Cramps can be eased with a hot water bag, a warm bath and gentle stretching.',
        'Talk to a trusted adult — your mother, an elder sister, aunt or school nurse — about anything that worries you.',
      ],
      doctor: 'See a doctor if periods have not started by 15, if they last more than 8 days, are very heavy, or pain makes you miss school.',
    }),
    followUps: ['Pads, tampons or a menstrual cup — which is best?', 'How can I reduce period cramps?'],
  },
  {
    id: 'birth_control',
    topic: 'disturbances',
    keywords: [
      [/\b(birth control|contracepti\w*|the pill|oral pill|ocp|copper t|cu-?t|iud|coil|implant|injection|mala d|chhaya|saheli)\b/, 6],
      [/\bmissed (a )?pill\b|\bwithdrawal bleed\b/, 5],
    ],
    examples: ['do birth control pills affect periods', 'i missed a pill', 'copper t and heavy periods'],
    reply: () => ({
      text: `Hormonal contraception changes periods: **pills** usually make them lighter, more regular and less painful (the bleed in the pill-free week is a "withdrawal bleed"). Spotting is common in the first **3 months** of a new pill, implant, injection or hormonal coil. A **copper-T** can make periods heavier and more painful at first.`,
      steps: [
        'Missed a pill? Take it as soon as you remember and check the leaflet — whether you need back-up protection depends on the type of pill and how many you missed.',
        'Vomiting or severe diarrhoea can stop the pill working that day.',
      ],
      doctor: 'A doctor or the leaflet is the best guide for your exact method. See a doctor for bleeding after sex, heavy bleeding, or severe pain with any method.',
      actions: [CARE],
    }),
    followUps: ['How does the emergency pill work?', 'I have spotting between periods'],
  },
];

// ============================================================
// PAIN & BODY
// ============================================================
const BODY: Intent[] = [
  {
    id: 'cramps',
    topic: 'menstruation',
    keywords: [
      [/\bcramp\w*\b/, 5],
      [/\b(period|periods|menstrual|mc)\b.{0,20}\b(pain|ache|hurt\w*|dard)\b|\b(pain|ache|hurt\w*|dard)\b.{0,25}\b(period|periods|menstrual)\b/, 5],
      [/\b(stomach|tummy|belly|abdomen|uterus|womb)\b.{0,20}\b(hurt\w*|pain|ache|cramp\w*)\b/, 4],
      [/\bpet (me )?dard\b|\bstomach (pain|ache)\b|\blower (belly|abdomen|tummy) pain\b|\bdysmenorrh\w*\b/, 4],
      [/\b(reduce|relieve|stop|ease|help|soothe)\b/, 1],
    ],
    examples: [
      'how can i reduce period cramps',
      'my period pain is unbearable',
      'pet dard ho raha hai',
      'help me with cramps right now',
      'how do i soothe painful cramps naturally',
    ],
    reply: (c) => ({
      text: `I'm sorry it hurts${hi(c)} 🫶 Cramps happen when the womb tightens to shed its lining. Here's what helps most:${(c.recentPain ?? 0) >= 7 ? `\n\nYou logged pain of **${c.recentPain}/10** recently — that's a lot. If it often stops your day, please read the doctor note below.` : ''}`,
      steps: [
        '**Heat**: a hot water bag or heat pad on your lower tummy or back for 15–20 minutes — studies show it works about as well as mild painkillers.',
        '**Painkillers**: ibuprofen or mefenamic acid (e.g. Meftal) work best taken **with food at the very start** of the pain, at the dose on the label. Skip them if you have asthma, stomach ulcers, or kidney/liver problems; paracetamol is gentler, though usually a bit weaker.',
        '**Move gently**: a short walk, child’s pose, cat–cow or knees-to-chest stretches.',
        '**Warm drinks** like ginger or cinnamon tea, and a warm bath or shower.',
        '**Massage** your lower tummy in slow circles with a little oil.',
      ],
      why: 'Prostaglandins released by the womb lining make the muscle squeeze. Anti-inflammatory painkillers lower prostaglandins — that’s why taking them early works better.',
      doctor: 'See a gynaecologist if pain stops you from going to school or work, painkillers don’t help, pain is getting worse each cycle, or you also have pain during sex, when peeing or pooing — it may be endometriosis or another treatable cause.',
      actions: [LOG_PAIN, CARE],
    }),
    followUps: ['What should I eat during my period?', 'Which painkiller is safe for period pain?', 'Could my pain be endometriosis?'],
  },
  {
    id: 'painkillers',
    topic: 'menstruation',
    keywords: [
      [/\b(painkiller\w*|pain killer\w*|ibuprofen|brufen|combiflam|meftal\w*|mefenamic|paracetamol|crocin|dolo|naproxen|aspirin|tablet|medicine)\b/, 5],
      [/\b(safe|which|best|can i take|how many)\b/, 1],
    ],
    examples: ['which painkiller is safe for period pain', 'can i take meftal spas', 'is ibuprofen ok for cramps', 'best medicine for period pain'],
    reply: () => ({
      text: `For most people, **anti-inflammatory painkillers** work best for period pain: **ibuprofen** or **mefenamic acid** (sold in India as Meftal and similar). **Paracetamol** is gentler on the stomach but usually a bit less effective.`,
      steps: [
        'Take it **with food**, at the **dose printed on the pack**, starting when the pain or bleeding begins.',
        'Don’t take ibuprofen/mefenamic acid if you have asthma, stomach ulcers, kidney or liver problems, or are pregnant — ask a pharmacist or doctor instead.',
        'Don’t mix two anti-inflammatory painkillers together.',
        'Under 16? Never take aspirin, and ask a parent or doctor before any painkiller.',
      ],
      doctor: 'If you need painkillers every period and they still don’t help, see a gynaecologist — there are better treatments (including hormonal ones) and possible causes to check.',
      actions: [CARE],
    }),
    followUps: ['How can I reduce period cramps?', 'Could my pain be endometriosis?'],
  },
  {
    id: 'endometriosis',
    topic: 'menstruation',
    keywords: [
      [/\bendometrio\w*\b|\badenomyosis\b/, 7],
      [/\bpain (during|with|after) sex\b|\bpainful sex\b|\bpain (when|while) (peeing|pooing|urinating)\b/, 5],
    ],
    examples: ['could my pain be endometriosis', 'what is endometriosis', 'pain during sex and bad periods'],
    reply: () => ({
      text: `**Endometriosis** is when tissue similar to the womb lining grows outside the womb (on the ovaries, tubes or bowel). It affects about 1 in 10 women and is often missed for years because people are told "period pain is normal".`,
      steps: [
        'Common signs: period pain that stops your daily life, pain that painkillers don’t fix, pelvic pain at other times, pain during or after sex, pain when peeing or pooing during your period, trouble getting pregnant.',
        'Log your pain each cycle — where it is, how strong, what helped. It makes the doctor visit much more useful.',
      ],
      doctor: 'If this sounds like you, see a gynaecologist and say clearly: “My period pain affects my daily life and painkillers don’t help.” Treatments include hormonal medicines and, sometimes, keyhole surgery.',
      actions: [LOG_PAIN, CARE],
    }),
    followUps: ['When should I see a gynaecologist?', 'How can I reduce period cramps?'],
  },
  {
    id: 'back_leg_pain',
    topic: 'menstruation',
    keywords: [[/\b(back|lower back|kamar|thigh|leg|legs)\b.{0,20}\b(pain|ache|dard|hurts?)\b|\b(pain|ache)\b.{0,15}\b(back|legs?|thighs?)\b/, 5]],
    examples: ['why do i get back pain during periods', 'my legs ache on my period', 'kamar dard during periods'],
    reply: () => ({
      text: `Lower back and thigh aches during a period are common — the same prostaglandins that cause cramps also affect nearby nerves and muscles, so the pain "spreads".`,
      steps: [
        'Heat on the lower back for 15–20 minutes.',
        'Stretches: child’s pose, cat–cow, lying on your back hugging your knees, gentle twists.',
        'An anti-inflammatory painkiller with food at the start of the pain, if safe for you.',
        'Sleep on your side with a pillow between your knees.',
      ],
      doctor: 'See a doctor if back pain is severe, comes with fever, burning when peeing, or continues outside your period.',
    }),
    followUps: ['How can I reduce period cramps?', 'Which painkiller is safe for period pain?'],
  },
  {
    id: 'bloating',
    topic: 'menstruation',
    keywords: [[/\bbloat\w*\b|\bgas\w*\b|\bwater retention\b|\bpuffy\b|\bswollen (belly|stomach)\b/, 5]],
    examples: ['why do i feel bloated before my period', 'how to reduce period bloating', 'water retention before periods'],
    reply: (c) => ({
      text: `Bloating before and during a period is very common${c.phase === 'luteal' || c.phase === 'menstrual' ? ' — and you’re in that window now' : ''}. Hormone shifts make the body hold on to more water and slow digestion a little. It usually eases once your period starts.`,
      steps: [
        'Drink more water (it actually reduces water retention).',
        'Go easy on salty snacks, chips and packaged food for a few days.',
        'Eat potassium-rich foods: banana, coconut water, curd, sweet potato.',
        'A short walk after meals and warm ajwain/jeera/saunf water can ease gas.',
      ],
      doctor: 'See a doctor if bloating lasts most days for 3 weeks or more, or comes with weight loss, feeling full quickly or pain.',
    }),
    followUps: ['What helps with PMS?', 'What should I eat during my period?'],
  },
  {
    id: 'headache',
    topic: 'menstruation',
    keywords: [[/\bheadache\w*\b|\bmigraine\w*\b|\bsir dard\b|\bhead (pain|hurts)\b/, 5]],
    examples: ['i get headaches before my period', 'period migraine', 'sir dard during periods'],
    reply: () => ({
      text: `Headaches and migraines often come just before or during a period, when **oestrogen drops**.`,
      steps: [
        'Drink water regularly and don’t skip meals.',
        'Keep sleep steady — same bed and wake time.',
        'Rest in a dark, quiet room; a cold pack on the forehead or neck can help.',
        'A simple painkiller early on (at the label dose) helps more than waiting.',
        'Note in SheSync when headaches happen — a pattern helps the doctor.',
      ],
      doctor: 'See a doctor if headaches are new and severe, come with vision changes, weakness, numbness or confusion (urgent), or you need painkillers on more than about 10 days a month.',
    }),
    followUps: ['What helps with PMS?', 'I can’t sleep before my period'],
  },
  {
    id: 'digestion',
    topic: 'menstruation',
    keywords: [[/\b(nause\w*|vomit\w*|throw(ing)? up|diarr\w*|loose motion\w*|constipat\w*|poop\w*|ulti)\b/, 5]],
    examples: ['i feel nauseous during my period', 'loose motions during periods', 'constipation before periods'],
    reply: () => ({
      text: `Upset stomach, loose motions or nausea around a period are common — prostaglandins don't just affect the womb, they also speed up the gut. Some people get constipated before a period instead, from progesterone slowing digestion.`,
      steps: [
        'Small, plain meals: khichdi, curd rice, banana, toast.',
        'Sip water, ORS or coconut water if you have loose motions.',
        'Ginger tea can settle nausea.',
        'An anti-inflammatory painkiller at the start of your period can reduce both cramps and loose motions (if safe for you).',
      ],
      doctor: 'See a doctor if you can’t keep fluids down, have blood in your stool, severe pain, fever, or symptoms continue after your period.',
    }),
    followUps: ['How can I reduce period cramps?', 'What should I eat during my period?'],
  },
  {
    id: 'breast_pain',
    topic: 'menstruation',
    keywords: [
      [/\b(breast|breasts|boob\w*|chest)\b.{0,20}\b(pain|tender\w*|sore|swollen|heavy|hurt\w*)\b|\btender breasts?\b/, 5],
      [/\b(sore|tender|painful|swollen|heavy)\b.{0,10}\b(breasts?|boobs?)\b/, 5],
    ],
    examples: ['my breasts hurt before my period', 'breast tenderness before periods', 'sore boobs before period'],
    reply: () => ({
      text: `Tender, swollen or heavy breasts in the week or so before a period are very common — progesterone and oestrogen make breast tissue hold more fluid. It eases once the period starts.`,
      steps: ['Wear a soft, well-fitting, supportive bra (a sports bra at night can help).', 'Cut back on very salty food and caffeine for a few days.', 'Warm or cool compresses — whichever feels better.'],
      doctor: 'See a doctor for a new lump, nipple discharge (especially bloody), skin dimpling, or breast pain that doesn’t follow your cycle.',
    }),
    followUps: ['What helps with PMS?'],
  },
  {
    id: 'fatigue',
    topic: 'body',
    keywords: [
      [/\b(tired|exhaust\w*|fatigue\w*|weak|weakness|no energy|low energy|drained|thakan|kamzori|sleepy all day)\b/, 4],
      [/\b(dizzy|dizziness|lightheaded|light-headed|chakkar)\b/, 4],
      [/\b(anaemi\w*|anemi\w*|low iron|haemoglobin|hemoglobin|hb)\b/, 5],
    ],
    examples: ['why do i feel so tired during my period', 'i feel weak and dizzy on my period', 'am i anaemic', 'low iron symptoms'],
    reply: (c) => ({
      text: `Feeling drained around your period is common${hi(c)} — hormones dip, sleep can be worse, and you're losing iron. But tiredness that's **constant** can mean **low iron (anaemia)**, which is very common in Indian women, especially with heavy periods.`,
      steps: [
        'Eat iron-rich food daily: dal, rajma, chana, soybean, spinach/methi, jaggery, dates, eggs, fish or meat.',
        'Add vitamin C (lemon, amla, guava, orange) to the same meal; avoid tea/coffee within an hour of meals — it blocks iron.',
        'Prioritise sleep and drink enough water.',
      ],
      why: 'Each period loses some iron. If more goes out than comes in through food, haemoglobin falls and you feel tired, breathless, dizzy or cold.',
      doctor: 'Ask a doctor for a haemoglobin and ferritin test if you feel tired all the time, breathless, dizzy, have pale skin, or your periods are heavy. Don’t start iron tablets without a test.',
      actions: [CARE],
    }),
    followUps: ['What should I eat during my period?', 'How do I know if my bleeding is too heavy?'],
  },
  {
    id: 'period_food',
    topic: 'body',
    keywords: [
      [/\b(what|which|best|good)\b.{0,15}\b(eat|food|foods|drink|diet)\b|\b(eat|food|foods|diet)\b.{0,20}\b(period|periods|cramps|menstrua\w*)\b/, 5],
      [/\biron (rich )?foods?\b/, 3],
    ],
    examples: ['what should i eat during my period', 'foods that reduce cramps', 'best diet during periods', 'what foods help period pain'],
    reply: () => ({
      text: `There's no magic food, but these really help during your period:`,
      steps: [
        '**Iron**: dal, rajma, chana, spinach, methi, jaggery, dates, eggs, fish or chicken — with lemon or amla for vitamin C.',
        '**Anti-inflammatory**: fish, walnuts, flaxseeds (alsi), turmeric milk, ginger tea — may ease cramps.',
        '**Magnesium & potassium**: banana, curd, nuts, seeds, dark chocolate (a small piece!).',
        '**Water**: 8+ glasses; it reduces bloating and headaches.',
        'Go easier on very salty/packaged food, lots of sugar and too much caffeine — they can worsen bloating and mood swings.',
      ],
    }),
    followUps: ['How can I reduce period cramps?', 'Why do I crave sugar before my period?', 'Why do I feel so tired during my period?'],
  },
  {
    id: 'cravings',
    topic: 'body',
    keywords: [[/\bcrav\w*\b|\bsugar\b|\bchocolate\b|\bsweet tooth\b|\bjunk food\b|\balways hungry\b|\bhungry\b/, 4]],
    examples: ['why do i crave sugar before my period', 'i want to eat chocolate all the time before periods', 'i am always hungry before my period'],
    reply: () => ({
      text: `Cravings before a period are real, not a lack of willpower 💜 Your body uses a bit more energy in the luteal phase (around 100–300 extra calories a day), and falling hormones affect serotonin, which can make sweets extra tempting.`,
      steps: [
        'Eat regular meals with protein — long gaps make cravings stronger.',
        'Satisfy it smartly: dark chocolate, fruit with peanut butter, roasted chana, dates with nuts.',
        'It’s okay to enjoy the treat — no guilt needed. Balance over the week matters more than one day.',
      ],
    }),
    followUps: ['What should I eat during my period?', 'What helps with PMS?'],
  },
  {
    id: 'exercise_period',
    topic: 'body',
    keywords: [
      [/\b(exercise|workout|gym|yoga|run|running|sports?|work ?out)\b.{0,25}\b(period|periods|menstrua\w*|cycle)\b|\b(period|periods)\b.{0,25}\b(exercise|workout|gym|yoga)\b/, 6],
    ],
    examples: ['can i exercise during my period', 'is yoga good during periods', 'should i go to the gym on my period', 'best workout for my cycle'],
    reply: (c) => ({
      text: `Yes — you can exercise during your period, and gentle movement often **reduces** cramps and lifts mood. Listen to your body: some days a walk or yoga is perfect; other days you'll feel strong enough for your normal workout.${c.hasCycleData ? `\n\n${phaseLine(c)} SheSync’s Fitness tab picks today’s workout for your phase.` : ''}`,
      steps: [
        'Period days: walking, yoga, stretching, light strength — go harder if you feel good.',
        'After your period: energy rises, a great time for harder training.',
        'Before your period: keep moving, but it’s fine to lower intensity if you feel drained.',
        'Wear a cup, tampon or period underwear for sport, and stay hydrated.',
      ],
      doctor: 'Stop and rest if you feel dizzy or faint. Missing periods because of a lot of exercise and too little food is a reason to see a doctor.',
      actions: [FITNESS],
    }),
    followUps: ['What phase am I in right now?', 'How can I reduce period cramps?'],
  },
  {
    id: 'sleep',
    topic: 'body',
    keywords: [[/\b(can'?t sleep|cannot sleep|insomnia|sleepless|neend nahi|trouble sleeping|wake up at night|sleep problem\w*|not sleeping)\b/, 6], [/\bsleep\b/, 2]],
    examples: ['i can’t sleep before my period', 'how can i sleep better', 'insomnia during periods', 'neend nahi aati'],
    reply: () => ({
      text: `Sleep often gets worse in the days before a period — body temperature rises after ovulation and falling progesterone (which is a bit calming) can make sleep lighter.`,
      steps: [
        'Keep the same wake-up time every day, even on weekends.',
        'Keep your room cool, dark and quiet; a lighter blanket helps with the warmer pre-period body.',
        'No screens for 30 minutes before bed; try slow breathing (in 4, out 6) in bed.',
        'Cut caffeine after 2 PM; a warm glass of milk or chamomile tea can help.',
        'If cramps wake you, use heat and take a painkiller before bed (if safe for you).',
      ],
      doctor: 'See a doctor if poor sleep lasts weeks and affects your day, or if you also feel low most days.',
      actions: [BREATHE],
    }),
    followUps: ['Help me calm down with a breathing exercise', 'What helps with PMS?'],
  },
  {
    id: 'acne',
    topic: 'body',
    keywords: [[/\b(acne|pimple\w*|breakout\w*|zits?|spots on (my )?face|oily skin)\b/, 5]],
    examples: ['why do i get pimples before my period', 'hormonal acne on my chin', 'how to stop period acne'],
    reply: () => ({
      text: `Breakouts before a period are common — androgens (hormones all women have) affect the skin more when oestrogen dips, making it oilier.`,
      steps: [
        'Wash your face twice a day with a gentle cleanser; don’t scrub hard.',
        'Look for salicylic acid or benzoyl peroxide products (start slowly — they can dry the skin).',
        'Use non-comedogenic (won’t block pores) moisturiser and sunscreen.',
        'Don’t pick or squeeze — it causes marks.',
      ],
      doctor: 'See a dermatologist or gynaecologist if acne is severe, leaves scars, or comes with irregular periods or extra facial hair — it could be PCOS, and good treatments exist.',
      actions: [CARE],
    }),
    followUps: ['What is PCOS?', 'How can I reduce facial hair and acne?'],
  },
  {
    id: 'hair',
    topic: 'body',
    keywords: [
      [/\b(facial hair|chin hair|unwanted hair|hirsutism|hair on (my )?(face|chin|chest|stomach)|hair fall|hair loss|hair thinning|bald\w*)\b/, 6],
      [/\bhair\b.{0,15}\b(fall\w*|loss|thin\w*|break\w*|grow\w*)\b/, 6],
    ],
    examples: ['how can i reduce facial hair and acne', 'why do i have hair on my chin', 'hair fall and irregular periods'],
    reply: () => ({
      text: `Extra hair on the face, chest or tummy (hirsutism), or thinning hair on the scalp, can be linked to **higher androgens** — often from PCOS. Some hair growth is also just genetic. Hair fall can also come from low iron, thyroid problems or stress.`,
      steps: [
        'Threading, waxing, shaving or creams are safe ways to remove hair — shaving does not make it grow back thicker.',
        'For hair fall: eat enough protein and iron, and be gentle with hair (no tight styles or harsh heat).',
        'Laser hair reduction or prescription treatments help longer-term.',
      ],
      doctor: 'See a gynaecologist or dermatologist, especially with irregular periods or acne — hormone, thyroid and iron tests can find the cause, and treatment (including for PCOS) helps.',
      actions: [CARE],
    }),
    followUps: ['What is PCOS?', 'Can thyroid problems affect periods?'],
  },
  {
    id: 'weight',
    topic: 'body',
    keywords: [[/\b(weight gain|gain(ed|ing)? weight|lose weight|weight loss|losing weight|i'?m (fat|overweight)|weight)\b/, 4]],
    examples: ['why do i gain weight before my period', 'how can i lose weight', 'my weight keeps changing during my cycle'],
    reply: () => ({
      text: `Gaining up to 1–2 kg in the days before a period is usually **water retention**, not fat — it goes away after your period starts. So weigh yourself at the same point in your cycle each month if you're tracking weight.\n\nFor real, lasting change, small habits beat crash diets.`,
      steps: [
        'Protein and vegetables at every meal; fewer sugary drinks.',
        'Walk daily and add 2 strength sessions a week.',
        'Sleep 7–9 hours — poor sleep increases hunger hormones.',
        'Aim for slow change (about 0.25–0.5 kg a week). Very low-calorie diets can stop your periods.',
      ],
      doctor: 'See a doctor if weight changes a lot without trying, or comes with irregular periods, extra hair growth or tiredness (PCOS or thyroid).',
      actions: [FITNESS],
    }),
    followUps: ['What should I eat if I have PCOS?', 'Can I exercise during my period?'],
  },
  {
    id: 'discharge',
    topic: 'body',
    keywords: [
      [/\bdischarge\b|\bsafed pani\b|\bleucorrh\w*\b|\bwhite (fluid|liquid|stuff)\b/, 5],
      [/\b(itch\w*|smell\w*|odou?r|burning)\b.{0,20}\b(vagina\w*|down there|private part\w*)\b|\bvaginal (itch\w*|smell|odou?r)\b/, 5],
      [/\byeast infection\b|\bthrush\b|\bfungal infection\b|\bbv\b/, 5],
    ],
    examples: ['is white discharge normal', 'smelly discharge', 'itching down there', 'safed pani problem'],
    reply: () => ({
      text: `**White or clear discharge is normal and healthy** — it keeps the vagina clean. It changes through your cycle: thicker and creamy after your period, clear and stretchy (like egg white) around ovulation, then thicker again.`,
      steps: [
        'Wash the outside only with plain water (or mild unscented soap on the outer area). No douching or intimate washes inside — they upset the natural balance.',
        'Wear cotton underwear and change out of wet or sweaty clothes quickly.',
        'Wipe front to back.',
      ],
      doctor: 'See a doctor if discharge is **thick and cottage-cheese-like with itching** (often a yeast infection), **grey/green or fishy-smelling**, **yellow-green with pain or fever**, or bloody when it’s not your period. These are common and easy to treat.',
      actions: [CARE],
    }),
    followUps: ['Pads, tampons or a menstrual cup — which is best?', 'It burns when I pee'],
  },
  {
    id: 'uti',
    topic: 'body',
    keywords: [[/\b(burn\w*|pain\w*|sting\w*)\b.{0,20}\b(pee\w*|urin\w*|toilet|wee)\b|\buti\b|\burine infection\b|\bpee (a lot|often|frequently)\b|\bpeshab\b/, 6]],
    examples: ['it burns when i pee', 'do i have a uti', 'urine infection symptoms'],
    reply: () => ({
      text: `Burning or stinging when you pee, needing to go often, or cloudy/smelly urine are classic signs of a **urinary infection (UTI)**. They're very common in women.`,
      steps: ['Drink plenty of water.', 'Don’t hold your urine; pee after sex.', 'Wipe front to back.'],
      doctor: 'See a doctor soon — UTIs usually need antibiotics. Go **today** if you have fever, back/side pain, vomiting, or blood in your urine, or if you might be pregnant.',
      actions: [CARE],
    }),
    followUps: ['Is white discharge normal?'],
  },
  {
    id: 'hygiene',
    topic: 'body',
    keywords: [
      [/\b(pad|pads|sanitary|napkin|tampon\w*|menstrual cup|cup|period underwear|period panties)\b/, 4],
      [/\bhow (often|long)\b.{0,20}\b(change|wear|leave)\b/, 3],
      [/\b(rash|rashes|chafing)\b/, 3],
      [/\bhygiene\b/, 3],
      [/\b(best|which|good|right)\b.{0,15}\b(pad|pads|tampons?|cup|napkin)\b/, 5],
    ],
    examples: [
      'pads, tampons or a menstrual cup — which is best',
      'how often should i change my pad',
      'how to use a menstrual cup',
      'rash from pads',
      'period hygiene tips',
    ],
    reply: () => ({
      text: `All three are safe — pick what feels right for you:\n\n• **Pads**: easiest to start with. Change every **4–6 hours** (sooner if full).\n• **Tampons**: good for sport and swimming. Change every **4–8 hours**; never leave one in longer than 8 hours; use the lowest absorbency you need.\n• **Menstrual cup**: reusable, eco-friendly, holds more. Empty every **8–12 hours**, rinse, and boil it between periods.`,
      steps: [
        'Wash hands before and after changing.',
        'Pad rash? Change more often, try cotton/cloth pads, keep the area dry, and apply a plain barrier cream.',
        'Wrap used pads in paper before throwing them away.',
        'Cloth pads are fine if washed well with soap and dried fully in sunlight.',
      ],
      doctor: 'Remove a tampon or cup and get help today if you have a sudden high fever, rash, vomiting or dizziness while using one.',
    }),
    followUps: ['First period — what do I need to know?', 'Can I wash my hair or bathe during my period?'],
  },
  {
    id: 'myths',
    topic: 'body',
    keywords: [
      [/\b(wash (my )?hair|bath\w*|shower|head bath)\b.{0,25}\b(period|periods)\b|\b(period|periods)\b.{0,25}\b(wash (my )?hair|bath\w*|shower|head bath)\b/, 6],
      [/\b(myth\w*|pickle|achaar|temple|kitchen|touch|impure|unclean|sour food|curd)\b.{0,30}\b(period|periods)\b|\b(period|periods)\b.{0,30}\b(pickle|achaar|temple|kitchen|impure|unclean|sour)\b/, 5],
    ],
    examples: ['can i wash my hair or bathe during my period', 'can i eat curd during periods', 'is it true i cannot touch pickle on periods', 'period myths'],
    reply: () => ({
      text: `Good question 🌸 Let's clear up some common myths:\n\n• **Bathing and washing your hair** during a period is completely safe — a warm bath can even ease cramps.\n• **Curd, sour or cold foods** don't harm your flow or cause cramps.\n• Touching **pickle** won't spoil it — periods are not "impure".\n• You can **exercise, swim (with a tampon or cup), study and go out** as usual.\n\nA period is a normal body process. You deserve comfort, not restrictions.`,
    }),
    followUps: ['What should I eat during my period?', 'Can I exercise during my period?'],
  },
];

// ============================================================
// MIND, MOOD, FOCUS
// ============================================================
const MIND: Intent[] = [
  {
    id: 'pms',
    topic: 'emotional',
    keywords: [
      [/\bpms\b|\bpmdd\b|\bpre ?menstrual\b/, 6],
      [/\bmood swing\w*\b/, 5],
      [/\bbefore (my|the) period\b/, 2],
      [/\b(cry|crying|tearful|emotional|irritable|sad)\b.{0,30}\bbefore (my|the|a) period\b/, 4],
    ],
    examples: [
      'what helps with pms',
      'i get mood swings and cry easily before my period',
      'do i have pmdd',
      'why am i so emotional before my period',
    ],
    reply: (c) => ({
      text: `You're not "too sensitive"${hi(c)} 💜 Mood swings, tearfulness, irritability, bloating and tender breasts in the 1–2 weeks before a period are **PMS**, and they're real. When the low mood, anxiety or anger is **severe enough to affect relationships, studies or work**, doctors call it **PMDD** — and it's treatable.${c.phase === 'luteal' ? `\n\n${phaseLine(c)}` : ''}`,
      why: 'Some people’s brains are more sensitive to the normal rise and fall of oestrogen and progesterone, which affects serotonin — a mood chemical.',
      steps: [
        'Track your mood daily for 2 cycles — if symptoms reliably start before and ease after your period starts, that confirms the pattern.',
        'Regular meals, less caffeine/sugar/salt, and daily movement (even a 20-minute walk) help many people.',
        'Plan lighter days before your period when you can, and tell people close to you.',
        'Use the “hormonal weather” rule: delay big decisions or harsh judgements about yourself for a few days.',
      ],
      doctor: 'If symptoms are severe — or you feel hopeless or have thoughts of self-harm — talk to a gynaecologist or counsellor. Treatments include therapy (CBT), certain antidepressants and hormonal options.',
      affirmation: 'These feelings are a wave, not my whole self. I can be gentle with myself until it passes.',
      actions: [CARE],
    }),
    followUps: ['Help me reframe a negative thought', 'I want to talk to a counsellor', 'I feel angry and irritable all the time'],
  },
  {
    id: 'anxiety',
    topic: 'emotional',
    keywords: [
      [/\b(anxious|anxiety|panic\w*|nervous|overthink\w*|worried|worrying|ghabrahat|restless|heart (is )?racing)\b/, 5],
    ],
    examples: ['i feel anxious all the time', 'i am having a panic attack', 'i overthink everything', 'ghabrahat ho rahi hai'],
    reply: (c) => {
      const panic = /panic|racing|can'?t breathe/.test(c.text);
      return {
        text: panic
          ? `I'm right here with you${hi(c)}. A panic attack feels scary, but **it will pass** — usually within minutes — and it can't hurt you. Let's slow your breathing together.`
          : `Anxiety is exhausting${hi(c)}, and you're not alone in it. Racing thoughts and a tight chest are your body's alarm system being a little too protective. Let's calm the body first — the mind follows.`,
        steps: [
          '**Breathe out longer than in**: in through your nose for 4, out slowly for 6–8. Repeat 6 times.',
          '**5-4-3-2-1 grounding**: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
          'Put your feet flat on the floor and press them down; notice the support under you.',
          'Write the worry down, then ask: “What’s one small thing I can do about it today?”',
        ],
        why: 'A long exhale activates the vagus nerve, which slows the heart and tells the brain you are safe.',
        doctor: 'If anxiety is most days, stops you doing things, or you get frequent panic attacks, talking to a counsellor really helps — Tele-MANAS (14416) is free and 24×7.',
        affirmation: 'I am safe in this moment. This feeling will pass.',
        actions: [BREATHE, CALL_TELEMANAS],
      };
    },
    followUps: ['Walk me through a quick grounding exercise', 'Help me reframe a negative thought', 'I want to talk to a counsellor'],
  },
  {
    id: 'low_mood',
    topic: 'emotional',
    keywords: [
      [/\b(sad|depress\w*|down|low|hopeless|empty|numb|crying|cry a lot|udaas|dukhi|feel nothing|worthless)\b/, 4],
      [/\bfeel(ing)? (so )?(bad|terrible|awful)\b/, 3],
    ],
    examples: ['i feel low and unmotivated', 'i feel sad all the time', 'i think i am depressed', 'i keep crying', 'i feel empty'],
    reply: (c) => ({
      text: `I'm really sorry you're feeling this way${hi(c)}. Thank you for telling me — that takes strength. 💜${c.recentMood !== null && c.recentMood <= 2 ? '\n\nI can see you logged a low mood recently too.' : ''}\n\nLow days happen, and before a period they can hit harder. But if you've felt down or hopeless on **most days for 2 weeks or more**, that's a sign to talk to someone — not a weakness.`,
      steps: [
        'Do one tiny kind thing for your body: a glass of water, a shower, 5 minutes of sunlight.',
        'Message one person you trust: “Having a hard day, can we talk?”',
        'Move a little — a 10-minute walk can lift mood more than you’d expect.',
        'Write down 3 things that went okay today, however small.',
      ],
      doctor: 'Please talk to a counsellor if this has lasted 2 weeks or more. Tele-MANAS (14416) is free, private and 24×7. If you ever think about hurting yourself, call 14416 or 112 right away.',
      affirmation: 'I don’t have to feel better all at once. One small step is enough today.',
      actions: [CALL_TELEMANAS, CARE],
    }),
    followUps: ['I want to talk to a counsellor', 'Help me reframe a negative thought', 'What helps with PMS?'],
  },
  {
    id: 'stress',
    topic: 'emotional',
    keywords: [[/\b(stress\w*|overwhelm\w*|too much (work|pressure)|pressure|burn ?out|burnt out|tension)\b/, 5]],
    examples: ['i am so stressed', 'i feel overwhelmed with everything', 'too much pressure at college', 'tension ho rahi hai'],
    reply: (c) => ({
      text: `That sounds like a lot to carry${hi(c)}. When everything feels urgent, the brain treats it all as a threat. Let's shrink it down to something manageable.`,
      steps: [
        '**Brain dump**: write every task and worry on paper — get it out of your head.',
        'Circle **one** thing that matters most today. Do just that first.',
        'Work in short blocks (25 min) with real breaks.',
        'Take 6 slow breaths (in 4, out 6) before you start.',
        'Say no or "later" to one thing this week.',
      ],
      why: 'Stress hormones make it harder to think clearly; small concrete steps calm that response and rebuild a sense of control.',
      doctor: 'If stress is affecting your sleep, eating or mood for weeks, talking to a counsellor helps — iCALL and Tele-MANAS are free.',
      affirmation: 'I can only do one thing at a time — and that is enough.',
      actions: [BREATHE, CARE],
    }),
    followUps: ['Help me plan a Minimum Viable Day', 'Help me calm down with a breathing exercise', 'I have exams and I’m panicking'],
  },
  {
    id: 'anger',
    topic: 'emotional',
    keywords: [[/\b(angry|anger|irritab\w*|irritated|snap\w*|rage|annoyed|gussa|frustrat\w*)\b/, 5]],
    examples: ['i feel angry and irritable all the time', 'i snap at everyone before my period', 'gussa bahut aata hai'],
    reply: (c) => ({
      text: `Feeling irritable or angry doesn't make you a bad person${hi(c)}. Before a period, many people have a shorter fuse — the hormone drop affects serotonin. You can feel it without letting it run the show.`,
      steps: [
        'When it rises: pause, breathe out slowly 3 times, and step away for 2 minutes.',
        'Name it: “I’m irritated, and my body is in its pre-period week.” Naming lowers the intensity.',
        'Move it out: a brisk walk, stairs, or shaking out your hands and shoulders.',
        'If you snapped, a short repair helps: “Sorry, I’m having a rough day — it wasn’t about you.”',
      ],
      doctor: 'If anger before periods is harming relationships or studies every month, talk to a doctor or counsellor about PMDD — it’s treatable.',
      affirmation: 'My feelings are valid, and I choose how I respond.',
    }),
    followUps: ['What helps with PMS?', 'How do I explain my period pain or mood to others?'],
  },
  {
    id: 'lonely',
    topic: 'emotional',
    keywords: [[/\b(lonely|alone|no friends|nobody (cares|understands|likes me)|no one (cares|understands)|left out|isolated|akela\w*)\b/, 5]],
    examples: ['i feel so lonely', 'nobody understands me', 'i have no friends'],
    reply: (c) => ({
      text: `Feeling lonely hurts${hi(c)}, and it's more common than people admit — especially after moving, in a new college, or when you're feeling low. It doesn't mean something is wrong with you.`,
      steps: [
        'Reach out to one person today, even with something small — a meme, a voice note, “thinking of you”.',
        'Join one regular thing: a club, a class, a sports or volunteering group. Seeing the same faces each week builds friendships.',
        'Be a little kinder to yourself — loneliness makes the inner voice harsher than the truth.',
      ],
      doctor: 'If loneliness comes with low mood most days, talking to a counsellor can help — it’s free and private.',
      affirmation: 'I am worthy of connection, and the right people will see me.',
      actions: [CARE],
    }),
    followUps: ['I want to talk to a counsellor', 'I feel low and unmotivated'],
  },
  {
    id: 'body_image',
    topic: 'emotional',
    keywords: [[/\b(i (look|feel) (fat|ugly)|hate my body|body image|i'?m ugly|i'?m fat|not pretty|insecure about my (body|looks|face))\b/, 6]],
    examples: ['i hate my body', 'i feel fat and ugly before my period', 'body image issues'],
    reply: (c) => ({
      text: `I'm sorry you're feeling this way about yourself${hi(c)}. Bodies naturally change through the month — bloating and water weight before a period are temporary, but they can make the mirror feel unkind.\n\nYour worth is not your weight or your skin.`,
      steps: [
        'Notice the critic, and answer it like you would a friend: “That’s harsh. My body is carrying me through a lot.”',
        'Unfollow accounts that make you feel worse; follow ones that show real bodies.',
        'Wear something comfortable today.',
        'Focus on what your body does — walks, hugs, dances, heals.',
      ],
      doctor: 'If thoughts about food, weight or your body take over your day, or you are restricting food, bingeing or making yourself sick, please talk to a doctor or counsellor — support really helps.',
      affirmation: 'My body is not a problem to be fixed. It is my home.',
      actions: [CARE],
    }),
    followUps: ['Help me reframe a negative thought', 'I want to talk to a counsellor'],
  },
  {
    id: 'guilt',
    topic: 'motivation',
    keywords: [[/\b(guilt\w*|lazy|useless|not good enough|failure|i'?m a failure|behind on everything|disappoint\w*)\b/, 5]],
    examples: ['i feel guilty for being lazy', 'i feel useless', 'i am behind on everything', 'how do i stop feeling guilty about low productivity'],
    reply: (c) => ({
      text: `That voice calling you "lazy" or "useless" isn't telling the truth${hi(c)}. Energy and focus genuinely dip on some days — especially around a period, after poor sleep, or when you're stressed. Rest isn't failing.`,
      steps: [
        'Swap “I should have done more” for “I did what I could with the energy I had.”',
        'Pick **one** small task and finish it — completion beats perfection.',
        'Plan bigger tasks for higher-energy days (often the week after your period).',
      ],
      affirmation: 'My worth is not measured by my productivity.',
    }),
    followUps: ['Help me plan a Minimum Viable Day', 'Help me reframe a negative thought'],
  },
  {
    id: 'motivation',
    topic: 'motivation',
    keywords: [
      [/\b(no|zero|lost|lack of|low)\b.{0,10}\bmotivat\w*\b|\bunmotivated\b|\bdemotivated\b/, 6],
      [/\bcan'?t get (out of bed|up|started)\b|\bdon'?t feel like doing anything\b|\bmann nahi\b|\bprocrastinat\w*\b/, 5],
      [/\bmotivat\w*\b/, 3],
    ],
    examples: ['i have zero motivation today', 'why have i lost all motivation lately', 'i can’t get out of bed', 'i keep procrastinating'],
    reply: (c) => ({
      text: `Some days the tank really is lower${hi(c)} — and that's biology, not a character flaw.${c.phase === 'menstrual' || c.phase === 'luteal' ? ` ${phaseLine(c)} Lower drive is common now.` : ''} Waiting to "feel motivated" rarely works; **action comes first, motivation follows.**`,
      steps: [
        '**2-minute start**: pick the smallest version of the task (open the book, write one line) and do only that.',
        '**Make it cosy**: blanket, tea, music — pair the task with comfort.',
        'Get 5 minutes of daylight and some water — both nudge energy up.',
        'Tick off one thing, then decide if you want to continue. Often you will.',
      ],
      doctor: 'If you have lost interest in almost everything for 2 weeks or more, it could be low mood or depression — talking to a counsellor helps.',
      affirmation: 'Small steps still move me forward.',
      actions: [STUDY],
    }),
    followUps: ['Help me plan a Minimum Viable Day', 'I can’t focus on studying', 'Why do I feel so tired during my period?'],
  },
  {
    id: 'mvd',
    topic: 'motivation',
    keywords: [[/\bminimum viable day\b|\bplan (my|a) (day|today)\b|\bplan (for )?today\b/, 6]],
    examples: ['help me plan a minimum viable day', 'plan my day', 'help me plan today'],
    reply: () => ({
      text: `A **Minimum Viable Day** is the smallest version of today that still counts as a win. On low-energy days, aim for this — anything extra is a bonus.`,
      steps: [
        '**1 must-do**: the one task that truly matters today (e.g. submit the assignment, revise one chapter).',
        '**1 body thing**: eat a proper meal, shower, or take a 10-minute walk.',
        '**1 kind thing**: message a friend, watch something you love, or rest guilt-free.',
        'Cross out or postpone everything else — on purpose, not by accident.',
      ],
      affirmation: 'Done gently is better than not done at all.',
      actions: [STUDY],
    }),
    followUps: ['I can’t focus on studying', 'I feel guilty for being lazy'],
  },
  {
    id: 'focus',
    topic: 'focus',
    keywords: [
      [/\b(can'?t|cannot|unable to|hard to|difficult to)\b.{0,10}\b(focus|concentrate|study|remember)\b/, 6],
      [/\bbrain ?fog\w*\b|\bfoggy\b|\bdistract\w*\b|\bconcentrat\w*\b|\bpadhai\b|\bforget\w*\b/, 5],
      [/\bfocus\w*\b/, 3],
      [/\bstudy\w*\b/, 1],
    ],
    examples: ['i can’t focus on studying', 'help me focus through severe brain fog', 'i keep getting distracted', 'padhai mein mann nahi lagta'],
    reply: (c) => ({
      text: `Brain fog is real${hi(c)} — many people notice slower thinking and worse focus just before or during a period, especially with poor sleep or pain.${c.hasCycleData ? ` ${phaseLine(c)}` : ''} Let's work *with* your energy instead of fighting it.`,
      steps: [
        '**Short sprints**: 15–25 minutes on one small task, then a 5-minute break (SheSync’s Study timer suggests the right length for today).',
        '**Phone away** — in another room or in focus mode.',
        '**Write the 3 must-dos** on paper so your brain doesn’t have to hold them.',
        'Drink water, eat something with protein, and step into daylight between sessions.',
        'Save hard new topics for higher-energy days; do revision or easy tasks on foggy days.',
      ],
      doctor: 'If focus problems are constant (not just some days), or you are always exhausted, see a doctor — low iron, thyroid or sleep problems are common and treatable.',
      affirmation: 'My focus comes in waves. I can work with my energy, not against it.',
      actions: [STUDY],
    }),
    followUps: ['I have exams and I’m panicking', 'Help me plan a Minimum Viable Day', 'Why do I feel so tired during my period?'],
  },
  {
    id: 'exam',
    topic: 'focus',
    keywords: [
      [/\bexam\w*\b|\btest tomorrow\b|\bboards?\b|\bjee\b|\bneet\b|\bcuet\b|\bviva\b|\bpresentation\b|\binterview\b/, 5],
      [/\b(anxi\w*|nervous|panic\w*|scared|stress\w*)\b.{0,30}\b(exam\w*|test|boards?|viva|interview)\b|\b(exam\w*|boards?|viva|interview)\b.{0,30}\b(anxi\w*|nervous|panic\w*|scared)\b/, 4],
    ],
    examples: ['i have exams and i’m panicking', 'my period started on exam day', 'exam stress', 'how do i study before exams on my period'],
    reply: (c) => ({
      text: `Exams plus a period (or just exam nerves) is a lot${hi(c)}. You've prepared more than your panic is telling you. Let's make today manageable.`,
      steps: [
        '**Tonight**: revise key points only, then sleep — sleep fixes memories better than late-night cramming.',
        '**Period kit**: painkiller (with food, if safe for you) at the first sign of cramps, a spare pad, water bottle, a snack.',
        '**In the hall**: breathe out slowly 3 times before you start; do the questions you know first.',
        'If cramps start during the exam, it’s okay to tell the invigilator.',
        'One bad paper does not define you.',
      ],
      affirmation: 'I am prepared, I am capable, and I will do my best — that is enough.',
      actions: [STUDY, BREATHE],
    }),
    followUps: ['Which painkiller is safe for period pain?', 'Help me calm down with a breathing exercise', 'I can’t focus on studying'],
  },
  {
    id: 'relationship',
    topic: 'emotional',
    keywords: [
      [/\b(boyfriend|girlfriend|partner|husband|breakup|broke up|break up|crush|parents|mom|mother|dad|father|family|friend)\b.{0,40}\b(fight\w*|argu\w*|hurt\w*|left|ignor\w*|understand|problem\w*|issue\w*)\b/, 5],
      [/\b(broke up|breakup|break up|divorce\w*|cheated|heartbreak\w*|heart ?broken)\b/, 6],
    ],
    examples: ['i had a fight with my boyfriend', 'my parents don’t understand me', 'i just went through a breakup', 'my friend is ignoring me'],
    reply: (c) => ({
      text: `That sounds really painful${hi(c)}. Relationships — with partners, parents or friends — affect us deeply, and conflict can feel even bigger when you're tired or before a period.`,
      steps: [
        'Give yourself time to cool down before replying — big decisions can wait 24 hours.',
        'Use “I” statements: “I felt hurt when…” instead of “You always…”.',
        'Write what you want to say first; it helps you find the calm version.',
        'Lean on someone outside the situation — a friend, sibling or counsellor.',
      ],
      doctor: 'If you ever feel unsafe, controlled or threatened in a relationship, Women Helpline 181 (24×7) can help confidentially.',
      affirmation: 'I deserve relationships where I feel respected and safe.',
      actions: [CARE],
    }),
    followUps: ['I want to talk to a counsellor', 'How do I explain my period pain or mood to others?'],
  },
  {
    id: 'grounding',
    topic: 'emotional',
    keywords: [
      [/\b(calm (me )?down|grounding|breathing exercise|breathe with me|relax|help me breathe|calm my (mind|nervous system))\b/, 6],
    ],
    examples: [
      'help me calm down with a breathing exercise',
      'walk me through a quick grounding exercise',
      'guide me through a 2-minute relaxation',
      'help me calm my nervous system right now',
    ],
    reply: () => ({
      text: `Let's do this together. Get comfortable, drop your shoulders, and unclench your jaw. 🌿`,
      steps: [
        '**Breathe**: in through your nose for 4… hold for 4… out through your mouth for 6. Repeat 5 times.',
        '**Ground**: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.',
        '**Feel**: press your feet into the floor and notice the support under you.',
        '**Soothe**: place a hand on your chest or tummy and say, “I’m okay right now.”',
      ],
      why: 'Slow breathing with a longer exhale switches on the body’s “rest and digest” system, slowing your heart and calming racing thoughts.',
      affirmation: 'I am here, I am breathing, and I am safe in this moment.',
      actions: [BREATHE],
    }),
    followUps: ['I feel anxious all the time', 'Help me reframe a negative thought'],
  },
  {
    id: 'reframe',
    topic: 'emotional',
    keywords: [[/\breframe\b|\bnegative thought\w*\b|\bnegative self ?talk\b|\bkeep thinking\b|\bthoughts about myself\b|\bcbt\b/, 6]],
    examples: ['help me reframe a negative thought', 'i keep having negative thoughts about myself', 'negative self talk'],
    reply: () => ({
      text: `Let's try a simple CBT (cognitive behavioural therapy) exercise. Write your thought down, then walk it through these steps:`,
      steps: [
        '**Catch it**: what exactly is the thought? e.g. “I’m going to fail everything.”',
        '**Check it**: what’s the evidence for it — and against it? Would a friend agree?',
        '**Spot the trap**: all-or-nothing? Mind-reading? Predicting the worst?',
        '**Rewrite it** in a fairer way: “I’m behind in two subjects, and I can catch up on one this week.”',
        '**Next step**: one small action that fits the kinder thought.',
      ],
      affirmation: 'Thoughts are not facts. I can choose a kinder, truer one.',
    }),
    followUps: ['I feel low and unmotivated', 'I want to talk to a counsellor'],
  },
  {
    id: 'explain_others',
    topic: 'emotional',
    keywords: [
      [/\b(explain|tell|talk to|say to)\b.{0,30}\b(boss|manager|teacher|professor|partner|boyfriend|husband|parents|family|dad|team|friends?|others|people)\b/, 6],
      [/\bleave (for|because of) (my )?period\b|\bperiod leave\b/, 5],
    ],
    examples: ['how do i explain my period pain or mood to others', 'how do i tell my teacher i have cramps', 'how to explain low energy to my partner or team'],
    reply: () => ({
      text: `You don't owe anyone details — a short, confident message is enough. Some you can use:`,
      steps: [
        '**Teacher/professor**: “I’m unwell today with bad period pain. Could I sit near the door / submit this tomorrow?”',
        '**Boss/team**: “I’m dealing with a health issue today and will work at reduced capacity. I’ll prioritise X.”',
        '**Partner/family**: “Before my period I get low energy and can be irritable. It’s not about you — a bit of patience and a hot water bag would really help.”',
        '**Friends**: “Period day — I’m in for a quiet plan tonight!”',
      ],
      affirmation: 'Asking for what my body needs is strength, not weakness.',
    }),
    followUps: ['What helps with PMS?', 'How can I reduce period cramps?'],
  },
  {
    id: 'counsellor',
    topic: 'emotional',
    keywords: [[/\b(talk to (someone|a counsell?or|a therapist|a person)|counsell?or|therapist|therapy|psychologist|psychiatrist|need help|need someone)\b/, 6]],
    examples: ['i want to talk to a counsellor', 'can i talk to a real person', 'i need a therapist'],
    reply: () => ({
      text: `That's a brave and good step 💜 Here are free, confidential options in India:\n\n• **Tele-MANAS — 14416** (24×7, Government of India, 20+ languages)\n• **iCALL (TISS) — 9152987821** (Mon–Sat, 10 AM–8 PM, trained counsellors)\n• **Vandrevala Foundation — +91 9999 666 555** (24×7, call or WhatsApp)\n\nIt's okay to start with "I don't know where to begin." If you'd feel more comfortable, you can ask whether a woman counsellor is available.`,
      actions: [CALL_TELEMANAS, CARE],
    }),
    followUps: ['Walk me through a quick grounding exercise', 'Help me reframe a negative thought'],
  },
  {
    id: 'see_doctor',
    topic: 'disturbances',
    keywords: [
      [/\b(when|should)\b.{0,25}\b(see|visit|consult)\b.{0,15}\b(a |the )?(doctor|gyn\w*|gyne\w*|gynae\w*)\b/, 6],
      [/\b(gyn\w*|gynae\w*|gyne\w*|obgyn)\b/, 4],
      [/\b(find|book)\b.{0,15}\b(doctor|appointment)\b/, 4],
      [/\b(see|visit|consult|go to|meet|show)\b.{0,15}\b(a |the )?(doctor|gyn\w*|hospital)\b/, 5],
    ],
    examples: ['when should i see a gynaecologist', 'how do i find a gynecologist', 'what happens at a gyne visit', 'should i see a doctor about my periods'],
    reply: () => ({
      text: `See a gynaecologist if you have any of these:`,
      steps: [
        'Periods that soak a pad every 1–2 hours, last more than 7–8 days, or have big clots',
        'No period for 3 months (with a negative pregnancy test), or very irregular cycles',
        'Period pain that stops your daily life or doesn’t respond to painkillers',
        'Bleeding between periods or after sex',
        'Unusual discharge, itching or pelvic pain',
        'Signs like extra facial hair, bad acne, or weight change with irregular periods',
        '**Same day/emergency**: severe sudden pain, fainting, heavy bleeding with dizziness, or fever with pelvic pain',
      ],
      why: 'A first visit is mostly talking: your periods, symptoms and history. An internal exam is not always needed, and you can ask questions or say no to anything you’re not comfortable with.',
      doctor: 'Care Connect has eSanjeevani (free online government doctors) and a “find a gynaecologist near me” button. Take your SheSync report.',
      actions: [CARE],
    }),
    followUps: ['How do I know if my bleeding is too heavy?', 'Why are my periods irregular?'],
  },
];

export const INTENTS: Intent[] = [...SAFETY, ...GENERAL, ...CYCLE, ...BODY, ...MIND];

export const SAFETY_INTENTS = SAFETY;

/** Short labels for the "anything else?" chips shown when YourGoGirl is unsure. */
export const FALLBACK_SUGGESTIONS = [
  'How can I reduce period cramps?',
  'My period is late. What should I do?',
  'What is PCOS?',
  'I feel anxious all the time',
  'I can’t focus on studying',
  'Is white discharge normal?',
];
