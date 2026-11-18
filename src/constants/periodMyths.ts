/**
 * Daily myth-buster: common Indian period myths, with the fact in plain words
 * and where it comes from. One card a day on Home, in a fixed order, so
 * everyone sees the same myth on the same day.
 *
 * Religious customs are treated with respect: the card says what is true
 * about the body and leaves the choice about customs to her.
 */
export interface PeriodMyth {
  id: string;
  myth: string;
  fact: string;
  /** One or two short sentences of explanation. */
  why: string;
  source: { name: string; url: string };
}

const NHS_PERIODS = { name: 'NHS — Periods', url: 'https://www.nhs.uk/conditions/periods/' };
const NHS_PAIN = { name: 'NHS — Period pain', url: 'https://www.nhs.uk/conditions/period-pain/' };
const NHS_HEAVY = { name: 'NHS — Heavy periods', url: 'https://www.nhs.uk/conditions/heavy-periods/' };
const NHS_FERTILITY = {
  name: 'NHS — Periods and fertility',
  url: 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/',
};
const NHS_PCOS = { name: 'NHS — PCOS', url: 'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/' };
const NHS_PMS = { name: 'NHS — PMS', url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/' };
const NHS_ENDO = { name: 'NHS — Endometriosis', url: 'https://www.nhs.uk/conditions/endometriosis/' };
const NHS_IRREGULAR = { name: 'NHS — Irregular periods', url: 'https://www.nhs.uk/conditions/irregular-periods/' };
const NHS_MISSED = { name: 'NHS — Stopped or missed periods', url: 'https://www.nhs.uk/conditions/stopped-or-missed-periods/' };
const NHS_DISCHARGE = { name: 'NHS — Vaginal discharge', url: 'https://www.nhs.uk/conditions/vaginal-discharge/' };
const UNICEF = {
  name: 'UNICEF India — Busting period myths',
  url: 'https://www.unicef.org/india/stories/busting-myths-and-misconceptions-around-menstruation',
};
const WHO = {
  name: 'WHO — Menstrual health and rights',
  url: 'https://www.who.int/news/item/22-06-2022-who-statement-on-menstrual-health-and-rights',
};
const SWIM = {
  name: 'Swim England — Periods and swimming',
  url: 'https://www.swimming.org/justswim/menstrual-cycle-information-for-aquatic-participants/',
};
const IWP = {
  name: 'India Water Portal — Myths busted',
  url: 'https://www.indiawaterportal.org/articles/breaking-silence-menstruation-myths-busted',
};

export const PERIOD_MYTHS: PeriodMyth[] = [
  {
    id: 'pickle',
    myth: 'If you touch the pickle jar on your period, the pickle will spoil.',
    fact: 'A period cannot spoil pickle.',
    why: 'Pickle goes bad from moisture, air, a wet spoon or too little salt and oil — not from who touches the jar. Clean, dry hands are all that matter.',
    source: UNICEF,
  },
  {
    id: 'hair-wash',
    myth: 'Don’t bathe or wash your hair during your period.',
    fact: 'Bathing and washing your hair are safe — and good for you.',
    why: 'Staying clean lowers the chance of rashes and infection, and a warm bath or shower can ease cramps.',
    source: NHS_PAIN,
  },
  {
    id: 'exercise',
    myth: 'You should rest completely and not exercise on your period.',
    fact: 'Gentle exercise often makes cramps better.',
    why: 'Walking, yoga, stretching or swimming release endorphins, the body’s own pain relievers. Rest on days you need it — both are fine.',
    source: NHS_PAIN,
  },
  {
    id: 'kitchen',
    myth: 'Food cooked by a woman on her period is impure or will go bad.',
    fact: 'Food you cook on your period is just as safe as any other day.',
    why: 'What keeps food safe is washing hands and clean utensils. Menstruation has no effect on food.',
    source: IWP,
  },
  {
    id: 'temple',
    myth: 'A period makes a woman’s body impure or unclean.',
    fact: 'A period is a normal, healthy body process — nothing about it is impure.',
    why: 'Whether you follow a religious or family custom during your period is your own choice. Medically, your body is not dirty or unsafe to be near.',
    source: WHO,
  },
  {
    id: 'sour-food',
    myth: 'Eating curd, tamarind or sour food on your period increases pain or stops the flow.',
    fact: 'No food stops your flow or causes cramps.',
    why: 'Curd is actually a good source of calcium. A balanced plate with iron-rich food (dal, rajma, greens) and water helps most.',
    source: NHS_PERIODS,
  },
  {
    id: 'cold',
    myth: 'Cold water or ice cream on your period will block the blood and cause clots.',
    fact: 'Cold food and drinks don’t change your flow.',
    why: 'Blood flows from the womb, not the stomach, so what you eat or drink can’t block it. Some people simply find warm drinks more comforting for cramps.',
    source: NHS_PERIODS,
  },
  {
    id: 'pregnancy',
    myth: 'You cannot get pregnant from sex during your period.',
    fact: 'It is less likely, but it can happen.',
    why: 'Sperm can live up to 7 days inside the body, and in shorter cycles you might ovulate soon after your period ends.',
    source: NHS_FERTILITY,
  },
  {
    id: 'dirty-blood',
    myth: 'Period blood is dirty blood that the body is throwing out.',
    fact: 'Period blood is ordinary blood mixed with the lining of the womb.',
    why: 'Each month the womb builds a lining in case of pregnancy and sheds it when there isn’t one. It isn’t toxic or “bad blood”.',
    source: UNICEF,
  },
  {
    id: 'pain-normal',
    myth: 'Very bad period pain is normal — every woman just has to bear it.',
    fact: 'Pain that stops your daily life is worth a doctor’s visit.',
    why: 'Conditions like endometriosis often go undiagnosed for years because pain is brushed off. They can be treated.',
    source: NHS_ENDO,
  },
  {
    id: 'separate',
    myth: 'A woman on her period should sleep separately and not touch others.',
    fact: 'Periods are not contagious, and touching anyone is completely safe.',
    why: 'Being kept apart can make girls feel ashamed and miss school or rest. Health experts call for ending period stigma.',
    source: WHO,
  },
  {
    id: 'cup-virginity',
    myth: 'Unmarried girls should not use tampons or menstrual cups.',
    fact: 'Tampons and menstrual cups are safe at any age, married or not.',
    why: 'They are just period products. Use the size and absorbency that suit you, and follow the change times on the pack.',
    source: NHS_PERIODS,
  },
  {
    id: 'irregular-pcos',
    myth: 'Irregular periods always mean you have PCOS.',
    fact: 'Many things can make periods irregular.',
    why: 'Stress, big weight changes, intense exercise, thyroid problems and the first few years after periods start are common reasons. A doctor can find the cause.',
    source: NHS_IRREGULAR,
  },
  {
    id: 'pcos-pregnancy',
    myth: 'If you have PCOS, you can never have a baby.',
    fact: 'Many women with PCOS get pregnant, sometimes with a little help.',
    why: 'PCOS can make ovulation less regular, and there are simple treatments that help it happen.',
    source: NHS_PCOS,
  },
  {
    id: 'plants',
    myth: 'Plants wilt if a woman on her period waters or touches them.',
    fact: 'Your period has no effect on plants.',
    why: 'Plants wilt from too much or too little water, heat or pests. Water your tulsi any day you like.',
    source: IWP,
  },
  {
    id: 'cloth-shade',
    myth: 'Cloth pads should be dried hidden away indoors so no one sees them.',
    fact: 'Wash cloth pads with soap and dry them fully in sunlight.',
    why: 'Sunlight and complete drying help kill germs. Damp cloth kept in the dark can cause itching and infections.',
    source: UNICEF,
  },
  {
    id: 'heavy-normal',
    myth: 'Soaking a pad every hour is just a “strong period”.',
    fact: 'Changing every 1–2 hours, big clots or bleeding over 7 days are heavy periods.',
    why: 'Heavy periods can cause low iron and tiredness, and they are treatable. Feeling dizzy or faint while bleeding needs help the same day.',
    source: NHS_HEAVY,
  },
  {
    id: 'pms-head',
    myth: 'PMS is just in your head — you are being dramatic.',
    fact: 'PMS is real and comes from hormone changes before a period.',
    why: 'Mood swings, tiredness, bloating and tender breasts are common. When they are severe, doctors can treat them.',
    source: NHS_PMS,
  },
  {
    id: 'painkillers',
    myth: 'Taking painkillers for period pain is harmful or a bad habit.',
    fact: 'Painkillers like ibuprofen are safe for most people at the dose on the pack.',
    why: 'They work best taken with food at the very start of the pain. If you have asthma, stomach ulcers or kidney problems, ask a pharmacist first.',
    source: NHS_PAIN,
  },
  {
    id: '28-days',
    myth: 'A healthy cycle is always exactly 28 days.',
    fact: 'Cycles of different lengths are normal.',
    why: 'Most cycles fall somewhere between about 21 and 40 days, and teenagers’ cycles vary even more. What matters is your own pattern — tell a doctor if it changes a lot.',
    source: NHS_PERIODS,
  },
  {
    id: 'exam-missed',
    myth: 'A missed period during exams means something is badly wrong.',
    fact: 'Stress can delay a period for a while.',
    why: 'If there is a chance of pregnancy, take a test. If you miss 3 periods in a row, see a doctor.',
    source: NHS_MISSED,
  },
  {
    id: 'school-sport',
    myth: 'Girls should skip school, sport or swimming during periods.',
    fact: 'You can study, play and swim on your period.',
    why: 'Swimming with a tampon or cup is hygienic and safe, and moving often helps cramps. Pack a spare pad and you are set.',
    source: SWIM,
  },
  {
    id: 'papaya',
    myth: 'Eating papaya or hot foods will bring a late period on.',
    fact: 'No food reliably brings a late period on.',
    why: 'If your period is late, take a pregnancy test if there is any chance, and see a doctor if you miss 3 periods in a row.',
    source: NHS_MISSED,
  },
  {
    id: 'blood-loss',
    myth: 'Every period drains a lot of blood and leaves you weak.',
    fact: 'Most people lose only a few tablespoons of blood in a whole period.',
    why: 'Feeling very tired or breathless can mean low iron, often from heavy periods — a simple blood test can check.',
    source: NHS_HEAVY,
  },
  {
    id: 'discharge',
    myth: 'White discharge (“safed pani”) is a disease that makes you weak.',
    fact: 'White or clear discharge is normal and keeps the vagina healthy.',
    why: 'It changes through your cycle. See a doctor if it itches, smells bad, or turns green, grey or yellow.',
    source: NHS_DISCHARGE,
  },
  {
    id: 'shame',
    myth: 'Periods are private and shameful — never talk about them.',
    fact: 'Talking openly about periods keeps girls healthy.',
    why: 'When girls and boys learn the facts early, fewer girls miss school, and problems get noticed and treated sooner.',
    source: WHO,
  },
];

/** Same card for everyone on the same calendar day. */
export function mythForDate(date = new Date()): PeriodMyth {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return PERIOD_MYTHS[((day % PERIOD_MYTHS.length) + PERIOD_MYTHS.length) % PERIOD_MYTHS.length];
}
