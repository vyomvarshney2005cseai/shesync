import type {
  ChatLanguage,
  CyclePrediction,
  DigestiveSymptom,
  HealthCheckAnswers,
  PastCycleRecord,
  ReferralLevel,
  SleepLog,
  SymptomLog,
} from '@/types';
import { assessReferral } from '@/lib/referral';
import { daysSinceKey } from '@/lib/dates';
import { summariseDigestive } from '@/lib/digestive';

/**
 * Doctor-visit prep: five questions to take to the gynaecologist, chosen
 * from her own logs and her referral result. Each question says which of her
 * data it comes from, so she can explain it. Never a diagnosis — only
 * questions.
 */
export interface DoctorPrepInput {
  symptomLogs: SymptomLog[];
  sleepLogs: SleepLog[];
  pastCycles: PastCycleRecord[];
  cyclePrediction: CyclePrediction;
  healthCheck: HealthCheckAnswers;
  assessmentAnswers: Record<string, string>;
  sleepTarget: number;
  /** From PCOS Care: has a doctor told her she has PCOS? */
  pcosDiagnosed?: boolean;
  /** Latest PCOS check-in shows hair/acne signs (moderate or more). */
  pcosSigns?: boolean;
}

export interface DoctorQuestion {
  id: string;
  question: string;
  because: string;
}

export interface DoctorPrep {
  questions: DoctorQuestion[];
  level: ReferralLevel;
  /** True when the questions are only the general ones (not enough logged yet). */
  generalOnly: boolean;
}

type L = ChatLanguage;
type Text3 = Record<L, string>;
const t = (en: string, hinglish: string, hi: string): Text3 => ({ en, hinglish, hi });

const DIG_WORDS: Record<DigestiveSymptom, Text3> = {
  bloating: t('bloating', 'bloating', 'पेट फूलना'),
  constipation: t('constipation', 'kabz', 'कब्ज़'),
  loose_motions: t('loose motions', 'loose motions', 'दस्त'),
  nausea: t('nausea', 'ji machlana', 'जी मिचलाना'),
};

const and = (l: L) => (l === 'en' ? 'and' : l === 'hinglish' ? 'aur' : 'और');

interface Candidate {
  id: string;
  priority: number;
  q: Text3;
  because: Text3;
}

