/**
 * Language support for YourGoGirl: which language to answer in, how to read
 * Hindi typed in Devanagari, and the chat's own words in each language.
 */
import type { ChatLanguage } from '@/types';
import type { ChatLanguageSetting } from '@/store/useSettingsStore';

const DEVANAGARI = /[ऀ-ॿ]/;

// Roman-script Hindi words that rarely appear in English sentences.
const HINGLISH_STRONG = new Set(
  (
    'hai hain hu hun hoon kya kyu kyun kyon kaise kaisa kaisi kab kitna kitni kitne mujhe mujhko mera meri mere ' +
    'nahi nahin nhi bahut bohot bahot kuch karu karun karna karti karta kar rahi raha rahi rahe chahiye chahti ' +
    'lagta lagti lag accha acha achha theek thik yaar aur toh bhi gaya gayi gya gyi hua hui ho pet dard ' +
    'sar sir kamar thakan thakaan kamzori neend gussa udaas akela akeli padhai mann tension ghabrahat ' +
    'din raat abhi kal aaj aaya aayi aaye aata aati jaata jaati wala wali sab koi kisi batao bataiye ' +
    'samajh pata matlab kaun kahan yahan wahan jab tab phir humesha hamesha thoda zyada jyada kam ' +
    'puchu puchun puchna poochu poochna pucho poocho karo karein kare batao btao samjhao chahti chahta sakti sakta ' +
    'hoti hota hoga hogi jaaye jaye kaunsa kaunsi kyunki lekin magar ghar mummy papa'
  ).split(' ')
);
// Short Hindi words that are also common in English ("me", "main", "par") count for less.
const HINGLISH_WEAK = new Set('ke ki ka ko se me mein main par pe se'.split(' '));

/** Which language a message is written in, or null when it is too short to tell. */
export function detectLanguage(text: string): ChatLanguage | null {
  if (DEVANAGARI.test(text)) return 'hi';
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return null;
  let score = 0;
  for (const w of words) {
    if (HINGLISH_STRONG.has(w)) score += 1;
    else if (HINGLISH_WEAK.has(w)) score += 0.4;
  }
  if (score >= 2 || (score >= 1 && score / words.length >= 0.3)) return 'hinglish';
  // "ok", "thanks", "yes" — can't tell.
  if (words.length <= 2) return null;
  return 'en';
}

/** The language for a reply: her setting, or (on Auto) the language she wrote in. */
export function resolveLanguage(setting: ChatLanguageSetting, text: string, previous?: ChatLanguage): ChatLanguage {
  if (setting !== 'auto') return setting;
  return detectLanguage(text) ?? previous ?? 'en';
}

