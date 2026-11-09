import type {
  BiometricSnapshot,
  CounsellorMode,
  CycleData,
  FineTuningSettings,
  SymptomLog,
  YourGoGirlMessage,
} from '@/types';

export interface CounsellorContext {
  userName: string;
  cycle: CycleData;
  biometrics: BiometricSnapshot;
  symptomLogs: SymptomLog[];
  fineTuningSettings: FineTuningSettings;
  mode: CounsellorMode;
}

export interface QuickPromptTopic {
  id: string;
  label: string;
  prompt: string;
  category: YourGoGirlMessage['category'];
  emoji: string;
}

export const QUICK_PROMPT_TOPICS: QuickPromptTopic[] = [
  {
    id: 'loss-of-motivation',
    label: 'Loss of Motivation',
    prompt:
      'I have zero motivation today and feel guilty for not getting enough done during my cycle.',
    category: 'motivation',
    emoji: '🔋',
  },
  {
    id: 'loss-of-focus',
    label: 'Brain Fog & Focus',
    prompt:
      "I can't focus at all today. My mind feels foggy and scattered—how do I cope with menstrual brain fog?",
    category: 'focus',
    emoji: '🌫️',
  },
  {
    id: 'menstrual-disturbances',
    label: 'Cycle Disturbances',
    prompt:
      'My periods have been irregular and unpredictable lately. Why does this happen and what can I do?',
    category: 'disturbances',
    emoji: '🌸',
  },
  {
    id: 'cramps-pain',
    label: 'Period Cramps & Pain',
    prompt:
      'I am dealing with painful menstrual cramps, pelvic heaviness, and lower back ache right now.',
    category: 'menstruation',
    emoji: '🫖',
  },
  {
    id: 'emotional-overwhelm',
    label: 'Mood Swings & PMDD',
    prompt:
      'I feel unusually tearful, anxious, and emotionally overwhelmed before my period. Can you counsel me through this?',
    category: 'emotional',
    emoji: '💜',
  },
  {
    id: 'heavy-flow-fatigue',
    label: 'Heavy Flow & Exhaustion',
    prompt:
      'My flow feels heavy and I am physically drained and dizzy. How should I take care of my body today?',
    category: 'menstruation',
    emoji: '🩸',
  },
];

export const COUNSELLOR_MODES: {
  id: CounsellorMode;
  label: string;
  subtitle: string;
}[] = [
  {
    id: 'empathetic_counsellor',
    label: 'Warm Counsellor',
    subtitle: 'Compassionate validation & emotional support',
  },
  {
    id: 'focus_motivation',
    label: 'Focus & Drive Coach',
    subtitle: 'Gentle strategies for brain fog & low motivation',
  },
  {
    id: 'cycle_disturbances',
    label: 'Cycle & Hormone Guide',
    subtitle: 'PCOS, irregular periods, cramps & flow clarity',
  },
  {
    id: 'somatic_cbt',
    label: 'Somatic & CBT Reset',
    subtitle: 'Nervous system calming & cognitive reframing',
  },
];

export function createInitialWelcomeMessage(
  userName: string,
  cycle: CycleData,
  biometrics: BiometricSnapshot
): YourGoGirlMessage {
  const name = userName || 'lovely';
  const phaseFormatted =
    cycle.phase.charAt(0).toUpperCase() + cycle.phase.slice(1);

  return {
    id: 'welcome-yourgogirl',
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    category: 'general',
    mode: 'empathetic_counsellor',
    text: `Hi ${name}, I'm **YourGoGirl** — your personal women's health & emotional counsellor. 💜\n\nI'm synced with your bio-adaptive profile on **Day ${cycle.currentDay} (${phaseFormatted} Phase)** with a daily strain score of **${biometrics.strainScore}%**. Whether you're navigating period pain, cycle disturbances, a sudden loss of motivation, brain fog, or heavy emotions, this is your safe, judgment-free space.\n\nTake a gentle breath. What is weighing on your body or mind today?`,
    biologicalWhy: `Your body is in the ${phaseFormatted} phase (${cycle.conditions.join(', ') || 'Bio-Adaptive Sync'}). With HRV at ${biometrics.hrv.current} ms and cortisol ${biometrics.cortisol.level}, your nervous system deserves gentleness rather than pressure today.`,
    gentleActionSteps: [
      'Tap any quick topic below or type freely about your period, cycle irregularities, focus, motivation, or mood.',
      'Switch my counselling lens anytime above (Warm Counsellor, Focus & Drive Coach, Cycle & Hormone Guide, or Somatic & CBT Reset).',
    ],
    affirmation:
      'My worth is not measured by my productivity across every phase of my cycle.',
    followUpSuggestions: [
      'Why have I lost all motivation lately?',
      'Help me focus through severe brain fog',
      'Why is my period irregular or delayed?',
      'How do I soothe painful cramps naturally?',
    ],
  };
}

