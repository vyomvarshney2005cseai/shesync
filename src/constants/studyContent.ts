import type { CyclePhase } from '@/types';
import type { FocusPreset } from '@/store/useStudyStore';

export interface FocusForecast {
  id: string;
  emoji: string;
  mode: string;
  headline: string;
  why: string;
  preset: FocusPreset;
  doList: string[];
  avoid: string[];
}

const GENTLE: FocusForecast = {
  id: 'gentle',
  emoji: '🌸',
  mode: 'Gentle Focus',
  headline: 'Short, kind study blocks today',
  why: 'Cramps, heavy flow, poor sleep and fatigue make long sessions harder. Short blocks keep you moving without burning out.',
  preset: { focus: 15, rest: 5 },
  doList: [
    'Review notes, flashcards and formula sheets',
    'Watch a recorded lecture and make short notes',
    'Keep a heat pad and water within reach',
    'Stand up and stretch in every break',
  ],
  avoid: ['Starting a brand-new tough chapter late at night', 'Skipping meals — try dates, roasted chana or peanuts'],
};

export const FORECASTS: Record<string, FocusForecast> = {
  menstrual: GENTLE,
  follicular: {
    id: 'deep',
    emoji: '🚀',
    mode: 'Deep Learning',
    headline: 'A great day for new, hard topics',
    why: 'Many people feel more energetic once their period ends. Spend that energy on the subjects you usually put off.',
    preset: { focus: 45, rest: 10 },
    doList: [
      'Start with the toughest chapter',
      'Learn new concepts — derive or explain them yourself',
      'Plan the next two weeks of revision',
      'Try a full mock test',
    ],
    avoid: ['Using your best hours for easy re-reading'],
  },
  ovulatory: {
    id: 'collab',
    emoji: '🎤',
    mode: 'Speak Up & Collaborate',
    headline: 'Practise out loud, study with others',
    why: 'Around mid-cycle many feel more social and confident — a good time for anything that involves other people.',
    preset: { focus: 25, rest: 5 },
    doList: [
      'Group study, or teach a topic to a friend',
      'Practise presentations, vivas and interviews',
      'Clear your doubts with teachers or seniors',
      'Do timed previous-year papers',
    ],
    avoid: ['Over-committing to plans for the week before your period'],
  },
  luteal: {
    id: 'steady',
    emoji: '🧩',
    mode: 'Steady & Structured',
    headline: 'Checklists beat willpower this week',
    why: 'In the second half of the cycle energy can dip and focus can wobble. Structure and small wins help more than pushing harder.',
    preset: { focus: 25, rest: 5 },
    doList: [
      'Work from a checklist and tick off small wins',
      'Practice questions and previous-year papers',
      'Finish half-done assignments',
      'Protect your sleep — no caffeine after 2 pm',
    ],
    avoid: ['All-nighters', 'Comparing your speed with others'],
  },
  pms: {
    id: 'pms',
    emoji: '🫶',
    mode: 'Kind & Organised',
    headline: 'Your period is close — get ahead, gently',
    why: 'In the days before a period, mood and sleep can be more fragile. Prepare now so next week feels lighter.',
    preset: { focus: 25, rest: 5 },
    doList: [
      'Organise notes and make a “period-week” mini plan',
      'Revise lighter topics; save heavy ones for after',
      'Pack your period kit in your college bag',
      'Plan one relaxing thing each evening',
    ],
    avoid: ['Big decisions when you feel overwhelmed — sleep on them'],
  },
  irregular: {
    id: 'flex',
    emoji: '🧭',
    mode: 'Follow Your Energy',
    headline: 'Let today’s energy choose the task',
    why: 'With an irregular cycle, the calendar is less useful than how you feel right now. Match the task to your energy.',
    preset: { focus: 25, rest: 5 },
    doList: [
      'High energy → new or difficult topics',
      'Medium energy → practice questions',
      'Low energy → review, flashcards, planning',
      'Log your mood so SheSync learns your pattern',
    ],
    avoid: ['Waiting to “feel motivated” before starting'],
  },
};

export interface ForecastInput {
  phase: CyclePhase;
  daysUntilNextPeriod?: number;
  pain: number | null;
  flow: string;
  mood: number | null;
  energy: string | null;
  tags: string[];
  strainLevel: string;
}

/** Picks today's study mode from cycle phase and what the user logged. */
export function getFocusForecast(input: ForecastInput): { forecast: FocusForecast; reasons: string[] } {
  const reasons: string[] = [];
  if ((input.pain ?? 0) >= 6) reasons.push(`pain ${input.pain}/10`);
  if (input.flow === 'heavy' || input.flow === 'severe') reasons.push('heavy flow');
  if (input.tags.includes('Brain Fog')) reasons.push('brain fog');
  if (input.energy === 'low') reasons.push('low energy');
  if (input.mood != null && input.mood <= 2) reasons.push('low mood');
  if (input.strainLevel === 'high' || input.strainLevel === 'severe') reasons.push('high strain');

  if (reasons.length) return { forecast: GENTLE, reasons };

  let key: string = input.phase;
  if (input.phase === 'luteal' && input.daysUntilNextPeriod != null && input.daysUntilNextPeriod <= 6) key = 'pms';
  if (!FORECASTS[key]) key = 'irregular';
  return { forecast: FORECASTS[key], reasons };
}

// Written for SheSync.
export const AFFIRMATIONS = [
  'My worth is not measured by how productive I am today.',
  'Rest is part of the work. I can begin again after a break.',
  'I have got through hard weeks before. I can get through this one.',
  'Slow progress is still progress.',
  'My body is doing important work. I can be patient with it.',
  'I do not need to feel motivated to take one small step.',
  'I belong in this classroom, this lab and this field.',
  'One page, one question, one chapter — that is how big things get done.',
  'Asking for help is a skill, not a weakness.',
  'A bad study day is one day, not my whole story.',
];

export const PERIOD_KIT = [
  { id: 'heat', label: 'Heat pad or hot-water bottle ready' },
  { id: 'water', label: 'Water bottle filled' },
  { id: 'snack', label: 'Iron-rich snack (dates, chana, peanut chikki)' },
  { id: 'meds', label: 'Pain relief your doctor has okayed, if you use it' },
  { id: 'pads', label: 'Spare pads / cup / tampons in your bag' },
  { id: 'comfy', label: 'Comfy clothes and a cushion for long sitting' },
  { id: 'breaks', label: 'Breaks planned every 15–25 minutes' },
];

export const FOG_RESETS = [
  { emoji: '🚶‍♀️', text: 'Walk for 2 minutes or take the stairs' },
  { emoji: '🫁', text: 'Box breathing for 1 minute (Mind Games → Calm Breathing)' },
  { emoji: '💧', text: 'Drink a glass of water and splash your face' },
  { emoji: '🔀', text: 'Switch subject for one block' },
  { emoji: '📝', text: 'Write the very next tiny step on a sticky note' },
];

export const CONFIDENCE_LEVELS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Shaky' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Strong' },
];
