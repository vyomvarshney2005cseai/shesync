/**
 * Confidence Booster content. Written for SheSync. "Glow" here means feeling
 * good in your body and mind — never a beauty standard to meet.
 */
import { daysBetweenKeys } from '@/lib/dates';

export interface Affirmation {
  id: string;
  text: string;
}

export const AFFIRMATIONS: Affirmation[] = [
  { id: 'a1', text: 'I do not have to be perfect to be proud of myself.' },
  { id: 'a2', text: 'My voice matters, in class, at work and at home.' },
  { id: 'a3', text: 'I am allowed to take up space.' },
  { id: 'a4', text: 'My body carries me through every day. I can be kind to it.' },
  { id: 'a5', text: 'I learn something every time I try, even when it does not work out.' },
  { id: 'a6', text: 'I can be nervous and brave at the same time.' },
  { id: 'a7', text: 'Rest is part of my progress, not a break from it.' },
  { id: 'a8', text: 'Other people’s opinions are information, not my identity.' },
  { id: 'a9', text: 'I can say no without explaining myself.' },
  { id: 'a10', text: 'My worth is not measured in marks, likes or kilograms.' },
  { id: 'a11', text: 'I have handled hard days before. I can handle this one.' },
  { id: 'a12', text: 'I am becoming someone I am proud of, one small step at a time.' },
  { id: 'a13', text: 'Asking for help is a strength I am allowed to use.' },
  { id: 'a14', text: 'I deserve the same kindness I give my friends.' },
  { id: 'a15', text: 'Comparing my start to someone else’s middle is not fair to me.' },
  { id: 'a16', text: 'My dreams are not too big. They are exactly my size.' },
  { id: 'a17', text: 'I can change my mind and still be true to myself.' },
  { id: 'a18', text: 'Mistakes are proof that I am trying.' },
  { id: 'a19', text: 'I bring something to every room that no one else does.' },
  { id: 'a20', text: 'Today I will notice what I did well.' },
  { id: 'a21', text: 'My period, my moods and my energy are part of me, not a weakness.' },
  { id: 'a22', text: 'I can disagree politely and stand by what I think.' },
  { id: 'a23', text: 'I choose progress over perfect.' },
  { id: 'a24', text: 'I am not behind. I am on my own timeline.' },
  { id: 'a25', text: 'Being gentle with myself is how I keep going.' },
  { id: 'a26', text: 'I have permission to celebrate small wins.' },
  { id: 'a27', text: 'The people who matter like me as I am.' },
  { id: 'a28', text: 'Courage is doing it with shaky hands.' },
  { id: 'a29', text: 'I am more than how I look today.' },
  { id: 'a30', text: 'I trust myself to figure things out.' },
];

export interface Challenge {
  id: string;
  title: string;
  why: string;
}

export const CHALLENGES: Challenge[] = [
  { id: 'c1', title: 'Ask one question in class or a meeting', why: 'Speaking once makes the next time easier.' },
  { id: 'c2', title: 'Write 3 things you did well this week', why: 'Your brain remembers mistakes more easily than wins; this evens it out.' },
  { id: 'c3', title: 'Give someone a genuine compliment', why: 'Kindness out tends to come back as confidence in.' },
  { id: 'c4', title: 'Say no to one thing you don’t want to do', why: 'Boundaries are a confidence muscle.' },
  { id: 'c5', title: 'Stand tall for 2 minutes before something nervous', why: 'Open posture and slow breaths calm the body down.' },
  { id: 'c6', title: 'Wear something that makes you feel like you', why: 'Feeling comfortable in your clothes frees up attention.' },
  { id: 'c7', title: 'Unfollow 3 accounts that make you feel worse', why: 'Your feed shapes how you see yourself.' },
  { id: 'c8', title: 'Share one opinion you usually keep to yourself', why: 'Your view counts as much as anyone’s.' },
  { id: 'c9', title: 'Introduce yourself to someone new', why: 'Small social risks build social confidence.' },
  { id: 'c10', title: 'Finish one task you have been putting off', why: 'Keeping promises to yourself builds self-trust.' },
  { id: 'c11', title: 'Say “thank you” to a compliment — no “but…”', why: 'Accepting praise is a skill.' },
  { id: 'c12', title: 'Learn 5 minutes of something new', why: 'Growing skills grow confidence.' },
  { id: 'c13', title: 'Write a kind note to your future self', why: 'Self-compassion is linked to steadier confidence.' },
  { id: 'c14', title: 'Take a 10-minute walk with no phone', why: 'Movement and a quiet mind lift mood.' },
  { id: 'c15', title: 'Practise one answer out loud for an interview or viva', why: 'Rehearsal turns nerves into readiness.' },
  { id: 'c16', title: 'Ask for help with one thing', why: 'Confident people ask; it is not weakness.' },
  { id: 'c17', title: 'Celebrate a friend’s win sincerely', why: 'Joy for others quiets comparison.' },
  { id: 'c18', title: 'Notice one negative thought and rewrite it kindly', why: 'This is the core of CBT reframing.' },
  { id: 'c19', title: 'Make eye contact and smile at someone', why: 'Tiny social moments add up.' },
  { id: 'c20', title: 'Do one thing you were scared of as a child', why: 'Proof that you have already grown.' },
  { id: 'c21', title: 'Post or share something you made', why: 'Letting your work be seen is brave.' },
];

export interface GlowHabit {
  id: string;
  label: string;
  hint: string;
}

/** Everyday care that helps her feel good. Nothing here is about changing how she looks. */
export const GLOW_HABITS: GlowHabit[] = [
  { id: 'water', label: 'Drink 8 glasses of water', hint: 'More on period and hot days.' },
  { id: 'sleep', label: 'Sleep 7–9 hours', hint: 'Sleep shows up in mood, skin and focus.' },
  { id: 'move', label: 'Move for 20 minutes', hint: 'A walk, dance or yoga all count.' },
  { id: 'sun', label: 'Sunscreen or shade outdoors', hint: 'Simple daily skin care.' },
  { id: 'food', label: 'Fruit or vegetables at 2 meals', hint: 'Steady energy all day.' },
  { id: 'screens', label: 'No phone for the last 30 minutes before bed', hint: 'Helps you fall asleep faster.' },
  { id: 'kind', label: 'One kind thing for yourself', hint: 'A bath, a song, oiling your hair, a call with a friend.' },
];

export const LEVEL_LABELS = ['', 'Shaky', 'Low', 'Okay', 'Good', 'Unstoppable'] as const;

/** Same item all day, a new one each day. */
export function pickForDay<T>(list: T[], dateKey: string, offset = 0): T {
  const n = Math.abs(daysBetweenKeys('2026-01-01', dateKey)) + offset;
  return list[((n % list.length) + list.length) % list.length];
}

/** Days in a row (ending today or yesterday) with at least one confidence action. */
export function streak(activeDays: Set<string>, today: string, addDays: (k: string, n: number) => string): number {
  let day = activeDays.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (activeDays.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