// ─── Reading Hindi typed in Devanagari (and common Hinglish phrases) ───
// Each match adds the English words YourGoGirl's knowledge base matches on.
// Safety phrases come first so emergencies are never missed.
const HINDI_TO_ENGLISH: [RegExp, string][] = [
  // Safety
  [/आत्महत्या|ख़ुदकुशी|खुदकुशी|मरना चाहती|मरना चाहता|मर जाना चाहती|मर जाऊं|मर जाऊँ|जीना नहीं चाहती|जीने का मन नहीं|ज़िंदा नहीं रहना|जिंदा नहीं रहना/g, ' want to die '],
  [/(ख़ुद|खुद|अपने आप)\s*को\s*(नुकसान|नुक़सान|चोट|काट)/g, ' hurt myself '],
  [/मारता है|मारते हैं|मारती है|पीटता|पीटते|मारपीट|घरेलू हिंसा|हिंसा/g, ' hits me '],
  [/छेड़|छेड़छाड़|उत्पीड़न|परेशान करता|पीछा करता/g, ' harassing '],
  [/बलात्कार|ज़बरदस्ती|जबरदस्ती/g, ' forced me '],
  [/(हर|एक)\s*घंटे.{0,30}(भीग|भर|बदल)|(भीग|भर|बदल).{0,30}(हर|एक)\s*घंटे/g, ' soaking a pad every hour '],
  [/बेहोश|बेहोशी|चक्कर/g, ' faint dizzy '],
  [/बुख़ार|बुखार/g, ' fever '],
  [/अचानक/g, ' sudden '],
  [/निचले पेट|पेट के निचले|पेडू|पेल्विक/g, ' lower tummy pelvic '],
  [/बहुत तेज़ दर्द|बहुत तेज दर्द|असहनीय/g, ' severe pain '],
  [/एक तरफ़|एक तरफ/g, ' one side '],
  // Periods & cycle
  [/पीरियड्स|पीरियड|माहवारी|मासिक धर्म|मासिक|एमसी/g, ' period '],
  [/अगला|अगली|कब आएगा|कब आएगी|कब आयेगा/g, ' next when '],
  [/देर से|देरी|लेट|नहीं आया|नहीं आए|नहीं आई|नहीं आये/g, ' late '],
  [/अनियमित|इर्रेगुलर|इररेगुलर|टाइम पर नहीं|समय पर नहीं/g, ' irregular '],
  [/ओव्यूलेशन|अंडोत्सर्ग/g, ' ovulation '],
  [/फ़र्टाइल|फर्टाइल|उपजाऊ/g, ' fertile '],
  [/फेज़|फेज/g, ' phase '],
  [/साइकिल|चक्र/g, ' cycle '],
  [/सामान्य|नॉर्मल|नार्मल/g, ' normal '],
  [/प्रेग्नेंसी टेस्ट|प्रेगनेंसी टेस्ट|गर्भावस्था परीक्षण/g, ' pregnancy test '],
  [/प्रेग्नेंट|प्रेगनेंट|गर्भवती|गर्भ|प्रेग्नेंसी|प्रेगनेंसी/g, ' pregnant '],
  [/इमरजेंसी गोली|आई-पिल|आईपिल|आई पिल/g, ' emergency pill '],
  [/गर्भनिरोधक|बर्थ कंट्रोल|कॉपर-टी|कॉपर टी/g, ' birth control '],
  [/पहला पीरियड|पहली बार पीरियड/g, ' first period '],
  [/स्पॉटिंग|धब्बे/g, ' spotting '],
  [/थक्के|क्लॉट/g, ' clots '],
  [/भूरा|काला|गहरा/g, ' brown '],
  [/(ज़्यादा|ज्यादा|भारी|हैवी)\s*(ख़ून|खून|ब्लीडिंग|फ़्लो|फ्लो|पीरियड)|(ख़ून|खून|ब्लीडिंग|फ़्लो|फ्लो)\s*(बहुत\s*)?(ज़्यादा|ज्यादा|भारी)/g, ' heavy bleeding '],
  [/ख़ून|खून|ब्लीडिंग|रक्तस्राव/g, ' bleeding '],
  [/भारी|हैवी/g, ' heavy '],
  [/पीसीओएस|पीसीओडी/g, ' pcos '],
  [/थायरॉइड|थायराइड/g, ' thyroid '],
  [/एंडोमेट्रियोसिस/g, ' endometriosis '],
  // Pain & body
  [/पेट\s*(में|मे)?\s*(बहुत|बहोत|काफ़ी|काफी|तेज़|तेज)?\s*(दर्द|दुख)/g, ' stomach pain cramps '],
  [/पेट/g, ' stomach '],
  [/सिरदर्द|सिर दर्द|सर दर्द|माइग्रेन/g, ' headache '],
  [/कमर|पीठ/g, ' back '],
  [/जांघ|जाँघ|टांग|टाँग|पैरों/g, ' legs '],
  [/ऐंठन|मरोड़|क्रैम्प्स|क्रैम्प/g, ' cramps '],
  [/दर्द/g, ' pain '],
  [/दवा|दवाई|गोली|टैबलेट|मेफ़्टाल|मेफ्टाल|पेनकिलर/g, ' painkiller medicine '],
  [/पेट फूल|फूला|फूलना|गैस|ब्लोटिंग/g, ' bloating '],
  [/कब्ज़|कब्ज/g, ' constipation '],
  [/दस्त|लूज़ मोशन|लूज मोशन/g, ' loose motions '],
  [/उल्टी|जी मिचला|मितली|मतली/g, ' nausea vomiting '],
  [/ब्रेस्ट|स्तन/g, ' breast '],
  [/थकान|थकावट|कमज़ोरी|कमजोरी/g, ' tired weak '],
  [/ख़ून की कमी|खून की कमी|एनीमिया/g, ' anaemia '],
  [/नींद नहीं|नींद न|अनिद्रा/g, ' can\'t sleep '],
  [/नींद/g, ' sleep '],
  [/क्या खाऊं|क्या खाऊँ|खाना|खाएँ|खाएं|डाइट|आहार/g, ' what to eat food '],
  [/मीठा|चॉकलेट|क्रेविंग/g, ' craving sugar '],
  [/एक्सरसाइज़|एक्सरसाइज|व्यायाम|कसरत|योग|जिम|वर्कआउट/g, ' exercise '],
  [/मुँहासे|मुंहासे|पिंपल|दाने/g, ' acne pimples '],
  [/चेहरे पर बाल|ठुड्डी पर बाल/g, ' facial hair '],
  [/बाल झड़|बाल गिर|बाल पतले/g, ' hair fall '],
  [/वज़न|वजन/g, ' weight '],
  [/सफ़ेद पानी|सफेद पानी|डिस्चार्ज|स्राव|ल्यूकोरिया/g, ' discharge '],
  [/खुजली/g, ' itching '],
  [/बदबू|गंध/g, ' smell '],
  [/पेशाब\s*(में|करते)?\s*(जलन|दर्द)|जलन/g, ' burns when i pee '],
  [/पैड|सैनिटरी|नैपकिन/g, ' pad '],
  [/मेंस्ट्रुअल कप|कप/g, ' menstrual cup '],
  [/टैम्पोन/g, ' tampon '],
  [/सेक्स के बाद/g, ' after sex '],
  [/अचार|मंदिर|रसोई|किचन|बाल धो|नहा|नहाना|अशुद्ध|मिथक/g, ' period myths pickle bath '],
  // Mind
  [/पैनिक|घबराहट|बेचैनी|एंग्जायटी|चिंता/g, ' anxious panic '],
  [/उदास|दुखी|डिप्रेशन|डिप्रेस|रोना|रो रही|खालीपन/g, ' sad crying low '],
  [/तनाव|टेंशन|स्ट्रेस|दबाव/g, ' stressed '],
  [/ग़ुस्सा|गुस्सा|चिड़चिड़|चिड़चिड़ापन/g, ' angry irritable '],
  [/अकेलापन|अकेली|अकेला/g, ' lonely '],
  [/मूड स्विंग|मूड बदल/g, ' mood swings '],
  [/पढ़ाई|पढ़ने|ध्यान नहीं|फ़ोकस|फोकस|ब्रेन फ़ॉग|ब्रेन फॉग/g, ' can\'t focus studying '],
  [/परीक्षा|एग्ज़ाम|एग्जाम|इम्तिहान/g, ' exam '],
  [/मोटिवेशन|मन नहीं|आलस|आलसी/g, ' no motivation lazy '],
  [/साँस फूल|सांस फूल|साँस नहीं|सांस नहीं/g, ' breathless '],
  [/शांत|रिलैक्स|साँस की एक्सरसाइज़|सांस की एक्सरसाइज|ब्रीदिंग/g, ' calm down breathing exercise '],
  [/काउंसलर|थेरेपिस्ट|किसी से बात/g, ' talk to a counsellor '],
  [/स्त्री रोग विशेषज्ञ|गायनेकोलॉजिस्ट|गायनी|डॉक्टर|डाक्टर/g, ' doctor gynaecologist '],
  [/सवाल|प्रश्न|क्या पूछूं|क्या पूछूँ|क्या पूछना/g, ' questions to ask '],
  [/तैयारी|तैयार/g, ' prepare '],
  [/नमस्ते|नमस्कार|हेलो|हाय/g, ' hello '],
  [/धन्यवाद|शुक्रिया|थैंक/g, ' thank you '],
  [/तुम कौन|आप कौन/g, ' who are you '],
];