/**
 * Classifies user query into primary women's health / counselling domains
 */
function detectTopicCategory(
  input: string,
  mode: CounsellorMode
): {
  primary: YourGoGirlMessage['category'];
  subtopics: string[];
} {
  const q = input.toLowerCase();
  const subtopics: string[] = [];

  const isFocus =
    /focus|concentrat|brain fog|foggy|distract|study|work|forget|memory|attention|scatter|procrastinat|adhd|productive|clarity/.test(
      q
    );
  const isMotivation =
    /motivat|lazy|laziness|unmotivated|drive|ambition|tired|exhaust|letharg|burnout|burnt out|guilt|behind|energy|slump|bed|cant get up|can't get up|no energy/.test(
      q
    );
  const isDisturbance =
    /irregular|late|missed|delay|pcos|pcod|spotting|clot|heavy|prolonged|short cycle|long cycle|anovulat|disturbance|unpredictable|skip|absent|amenorrhea|menorrhagia|hormon|thyroid|endometrio|fibroid/.test(
      q
    );
  const isMenstruationPain =
    /cramp|pain|period|menstrua|bleed|flow|pelvic|backache|lower back|bloat|nausea|headache|migraine|breast|tender|pms|pad|tampon|cup|dysmenorrhea/.test(
      q
    );
  const isEmotional =
    /sad|cry|tear|depress|anxious|anxiety|angry|irritab|mood|pmdd|overwhelm|lonely|hopeless|stress|panic|rage|emotion|insecure|body image|craving/.test(
      q
    );

  if (isFocus) subtopics.push('focus');
  if (isMotivation) subtopics.push('motivation');
  if (isDisturbance) subtopics.push('disturbances');
  if (isMenstruationPain) subtopics.push('menstruation');
  if (isEmotional) subtopics.push('emotional');

  if (isFocus && (!isMotivation || q.includes('focus') || q.includes('fog'))) {
    return { primary: 'focus', subtopics };
  }
  if (isMotivation) {
    return { primary: 'motivation', subtopics };
  }
  if (isDisturbance) {
    return { primary: 'disturbances', subtopics };
  }
  if (isMenstruationPain) {
    return { primary: 'menstruation', subtopics };
  }
  if (isEmotional) {
    return { primary: 'emotional', subtopics };
  }

  // Fallback based on selected mode
  if (mode === 'focus_motivation') return { primary: 'focus', subtopics };
  if (mode === 'cycle_disturbances') return { primary: 'disturbances', subtopics };
  if (mode === 'somatic_cbt') return { primary: 'emotional', subtopics };

  return { primary: 'general', subtopics };
}

/**
 * Generates a deeply empathetic, bio-adaptive response tailored to the user's message and cycle state.
 * Also supports optional live Gemini API call if EXPO_PUBLIC_GEMINI_API_KEY is configured.
 */
export async function generateYourGoGirlResponse(
  userText: string,
  ctx: CounsellorContext
): Promise<YourGoGirlMessage> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const liveReply = await fetchGeminiCounsellorReply(userText, ctx, apiKey.trim());
      if (liveReply) return liveReply;
    } catch {
      // Fall back gracefully to built-in bio-adaptive counsellor engine
    }
  }

  // Simulate natural counsellor thinking pause (450ms)
  await new Promise((resolve) => setTimeout(resolve, 450));

  return buildBioAdaptiveCounsellorReply(userText, ctx);
}

