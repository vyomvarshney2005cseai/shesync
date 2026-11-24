// ============================================================
// Gentle journal prompts for each cycle phase (English + Hindi).
// One featured prompt a day, picked by date so it stays the same
// all day and changes tomorrow.
// ============================================================
import type { CyclePhase } from '@/types';

export type PromptPhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'any';

export interface PhasePrompts {
  title: string;
  titleHi: string;
  /** One kind line on what this phase can feel like. */
  note: string;
  noteHi: string;
  en: string[];
  hi: string[];
}

export const PHASE_PROMPTS: Record<PromptPhase, PhasePrompts> = {
  menstrual: {
    title: 'Period days',
    titleHi: 'पीरियड के दिन',
    note: 'Your body is doing a lot right now. Rest counts as progress.',
    noteHi: 'आपका शरीर अभी बहुत मेहनत कर रहा है। आराम करना भी आगे बढ़ना है।',
    en: [
      'What does my body need most today — rest, warmth, food or quiet?',
      'What can I let go of this week without guilt?',
      'Where do I feel the most discomfort, and what eased it even a little?',
      'Who or what made today a bit easier?',
      'What would I say to a friend who felt the way I feel today?',
      'What is one small comfort I can give myself tonight?',
      'What am I proud of getting through today, even if it was small?',
    ],
    hi: [
      'आज मेरे शरीर को सबसे ज़्यादा किस चीज़ की ज़रूरत है — आराम, गर्माहट, खाना या शांति?',
      'इस हफ़्ते मैं बिना अपराध-बोध के क्या छोड़ सकती हूँ?',
      'मुझे सबसे ज़्यादा तकलीफ़ कहाँ है, और किस चीज़ से थोड़ी राहत मिली?',
      'आज किसने या किस चीज़ ने दिन थोड़ा आसान बनाया?',
      'अगर मेरी कोई दोस्त आज मेरे जैसा महसूस करती, तो मैं उससे क्या कहती?',
      'आज रात मैं ख़ुद को कौन-सा छोटा-सा सुकून दे सकती हूँ?',
      'आज मैंने क्या संभाला जिस पर मुझे गर्व है, भले ही वो छोटा हो?',
    ],
  },
  follicular: {
    title: 'Fresh-start days',
    titleHi: 'नई शुरुआत के दिन',
    note: 'Energy often rises after a period — a good time to plan and begin.',
    noteHi: 'पीरियड के बाद अक्सर ऊर्जा बढ़ती है — योजना बनाने और शुरुआत करने का अच्छा समय।',
    en: [
      'What do I feel curious about or excited to start?',
      'If this week went really well, what would have happened?',
      'What is one small step toward something I care about?',
      'What new habit feels light enough to try for a few days?',
      'What is something I learned about myself last cycle?',
      'Where do I want to put my extra energy this week?',
      'What would make tomorrow feel like a good day?',
    ],
    hi: [
      'मुझे किस चीज़ के बारे में जानने या शुरू करने का मन है?',
      'अगर यह हफ़्ता बहुत अच्छा गया, तो क्या-क्या हुआ होगा?',
      'जिस चीज़ की मुझे परवाह है, उसकी ओर एक छोटा क़दम क्या हो सकता है?',
      'कौन-सी नई आदत कुछ दिन आज़माने लायक हल्की लगती है?',
      'पिछले चक्र में मैंने अपने बारे में क्या सीखा?',
      'इस हफ़्ते मैं अपनी अतिरिक्त ऊर्जा कहाँ लगाना चाहती हूँ?',
      'कल को अच्छा दिन बनाने के लिए क्या होना चाहिए?',
    ],
  },
  ovulatory: {
    title: 'Bright days',
    titleHi: 'चमकते दिन',
    note: 'Many feel more social and confident around now — enjoy it.',
    noteHi: 'इन दिनों कई लोग ज़्यादा आत्मविश्वासी और मिलनसार महसूस करते हैं — इसका आनंद लें।',
    en: [
      'When did I feel most like myself today?',
      'What conversation or idea gave me energy?',
      'What is something I want to say or ask for while I feel confident?',
      'Who would I like to spend more time with, and why?',
      'What strength of mine showed up today?',
      'What would I try if I knew I could not fail?',
      'What made me laugh or smile today?',
    ],
    hi: [
      'आज मैं कब सबसे ज़्यादा ख़ुद जैसी महसूस हुई?',
      'किस बातचीत या विचार से मुझे ऊर्जा मिली?',
      'आत्मविश्वास के इस समय में मैं क्या कहना या माँगना चाहती हूँ?',
      'मैं किसके साथ और समय बिताना चाहती हूँ, और क्यों?',
      'आज मेरी कौन-सी ख़ूबी सामने आई?',
      'अगर असफल होने का डर न हो, तो मैं क्या आज़माऊँगी?',
      'आज किस बात ने मुझे हँसाया या मुस्कुराने पर मजबूर किया?',
    ],
  },
  luteal: {
    title: 'Slow-down days',
    titleHi: 'धीमे होने के दिन',
    note: 'Before a period, energy and mood can dip. Be gentle — it passes.',
    noteHi: 'पीरियड से पहले ऊर्जा और मूड कम हो सकते हैं। ख़ुद के साथ नरमी रखें — यह गुज़र जाता है।',
    en: [
      'What is weighing on me today, and is it mine to carry?',
      'What drained my energy today, and what gave a little back?',
      'Where in my body do I feel tension right now?',
      'What boundary would protect my energy this week?',
      'What am I being too hard on myself about?',
      'What feeling keeps coming back, and what might it be telling me?',
      'What is one kind thing I can do for myself tonight?',
    ],
    hi: [
      'आज मुझ पर किस बात का बोझ है, और क्या उसे उठाना मेरी ज़िम्मेदारी है?',
      'आज मेरी ऊर्जा किसने कम की, और किसने थोड़ी लौटाई?',
      'अभी मेरे शरीर में तनाव कहाँ महसूस हो रहा है?',
      'इस हफ़्ते कौन-सी सीमा मेरी ऊर्जा बचा सकती है?',
      'मैं किस बात पर ख़ुद से ज़रूरत से ज़्यादा सख़्त हो रही हूँ?',
      'कौन-सी भावना बार-बार लौट रही है, और वो मुझसे क्या कह रही होगी?',
      'आज रात मैं अपने लिए कौन-सा एक प्यारा काम कर सकती हूँ?',
    ],
  },
  any: {
    title: 'Today',
    titleHi: 'आज',
    note: 'Log your period to get prompts that match where you are in your cycle.',
    noteHi: 'अपना पीरियड लॉग करें, ताकि सवाल आपके चक्र के हिसाब से मिलें।',
    en: [
      'How does my body feel today, from head to toe?',
      'What is on my mind that I have not said out loud?',
      'What gave me energy today, and what took it away?',
      'What is one thing I am grateful for right now?',
      'What is one kind thing I can do for myself tonight?',
    ],
    hi: [
      'आज मेरा शरीर सिर से पैर तक कैसा महसूस कर रहा है?',
      'मेरे मन में क्या है जो मैंने अब तक कहा नहीं?',
      'आज मुझे ऊर्जा किससे मिली, और किसने छीनी?',
      'अभी मैं किस एक बात के लिए आभारी हूँ?',
      'आज रात मैं अपने लिए कौन-सा एक प्यारा काम कर सकती हूँ?',
    ],
  },
};

export function promptPhase(phase: CyclePhase | undefined, hasCycleData: boolean): PromptPhase {
  if (!hasCycleData) return 'any';
  if (phase === 'menstrual' || phase === 'follicular' || phase === 'ovulatory' || phase === 'luteal') return phase;
  return 'any';
}

/** Days since 1970 in local time, so the pick changes at local midnight. */
function dayNumber(date: Date): number {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

/**
 * Today's prompts for her phase: the featured one first, then two more.
 * `shift` lets her ask for another one.
 */
export function promptsFor(phase: PromptPhase, lang: 'en' | 'hi', shift = 0, date = new Date()): string[] {
  const list = PHASE_PROMPTS[phase][lang];
  const start = (dayNumber(date) + shift) % list.length;
  return [0, 1, 2].map((i) => list[(start + i * 3) % list.length]);
}