export function buildDoctorQuestions(input: DoctorPrepInput, lang: L): DoctorPrep {
  const referral = assessReferral(input);
  const ids = new Set(referral.reasons.map((r) => r.id));
  const recent = input.symptomLogs.filter((l) => {
    const age = daysSinceKey(l.date);
    return age >= 0 && age <= 90;
  });
  const pains = recent.filter((l) => typeof l.pain === 'number').map((l) => l.pain as number);
  const maxPain = pains.length ? Math.max(...pains) : 0;
  const heavyDays = new Set(recent.filter((l) => l.flow === 'heavy' || l.flow === 'severe').map((l) => l.date)).size;
  const lowMoodDays = new Set(recent.filter((l) => typeof l.mood === 'number' && (l.mood as number) <= 2).map((l) => l.date)).size;
  const lengths = input.pastCycles.map((c) => c.lengthDays).filter((n) => n > 0);
  const minLen = lengths.length ? Math.min(...lengths) : 0;
  const maxLen = lengths.length ? Math.max(...lengths) : 0;
  const tummy = summariseDigestive(input.symptomLogs, input.pastCycles, 30);
  const shortNights = input.sleepLogs.filter((s) => {
    const age = daysSinceKey(s.date);
    return age >= 0 && age < 14 && s.hours < input.sleepTarget - 1.5;
  }).length;

  const c: Candidate[] = [];

  if (referral.level === 'urgent') {
    const title = referral.reasons.find((r) => r.level === 'urgent')?.title ?? '';
    c.push({
      id: 'urgent',
      priority: 100,
      q: t(
        'Do I need treatment today, and which warning signs mean I should come straight to emergency?',
        'Kya mujhe aaj hi treatment chahiye, aur kaunse signs par seedha emergency aana chahiye?',
        'क्या मुझे आज ही इलाज चाहिए, और किन लक्षणों पर सीधे इमरजेंसी आना चाहिए?'
      ),
      because: t(
        `Your health check flagged: ${title}.`,
        'Aapke health check mein ek urgent sign aaya.',
        'आपके हेल्थ चेक में एक ज़रूरी चेतावनी का लक्षण आया।'
      ),
    });
  }

  if (ids.has('heavy') || ids.has('heavy-mild') || ids.has('anaemia') || heavyDays >= 2) {
    c.push({
      id: 'heavy',
      priority: 90,
      q: t(
        'My periods are heavy. Should I have a haemoglobin and ferritin (iron) test, and what treatments can make my periods lighter?',
        'Mere periods heavy hain. Kya haemoglobin aur ferritin (iron) test karwana chahiye, aur kaunse treatment periods halke kar sakte hain?',
        'मेरे पीरियड भारी हैं। क्या हीमोग्लोबिन और फ़ेरिटिन (आयरन) की जाँच करवानी चाहिए, और कौन से इलाज पीरियड हल्के कर सकते हैं?'
      ),
      because: heavyDays
        ? t(`You logged heavy flow on ${heavyDays} day${heavyDays > 1 ? 's' : ''}.`, `Aapne ${heavyDays} din heavy flow log kiya.`, `आपने ${heavyDays} दिन भारी फ़्लो लॉग किया।`)
        : t('Your health check showed signs of heavy periods or feeling faint.', 'Health check mein heavy periods ya chakkar ke signs aaye.', 'हेल्थ चेक में भारी पीरियड या चक्कर के लक्षण आए।'),
    });
  }

  if (ids.has('between')) {
    c.push({
      id: 'between',
      priority: 89,
      q: t(
        'I get bleeding between periods or after sex. What could cause this, and do I need an examination or a cervical screening test?',
        'Mujhe periods ke beech ya sex ke baad bleeding hoti hai. Iski wajah kya ho sakti hai, aur kya examination ya cervical screening test chahiye?',
        'मुझे पीरियड के बीच या सेक्स के बाद ब्लीडिंग होती है। इसकी वजह क्या हो सकती है, और क्या जाँच या सर्वाइकल स्क्रीनिंग टेस्ट चाहिए?'
      ),
      because: t('You answered yes to this in your health check.', 'Health check mein aapne iska haan kaha.', 'हेल्थ चेक में आपने इसका जवाब हाँ दिया।'),
    });
  }

  if (tummy.persistentBloating) {
    c.push({
      id: 'bloating-persistent',
      priority: 88,
      q: t(
        'I’ve been bloated on most days for about 3 weeks. Should this be checked further, and which tests would you suggest?',
        'Lagbhag 3 hafte se zyaadatar din bloating hai. Kya ise aur check karna chahiye, aur kaunse tests suggest karenge?',
        'लगभग 3 हफ़्ते से ज़्यादातर दिन पेट फूला रहता है। क्या इसकी और जाँच होनी चाहिए, और कौन सी जाँच बताएँगे?'
      ),
      because: t('You logged bloating on most days in the last 3 weeks.', 'Aapne pichhle 3 hafte mein zyaadatar din bloating log ki.', 'आपने पिछले 3 हफ़्तों में ज़्यादातर दिन पेट फूलना लॉग किया।'),
    });
  }

  if (ids.has('pain-severe') || ids.has('pain-strong') || maxPain >= 7) {
    c.push({
      id: 'pain',
      priority: 87,
      q: t(
        'My period pain gets very strong. Could it be endometriosis or adenomyosis, and which tests or treatments would you suggest?',
        'Mera period dard bahut tez ho jaata hai. Kya yeh endometriosis ya adenomyosis ho sakta hai, aur kaunse tests ya treatment suggest karenge?',
        'मेरा पीरियड दर्द बहुत तेज़ हो जाता है। क्या यह एंडोमेट्रियोसिस या एडिनोमायोसिस हो सकता है, और कौन सी जाँच या इलाज बताएँगे?'
      ),
      because: maxPain
        ? t(`Your pain reached ${maxPain}/10 in your logs.`, `Aapke logs mein dard ${maxPain}/10 tak gaya.`, `आपके लॉग में दर्द ${maxPain}/10 तक गया।`)
        : t('Your health check said period pain stops your day.', 'Health check ke hisaab se period dard aapka din rok deta hai.', 'हेल्थ चेक के अनुसार पीरियड दर्द आपका दिन रोक देता है।'),
    });
  }

  if (ids.has('irregular') || ids.has('no-period') || ids.has('short-cycles')) {
    const range =
      lengths.length > 1 && maxLen > minLen
        ? t(`Your saved cycles range from ${minLen} to ${maxLen} days.`, `Aapke saved cycles ${minLen} se ${maxLen} din ke hain.`, `आपके सेव किए साइकिल ${minLen} से ${maxLen} दिन के हैं।`)
        : t('Your answers show irregular, long, short or missed cycles.', 'Aapke answers mein irregular, lambe, chhote ya miss cycles dikhe.', 'आपके जवाबों में अनियमित, लंबे, छोटे या छूटे साइकिल दिखे।');
    c.push({
      id: 'irregular',
      priority: 86,
      q: t(
        'What could be making my cycles irregular? Should I have thyroid, prolactin or PCOS blood tests, or an ultrasound?',
        'Mere cycles irregular kyun ho sakte hain? Kya thyroid, prolactin ya PCOS ke blood tests, ya ultrasound karwana chahiye?',
        'मेरे साइकिल अनियमित क्यों हो सकते हैं? क्या थायरॉइड, प्रोलैक्टिन या PCOS की ख़ून की जाँच, या अल्ट्रासाउंड करवाना चाहिए?'
      ),
      because: range,
    });
  }

  if (ids.has('pain-other')) {
    c.push({
      id: 'pain-other',
      priority: 85,
      q: t(
        'I also get pain when peeing, pooing or during sex. Could this be linked to my periods, and do I need a scan?',
        'Mujhe peshab, potty ya sex ke time bhi dard hota hai. Kya yeh periods se juda ho sakta hai, aur kya scan chahiye?',
        'मुझे पेशाब, शौच या सेक्स के समय भी दर्द होता है। क्या यह पीरियड से जुड़ा हो सकता है, और क्या स्कैन चाहिए?'
      ),
      because: t('You answered yes to this in your health check.', 'Health check mein aapne iska haan kaha.', 'हेल्थ चेक में आपने इसका जवाब हाँ दिया।'),
    });
  }

  if ((ids.has('hair-acne') || input.pcosSigns) && !input.pcosDiagnosed) {
    c.push({
      id: 'pcos-check',
      priority: 84,
      q: t(
        'I have acne or extra facial/body hair. Should I be checked for PCOS, and what would treatment look like for me?',
        'Mujhe acne ya chehre/body par extra baal hain. Kya PCOS ke liye check karwana chahiye, aur mere liye treatment kaisa hoga?',
        'मुझे मुँहासे या चेहरे/शरीर पर ज़्यादा बाल हैं। क्या PCOS की जाँच करवानी चाहिए, और मेरे लिए इलाज कैसा होगा?'
      ),
      because: t('From your health check or PCOS Care check-in.', 'Aapke health check ya PCOS Care check-in se.', 'आपके हेल्थ चेक या PCOS Care चेक-इन से।'),
    });
  }

  if (ids.has('pmdd') || ids.has('pmdd-doctor') || ids.has('low-mood') || lowMoodDays >= 3) {
    c.push({
      id: 'mood',
      priority: 80,
      q: t(
        'My mood drops a lot, especially before my period. Could this be PMS or PMDD, and what treatments — like therapy or medicine — could help?',
        'Mera mood bahut gir jaata hai, khaas kar period se pehle. Kya yeh PMS ya PMDD ho sakta hai, aur kaunse treatment — jaise therapy ya dawa — help karenge?',
        'मेरा मूड बहुत गिर जाता है, ख़ासकर पीरियड से पहले। क्या यह PMS या PMDD हो सकता है, और कौन से इलाज — जैसे थेरेपी या दवा — मदद करेंगे?'
      ),
      because: lowMoodDays
        ? t(`You logged a low mood on ${lowMoodDays} day${lowMoodDays > 1 ? 's' : ''}.`, `Aapne ${lowMoodDays} din low mood log kiya.`, `आपने ${lowMoodDays} दिन उदास मूड लॉग किया।`)
        : t('Your answers mention strong mood changes.', 'Aapke answers mein mood ke bade badlaav dikhe.', 'आपके जवाबों में मूड के बड़े बदलाव दिखे।'),
    });
  }

  if (!tummy.persistentBloating && tummy.days >= 3) {
    const words = tummy.top.slice(0, 2).map((s) => DIG_WORDS[s][lang]).join(` ${and(lang)} `);
    c.push({
      id: 'digestive',
      priority: 70,
      q: t(
        `I often get ${words} around my period. Is that part of my cycle, and when should it be checked further?`,
        `Period ke aas-paas mujhe aksar ${words} hota hai. Kya yeh cycle ka hissa hai, aur kab ise aur check karwana chahiye?`,
        `पीरियड के आसपास मुझे अक्सर ${words} होता है। क्या यह साइकिल का हिस्सा है, और कब इसकी और जाँच होनी चाहिए?`
      ),
      because: t(
        `You logged tummy symptoms on ${tummy.days} days this month (${tummy.nearPeriodDays} near your period).`,
        `Is mahine aapne ${tummy.days} din pet ke symptoms log kiye (${tummy.nearPeriodDays} period ke paas).`,
        `इस महीने आपने ${tummy.days} दिन पेट के लक्षण लॉग किए (${tummy.nearPeriodDays} पीरियड के पास)।`
      ),
    });
  }

  if (input.pcosDiagnosed) {
    c.push({
      id: 'pcos-followup',
      priority: 60,
      q: t(
        'Since I have PCOS, how often should I have my blood sugar, cholesterol and blood pressure checked?',
        'Mujhe PCOS hai, toh blood sugar, cholesterol aur BP kitni baar check karwana chahiye?',
        'मुझे PCOS है, तो ब्लड शुगर, कोलेस्ट्रॉल और ब्लड प्रेशर कितनी बार जँचवाना चाहिए?'
      ),
      because: t('You told PCOS Care a doctor has diagnosed PCOS.', 'Aapne PCOS Care mein bataya ki doctor ne PCOS bataya hai.', 'आपने PCOS Care में बताया कि डॉक्टर ने PCOS बताया है।'),
    });
  }

  if (shortNights >= 4) {
    c.push({
      id: 'sleep',
      priority: 55,
      q: t(
        'I often sleep badly and feel drained. Could my cycle, iron levels or thyroid be affecting my energy?',
        'Meri neend aksar kharab hoti hai aur thakaan rehti hai. Kya cycle, iron ya thyroid meri energy par asar daal rahe hain?',
        'मेरी नींद अक्सर ख़राब होती है और थकान रहती है। क्या साइकिल, आयरन या थायरॉइड मेरी एनर्जी पर असर डाल रहे हैं?'
      ),
      because: t(
        `${shortNights} short nights in the last 2 weeks.`,
        `Pichhle 2 hafte mein ${shortNights} raatein kam neend.`,
        `पिछले 2 हफ़्तों में ${shortNights} रातें कम नींद।`
      ),
    });
  }

  if (pains.length && !c.some((x) => x.id === 'pain')) {
    c.push({
      id: 'painkiller',
      priority: 45,
      q: t(
        'Is the painkiller I use for period pain (and the dose) right for me?',
        'Period dard ke liye jo painkiller leti hoon (aur uski dose), kya woh mere liye sahi hai?',
        'पीरियड दर्द के लिए जो दवा लेती हूँ (और उसकी ख़ुराक), क्या वह मेरे लिए सही है?'
      ),
      because: t(`You logged pain on ${pains.length} day${pains.length > 1 ? 's' : ''}.`, `Aapne ${pains.length} din dard log kiya.`, `आपने ${pains.length} दिन दर्द लॉग किया।`),
    });
  }

  const specific = c.length;

  // General questions that are useful for anyone — fill up to five.
  c.push(
    {
      id: 'normal',
      priority: 40,
      q: t(
        'Looking at my period dates, is my cycle normal for my age?',
        'Meri period dates dekh kar, kya mera cycle meri umar ke hisaab se normal hai?',
        'मेरी पीरियड की तारीख़ें देखकर, क्या मेरा साइकिल मेरी उम्र के हिसाब से सामान्य है?'
      ),
      because: t('Show the doctor your SheSync report.', 'Doctor ko apni SheSync report dikhao.', 'डॉक्टर को अपनी SheSync रिपोर्ट दिखाएँ।'),
    },
    {
      id: 'warning',
      priority: 35,
      q: t(
        'Which symptoms should make me come back sooner, or go to emergency?',
        'Kaunse symptoms par mujhe jaldi wapas aana chahiye, ya emergency jaana chahiye?',
        'किन लक्षणों पर मुझे जल्दी वापस आना चाहिए, या इमरजेंसी जाना चाहिए?'
      ),
      because: t('So you know when not to wait.', 'Taaki pata ho kab wait nahi karna.', 'ताकि पता रहे कब इंतज़ार नहीं करना।'),
    },
    {
      id: 'tests',
      priority: 30,
      q: t(
        'Would any tests help me — and what would the results change?',
        'Kya koi tests meri help karenge — aur results se kya badlega?',
        'क्या कोई जाँच मेरी मदद करेगी — और नतीजों से क्या बदलेगा?'
      ),
      because: t('Good to ask before any test.', 'Kisi bhi test se pehle puchna accha hai.', 'किसी भी जाँच से पहले पूछना अच्छा है।'),
    },
    {
      id: 'lifestyle',
      priority: 25,
      q: t(
        'What one or two changes in food, sleep or exercise would make the most difference for me?',
        'Khaane, neend ya exercise mein kaunse ek-do badlaav mere liye sabse zyada farak laayenge?',
        'खाने, नींद या एक्सरसाइज़ में कौन से एक-दो बदलाव मेरे लिए सबसे ज़्यादा फ़र्क़ लाएँगे?'
      ),
      because: t('Makes the advice fit your life.', 'Isse advice aapki life ke hisaab se milti hai.', 'इससे सलाह आपकी ज़िंदगी के हिसाब से मिलती है।'),
    },
    {
      id: 'follow-up',
      priority: 20,
      q: t(
        'When should I come back for a follow-up, and what should I track until then?',
        'Follow-up ke liye kab aana chahiye, aur tab tak kya track karna chahiye?',
        'फ़ॉलो-अप के लिए कब आना चाहिए, और तब तक क्या ट्रैक करना चाहिए?'
      ),
      because: t('SheSync can keep tracking it for you.', 'SheSync aapke liye track karta rahega.', 'SheSync आपके लिए ट्रैक करता रहेगा।'),
    }
  );

  const questions = c
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map((x) => ({ id: x.id, question: x.q[lang], because: x.because[lang] }));

  return { questions, level: referral.level, generalOnly: specific === 0 };
}

/** Plain text to copy or share. */
export function doctorQuestionsText(prep: DoctorPrep, lang: L): string {
  const head =
    lang === 'en'
      ? 'Questions for my gynaecologist (from SheSync)'
      : lang === 'hinglish'
      ? 'Gynaecologist ke liye mere sawaal (SheSync se)'
      : 'स्त्री रोग विशेषज्ञ के लिए मेरे सवाल (SheSync से)';
  return `${head}\n\n${prep.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`;
}