async function fetchGeminiCounsellorReply(
  userText: string,
  ctx: CounsellorContext,
  apiKey: string
): Promise<YourGoGirlMessage | null> {
  const systemPrompt = `You are "YourGoGirl", a compassionate, clinically-informed AI Women's Health & Menstruation Counsellor inside the SheSync app.
User context:
- Name: ${ctx.userName || 'Maya'}
- Cycle Day: Day ${ctx.cycle.currentDay}, Phase: ${ctx.cycle.phase} (${ctx.cycle.label})
- Tracked Conditions: ${ctx.cycle.conditions.join(', ') || 'General Cycle Sync'}
- Biometrics: Strain ${ctx.biometrics.strainScore}% (${ctx.biometrics.strainLevel}), HRV ${ctx.biometrics.hrv.current}ms, Sleep ${ctx.biometrics.sleep.label}, Cortisol ${ctx.biometrics.cortisol.level}
- Active Counselling Mode: ${ctx.mode}

Respond as a warm, supportive female counsellor. Address any problem related to menstruation, menstrual disturbances (PCOS, irregular/late periods, heavy flow, spotting), loss of motivation, loss of focus/brain fog, or emotional overwhelm.
Return ONLY valid JSON with keys:
{
  "text": "Warm 2-3 paragraph counsellor response",
  "biologicalWhy": "1-2 sentence hormone/neuro-endocrine explanation tied to her cycle",
  "gentleActionSteps": ["Step 1", "Step 2", "Step 3"],
  "affirmation": "1 empowering first-person affirmation",
  "followUpSuggestions": ["Short follow-up question 1", "Short follow-up question 2", "Short follow-up question 3"]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser says: "${userText}"` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  const { primary } = detectTopicCategory(userText, ctx.mode);

  return {
    id: `bot-${Date.now()}`,
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    category: primary,
    mode: ctx.mode,
    text: parsed.text,
    biologicalWhy: parsed.biologicalWhy,
    gentleActionSteps: parsed.gentleActionSteps,
    affirmation: parsed.affirmation,
    followUpSuggestions: parsed.followUpSuggestions,
  };
}