// A few Roman-Hinglish phrases that the English patterns miss.
const HINGLISH_TO_ENGLISH: [RegExp, string][] = [
  [/\bkhud ko (nuksan|nuksaan|hurt|chot|kaat)\w*/g, ' hurt myself '],
  [/\b(maarta|marta|peet(ta|ti|te)) (hai|h)\b/g, ' hits me '],
  [/\bhar ghante\b.{0,30}\b(bhar|bheeg|badal)\w*|\b(bhar|bheeg|badal)\w*.{0,30}\bhar ghante\b/g, ' soaking a pad every hour '],
  [/\bchakkar\b/g, ' dizzy '],
  [/\bbehosh\w*\b/g, ' faint '],
  [/\bbukh(aa|a)r\b/g, ' fever '],
  [/\b(ulti|ultiyan)\b/g, ' vomiting '],
  [/\b(kabz|kabj)\b/g, ' constipation '],
  [/\b(dast|loose motion)\b/g, ' loose motions '],
  [/\bpet (phool|fool)\w*\b/g, ' bloating '],
  [/\bdoctor se kya (puch|pooch)\w*|\bdoctor ke liye sawaal\w*|\bkya (puchu|poochu|puchna|poochna)\b/g, ' questions to ask my doctor '],
];

/** Text for matching: the original plus English keywords for any Hindi it contains. */
export function toMatchText(text: string): string {
  let extra = '';
  for (const [re, en] of HINDI_TO_ENGLISH) {
    re.lastIndex = 0;
    if (re.test(text)) extra += en;
  }
  const lower = text.toLowerCase();
  for (const [re, en] of HINGLISH_TO_ENGLISH) {
    re.lastIndex = 0;
    if (re.test(lower)) extra += en;
  }
  return extra ? `${text} ${extra}` : text;
}

