// ============================================================
// Period leave / attendance note: a polite, ready-to-send
// application in the usual Indian school/college format.
// Pure functions so the wording is easy to test.
// ============================================================
import { daysBetweenKeys, parseDateKey } from '@/lib/dates';

export type NoteLevel = 'school' | 'college';
export type NoteRecipient = 'principal' | 'class_teacher' | 'hod' | 'mentor';
export type NoteReason = 'unwell' | 'period_pain' | 'doctor';
export type NoteLang = 'en' | 'hi';

export interface LeaveNoteInput {
  level: NoteLevel;
  to: NoteRecipient;
  reason: NoteReason;
  lang: NoteLang;
  name: string;
  classOrCourse: string; // "Class 10-B" or "B.Tech CSE, 3rd year, Section E"
  rollNo?: string;
  institution: string;
  city?: string;
  from: string; // YYYY-MM-DD
  to_: string; // YYYY-MM-DD (same as from for one day)
  today: string; // YYYY-MM-DD
}

export const RECIPIENTS: Record<NoteLevel, NoteRecipient[]> = {
  school: ['class_teacher', 'principal'],
  college: ['hod', 'mentor', 'principal'],
};

export const RECIPIENT_LABEL: Record<NoteLevel, Record<NoteRecipient, string>> = {
  school: { class_teacher: 'Class teacher', principal: 'Principal', hod: 'HOD', mentor: 'Mentor' },
  college: { class_teacher: 'Class teacher', principal: 'Principal / Director', hod: 'HOD', mentor: 'Class coordinator' },
};

export const REASON_LABEL: Record<NoteReason, string> = {
  unwell: 'Unwell (private)',
  period_pain: 'Period pain',
  doctor: 'Doctor’s advice',
};

const EN_TO: Record<NoteRecipient, (level: NoteLevel) => string> = {
  principal: (l) => (l === 'college' ? 'The Principal / Director' : 'The Principal'),
  class_teacher: () => 'The Class Teacher',
  hod: () => 'The Head of Department',
  mentor: () => 'The Class Coordinator',
};

const HI_TO: Record<NoteRecipient, string> = {
  principal: 'प्रधानाचार्य महोदय/महोदया',
  class_teacher: 'कक्षा अध्यापक/अध्यापिका महोदय/महोदया',
  hod: 'विभागाध्यक्ष महोदय/महोदया',
  mentor: 'कक्षा समन्वयक महोदय/महोदया',
};

type Tense = 'past' | 'present' | 'future';

export function noteTense(from: string, to: string, today: string): Tense {
  if (to < today) return 'past';
  if (from > today) return 'future';
  return 'present';
}

/** Number of calendar days, inclusive (min 1). */
export function leaveDays(from: string, to: string): number {
  return Math.max(1, daysBetweenKeys(from, to) + 1);
}

const enDate = (k: string) => parseDateKey(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const hiDate = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}/${k.slice(0, 4)}`;

export function buildLeaveNote(i: LeaveNoteInput): { subject: string; body: string } {
  const to = i.to_ < i.from ? i.from : i.to_;
  const days = leaveDays(i.from, to);
  const tense = noteTense(i.from, to, i.today);
  const name = i.name.trim() || '[Your name]';
  const cls = i.classOrCourse.trim() || (i.level === 'school' ? '[Class & section]' : '[Course, year & section]');
  const roll = i.rollNo?.trim();
  const inst = i.institution.trim() || (i.level === 'school' ? '[School name]' : '[College name]');
  const city = i.city?.trim();
  return i.lang === 'hi' ? hindi() : english();

  function english() {
    const place = i.level === 'school' ? 'school' : 'classes';
    const when = days === 1 ? `on ${enDate(i.from)}` : `from ${enDate(i.from)} to ${enDate(to)} (${days} days)`;
    const verb = tense === 'past' ? 'was unable to attend' : tense === 'future' ? 'will not be able to attend' : 'am unable to attend';
    const reason =
      i.reason === 'period_pain'
        ? tense === 'past'
          ? 'as I had severe menstrual cramps'
          : tense === 'future'
          ? 'as I usually get severe menstrual cramps at this time'
          : 'as I have severe menstrual cramps'
        : i.reason === 'doctor'
        ? 'on my doctor’s advice'
        : tense === 'past'
        ? 'as I was unwell'
        : tense === 'future'
        ? 'for health reasons'
        : 'as I am unwell';
    const subject = `Application for leave ${days === 1 ? `on ${enDate(i.from)}` : `for ${days} days`}`;
    const lines = [
      'To,',
      EN_TO[i.to](i.level) + ',',
      inst + (city ? ',' : ''),
      ...(city ? [city] : []),
      '',
      `Date: ${enDate(i.today)}`,
      '',
      `Subject: ${subject}`,
      '',
      'Respected Sir/Madam,',
      '',
      `I am ${name}, a student of ${cls}${roll ? ` (Roll No. ${roll})` : ''}. I ${verb} ${place} ${when} ${reason}.`,
      '',
      `Kindly grant me leave for ${days === 1 ? 'this day' : 'these days'}. I will make sure to catch up on the work I miss.`,
      '',
      'Thank you.',
      '',
      'Yours sincerely,',
      name,
      cls + (roll ? `, Roll No. ${roll}` : ''),
    ];
    if (i.level === 'school') lines.push('', 'Parent’s signature: ____________');
    return { subject, body: lines.join('\n') };
  }

  function hindi() {
    const place = i.level === 'school' ? 'विद्यालय' : 'कॉलेज';
    const when = days === 1 ? `दिनांक ${hiDate(i.from)} को` : `दिनांक ${hiDate(i.from)} से ${hiDate(to)} तक (${days} दिन)`;
    const verb = tense === 'past' ? 'नहीं आ सकी' : tense === 'future' ? 'नहीं आ पाऊँगी' : 'नहीं आ पा रही हूँ';
    const reason =
      i.reason === 'period_pain' ? 'मासिक धर्म में तेज़ दर्द के कारण' : i.reason === 'doctor' ? 'डॉक्टर की सलाह पर' : 'अस्वस्थ होने के कारण';
    const subject = `${days === 1 ? 'एक दिन' : `${days} दिन`} के अवकाश हेतु प्रार्थना-पत्र`;
    const lines = [
      'सेवा में,',
      HI_TO[i.to] + ',',
      inst + (city ? ',' : ''),
      ...(city ? [city] : []),
      '',
      `दिनांक: ${hiDate(i.today)}`,
      '',
      `विषय: ${subject}`,
      '',
      'महोदय/महोदया,',
      '',
      `सविनय निवेदन है कि मैं ${name}, ${cls} की छात्रा हूँ${roll ? ` (रोल नं. ${roll})` : ''}। ${reason} मैं ${when} ${place} ${verb}।`,
      '',
      `अतः आपसे निवेदन है कि मुझे ${days === 1 ? 'इस दिन' : 'इन दिनों'} का अवकाश देने की कृपा करें। छूटा हुआ काम मैं पूरा कर लूँगी।`,
      '',
      'धन्यवाद।',
      '',
      'आपकी आज्ञाकारी शिष्या,',
      name,
      cls + (roll ? `, रोल नं. ${roll}` : ''),
    ];
    if (i.level === 'school') lines.push('', 'अभिभावक के हस्ताक्षर: ____________');
    return { subject, body: lines.join('\n') };
  }
}