function buildBioAdaptiveCounsellorReply(
  userText: string,
  ctx: CounsellorContext
): YourGoGirlMessage {
  const { primary, subtopics } = detectTopicCategory(userText, ctx.mode);
  const name = ctx.userName || 'sweetheart';
  const phase = ctx.cycle.phase;
  const day = ctx.cycle.currentDay;
  const strain = ctx.biometrics.strainScore;
  const hrv = ctx.biometrics.hrv.current;
  const sleepHours = `${ctx.biometrics.sleep.hoursSlept}h ${ctx.biometrics.sleep.minutesSlept}m`;
  const hasPCOS = ctx.cycle.conditions.includes('PCOS');
  const hasPMDD = ctx.cycle.conditions.includes('PMDD');
  const q = userText.toLowerCase();

  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. LOSS OF FOCUS / BRAIN FOG / CONCENTRATION
  if (primary === 'focus') {
    const isExamOrWork = /exam|study|deadline|work|office|project|meeting|class|college/.test(q);
    const modePrefix =
      ctx.mode === 'somatic_cbt'
        ? `Let's pause the mental spiral first, ${name}. When your brain feels foggy, forcing concentration triggers sympathetic stress that clouds your prefrontal cortex even further.`
        : `I hear you so clearly, ${name}. Trying to concentrate when your brain feels like it's wading through thick fog is deeply frustrating—especially when you have ${isExamOrWork ? 'important work or study deadlines' : 'responsibilities'} waiting on you.`;

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      timestamp,
      category: 'focus',
      mode: ctx.mode,
      text: `${modePrefix}\n\nFirst, please release any self-judgment: **menstrual and cycle-related brain fog is a real neurobiological shift, not a lack of discipline.** On **Day ${day} (${phase} phase)** with a strain score of **${strain}%** and **${sleepHours}** of recent sleep, your brain is actively reallocating glucose and neurotransmitter bandwidth.\n\nInstead of fighting your biology with harsh 4-hour focus marathons, let's counsel your mind into **"Low-Friction Focus"**—working *with* your hormonal wave rather than against it.`,
      biologicalWhy: `Estrogen directly modulates acetylcholine and dopamine in the prefrontal cortex (your center for working memory and sharp focus). When estrogen fluctuates or progesterone rises alongside elevated cortisol (${ctx.biometrics.cortisol.value} µg/dL), neural transmission naturally slows down to conserve metabolic energy.`,
      gentleActionSteps: [
        'Use the "12-Minute Gentle Sprint": Set a timer for just 12 minutes on ONE tiny, concrete task (e.g., outlining 3 bullet points), then take a 5-minute eyes-closed rest.',
        'Externalize Your Working Memory: Don\'t hold tasks in your head today. Write a "Brain Dump" of just 3 must-do items on paper and hide everything else.',
        'Sensory Awakening Reset: Sip cold water with a pinch of electrolytes or peppermint/rosemary tea, and do 60 seconds of slow box-breathing (4s inhale, 4s hold, 4s exhale) to restore prefrontal blood flow.',
        ...(subtopics.includes('motivation')
          ? [
              'Lower the Bar by 40%: Give yourself permission to produce a "B-minus draft" today—done gently is better than paralysed perfectionism.',
            ]
          : []),
      ],
      affirmation:
        'My mind moves in natural seasons; I honor my pace and trust my clarity to return.',
      followUpSuggestions: [
        'Can you help me break down one overwhelming task right now?',
        'What foods or drinks help clear menstrual brain fog?',
        'How do I stop feeling guilty about low productivity?',
      ],
    };
  }

  // 2. LOSS OF MOTIVATION / LETHARGY / GUILT / BURNOUT
  if (primary === 'motivation') {
    const mentionsGuilt = /guilt|lazy|useless|behind|fail|unproductive|bad about myself/.test(q);
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      timestamp,
      category: 'motivation',
      mode: ctx.mode,
      text: `Oh ${name}, take a deep breath and let your shoulders drop. 💜 ${
        mentionsGuilt
          ? 'That heavy voice calling you "lazy" or "behind" is lying to you—what you are experiencing is a physiological conservation state, not a character flaw.'
          : 'Feeling a sudden drop in drive and motivation during your cycle is one of the most universal yet misunderstood experiences women face.'
      }\n\nLook at what your body is carrying right now: you're on **Day ${day} (${phase} phase)**, your autonomic strain is at **${strain}%**, and your HRV is **${hrv} ms**. Expecting yourself to have linear, high-octane motivation every single day is an outdated standard built around a 24-hour male hormone clock—not a feminine infradian rhythm.\n\nAs your counsellor, I want you to trade **discipline through shame** for **compassionate pacing**. When your body asks for slowness, honoring it today actually prevents a week-long crash tomorrow.`,
      biologicalWhy: `Shifts in estrogen and progesterone alter baseline dopamine receptor sensitivity in the brain's reward pathway (the mesolimbic system). Combined with ${
        ctx.biometrics.sleep.deficit ? `your sleep deficit (${sleepHours})` : 'cyclical metabolic demand'
      }, your brain temporarily lowers "seeking/hustle drive" so your body can prioritize cellular and endocrine maintenance.`,
      gentleActionSteps: [
        'Do the "Minimum Viable Day" Exercise: Pick ONLY 1 essential task that truly matters today, and consciously cross off or postpone the rest without apology.',
        'Use the "5-Minute Cozy Entry": Pair a tiny task with physical comfort—wrap yourself in a warm blanket, put on a soothing playlist, and tell yourself you can stop after 5 minutes.',
        'Replenish Dopamine Gently: Step into natural sunlight for 3 minutes, eat a protein + complex-carb snack (like Greek yogurt with berries or dark chocolate & nuts), and celebrate tiny wins.',
      ],
      affirmation:
        'Rest is a productive biological necessity. I am allowed to move gently today.',
      followUpSuggestions: [
        'Help me plan a "Minimum Viable Day" for today',
        'Why do I feel so exhausted before and during my period?',
        'How do I explain my low energy to my partner or team?',
      ],
    };
  }

  // 3. MENSTRUAL DISTURBANCES (IRREGULAR, LATE, PCOS, HEAVY BLEEDING, SPOTTING)
  if (primary === 'disturbances') {
    const isLateOrMissed = /late|miss|delay|overdue|skip|absent|hasn't come|not coming|day 4/.test(q);
    const isHeavy = /heavy|clot|flood|soak|nonstop|prolonged|long period/.test(q);
    const isSpotting = /spot|brown|between period|pink discharge/.test(q);

    let specificGuidance = `Menstrual disturbances—whether irregular cycle lengths, unexpected spotting, or shifting flow patterns—are your body's **fifth vital sign** sending you a message rather than "breaking down."`;
    if (isLateOrMissed) {
      specificGuidance = `A delayed or irregular period happens when **ovulation was delayed or skipped** earlier in your cycle. Because stress, high cortisol (${ctx.biometrics.cortisol.value} µg/dL), sleep debt, or ${hasPCOS ? 'PCOS insulin signaling' : 'metabolic shifts'} can tell the hypothalamus to pause ovulation, your period waits accordingly.`;
    } else if (isHeavy) {
      specificGuidance = `Heavy menstrual bleeding or passing larger clots often reflects an **estrogen-to-progesterone imbalance** (where the uterine lining builds up thicker before shedding) or heightened local prostaglandins. It can leave your iron and ferritin stores deeply depleted.`;
    } else if (isSpotting) {
      specificGuidance = `Mid-cycle or pre-period spotting is frequently linked to a **luteal progesterone dip**, ovulatory estrogen shifts, or mild cervical/uterine sensitivity.`;
    }

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      timestamp,
      category: 'disturbances',
      mode: ctx.mode,
      text: `I'm right here with you, ${name}. Dealing with menstrual disturbances can feel so unsettling and isolating, especially when your body seems unpredictable. 🌸\n\n${specificGuidance}\n\nRight now in SheSync, your profile reflects **${ctx.cycle.label}** (${ctx.cycle.conditions.join(' & ') || 'Cycle Tracking'}). Remember: your ovaries and brain communicate along the **HPA-HPO axis** (Hypothalamic-Pituitary-Adrenal-Ovarian axis). When life stress, sleep, or blood sugar fluctuates, your cycle adapts to protect you.`,
      biologicalWhy: `The hypothalamus constantly scans cortisol (${ctx.biometrics.cortisol.level}), insulin sensitivity, thyroid hormones, and autonomic recovery (HRV ${hrv} ms). High allostatic strain (${strain}%) or ${hasPCOS ? 'elevated ovarian androgens/insulin in PCOS' : 'luteal progesterone fluctuations'} can shift GnRH pulsatility, altering ovulation timing and endometrial shedding.`,
      gentleActionSteps: [
        'Stabilize Blood Sugar & Cortisol: Eat balanced meals with 25-30g protein, healthy fats, and fiber every 3–4 hours; avoid fasting or high-cortisol HIIT when your strain is elevated.',
        'Track Patterns in SheSync: Log your flow intensity, color, and pain in the Home tab so your 90-Day Doctor Co-Pilot Report captures exact clinical trends.',
        isHeavy
          ? 'Protect Your Iron & Hydration: Pair iron-rich foods (spinach, lentils, lean meats, pumpkin seeds) with Vitamin C, and consult a gynecologist if you soak through a pad/tampon every 1–2 hours.'
          : 'Soothe Your HPA Axis Tonight: Aim for 30 minutes of screen-free wind-down and gentle diaphragmatic breathing before sleep to signal safety to your ovaries.',
      ],
      affirmation:
        'I listen to my body’s signals with curiosity and care instead of fear.',
      followUpSuggestions: [
        'How does stress or PCOS delay ovulation?',
        'What natural habits help regulate irregular cycles?',
        'When should I see a gynecologist about cycle changes?',
      ],
    };
  }

  // 4. MENSTRUATION PAIN, CRAMPS, BLOATING, PHYSICAL SYMPTOMS
  if (primary === 'menstruation') {
    const latestPain = ctx.symptomLogs.find((l) => l.pain !== undefined)?.pain ?? 6;
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      timestamp,
      category: 'menstruation',
      mode: ctx.mode,
      text: `I'm sending you so much warmth right now, ${name}. 🫖 Menstrual cramps, pelvic heaviness, and lower back aches can be exhausting—and women are far too often told to just "push through" pain that deserves real relief and tenderness.\n\nWith your recent logged discomfort around **${latestPain}/10** and your strain score at **${strain}%**, your uterus and pelvic floor are working hard. Let's focus on calming inflammation and releasing muscular guarding right now.`,
      biologicalWhy: `During menstruation, endometrial cells release **prostaglandins (PGF2α and PGE2)**, which trigger uterine smooth muscle contractions to shed the lining. When prostaglandin levels are high—or amplified by elevated cortisol and sleep debt—contractions temporarily restrict local blood flow, causing cramping spasms and radiating lower-back or thigh pain.`,
      gentleActionSteps: [
        'Continuous Heat Therapy (40°C / 104°F): Place a heating pad or warm water bottle over your lower abdomen or sacrum for 20 minutes—clinical studies show topical heat vasodilates uterine vessels as effectively as mild analgesics.',
        'Pelvic Floor Decompression: Lie on your back with knees resting wide in Reclined Butterfly (Supta Baddha Konasana) or Child’s Pose, breathing deep into your lower belly so your pelvic floor drops and softens.',
        'Anti-Inflammatory Sipping: Drink warm ginger, chamomile, or cinnamon tea and consider magnesium glycinate (200–300mg) to relax smooth muscle spasms.',
      ],
      affirmation:
        'I soften around my discomfort and give my body the warmth and rest it asks for.',
      followUpSuggestions: [
        'Guide me through a 2-minute pelvic relaxation breathing exercise',
        'Why do periods cause lower back pain and digestive bloating?',
        'What foods reduce menstrual cramps and inflammation?',
      ],
    };
  }

  // 5. EMOTIONAL OVERWHELM, PMDD, MOOD SWINGS, ANXIETY, TEARFULNESS
  if (primary === 'emotional') {
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      timestamp,
      category: 'emotional',
      mode: ctx.mode,
      text: `Oh ${name}, I'm wrapping you in the biggest virtual hug right now. 💜 Please hear me when I say this: **you are not "crazy," you are not "too sensitive," and you are not broken.**\n\nWhen your hormones shift—especially in the luteal or pre-menstrual window${hasPMDD ? ' with PMDD sensitivity' : ''}—it can feel like someone turned down the emotional dimmer switch on your whole world. Tears come easier, small triggers feel huge, and anxiety can hum in your chest.\n\nRight now, you don't need to fix your entire life or figure everything out today. We just need to help your nervous system feel safe for the next hour.`,
      biologicalWhy: `After ovulation and before menstruation, rising and then rapidly falling **allopregnanolone** (a neurosteroid metabolite of progesterone) interacts with **GABA-A receptors** in your amygdala and limbic system. Meanwhile, estrogen dips lower **serotonin** availability. Your brain's emotional alarm bell becomes biologically hyper-responsive.`,
      gentleActionSteps: [
        'Do 3 "Physiological Sighs" Right Now: Inhale deeply through your nose, take a second quick sip of air at the top, and exhale slowly with a long, audible sigh through your mouth. This immediately activates your vagus nerve.',
        'Practice the "Hormonal Weather" Rule: Postpone making major relationship, career, or self-worth conclusions for 72 hours. Remind yourself: "This is hormonal weather passing through my sky; it is not my permanent reality."',
        'Sensory Comfort Grounding: Change into your softest clothes, dim harsh overhead lights, hold a warm mug in both hands, or use the Somatic Video Library in the Mind tab.',
      ],
      affirmation:
        'These heavy feelings are a temporary biological wave, and I can ride this wave with self-compassion.',
      followUpSuggestions: [
        'Help me reframe a negative thought I am having about myself',
        'Why do I feel so irritable or tearful before my period?',
        'Walk me through a quick grounding exercise for anxiety',
      ],
    };
  }

  // 6. GENERAL / CONVERSATIONAL / HOLISTIC WOMEN'S COUNSELLOR FALLBACK
  return {
    id: `bot-${Date.now()}`,
    sender: 'bot',
    timestamp,
    category: 'general',
    mode: ctx.mode,
    text: `Thank you for sharing that with me, ${name}. 💜 As your women's health & emotional counsellor, I'm always looking at the whole picture of *you*—your mind, your heart, and your biology.\n\nRight now you're on **Day ${day} (${phase} phase)** with a strain score of **${strain}%** and HRV at **${hrv} ms**. Every shift in your menstrual cycle influences how you think, focus, feel motivated, and experience stress.\n\nTell me a little more about what feels hardest right now—is it physical discomfort (like cramps or fatigue), cycle unpredictability, feeling unmotivated and foggy, or emotional heaviness? We can unpack it step by step together.`,
    biologicalWhy: `Your infradian rhythm (your ~${ctx.cycle.expectedLength}-day hormone cycle) continuously shapes brain chemistry, metabolism, cortisol resilience, and autonomic tone alongside your 24-hour circadian rhythm.`,
    gentleActionSteps: [
      'Check in with your physical body: Unclench your jaw, drop your shoulders away from your ears, and take one slow belly breath.',
      `Honor your current phase: Match today's expectations to your ${phase} phase energy rather than forcing a pace that drains you.`,
      'Share freely: Ask me anything about periods, irregular cycles, PCOS/PMDD, motivation slumps, or focus strategies.',
    ],
    affirmation:
      'I am in tune with my body, and I deserve support in every phase of my cycle.',
    followUpSuggestions: [
      'I am struggling with loss of motivation and guilt',
      'I have brain fog and cannot focus on my work',
      'My menstrual cycle feels irregular and exhausting',
      'Help me calm my nervous system right now',
    ],
  };
}