// ─── The chat's own words ─────────────────────────────────
export interface ChatUiText {
  why: string;
  help: string;
  doctor: string;
  youCouldAsk: string;
  urgent: string;
  typing: string;
  placeholder: string;
  subtitleNoCycle: string;
  language: string;
  menuExport: string;
  menuDeleteAll: string;
  menuTip: string;
  deleteOne: string;
  copy: string;
  cancel: string;
  confirmDeleteAllTitle: string;
  confirmDeleteAllBody: string;
  confirmDeleteOneTitle: string;
  confirmDeleteOneBody: string;
  delete: string;
  exported: string;
  switched: (name: string) => string;
}

export const UI: Record<ChatLanguage, ChatUiText> = {
  en: {
    why: 'WHY THIS HAPPENS',
    help: 'WHAT CAN HELP',
    doctor: 'WHEN TO SEE A DOCTOR',
    youCouldAsk: 'You could ask:',
    urgent: 'Please get help now — this needs a real person',
    typing: 'YourGoGirl is typing…',
    placeholder: 'Ask anything — periods, pain, mood, focus…',
    subtitleNoCycle: 'Periods · mood · focus',
    language: 'Reply in',
    menuExport: 'Export chat as text',
    menuDeleteAll: 'Delete whole chat',
    menuTip: 'Tip: press and hold a message to copy or delete it.',
    deleteOne: 'Delete message',
    copy: 'Copy text',
    cancel: 'Cancel',
    confirmDeleteAllTitle: 'Delete the whole chat?',
    confirmDeleteAllBody: 'All messages are removed from this phone. This cannot be undone.',
    confirmDeleteOneTitle: 'Delete this message?',
    confirmDeleteOneBody: 'It is removed from this phone.',
    delete: 'Delete',
    exported: 'Chat exported',
    switched: (name) => `Okay! I’ll reply in **${name}** now.`,
  },
  hinglish: {
    why: 'AISA KYUN HOTA HAI',
    help: 'KYA HELP KAREGA',
    doctor: 'DOCTOR KO KAB DIKHAYEIN',
    youCouldAsk: 'Aap yeh puch sakti ho:',
    urgent: 'Please abhi help lo — iske liye real insaan chahiye',
    typing: 'YourGoGirl likh rahi hai…',
    placeholder: 'Kuch bhi pucho — periods, dard, mood, focus…',
    subtitleNoCycle: 'Periods · mood · focus',
    language: 'Reply',
    menuExport: 'Chat ko text file mein export karo',
    menuDeleteAll: 'Poori chat delete karo',
    menuTip: 'Tip: message ko daba kar rakho — copy ya delete kar sakti ho.',
    deleteOne: 'Message delete karo',
    copy: 'Text copy karo',
    cancel: 'Cancel',
    confirmDeleteAllTitle: 'Poori chat delete karein?',
    confirmDeleteAllBody: 'Saare messages is phone se hat jaayenge. Wapas nahi aayenge.',
    confirmDeleteOneTitle: 'Yeh message delete karein?',
    confirmDeleteOneBody: 'Yeh is phone se hat jayega.',
    delete: 'Delete',
    exported: 'Chat export ho gayi',
    switched: (name) => `Theek hai! Ab main **${name}** mein reply karungi.`,
  },
  hi: {
    why: 'ऐसा क्यों होता है',
    help: 'क्या मदद करेगा',
    doctor: 'डॉक्टर को कब दिखाएँ',
    youCouldAsk: 'आप यह पूछ सकती हैं:',
    urgent: 'कृपया अभी मदद लें — इसके लिए असली इंसान चाहिए',
    typing: 'YourGoGirl लिख रही है…',
    placeholder: 'कुछ भी पूछें — पीरियड, दर्द, मूड, फ़ोकस…',
    subtitleNoCycle: 'पीरियड · मूड · फ़ोकस',
    language: 'जवाब',
    menuExport: 'चैट को टेक्स्ट फ़ाइल में एक्सपोर्ट करें',
    menuDeleteAll: 'पूरी चैट डिलीट करें',
    menuTip: 'सुझाव: किसी मैसेज को दबाकर रखें — कॉपी या डिलीट कर सकती हैं।',
    deleteOne: 'मैसेज डिलीट करें',
    copy: 'टेक्स्ट कॉपी करें',
    cancel: 'रद्द करें',
    confirmDeleteAllTitle: 'पूरी चैट डिलीट करें?',
    confirmDeleteAllBody: 'सारे मैसेज इस फ़ोन से हट जाएँगे। यह वापस नहीं होगा।',
    confirmDeleteOneTitle: 'यह मैसेज डिलीट करें?',
    confirmDeleteOneBody: 'यह इस फ़ोन से हट जाएगा।',
    delete: 'डिलीट',
    exported: 'चैट एक्सपोर्ट हो गई',
    switched: (name) => `ठीक है! अब मैं **${name}** में जवाब दूँगी।`,
  },
};

export const LANGUAGE_OPTIONS: { id: ChatLanguageSetting; label: string; name: string }[] = [
  { id: 'auto', label: 'Auto', name: 'Auto' },
  { id: 'en', label: 'English', name: 'English' },
  { id: 'hinglish', label: 'Hinglish', name: 'Hinglish' },
  { id: 'hi', label: 'हिन्दी', name: 'हिन्दी' },
];

/** Button labels under replies. */
const ACTION_LABELS: Record<string, { hinglish: string; hi: string }> = {
  'Call Tele-MANAS 14416': { hinglish: 'Tele-MANAS 14416 call karo', hi: 'टेली-मानस 14416 पर कॉल करें' },
  'Emergency 112': { hinglish: 'Emergency 112', hi: 'इमरजेंसी 112' },
  'Women Helpline 181': { hinglish: 'Women Helpline 181', hi: 'महिला हेल्पलाइन 181' },
  'NCW 14490': { hinglish: 'NCW 14490', hi: 'NCW 14490' },
  'Open Care Connect': { hinglish: 'Care Connect kholo', hi: 'Care Connect खोलें' },
  'Add period dates': { hinglish: 'Period dates add karo', hi: 'पीरियड की तारीख़ें जोड़ें' },
  'Log pain': { hinglish: 'Dard log karo', hi: 'दर्द लॉग करें' },
  'Log flow': { hinglish: 'Flow log karo', hi: 'फ़्लो लॉग करें' },
  'Start a breathing exercise': { hinglish: 'Breathing exercise shuru karo', hi: 'साँस की एक्सरसाइज़ शुरू करें' },
  'Open SOS': { hinglish: 'SOS kholo', hi: 'SOS खोलें' },
  'Plan exams around my cycle': { hinglish: 'Exams ko cycle ke hisaab se plan karo', hi: 'परीक्षाएँ चक्र के हिसाब से प्लान करें' },
  'Open Study Focus': { hinglish: 'Study Focus kholo', hi: 'Study Focus खोलें' },
  'Open Fitness': { hinglish: 'Fitness kholo', hi: 'Fitness खोलें' },
  'Share these questions': { hinglish: 'Yeh sawaal share karo', hi: 'ये सवाल शेयर करें' },
  'Open doctor report': { hinglish: 'Doctor report kholo', hi: 'डॉक्टर रिपोर्ट खोलें' },
};

export function translateActionLabel(label: string, lang: ChatLanguage): string {
  if (lang === 'en') return label;
  return ACTION_LABELS[label]?.[lang] ?? label;
}

export const TOPIC_NAMES: Record<ChatLanguage, Record<string, string>> = {
  en: {
    menstruation: 'periods & pain',
    disturbances: 'your cycle',
    emotional: 'how you’re feeling',
    focus: 'focus & studying',
    motivation: 'motivation',
    body: 'your body',
    general: 'SheSync',
    safety: 'your safety',
  },
  hinglish: {
    menstruation: 'periods aur dard',
    disturbances: 'aapka cycle',
    emotional: 'aap kaisa feel kar rahi ho',
    focus: 'focus aur padhai',
    motivation: 'motivation',
    body: 'aapki body',
    general: 'SheSync',
    safety: 'aapki safety',
  },
  hi: {
    menstruation: 'पीरियड और दर्द',
    disturbances: 'आपका साइकिल',
    emotional: 'आप कैसा महसूस कर रही हैं',
    focus: 'फ़ोकस और पढ़ाई',
    motivation: 'मोटिवेशन',
    body: 'आपका शरीर',
    general: 'SheSync',
    safety: 'आपकी सुरक्षा',
  },
};

/** Lines the engine writes itself (not from the knowledge base). */
export const ENGINE_TEXT: Record<
  ChatLanguage,
  {
    alsoMentioned: (topic: string) => string;
    askAbout: (topic: string) => string;
    goDeeper: string;
    notSure: (name: string) => string;
    welcome: (name: string) => string;
  }
> = {
  en: {
    alsoMentioned: (t) => `You also mentioned something about **${t}** — tap below if you want to talk about that too.`,
    askAbout: (t) => `Tell me about ${t}`,
    goDeeper: 'Happy to go deeper. Here’s what I can tell you more about — pick one, or ask in your own words:',
    notSure: (n) =>
      `I want to make sure I give you the right answer${n ? `, ${n}` : ''}, and I'm not sure I understood. Could you tell me a bit more — is it about your **period or cycle**, your **body**, your **mood**, or **studying and focus**?\n\nI'm a built-in guide for periods, cycle health and wellbeing. For anything outside that — or if you're worried about your health — a doctor or counsellor is the right person, and Care Connect can help you reach one.`,
    welcome: (n) =>
      `Hi${n ? ` ${n}` : ''}, I'm **YourGoGirl** 💜 Ask me anything about periods, your cycle, mood or focus — in your own words. I can reply in English, Hinglish or हिन्दी (tap the language above).\n\nI'm not a doctor, but I'll tell you clearly when something needs one.`,
  },
  hinglish: {
    alsoMentioned: (t) => `Aapne **${t}** ke baare mein bhi kuch kaha — us par baat karni ho toh neeche tap karo.`,
    askAbout: (t) => `${t} ke baare mein batao`,
    goDeeper: 'Zaroor, aur detail mein batati hoon. Inme se kuch chuno, ya apne words mein pucho:',
    notSure: (n) =>
      `Main aapko sahi answer dena chahti hoon${n ? `, ${n}` : ''}, aur mujhe lagta hai main poori tarah samjhi nahi. Thoda aur batao — yeh **period ya cycle**, **body**, **mood**, ya **padhai aur focus** ke baare mein hai?\n\nMain periods, cycle health aur wellbeing ki built-in guide hoon. Iske bahar ki baat ho — ya health ki chinta ho — toh doctor ya counsellor sahi insaan hain, aur Care Connect unse jodne mein help kar sakta hai.`,
    welcome: (n) =>
      `Hi${n ? ` ${n}` : ''}, main **YourGoGirl** hoon 💜 Periods, cycle, mood ya focus ke baare mein kuch bhi pucho — apne words mein. Main English, Hinglish ya हिन्दी mein reply kar sakti hoon (upar language chuno).\n\nMain doctor nahi hoon, par jab doctor ki zaroorat hogi, saaf bataungi.`,
  },
  hi: {
    alsoMentioned: (t) => `आपने **${t}** के बारे में भी कुछ कहा — उस पर बात करनी हो तो नीचे टैप करें।`,
    askAbout: (t) => `${t} के बारे में बताएँ`,
    goDeeper: 'ज़रूर, और विस्तार से बताती हूँ। इनमें से कुछ चुनें, या अपने शब्दों में पूछें:',
    notSure: (n) =>
      `मैं आपको सही जवाब देना चाहती हूँ${n ? `, ${n}` : ''}, और मुझे लगता है मैं पूरी तरह समझी नहीं। थोड़ा और बताइए — यह **पीरियड या साइकिल**, **शरीर**, **मूड**, या **पढ़ाई और फ़ोकस** के बारे में है?\n\nमैं पीरियड, साइकिल की सेहत और मन की देखभाल की बिल्ट-इन गाइड हूँ। इसके बाहर की बात हो — या सेहत की चिंता हो — तो डॉक्टर या काउंसलर सही इंसान हैं, और Care Connect उनसे जोड़ने में मदद कर सकता है।`,
    welcome: (n) =>
      `नमस्ते${n ? ` ${n}` : ''}, मैं **YourGoGirl** हूँ 💜 पीरियड, साइकिल, मूड या फ़ोकस के बारे में कुछ भी पूछिए — अपने शब्दों में। मैं English, Hinglish या हिन्दी में जवाब दे सकती हूँ (ऊपर भाषा चुनें)।\n\nमैं डॉक्टर नहीं हूँ, पर जब डॉक्टर की ज़रूरत होगी, साफ़ बताऊँगी।`,
  },
};

/** Quick topic chips above the chat, in each language. */
export const QUICK_TOPIC_LABELS: Record<string, { hinglish: string; hi: string }> = {
  doctor_prep: { hinglish: 'Doctor visit prep', hi: 'डॉक्टर विज़िट की तैयारी' },
  cramps: { hinglish: 'Period cramps', hi: 'पीरियड क्रैम्प्स' },
  late: { hinglish: 'Late period', hi: 'देर से पीरियड' },
  next: { hinglish: 'Agla period', hi: 'अगला पीरियड' },
  mood: { hinglish: 'Mood swings', hi: 'मूड स्विंग' },
  focus: { hinglish: 'Brain fog', hi: 'ध्यान नहीं लगता' },
  motivation: { hinglish: 'No motivation', hi: 'मन नहीं लगता' },
  heavy: { hinglish: 'Heavy flow', hi: 'ज़्यादा ब्लीडिंग' },
  pcos: { hinglish: 'PCOS', hi: 'PCOS' },
  calm: { hinglish: 'Shaant karo', hi: 'मन शांत करें' },
};
