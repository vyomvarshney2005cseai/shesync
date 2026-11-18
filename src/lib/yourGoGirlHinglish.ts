/**
 * YourGoGirl answers in Hinglish (Roman-script Hindi mixed with English, the
 * way most young Indians text). Same medical content as the English answers
 * in yourGoGirlKnowledge.ts — keep them in step when either changes.
 * Only the words change: actions, urgency and follow-ups come from the
 * English intent.
 */
import type { Reply, ReplyCtx } from '@/lib/yourGoGirlKnowledge';

type T = (c: ReplyCtx) => Partial<Reply>;

const hi = (c: ReplyCtx) => (c.name ? `, ${c.name}` : '');

export function phaseLineHinglish(c: ReplyCtx): string {
  if (!c.hasCycleData || c.day <= 0) return '';
  switch (c.phase) {
    case 'menstrual':
      return `Aap day ${c.day} par ho — period ke din chal rahe hain.`;
    case 'follicular':
      return `Aap day ${c.day} par ho, period ke baad wala phase (follicular), jab energy usually badhti hai.`;
    case 'ovulatory':
      return `Aap day ${c.day} par ho, ovulation window ke aas-paas.`;
    case 'luteal':
      return `Aap day ${c.day} par ho, luteal phase mein — period se pehle ke 1–2 hafte, jab kai logon ko PMS hota hai.`;
    default:
      return `Aap day ${c.day} par ho, ek normal se lambe cycle mein.`;
  }
}

export const HINGLISH: Record<string, T> = {
  // ─── Safety ──────────────────────────────────────────────
  crisis_selfharm: (c) => ({
    text: `Mujhe sach mein accha laga ki aapne mujhe bataya${hi(c)}. Aap jo feel kar rahi ho woh matter karta hai, aur aapko yeh akele nahi uthana hai.\n\nPlease abhi kisi real insaan se baat karo. **Tele-MANAS (14416)** free, confidential aur 24×7 hai, aapki bhasha mein. Agar lag raha hai ki aap in thoughts par act kar sakti ho, ya aap khatre mein ho, toh **112** call karo ya sabse paas ke hospital jao.`,
    steps: [
      'Ho sake toh kisi bharosemand insaan ko abhi message ya call karo — dost, behen, parents ya teacher — aur bolo ki aapko unki zaroorat hai.',
      'Jis cheez se khud ko chot pahuncha sakti ho, usse door ho jao, aur aise jagah raho jahan aur log hon.',
      'Mere saath dheere saans lo: 4 tak andar, 6 tak bahar, das baar. Abhi bas agle kuch minute nikaalne hain.',
    ],
  }),
  abuse_violence: () => ({
    text: `Mujhe bahut afsos hai ki aapke saath aisa ho raha hai. **Isme aapki koi galti nahi hai**, aur aap safe rehne ki haqdaar ho.\n\nAgar abhi khatra hai toh **112** call karo. Help aur salah ke liye **Women Helpline 181** (24×7, free) aapko police, doctor, counselling, legal aid aur One Stop Centre se jod sakti hai.`,
    steps: [
      'Turant khatra ho toh 112 call karo.',
      '181 par call karke options samjho — aage kya hoga, yeh aap decide karogi.',
      '18+ women NCW helpline 14490 (24×7) par complaint aur support bhi le sakti hain.',
      'Safe ho toh ek bharosemand insaan ko batao, aur dates, messages ya photos ka private note rakho.',
    ],
  }),
  emergency_bleeding: (c) => ({
    text: `${c.name ? `${c.name}, isko` : 'Isko'} **aaj hi** medical care chahiye. Agar 2 ghante se zyada time tak har ghante pad ya tampon bhar raha hai, ya bleeding ke saath chakkar, kamzori ya saans phoolna ho raha hai, toh body bahut zyada khoon kho rahi ho sakti hai.\n\nPlease sabse paas ke hospital emergency jao, ya behoshi jaisa lage toh **112** call karo. Khud drive mat karo.`,
    steps: [
      'Chakkar aa rahe hain toh let jao aur pair upar rakho.',
      'Help aane tak thoda-thoda paani ya ORS piyo.',
      'Doctor ko batao pichhle kuch ghanton mein kitne pad lage, aur kya pregnancy ka koi chance hai.',
    ],
  }),
  pregnancy_emergency: () => ({
    text: `Agar aap pregnant ho sakti ho aur **pet mein tez ya ek taraf dard, kandhe ke upar dard, bleeding, ya behoshi jaisa** lag raha hai, toh please **aaj hi** doctor ko dikhao ya hospital emergency jao.\n\nIn signs ko jaldi check karna zaroori hai taaki ectopic pregnancy (bacchedani ke bahar pregnancy) rule out ho sake. Ho sakta hai kuch aur ho — par sure hona zaroori hai.`,
    steps: ['Dard bahut tez ho ya behoshi lage toh 112 call karo.', 'Wait mat karo ki apne aap theek ho jayega.', 'Doctor ko apne last period ki date batao.'],
  }),
  fever_pelvic: (c) => {
    const tampon = /tampon|cup/.test(c.text);
    return {
      text: tampon
        ? `**Tampon ya cup abhi nikaal do, aur aaj hi medical help lo.** Inhe use karte waqt bukhaar, rash, ulti, chakkar ya confusion toxic shock syndrome ho sakta hai — rare hai, par serious, aur jaldi pakda jaye toh ilaaj ho jata hai. Doctor ko batana ki aap tampon ya cup use kar rahi thi.`
        : `**Bukhaar ke saath neeche pet mein dard ya unusual discharge** bacchedani ya tubes ka infection (pelvic inflammatory disease) ho sakta hai. Please **aaj hi** doctor ko dikhao — isme antibiotics lagti hain, aur jaldi ilaaj se fertility safe rehti hai.`,
      steps: ['Bahut bimaar, confused ya behosh jaisa lage toh 112 call karo ya emergency jao.', 'Doctor tak pahunchne tak paani piyo aur aaram karo.'],
    };
  },
  severe_sudden_pain: () => ({
    text: `**Achanak, bahut tez pet ya pelvic dard ko aaj hi check karwana chahiye** — khaas kar ulti, bukhaar, behoshi ya ek taraf dard ke saath. Yeh twisted ya phata hua ovarian cyst, appendicitis, ya (pregnancy possible ho toh) ectopic pregnancy ho sakta hai.\n\nPlease hospital emergency jao ya **112** call karo.`,
    steps: ['Doctor ke dekhne tak zyada kuch mat khao-piyo, shayad procedure ki zaroorat pade.', 'Kisi ko saath le jao.'],
  }),

  // ─── General ─────────────────────────────────────────────
  greeting: (c) => ({
    text: `Hi${hi(c)}! 💜 Main yahin hoon. ${phaseLineHinglish(c)}\n\nAaj mann mein kya hai — period, body, mood, ya padhai aur focus? Apne words mein likh do.`.replace('  ', ' '),
  }),
  thanks: (c) => ({
    text: `Koi baat nahi${hi(c)}. 🌸 Khushi hui ki help kar payi. Kabhi bhi wapas aana — bas mann halka karne ke liye bhi.`,
    affirmation: 'Mujhe jagah lene aur help maangne ka poora haq hai.',
  }),
  bye: (c) => ({ text: `Apna khayal rakhna${hi(c)} 💜 Aaram karo, paani piyo, aur aaj khud se pyaar se pesh aao.` }),
  about_bot: () => ({
    text: `Main **YourGoGirl** hoon — SheSync ki built-in guide. Main periods aur cycle health samjha sakti hoon (cramps, late ya irregular periods, PCOS, heavy flow, discharge, hygiene), mood, anxiety, motivation aur padhai ke focus mein help kar sakti hoon, aur calming exercises karwa sakti hoon.\n\nMain **doctor nahi hoon** aur diagnose nahi karti. Jab aapki baat ke liye real doctor ya counsellor chahiye hoga, main saaf bataungi — aur Care Connect mein free helplines aur gynaecologist tak pahunchne ke tareeke hain.`,
    why: 'Aapki chat isi phone par rehti hai. Main aapke logged cycle day aur symptoms se answers ko personal banati hoon.',
  }),
  app_help: () => ({
    text: `SheSync mein cheezein yahan milengi:\n\n• **Period dates** — Home → Log Period (ya calendar). Har period ka pehla aur aakhri din tick karo.\n• **Pain, flow, mood** — Home → 10-second check-in ya quick log buttons. Roz 10 second bhi log karne se predictions aur advice kaafi better ho jaati hai.\n• **Doctor report** — Report tab aapke last 90 din ka PDF banata hai, gynaecologist ko dikhane ke liye.\n• **Pad change reminder** — Home → Pad Care. “I just changed” tap karo, time hone par yaad dila dega.\n• **Care Connect** — free helplines aur gynaecologist ya counsellor dhoondhne ke tareeke.`,
  }),

  // ─── Cycle & periods ─────────────────────────────────────
  cycle_basics: (c) => ({
    text: `Cycle **ek period ke pehle din se agle period ke pehle din tak** gina jata hai. Adults mein **24 se 38 din** tak normal hai, aur har mahine lagbhag ek hafte tak ka farak ho sakta hai. Bleeding usually **7–8 din tak** chalti hai.\n\nPeriods shuru hone ke pehle 2–3 saal cycles aksar irregular hote hain — yeh common hai.${c.hasCycleData && c.cycleLength ? `\n\nAapki saved dates ke hisaab se aapka cycle average lagbhag **${c.cycleLength} din** ka hai.` : ''}`,
    why: 'Cycle ke do hisse hote hain: ovulation se pehle (follicular — yahi hissa sabse zyada badalta hai) aur ovulation ke baad (luteal — usually 12–14 din).',
    doctor: 'Gynaecologist ko dikhao agar cycle aksar 24 din se chhota ya 38 din se lamba ho, har mahine ek hafte se kaafi zyada badle, bleeding 8 din se zyada chale, ya 3 mahine period na aaye.',
  }),
  next_period: (c) => {
    if (!c.hasCycleData || !c.nextPeriodDate) {
      return {
        text: `Aap apne last periods ki dates add karo toh main predict kar dungi${hi(c)}. Calendar par apne last 1–3 periods ke start aur end din tick karo — bas ek minute lagega.`,
      };
    }
    const d = c.daysUntilNext ?? 0;
    const when =
      d > 1
        ? `lagbhag **${d} din mein** (around **${c.nextPeriodDate}**)`
        : d === 1
        ? `**kal** (around ${c.nextPeriodDate})`
        : d === 0
        ? `**aaj ke aas-paas**`
        : `— yeh lagbhag **${Math.abs(d)} din late** hai`;
    return {
      text: `Aapki saved dates ke hisaab se agla period ${when} expected hai.${c.isIrregular ? '\n\nAapke cycles kaafi badalte hain, isliye isko kuch din aage-peeche ka rough window samjho.' : ''}`,
      why: 'Prediction aapke recent cycles ki average length se hota hai. Stress, bimaari, travel aur neend ya khaane mein bada badlaav period ko kuch din khiska sakta hai.',
      steps:
        d >= 0 && d <= 5
          ? ['Is hafte bag mein pad ya cup rakho.', 'Cramps hote hain toh heat pad ready rakho aur time par khana khao.', 'Jis din shuru ho, log kar dena — agla prediction aur sahi hoga.']
          : ['Period shuru hote hi log karo — har cycle se prediction aur accurate hota hai.'],
    };
  },
  my_phase: (c) => {
    if (!c.hasCycleData) {
      return { text: 'Apne last period ki dates add karo, phir main roz aapka cycle day aur phase bata sakti hoon.' };
    }
    const tips: Record<string, string[]> = {
      menstrual: ['Aaj aaram bhi productive hai — halke workouts, stretching ya walk.', 'Iron wala khaana (dal, rajma, palak, ande) vitamin C ke saath jo khoon gaya uski bharpai karta hai.'],
      follicular: ['Tough workouts aur nayi cheezein seekhne ka accha time — energy usually badhti hai.', 'Mushkil topics in dino ke liye plan karo.'],
      ovulatory: ['Energy aur mood aksar best hote hain.', 'Pregnancy avoid kar rahi ho toh yeh sabse fertile time hai.'],
      luteal: ['PMS (bloating, cravings, low mood) aa sakta hai — khaana aur neend regular rakho.', 'Thakaan lage toh kuch intense workouts ki jagah strength, yoga ya walk karo.'],
      irregular: ['Log karti raho — stress ya PCOS mein lambe cycles common hain.', '3 mahine se period nahi aaya toh gynaecologist ko dikhao.'],
    };
    return {
      text: `${phaseLineHinglish(c)}${c.nextPeriodDate && (c.daysUntilNext ?? 0) >= 0 ? ` Agla period around **${c.nextPeriodDate}** expected hai.` : ''}`,
      steps: tips[c.phase] ?? tips.irregular,
    };
  },
  phases_explained: () => ({
    text: `Cycle ke chaar phases hote hain:\n\n1. **Period (menstrual)** — day 1 se lagbhag 5 tak. Bacchedani ki lining nikalti hai. Energy kam ho sakti hai.\n2. **Follicular** — period ke baad ovulation tak. Oestrogen badhta hai; energy, mood aur focus usually better hote hain.\n3. **Ovulation** — egg release hota hai, agle period se lagbhag 14 din *pehle* (hamesha day 14 nahi). Yeh sabse fertile time hai.\n4. **Luteal** — ovulation ke baad period tak, usually 12–14 din. Progesterone badhkar girta hai, jisse PMS ho sakta hai: bloating, cravings, breasts mein dard, low ya chidchida mood.`,
    why: 'Follicular phase ki length badalti hai — isliye kuch cycles 25 din ke aur kuch 35 din ke hote hain.',
  }),
  ovulation: (c) => ({
    text: `Ovulation usually **agle period se lagbhag 14 din pehle** hota hai — 28 din ke cycle mein day 14 ke aas-paas, 35 din ke cycle mein day 21 ke aas-paas. **Fertile window** ovulation se pehle ke 5 din plus ovulation wala din hai.${c.hasCycleData && c.ovulationWindow ? `\n\nAapki dates se aapka likely ovulation window **${c.ovulationWindow}** hai.` : ''}`,
    steps: [
      'Signs: saaf, khinchne wala "egg-white" discharge, ek taraf halka sa dard, thodi zyada energy ya libido.',
      'Chemist se milne wali ovulation test strips confirm kar sakti hain.',
      '"Safe days" bharosemand contraception nahi hain — cycles khisakte hain, aur sperm 5 din tak zinda reh sakte hain.',
    ],
    doctor: 'Agar aap pregnancy try kar rahi ho aur 12 mahine (35 se upar ho toh 6 mahine) mein nahi hua, ya periods bahut irregular hain, toh gynaecologist ko dikhao.',
  }),
  late_period: (c) => ({
    text: `Period late hona bahut common hai${hi(c)}, aur aksar wajah simple hoti hai.\n\n**Agar pregnancy ka zara bhi chance hai, toh pehle home pregnancy test karo** — yeh period due hone wale din se, ya sex ke 3 hafte baad sabse reliable hota hai. Negative aaye aur period phir bhi na aaye, toh ek hafte baad dobara test karo.${c.hasCycleData && (c.daysUntilNext ?? 0) < 0 ? `\n\nAapki saved dates ke hisaab se aap predicted date se lagbhag **${Math.abs(c.daysUntilNext ?? 0)} din** aage ho.` : ''}`,
    why: 'Period ovulation ke lagbhag 2 hafte baad aata hai. Stress, bimaari, travel, kam neend, achanak weight change, zyada exercise, thyroid ya PCOS ovulation ko late kar sakte hain — aur period bhi saath mein late hota hai.',
    steps: [
      'Chance ho toh pregnancy test karo.',
      'Socho: exams, stress, bimaari, travel, diet ya exercise mein bada badlaav?',
      'Log karti raho — sirf ek late period aksar chinta ki baat nahi hota.',
    ],
    doctor: 'Gynaecologist ko dikhao agar lagaatar 3 periods miss hue hain (test negative ke saath), periods irregular ho gaye hain, ya saath mein weight change, chehre par extra baal, acne ya bahut thakaan hai.',
  }),
  stress_period: () => ({
    text: `Haan — stress sach mein period late kar sakta hai. Bada stress (exams, ghar badalna, bimaari, dukh, bahut kam neend) dimaag ko **ovulation rokne ya late karne** ka signal deta hai, aur phir period late aata hai. Isse period jaldi bhi aa sakta hai, ya normal se halka ya heavy ho sakta hai.\n\nCheezein shaant hone par usually ek-do cycle mein theek ho jata hai.`,
    why: 'Hypothalamus (dimaag ka hissa) ovulation wale hormones control karta hai, aur woh cortisol jaise stress hormones par react karta hai.',
    steps: ['Neend regular rakho — roz ek hi time uthna sabse zyada help karta hai.', 'Proper khana khao; khaana skip karna stress signal badhata hai.', 'Roz kuch calming karo, bas 5 minute dheere saans lena bhi.'],
    doctor: 'Lagaatar 3 periods miss hon, ya cycles mahino tak irregular rahein, toh gynaecologist ko dikhao — ho sakta hai sirf stress na ho.',
  }),
  pregnancy_test: (c) => {
    const duringPeriod = /during (my )?(period|periods)/.test(c.text);
    return {
      text: duringPeriod
        ? `Chance kam hai, par **haan, period ke dauraan ya turant baad sex se pregnant ho sakti ho** — khaas kar chhote cycles mein, kyunki sperm 5 din tak zinda reh sakte hain aur ovulation jaldi ho sakta hai.`
        : `Zyaadatar home pregnancy tests **missed period ke pehle din se** accurate hote hain. Period kab due hai pata nahi, toh jis sex ki chinta hai uske **kam se kam 3 hafte baad** test karo.`,
      steps: [
        'Sabse reliable result ke liye subah ka pehla urine use karo.',
        'Negative aaya par period ab bhi nahi? Ek hafte baad dobara test karo.',
        'Pichhle 3 din mein unprotected sex hua hai toh emergency contraceptive pill (chemist se) jitni jaldi lo utna better kaam karti hai.',
      ],
      doctor: 'Test positive aaye (confirm aur care plan ke liye), ya ek taraf dard, bleeding ya behoshi lage toh doctor ko dikhao.',
    };
  },
  emergency_pill: () => ({
    text: `**Emergency contraceptive pill** (jaise i-pill / Unwanted-72) unprotected sex ya contraception fail hone ke baad pregnancy rok sakti hai. Yeh ovulation ko late karke kaam karti hai, isliye **jitni jaldi lo utna better** — ideally 24 ghante ke andar, aur 72 ghante ke andar.\n\nYeh abortion pill **nahi** hai aur pehle se hui pregnancy par asar nahi karti.`,
    steps: [
      'Agla period kuch din jaldi ya late aa sakta hai.',
      'Lene ke baad period 7 din se zyada late ho toh pregnancy test karo.',
      'Yeh emergency ke liye hai — regular contraception zyada bharosemand hai. Doctor sahi option chunne mein help kar sakte hain.',
    ],
    doctor: 'Lene ke 3 ghante ke andar ulti ho jaye, baad mein pet mein tez dard ho, ya period bahut late ho toh doctor ko dikhao.',
  }),
  irregular: (c) => ({
    text: `Irregular periods common hain, khaas kar periods shuru hone ke pehle kuch saalon mein aur stress ke time. Cycle irregular tab maana jata hai jab length aksar **lagbhag ek hafte se zyada** badle, ya periods **24 din se pehle ya 38 din ke baad** aayein.${c.isIrregular ? '\n\nAapke saved cycles sach mein irregular dikh rahe hain, toh ispe nazar rakhna sahi hai.' : ''}`,
    why: 'Common wajah: stress, weight mein bada badlaav, zyada exercise, thyroid, PCOS, high prolactin, ya hormonal contraception.',
    steps: ['Har period ka start log karo — 3 mahine ki dates doctor ki bahut help karti hain.', 'Neend, khaana aur exercise steady rakho.', 'Baaki signs note karo: acne, chehre par extra baal, weight change, baal jhadna, thand lagna ya bahut thakaan.'],
    doctor: 'Gynaecologist ko dikhao agar 3–6 mahine se zyada irregular hai, 3 mahine period nahi aaya, ya acne, extra baal ya weight change dikh raha hai. Simple blood tests (thyroid, hormones) aur ultrasound se wajah pata chal sakti hai.',
  }),
  pcos: () => ({
    text: `**PCOS (polycystic ovary syndrome — India mein PCOD bhi kehte hain)** ek common hormone condition hai, lagbhag 10 mein se 1 women ko hoti hai. Ovaries regularly egg release nahi karti, isliye periods irregular ho jaate hain.\n\nDoctor tab diagnose karte hain jab **in 3 mein se 2** hon: irregular ya missed periods; androgens zyada hone ke signs (chehre/body par extra baal, acne, sir ke baal patle hona — ya blood test mein high level); aur ultrasound mein kai chhote follicles.`,
    why: 'PCOS mein insulin resistance common hai, jo ovaries ko zyada androgens banane ke liye push karta hai, aur isse ovulation disturb hota hai. Yeh family mein chalta hai.',
    steps: [
      'Yeh manage ho sakta hai: regular movement aur balanced khaana (protein + fibre, kam meethe drinks) kai logon mein symptoms better karte hain — bina zyada weight loss ke bhi.',
      'Treatment aapke goal par depend karta hai: regular periods, skin/baal, ya aage pregnancy.',
      'PCOS ka matlab yeh nahi ki bacche nahi ho sakte — PCOS wali kai women conceive karti hain, kabhi-kabhi thodi help ke saath.',
    ],
    doctor: 'Khud diagnose karne ki jagah gynaecologist se proper testing (blood tests + ultrasound) karwao — thyroid aur kuch aur conditions bhi aisi hi dikh sakti hain.',
  }),
  pcos_diet: () => ({
    text: `PCOS mein goal hai **steady blood sugar**, crash diet nahi.`,
    steps: [
      'Har meal protein + fibre ke around banao: dal, chana, rajma, paneer, ande, dahi, sabziyan, whole grains (millets, brown rice, oats).',
      'Meethe drinks, mithai aur maida kam karo — swap karo, ban nahi.',
      'Time par khana khao; meal skip karne se baad mein cravings badhti hain.',
      'Zyaadatar din move karo: tez walk plus hafte mein 2 strength sessions insulin sensitivity improve karte hain.',
      'Agar weight healthy range se upar hai, toh 5–10% weight loss bhi periods ko zyada regular bana sakta hai.',
    ],
    why: 'Exercise ke baad muscles glucose better use karte hain, aur fibre/protein sugar ko dheere blood mein jaane dete hain — dono insulin kam karte hain, jisse androgens kam hote hain.',
    doctor: 'Gynaecologist ya dietitian isko aapke hisaab se bana sakte hain, aur blood sugar aur thyroid check kar sakte hain.',
  }),
  thyroid: () => ({
    text: `Haan. Thyroid hormones cycle ko regulate karne mein help karte hain. **Underactive thyroid** se periods heavy, lambe ya irregular ho sakte hain, thakaan, thand lagna aur weight badhna ho sakta hai. **Overactive thyroid** se periods halke ya miss ho sakte hain, weight kam ho sakta hai, dhadkan tez aur anxiety ho sakti hai.`,
    steps: ['Ek simple blood test (TSH) se check hota hai.', 'Thyroid problems India mein common hain aur aasani se treat hoti hain.'],
    doctor: 'Agar periods badle hain aur saath mein thakaan, weight change, baal jhadna, ya unusual garmi ya thand lagti hai, toh doctor se thyroid test ke liye kaho.',
  }),
  spotting: () => ({
    text: `Halki spotting harmless ho sakti hai: period se ek-do din **pehle** brown spotting, **ovulation** ke aas-paas mid-cycle thodi spotting, ya **nayi pill ya hormonal coil** ke pehle kuch mahine spotting.`,
    why: 'Brown khoon bas purana khoon hai jise body se nikalne mein zyada time laga.',
    steps: ['Jin dino spotting ho unhe log karo taaki pattern dikhe.', 'Pregnancy ka chance ho toh test karo — early pregnancy mein halki bleeding ho sakti hai.'],
    doctor: '**Sex ke baad bleeding par hamesha doctor ko dikhao**, periods ke beech baar-baar bleeding, ya dard, bukhaar ya unusual discharge ke saath koi bhi bleeding ho tab bhi.',
  }),
  blood_colour: () => ({
    text: `Period ke khoon ka rang badalta hai aur yeh normal hai: heavy dino mein **chamkila laal**, shuru aur aakhir mein **gehra laal ya brown** (purana khoon), kabhi discharge ke saath mil kar **pink**. Heavy dino mein **chhote clots** (₹2 ke sikke se chhote) bhi normal hain.`,
    doctor: 'Gynaecologist ko dikhao agar aksar lagbhag 2.5 cm (₹2 ka sikka) se bade clots aate hain, grey ya green badboodaar discharge hai, ya bleeding itni heavy hai ki har 1–2 ghante pad bhar jata hai.',
  }),
  heavy_bleeding: (c) => ({
    text: `Aapke periods **heavy** ho sakte hain agar:\n• har **1–2 ghante** pad ya tampon badalna padta hai\n• **do products** saath lagane padte hain (ya raat ko extra pads)\n• kapdon ya bedsheet tak leak hota hai\n• **7 din se zyada** bleeding hoti hai\n• **₹2 ke sikke** se bade clots aate hain\n• periods mein thakaan, chakkar ya saans phoolna hota hai\n\nHeavy periods common hain — aur **inka ilaaj hai**, toh bas sehte mat raho.${c.recentFlow === 'heavy' || c.recentFlow === 'severe' ? '\n\nAapne haal hi mein heavy flow log kiya hai, toh please in signs par nazar rakho.' : ''}`,
    steps: [
      'Iron wala khaana khao (dal, rajma, chana, hari pattedar sabziyan, gud, ande, meat) vitamin C (nimbu, amla, santra) ke saath taaki absorb ho.',
      'Roz flow log karo — sabse heavy din kitne pads lage, yeh doctor ke liye sabse useful hai.',
      'Heat pad aur anti-inflammatory painkiller (agar aapke liye safe ho) cramps aur thoda flow bhi kam kar sakte hain.',
    ],
    doctor: 'Upar ka koi bhi sign ho toh gynaecologist ko dikhao, aur iron (haemoglobin/ferritin) test ke liye kaho. Agar 2+ ghante tak har ghante pad bhar raha hai ya behoshi lage toh aaj hi emergency jao.',
  }),
  period_length: () => ({
    text: `Period usually **2 se 7 din** chalta hai; 8 din tak bhi normal ho sakta hai. Chhote, halke periods (2–3 din) aksar us insaan ke liye normal hote hain, khaas kar agar regular hain.`,
    why: 'Length is baat par depend karti hai ki us cycle mein bacchedani ki lining kitni moti bani, aur hormone balance kaisa hai.',
    doctor: 'Gynaecologist ko dikhao agar bleeding 8 din se zyada chale, aapke liye yeh achanak badlaav ho, ya periods bahut halke ho gaye hain aur saath mein irregular ya miss bhi ho rahe hain.',
  }),
  first_period: () => ({
    text: `Pehla period aana badhne ka normal hissa hai 🌸 — zyaadatar ladkiyon ko **10 se 15** saal ke beech (aksar 12 ke aas-paas) shuru hota hai. Pehle kuch saal irregular ho sakte hain: kabhi mahine skip, kabhi paas-paas — jab tak body settle ho rahi hai yeh usually theek hai.`,
    steps: [
      'Shuruaat ke liye pads sabse aasaan hain — har 4–6 ghante mein badlo (bhar jaye toh pehle).',
      'School bag mein ek extra pad aur underwear rakho.',
      'Cramps mein garam paani ki bottle, garam paani se nahaana aur halki stretching help karti hai.',
      'Kisi bharosemand bade se baat karo — mummy, didi, mausi ya school nurse — jo bhi baat pareshan kare.',
    ],
    doctor: 'Doctor ko dikhao agar 15 saal tak periods shuru nahi hue, 8 din se zyada chalte hain, bahut heavy hain, ya dard ki wajah se school miss hota hai.',
  }),
  birth_control: () => ({
    text: `Hormonal contraception periods ko badalta hai: **pills** se periods usually halke, regular aur kam dard wale hote hain (pill-free week wali bleeding "withdrawal bleed" hoti hai). Nayi pill, implant, injection ya hormonal coil ke pehle **3 mahine** spotting common hai. **Copper-T** se shuru mein periods heavy aur zyada dard wale ho sakte hain.`,
    steps: [
      'Pill bhool gayi? Yaad aate hi le lo aur leaflet check karo — back-up protection chahiye ya nahi, yeh pill ke type aur kitni miss hui us par depend karta hai.',
      'Ulti ya tez dast us din pill ka asar rok sakte hain.',
    ],
    doctor: 'Aapke exact method ke liye doctor ya leaflet sabse sahi guide hai. Kisi bhi method ke saath sex ke baad bleeding, heavy bleeding ya tez dard ho toh doctor ko dikhao.',
  }),

  // ─── Pain & body ─────────────────────────────────────────
  cramps: (c) => ({
    text: `Sorry, dard ho raha hai${hi(c)} 🫶 Cramps tab hote hain jab bacchedani apni lining nikalne ke liye sikudti hai. Sabse zyada yeh help karta hai:${(c.recentPain ?? 0) >= 7 ? `\n\nAapne haal hi mein **${c.recentPain}/10** dard log kiya — yeh kaafi zyada hai. Agar yeh aksar aapka din rok deta hai, toh neeche doctor wala note padho.` : ''}`,
    steps: [
      '**Garmi**: neeche pet ya kamar par 15–20 minute garam paani ki bottle ya heat pad — studies ke hisaab se yeh halke painkillers jitna kaam karta hai.',
      '**Painkillers**: ibuprofen ya mefenamic acid (jaise Meftal) **dard ki shuruaat mein hi khaane ke saath**, pack par likhi dose mein, sabse accha kaam karti hain. Asthma, pet ke ulcer, ya kidney/liver problem ho toh mat lo; paracetamol halki hai, par usually thodi kam asar wali.',
      '**Halki movement**: chhoti walk, child’s pose, cat–cow ya ghutne chhati se lagane wali stretch.',
      '**Garam drinks** jaise adrak ya dalchini ki chai, aur garam paani se nahaana.',
      '**Massage**: thode tel se neeche pet par dheere-dheere gol ghumate hue.',
    ],
    why: 'Bacchedani ki lining se nikalne wale prostaglandins muscle ko sikodte hain. Anti-inflammatory painkillers prostaglandins kam karti hain — isliye jaldi lene par better kaam karti hain.',
    doctor: 'Gynaecologist ko dikhao agar dard ki wajah se school ya kaam nahi ja paati, painkillers kaam nahi karti, dard har cycle badh raha hai, ya sex ke time, peshab ya potty karte waqt bhi dard hota hai — yeh endometriosis ya koi aur treat hone wali wajah ho sakti hai.',
  }),
  painkillers: () => ({
    text: `Zyaadatar logon ke liye period dard mein **anti-inflammatory painkillers** sabse accha kaam karti hain: **ibuprofen** ya **mefenamic acid** (India mein Meftal jaise naam se milti hai). **Paracetamol** pet par halki hai par usually thodi kam asar karti hai.`,
    steps: [
      '**Khaane ke saath**, **pack par likhi dose** mein lo, dard ya bleeding shuru hote hi.',
      'Asthma, pet ke ulcer, kidney ya liver problem ho, ya pregnant ho, toh ibuprofen/mefenamic acid mat lo — pehle pharmacist ya doctor se pucho.',
      'Do anti-inflammatory painkillers ek saath mat milao.',
      '16 se kam umar? Aspirin kabhi mat lo, aur koi bhi painkiller lene se pehle parents ya doctor se pucho.',
    ],
    doctor: 'Agar har period painkillers leni padti hain aur phir bhi aaram nahi milta, toh gynaecologist ko dikhao — better treatments (hormonal bhi) hain aur kuch wajah check karni hoti hain.',
  }),
  endometriosis: () => ({
    text: `**Endometriosis** mein bacchedani ki lining jaisa tissue bacchedani ke bahar (ovaries, tubes ya aanton par) badhta hai. Yeh lagbhag 10 mein se 1 women ko hota hai aur aksar saalon tak pakda nahi jaata kyunki bola jaata hai "period ka dard toh normal hai".`,
    steps: [
      'Common signs: aisa period dard jo roz ki zindagi rok de, painkillers se na jaye, baaki dino mein bhi pelvic dard, sex ke time ya baad dard, period mein peshab ya potty karte waqt dard, pregnant hone mein dikkat.',
      'Har cycle apna dard log karo — kahan hai, kitna tez, kya help kiya. Isse doctor visit kaafi useful ho jaati hai.',
    ],
    doctor: 'Agar yeh aap jaisa lagta hai, toh gynaecologist ko dikhao aur saaf bolo: “Mera period dard meri daily life affect karta hai aur painkillers kaam nahi karti.” Treatment mein hormonal medicines aur kabhi-kabhi keyhole surgery hoti hai.',
  }),
  back_leg_pain: () => ({
    text: `Period mein kamar aur jaangh mein dard common hai — jo prostaglandins cramps karte hain wahi paas ki nerves aur muscles ko bhi affect karte hain, isliye dard "phail" jaata hai.`,
    steps: [
      'Kamar par 15–20 minute garmi.',
      'Stretches: child’s pose, cat–cow, peeth ke bal let kar ghutne pakadna, halke twists.',
      'Dard shuru hote hi khaane ke saath anti-inflammatory painkiller, agar aapke liye safe ho.',
      'Karwat le kar ghutnon ke beech takiya rakh kar so.',
    ],
    doctor: 'Kamar dard bahut tez ho, bukhaar ke saath ho, peshab mein jalan ho, ya period ke bahar bhi chale toh doctor ko dikhao.',
  }),
  bloating: (c) => ({
    text: `Period se pehle aur dauraan bloating bahut common hai${c.phase === 'luteal' || c.phase === 'menstrual' ? ' — aur aap abhi usi window mein ho' : ''}. Hormone badlaav se body zyada paani rokti hai aur digestion thoda slow hota hai. Period shuru hone par usually kam ho jaata hai.`,
    steps: [
      'Zyada paani piyo (isse sach mein water retention kam hota hai).',
      'Kuch din namkeen snacks, chips aur packaged food kam karo.',
      'Potassium wala khaana: kela, nariyal paani, dahi, shakarkand.',
      'Khaane ke baad chhoti walk aur garam ajwain/jeera/saunf paani gas mein aaram deta hai.',
    ],
    doctor: 'Agar 3 hafte ya zyada se zyaadatar din bloating rahe, ya saath mein weight kam ho, jaldi pet bhar jaye ya dard ho, toh doctor ko dikhao.',
  }),
  headache: () => ({
    text: `Sir dard aur migraine aksar period se theek pehle ya dauraan hote hain, jab **oestrogen girta hai**.`,
    steps: [
      'Regular paani piyo aur khaana skip mat karo.',
      'Neend steady rakho — sone aur uthne ka same time.',
      'Andhere, shaant kamre mein aaram karo; maathe ya gardan par thandi pack help kar sakti hai.',
      'Shuruaat mein hi simple painkiller (label wali dose) wait karne se zyada help karti hai.',
      'SheSync mein note karo sir dard kab hota hai — pattern doctor ki help karta hai.',
    ],
    doctor: 'Doctor ko dikhao agar sir dard naya aur bahut tez ho, saath mein nazar mein badlaav, kamzori, sunn hona ya confusion ho (urgent), ya mahine mein lagbhag 10 din se zyada painkiller leni padti hai.',
  }),
  digestion: () => ({
    text: `Period ke aas-paas pet kharab, loose motions ya ji machlana common hai — prostaglandins sirf bacchedani nahi, aanton ko bhi tez karte hain. Kuch logon ko iske ulta period se pehle kabz hoti hai, kyunki progesterone digestion slow karta hai.`,
    steps: [
      'Chhote, saade meals: khichdi, dahi chawal, kela, toast.',
      'Loose motions hain toh paani, ORS ya nariyal paani piti raho.',
      'Adrak ki chai ji machlana kam kar sakti hai.',
      'Period ki shuruaat mein anti-inflammatory painkiller cramps aur loose motions dono kam kar sakti hai (agar aapke liye safe ho).',
    ],
    doctor: 'Doctor ko dikhao agar paani bhi nahi ruk raha, potty mein khoon hai, tez dard ya bukhaar hai, ya period ke baad bhi symptoms chalte rahein.',
  }),
  breast_pain: () => ({
    text: `Period se lagbhag ek hafte pehle breasts mein dard, sujan ya bhaaripan bahut common hai — progesterone aur oestrogen breast tissue mein zyada fluid rokte hain. Period shuru hone par kam ho jaata hai.`,
    steps: ['Soft, sahi fit wali supportive bra pehno (raat mein sports bra help kar sakti hai).', 'Kuch din bahut namkeen khaana aur caffeine kam karo.', 'Garam ya thandi sikai — jo bhi accha lage.'],
    doctor: 'Nayi gaanth, nipple se discharge (khaas kar khoon wala), skin mein gadde padna, ya aisa dard jo cycle ke saath na chale — in par doctor ko dikhao.',
  }),
  fatigue: (c) => ({
    text: `Period ke aas-paas thakaan lagna common hai${hi(c)} — hormones girte hain, neend kharab ho sakti hai, aur iron jaata hai. Par agar thakaan **hamesha** rehti hai, toh yeh **iron ki kami (anaemia)** ho sakti hai, jo Indian women mein bahut common hai, khaas kar heavy periods ke saath.`,
    steps: [
      'Roz iron wala khaana: dal, rajma, chana, soyabean, palak/methi, gud, khajoor, ande, machhli ya meat.',
      'Usi meal mein vitamin C (nimbu, amla, amrood, santra) add karo; khaane ke ek ghante ke andar chai/coffee avoid karo — yeh iron rokti hai.',
      'Neend ko priority do aur kaafi paani piyo.',
    ],
    why: 'Har period mein kuch iron jaata hai. Agar khaane se aane se zyada jaaye, toh haemoglobin girta hai aur thakaan, saans phoolna, chakkar ya thand lagti hai.',
    doctor: 'Hamesha thakaan, saans phoolna, chakkar, peeli skin, ya heavy periods hon toh doctor se haemoglobin aur ferritin test ke liye kaho. Bina test ke iron tablets shuru mat karo.',
  }),
  period_food: () => ({
    text: `Koi magic food nahi hai, par period mein yeh sach mein help karte hain:`,
    steps: [
      '**Iron**: dal, rajma, chana, palak, methi, gud, khajoor, ande, machhli ya chicken — vitamin C ke liye nimbu ya amla ke saath.',
      '**Anti-inflammatory**: machhli, akhrot, alsi, haldi wala doodh, adrak ki chai — cramps kam kar sakte hain.',
      '**Magnesium aur potassium**: kela, dahi, nuts, seeds, dark chocolate (chhota sa tukda!).',
      '**Paani**: 8+ glass; bloating aur sir dard kam karta hai.',
      'Bahut namkeen/packaged food, zyada meetha aur zyada caffeine kam karo — yeh bloating aur mood swings badha sakte hain.',
    ],
  }),
  cravings: () => ({
    text: `Period se pehle cravings real hain, willpower ki kami nahi 💜 Luteal phase mein body thodi zyada energy use karti hai (roz lagbhag 100–300 extra calories), aur girte hormones serotonin par asar karte hain, jisse meetha aur bhi tempting lagta hai.`,
    steps: [
      'Protein ke saath time par khaana khao — lambe gap se cravings aur tez hoti hain.',
      'Smartly satisfy karo: dark chocolate, peanut butter ke saath fruit, bhuna chana, nuts ke saath khajoor.',
      'Treat enjoy karna bilkul theek hai — guilt ki zaroorat nahi. Ek din se zyada poore hafte ka balance matter karta hai.',
    ],
  }),
  exercise_period: (c) => ({
    text: `Haan — period mein exercise kar sakti ho, aur halki movement aksar cramps **kam** karti hai aur mood better karti hai. Body ki suno: kisi din walk ya yoga perfect hai; kisi din normal workout ke liye strong feel karogi.${c.hasCycleData ? `\n\n${phaseLineHinglish(c)} SheSync ka Fitness tab aapke phase ke hisaab se aaj ka workout chunta hai.` : ''}`,
    steps: [
      'Period ke din: walk, yoga, stretching, halki strength — accha lage toh zyada bhi.',
      'Period ke baad: energy badhti hai, tough training ka great time.',
      'Period se pehle: move karti raho, par thakaan ho toh intensity kam karna theek hai.',
      'Sports ke liye cup, tampon ya period underwear pehno, aur paani piti raho.',
    ],
    doctor: 'Chakkar ya behoshi lage toh ruk kar aaram karo. Bahut exercise aur bahut kam khaane se periods miss hon toh doctor ko dikhana chahiye.',
  }),
  sleep: () => ({
    text: `Period se pehle ke dino mein neend aksar kharab hoti hai — ovulation ke baad body ka temperature badhta hai aur girta progesterone (jo thoda calming hai) neend ko halka kar sakta hai.`,
    steps: [
      'Roz ek hi time utho, weekends par bhi.',
      'Kamra thanda, andhera aur shaant rakho; period se pehle garam body ke liye halki chadar help karti hai.',
      'Sone se 30 minute pehle screen band; bistar mein dheere saans lo (4 andar, 6 bahar).',
      'Dopahar 2 baje ke baad caffeine kam; garam doodh ya chamomile chai help kar sakti hai.',
      'Cramps se neend khulti hai toh garmi lagao aur sone se pehle painkiller lo (agar aapke liye safe ho).',
    ],
    doctor: 'Agar hafton tak neend kharab rahe aur din par asar pade, ya saath mein zyaadatar din low feel ho, toh doctor ko dikhao.',
  }),
  acne: () => ({
    text: `Period se pehle breakouts common hain — androgens (jo sab women mein hote hain) oestrogen girne par skin par zyada asar karte hain, jisse skin oily ho jaati hai.`,
    steps: [
      'Din mein do baar gentle cleanser se chehra dho; zor se ragdo mat.',
      'Salicylic acid ya benzoyl peroxide wale products dekho (dheere shuru karo — yeh skin dry kar sakte hain).',
      'Non-comedogenic (pores band na kare) moisturiser aur sunscreen use karo.',
      'Pimples ko chhedo ya dabao mat — daag pad jaate hain.',
    ],
    doctor: 'Acne bahut zyada ho, daag chhode, ya irregular periods ya chehre par extra baal ke saath ho, toh dermatologist ya gynaecologist ko dikhao — yeh PCOS ho sakta hai, aur acche treatments hain.',
  }),
  hair: () => ({
    text: `Chehre, chhati ya pet par extra baal (hirsutism), ya sir ke baal patle hona, **zyada androgens** se jud sakta hai — aksar PCOS se. Kuch baal genetic bhi hote hain. Baal jhadna iron ki kami, thyroid ya stress se bhi ho sakta hai.`,
    steps: [
      'Threading, waxing, shaving ya creams baal hatane ke safe tareeke hain — shaving se baal mote nahi aate.',
      'Baal jhadne ke liye: kaafi protein aur iron khao, aur baalon ke saath gentle raho (tight hairstyle ya tez heat nahi).',
      'Laser hair reduction ya prescription treatment lambe samay tak help karte hain.',
    ],
    doctor: 'Gynaecologist ya dermatologist ko dikhao, khaas kar irregular periods ya acne ke saath — hormone, thyroid aur iron tests se wajah pata chal sakti hai, aur treatment (PCOS ka bhi) help karta hai.',
  }),
  weight: () => ({
    text: `Period se pehle ke dino mein 1–2 kg tak weight badhna usually **water retention** hai, fat nahi — period shuru hone ke baad chala jaata hai. Weight track kar rahi ho toh har mahine cycle ke same point par weight lo.\n\nAsli, lambe samay ke badlaav ke liye chhoti habits crash diet se behtar hain.`,
    steps: [
      'Har meal mein protein aur sabzi; meethe drinks kam.',
      'Roz walk karo aur hafte mein 2 strength sessions jodo.',
      '7–9 ghante neend — kam neend bhook wale hormones badhati hai.',
      'Dheere badlaav ka target rakho (hafte mein lagbhag 0.25–0.5 kg). Bahut kam calorie wali diet periods rok sakti hai.',
    ],
    doctor: 'Bina koshish ke weight bahut badle, ya saath mein irregular periods, extra baal ya thakaan ho (PCOS ya thyroid), toh doctor ko dikhao.',
  }),
  discharge: () => ({
    text: `**Safed ya saaf discharge normal aur healthy hai** — yeh vagina ko saaf rakhta hai. Cycle ke saath badalta hai: period ke baad gaadha aur creamy, ovulation ke aas-paas saaf aur khinchne wala (egg white jaisa), phir dobara gaadha.`,
    steps: [
      'Sirf bahar ki taraf saade paani se dho (ya bahar ke hisse par mild bina khushbu wala sabun). Andar douching ya intimate wash mat use karo — natural balance bigadta hai.',
      'Cotton underwear pehno aur geele ya paseene wale kapde jaldi badlo.',
      'Aage se peeche ki taraf pochho.',
    ],
    doctor: 'Doctor ko dikhao agar discharge **gaadha, paneer jaisa aur khujli ke saath** ho (aksar yeast infection), **grey/green ya machhli jaisi badboo** wala ho, **dard ya bukhaar ke saath peela-hara** ho, ya period na hone par khoon wala ho. Yeh common hain aur aasani se treat hote hain.',
  }),
  uti: () => ({
    text: `Peshab karte waqt jalan ya chubhan, baar-baar jaana padna, ya dhundhla/badboo wala peshab **urine infection (UTI)** ke classic signs hain. Women mein yeh bahut common hai.`,
    steps: ['Khoob paani piyo.', 'Peshab rok kar mat rakho; sex ke baad peshab karo.', 'Aage se peeche ki taraf pochho.'],
    doctor: 'Jaldi doctor ko dikhao — UTI mein usually antibiotics lagti hain. **Aaj hi** jao agar bukhaar, kamar/side mein dard, ulti, peshab mein khoon ho, ya pregnant ho sakti ho.',
  }),
  hygiene: () => ({
    text: `Teeno safe hain — jo aapko sahi lage woh chuno:\n\n• **Pads**: shuru karne ke liye sabse aasaan. Har **4–6 ghante** badlo (bhar jaye toh pehle).\n• **Tampons**: sports aur swimming ke liye acche. Har **4–8 ghante** badlo; 8 ghante se zyada kabhi mat rakho; jitni zaroorat ho utni kam absorbency wala lo.\n• **Menstrual cup**: reusable, eco-friendly, zyada hold karta hai. Har **8–12 ghante** khaali karo, dho lo, aur periods ke beech ubaal lo.`,
    steps: [
      'Badalne se pehle aur baad haath dho.',
      'Pad se rash? Jaldi-jaldi badlo, cotton/cloth pad try karo, jagah sookhi rakho, aur plain barrier cream lagao.',
      'Use kiye pads paper mein lapet kar phenko.',
      'Cloth pads theek hain agar sabun se acche se dhoye jaayein aur dhoop mein poori tarah sukhaaye jaayein.',
    ],
    doctor: 'Tampon ya cup use karte hue achanak tez bukhaar, rash, ulti ya chakkar aaye toh use nikaalo aur aaj hi help lo.',
  }),
  myths: () => ({
    text: `Accha sawaal 🌸 Kuch common myths clear karte hain:\n\n• Period mein **nahaana aur baal dhona** bilkul safe hai — garam paani se nahaana cramps bhi kam kar sakta hai.\n• **Dahi, khatta ya thanda khaana** flow ko nuksaan nahi karta aur cramps nahi karta.\n• **Achaar** chhoone se woh kharab nahi hota — periods "ashuddh" nahi hote.\n• Aap normal ki tarah **exercise, swimming (tampon ya cup ke saath), padhai aur bahar jaana** kar sakti ho.\n\nPeriod body ki normal process hai. Aapko aaram milna chahiye, rok-tok nahi.`,
  }),

  // ─── Mind, mood, focus ───────────────────────────────────
  pms: (c) => ({
    text: `Aap "zyada sensitive" nahi ho${hi(c)} 💜 Period se 1–2 hafte pehle mood swings, rona aana, chidchidapan, bloating aur breasts mein dard **PMS** hai, aur yeh real hai. Jab low mood, anxiety ya gussa **itna tez ho ki relationships, padhai ya kaam par asar pade**, doctors ise **PMDD** kehte hain — aur iska ilaaj hai.${c.phase === 'luteal' ? `\n\n${phaseLineHinglish(c)}` : ''}`,
    why: 'Kuch logon ka dimaag oestrogen aur progesterone ke normal utaar-chadhaav ke liye zyada sensitive hota hai, jo serotonin (mood chemical) par asar karta hai.',
    steps: [
      '2 cycles tak roz mood track karo — agar symptoms period se pehle shuru aur period aate hi kam hote hain, toh pattern confirm hota hai.',
      'Time par khaana, kam caffeine/meetha/namak, aur roz movement (20 minute walk bhi) kai logon ki help karta hai.',
      'Ho sake toh period se pehle ke din halke plan karo, aur kareebi logon ko batao.',
      '“Hormonal mausam” wala rule: kuch din bade decisions ya khud ke baare mein harsh judgement taal do.',
    ],
    doctor: 'Symptoms bahut tez hon — ya hopeless feel ho ya khud ko nuksaan ke thoughts aayein — toh gynaecologist ya counsellor se baat karo. Treatment mein therapy (CBT), kuch antidepressants aur hormonal options hain.',
    affirmation: 'Yeh feelings ek lehar hain, poori main nahi. Jab tak yeh guzre, main khud se narmi rakh sakti hoon.',
  }),
  anxiety: (c) => {
    const panic = /panic|racing|can'?t breathe/.test(c.text);
    return {
      text: panic
        ? `Main yahin aapke saath hoon${hi(c)}. Panic attack daraavna lagta hai, par **yeh guzar jayega** — usually kuch minute mein — aur yeh aapko nuksaan nahi pahuncha sakta. Chalo saath mein saans dheemi karte hain.`
        : `Anxiety bahut thaka deti hai${hi(c)}, aur aap isme akeli nahi ho. Daudte thoughts aur chhati mein jakdan aapki body ka alarm system hai jo thoda zyada protective ho raha hai. Pehle body ko shaant karte hain — mann peeche aata hai.`,
      steps: [
        '**Saans andar se zyada lambi bahar chhodo**: naak se 4 tak andar, dheere 6–8 tak bahar. 6 baar dohraao.',
        '**5-4-3-2-1 grounding**: 5 cheezein jo dikh rahi hain, 4 jo chhoo sakti ho, 3 jo sunai de rahi hain, 2 jo soongh sakti ho, 1 jiska swaad le sakti ho — naam lo.',
        'Pair zameen par seedhe rakh kar dabao; neeche ke support ko feel karo.',
        'Chinta likh lo, phir pucho: “Aaj iske baare mein ek chhoti cheez kya kar sakti hoon?”',
      ],
      why: 'Lambi saans chhodne se vagus nerve active hoti hai, jo dil ki dhadkan dheemi karti hai aur dimaag ko batati hai ki aap safe ho.',
      doctor: 'Agar anxiety zyaadatar din rehti hai, kaam rokti hai, ya baar-baar panic attacks aate hain, toh counsellor se baat karna sach mein help karta hai — Tele-MANAS (14416) free aur 24×7 hai.',
      affirmation: 'Is pal main safe hoon. Yeh feeling guzar jayegi.',
    };
  },
  low_mood: (c) => ({
    text: `Mujhe sach mein afsos hai ki aap aisa feel kar rahi ho${hi(c)}. Batane ke liye shukriya — isme himmat lagti hai. 💜${c.recentMood !== null && c.recentMood <= 2 ? '\n\nMujhe dikh raha hai ki aapne haal hi mein low mood log kiya tha.' : ''}\n\nLow din aate hain, aur period se pehle zyada lag sakte hain. Par agar **2 hafte ya zyada se zyaadatar din** udaas ya hopeless feel ho raha hai, toh kisi se baat karne ka sign hai — kamzori nahi.`,
    steps: [
      'Body ke liye ek chhota sa kind kaam: ek glass paani, nahaana, 5 minute dhoop.',
      'Ek bharosemand insaan ko message karo: “Aaj din mushkil hai, baat kar sakte hain?”',
      'Thoda move karo — 10 minute ki walk socha bhi nahi utna mood better kar sakti hai.',
      'Aaj ki 3 cheezein likho jo theek gayi, kitni bhi chhoti ho.',
    ],
    doctor: 'Agar yeh 2 hafte ya zyada se chal raha hai toh please counsellor se baat karo. Tele-MANAS (14416) free, private aur 24×7 hai. Agar kabhi khud ko nuksaan pahunchane ka khayal aaye, toh turant 14416 ya 112 call karo.',
    affirmation: 'Mujhe ek saath sab theek feel nahi karna hai. Aaj ek chhota kadam kaafi hai.',
  }),
  stress: (c) => ({
    text: `Yeh kaafi zyada bojh lag raha hai${hi(c)}. Jab sab kuch urgent lagta hai, dimaag sab ko khatra samajhta hai. Chalo isko manageable size mein laate hain.`,
    steps: [
      '**Brain dump**: har kaam aur chinta kaagaz par likho — sir se bahar nikaalo.',
      'Aaj ki sabse important **ek** cheez par gol lagao. Pehle bas wahi karo.',
      'Chhote blocks (25 min) mein kaam karo, asli breaks ke saath.',
      'Shuru karne se pehle 6 dheemi saans (4 andar, 6 bahar).',
      'Is hafte ek cheez ko na ya "baad mein" bolo.',
    ],
    why: 'Stress hormones saaf sochna mushkil karte hain; chhote, clear kadam us response ko shaant karte hain aur control ka ehsaas wapas laate hain.',
    doctor: 'Agar stress hafton se neend, khaane ya mood par asar daal raha hai, toh counsellor se baat karna help karta hai — iCALL aur Tele-MANAS free hain.',
    affirmation: 'Main ek time par ek hi kaam kar sakti hoon — aur woh kaafi hai.',
  }),
  anger: (c) => ({
    text: `Chidchidapan ya gussa aane se aap buri insaan nahi ban jaati${hi(c)}. Period se pehle kai logon ka sabr jaldi khatam hota hai — hormone girne se serotonin par asar padta hai. Aap ise feel kar sakti ho bina ise control dene ke.`,
    steps: [
      'Jab gussa chadhe: ruko, 3 baar dheere saans chhodo, aur 2 minute ke liye hat jao.',
      'Naam do: “Mujhe chidh ho rahi hai, aur meri body period se pehle wale hafte mein hai.” Naam dene se intensity kam hoti hai.',
      'Bahar nikaalo: tez walk, seedhiyan, ya haath aur kandhe jhatko.',
      'Agar chilla diya, chhota sa sorry help karta hai: “Sorry, aaj din mushkil hai — baat aapki nahi thi.”',
    ],
    doctor: 'Agar period se pehle ka gussa har mahine relationships ya padhai ko nuksaan pahuncha raha hai, toh doctor ya counsellor se PMDD ke baare mein baat karo — iska ilaaj hai.',
    affirmation: 'Meri feelings valid hain, aur main chunti hoon ki kaise react karun.',
  }),
  lonely: (c) => ({
    text: `Akelapan dukh deta hai${hi(c)}, aur yeh log jitna maante hain usse zyada common hai — khaas kar shift hone ke baad, naye college mein, ya low feel karte waqt. Iska matlab yeh nahi ki aap mein kuch galat hai.`,
    steps: [
      'Aaj ek insaan ko kuch chhota bhejo — meme, voice note, “tumhari yaad aayi”.',
      'Koi ek regular cheez join karo: club, class, sports ya volunteering group. Har hafte same chehre dekhne se dosti banti hai.',
      'Khud se thoda narmi se pesh aao — akelapan andar ki awaaz ko sach se zyada harsh bana deta hai.',
    ],
    doctor: 'Agar akelapan ke saath zyaadatar din low mood ho, toh counsellor se baat karna help kar sakta hai — yeh free aur private hai.',
    affirmation: 'Main connection ki haqdaar hoon, aur sahi log mujhe dekhenge.',
  }),
  body_image: (c) => ({
    text: `Mujhe afsos hai ki aap khud ke baare mein aisa feel kar rahi ho${hi(c)}. Body mahine bhar mein naturally badalti hai — period se pehle bloating aur paani ka weight temporary hai, par aaina tab kathor lag sakta hai.\n\nAapki keemat aapke weight ya skin se nahi hai.`,
    steps: [
      'Andar ke critic ko pehchano, aur use aise jawab do jaise dost ko dogi: “Yeh harsh hai. Meri body mujhe bahut kuch se nikaal rahi hai.”',
      'Jo accounts aapko bura feel karwate hain unhe unfollow karo; real bodies dikhane wale follow karo.',
      'Aaj kuch comfortable pehno.',
      'Body kya karti hai us par dhyaan do — chalti hai, gale lagati hai, naachti hai, theek hoti hai.',
    ],
    doctor: 'Agar khaane, weight ya body ke thoughts poora din le lete hain, ya aap khaana bahut kam kar rahi ho, binge kar rahi ho ya ulti kar rahi ho, toh please doctor ya counsellor se baat karo — support sach mein help karta hai.',
    affirmation: 'Meri body theek karne wali problem nahi hai. Yeh mera ghar hai.',
  }),
  guilt: (c) => ({
    text: `Jo awaaz aapko "aalsi" ya "bekaar" bol rahi hai woh sach nahi bol rahi${hi(c)}. Kuch dino energy aur focus sach mein kam hote hain — khaas kar period ke aas-paas, kam neend ke baad, ya stress mein. Aaram karna fail hona nahi hai.`,
    steps: [
      '“Mujhe aur karna chahiye tha” ki jagah bolo “Jitni energy thi, usme jo ho saka maine kiya.”',
      '**Ek** chhota kaam chuno aur poora karo — perfection se zyada completion matter karta hai.',
      'Bade kaam zyada energy wale dino ke liye rakho (aksar period ke baad wala hafta).',
    ],
    affirmation: 'Meri keemat meri productivity se nahi naapi jaati.',
  }),
  motivation: (c) => ({
    text: `Kuch dino tank sach mein kam hota hai${hi(c)} — yeh biology hai, character ki kami nahi.${c.phase === 'menstrual' || c.phase === 'luteal' ? ` ${phaseLineHinglish(c)} Abhi drive kam hona common hai.` : ''} "Motivated feel" hone ka wait karna kam hi kaam karta hai; **pehle action, motivation baad mein aata hai.**`,
    steps: [
      '**2-minute start**: kaam ka sabse chhota version chuno (kitaab kholo, ek line likho) aur bas utna karo.',
      '**Cosy banao**: kambal, chai, music — kaam ko comfort ke saath jodo.',
      '5 minute dhoop aur thoda paani — dono energy thodi badhate hain.',
      'Ek cheez tick karo, phir decide karo aage karna hai ya nahi. Aksar karogi.',
    ],
    doctor: 'Agar 2 hafte ya zyada se lagbhag har cheez mein interest chala gaya hai, toh yeh low mood ya depression ho sakta hai — counsellor se baat karna help karta hai.',
    affirmation: 'Chhote kadam bhi mujhe aage le jaate hain.',
  }),
  mvd: () => ({
    text: `**Minimum Viable Day** aaj ka sabse chhota version hai jo phir bhi jeet gina jaye. Kam energy wale dino mein bas itna target rakho — baaki sab bonus hai.`,
    steps: [
      '**1 zaroori kaam**: woh ek kaam jo aaj sach mein matter karta hai (jaise assignment submit karna, ek chapter revise karna).',
      '**1 body wali cheez**: proper meal, nahaana, ya 10 minute walk.',
      '**1 kind cheez**: dost ko message, kuch pasand ka dekhna, ya bina guilt aaram.',
      'Baaki sab kaat do ya aage khisko — jaan-bujh kar, galti se nahi.',
    ],
    affirmation: 'Dheere kiya hua, na kiye hue se behtar hai.',
  }),
  focus: (c) => ({
    text: `Brain fog real hai${hi(c)} — kai log period se theek pehle ya dauraan dheema sochna aur kam focus notice karte hain, khaas kar kam neend ya dard ke saath.${c.hasCycleData ? ` ${phaseLineHinglish(c)}` : ''} Chalo energy ke *saath* kaam karte hain, usse ladne ki jagah.`,
    steps: [
      '**Chhote sprints**: ek chhote kaam par 15–25 minute, phir 5 minute break (SheSync ka Study timer aaj ke liye sahi length suggest karta hai).',
      '**Phone door** — dusre kamre mein ya focus mode mein.',
      '**3 zaroori kaam kaagaz par likho** taaki dimaag ko yaad na rakhna pade.',
      'Sessions ke beech paani piyo, protein wala kuch khao, aur dhoop mein jao.',
      'Mushkil naye topics zyada energy wale dino ke liye rakho; dhundhle dino mein revision ya aasaan kaam karo.',
    ],
    doctor: 'Agar focus ki problem hamesha rehti hai (sirf kuch din nahi), ya hamesha thakaan rehti hai, toh doctor ko dikhao — iron ki kami, thyroid ya neend ki problems common hain aur treat hoti hain.',
    affirmation: 'Mera focus lehron mein aata hai. Main apni energy ke saath kaam kar sakti hoon, uske khilaaf nahi.',
  }),
  exam: (c) => ({
    text: `Exams plus period (ya sirf exam ki ghabrahat) bahut hai${hi(c)}. Aapne jitna aapka panic bata raha hai usse zyada taiyaari ki hai. Chalo aaj ko manageable banate hain.`,
    steps: [
      '**Aaj raat**: sirf key points revise karo, phir so jao — neend memory ko late-night ratne se better pakki karti hai.',
      '**Period kit**: cramps ke pehle sign par painkiller (khaane ke saath, agar safe ho), extra pad, paani ki bottle, snack.',
      '**Hall mein**: shuru karne se pehle 3 baar dheere saans chhodo; jo aata hai woh pehle karo.',
      'Exam ke dauraan cramps shuru hon toh invigilator ko batana theek hai.',
      'Ek kharab paper aapko define nahi karta.',
    ],
    affirmation: 'Main taiyaar hoon, kaabil hoon, aur apna best dungi — woh kaafi hai.',
  }),
  relationship: (c) => ({
    text: `Yeh sach mein dukh dene wala lagta hai${hi(c)}. Rishte — partner, parents ya dost — humein gehraai se affect karte hain, aur thakaan mein ya period se pehle jhagda aur bhi bada lagta hai.`,
    steps: [
      'Reply karne se pehle khud ko shaant hone ka time do — bade decisions 24 ghante ruk sakte hain.',
      '“Main” wale sentences use karo: “Mujhe bura laga jab…” na ki “Tum hamesha…”.',
      'Jo kehna hai pehle likh lo; isse shaant version milta hai.',
      'Situation se bahar kisi par bharosa karo — dost, bhai-behen ya counsellor.',
    ],
    doctor: 'Agar kabhi rishte mein unsafe, control ya dhamki feel ho, toh Women Helpline 181 (24×7) confidentially help kar sakti hai.',
    affirmation: 'Main aise rishton ki haqdaar hoon jahan mujhe izzat aur safety mile.',
  }),
  grounding: () => ({
    text: `Chalo saath mein karte hain. Aaram se baitho, kandhe dheele chhodo, aur jabda dheela karo. 🌿`,
    steps: [
      '**Saans**: naak se 4 tak andar… 4 tak roko… muh se 6 tak bahar. 5 baar dohraao.',
      '**Ground**: 5 cheezein jo dikh rahi hain, 4 jo chhoo sakti ho, 3 jo sun sakti ho, 2 jo soongh sakti ho, 1 jiska swaad le sakti ho — naam lo.',
      '**Mehsoos karo**: pair zameen par dabao aur neeche ka support feel karo.',
      '**Sukoon**: haath chhati ya pet par rakho aur bolo, “Main abhi theek hoon.”',
    ],
    why: 'Lambi saans chhodne wali dheemi breathing body ka “rest and digest” system on karti hai, jo dil ki dhadkan dheemi karti hai aur daudte thoughts shaant karti hai.',
    affirmation: 'Main yahan hoon, saans le rahi hoon, aur is pal mein safe hoon.',
  }),
  reframe: () => ({
    text: `Chalo ek simple CBT (cognitive behavioural therapy) exercise karte hain. Apna thought likho, phir in steps se guzaaro:`,
    steps: [
      '**Pakdo**: exactly thought kya hai? jaise “Main sab mein fail ho jaungi.”',
      '**Check karo**: iske paksh mein kya saboot hai — aur khilaaf kya? Kya ek dost agree karegi?',
      '**Trap pehchano**: sab-ya-kuch-nahi? Mind-reading? Sabse bura soch lena?',
      '**Dobara likho** zyada fair tareeke se: “Main do subjects mein peeche hoon, aur is hafte ek cover kar sakti hoon.”',
      '**Agla kadam**: ek chhota action jo naram thought se match kare.',
    ],
    affirmation: 'Thoughts facts nahi hain. Main ek naram, sachcha thought chun sakti hoon.',
  }),
  explain_others: () => ({
    text: `Aap kisi ko details dene ke liye majboor nahi ho — ek chhota, confident message kaafi hai. Kuch jo use kar sakti ho:`,
    steps: [
      '**Teacher/professor**: “Aaj mujhe period ka tez dard hai. Kya main darwaze ke paas baith sakti hoon / ise kal submit kar sakti hoon?”',
      '**Boss/team**: “Aaj ek health issue hai, toh main kam capacity par kaam karungi. X ko priority dungi.”',
      '**Partner/family**: “Period se pehle meri energy kam hoti hai aur chidchidi ho sakti hoon. Yeh aapke baare mein nahi hai — thoda sabr aur garam paani ki bottle bahut help karegi.”',
      '**Dost**: “Period day hai — aaj raat shaant plan chalega!”',
    ],
    affirmation: 'Body ki zaroorat maangna strength hai, kamzori nahi.',
  }),
  counsellor: () => ({
    text: `Yeh himmat wala aur accha kadam hai 💜 India mein free, confidential options:\n\n• **Tele-MANAS — 14416** (24×7, Government of India, 20+ bhashaayein)\n• **iCALL (TISS) — 9152987821** (Mon–Sat, 10 AM–8 PM, trained counsellors)\n• **Vandrevala Foundation — +91 9999 666 555** (24×7, call ya WhatsApp)\n\n"Mujhe nahi pata kahan se shuru karun" se shuru karna bilkul theek hai. Comfortable lage toh puch sakti ho ki kya woman counsellor available hai.`,
  }),
  see_doctor: () => ({
    text: `Gynaecologist ko dikhao agar inme se kuch bhi ho:`,
    steps: [
      'Periods jisme har 1–2 ghante pad bhar jaye, 7–8 din se zyada chalein, ya bade clots aayein',
      '3 mahine period na aaye (pregnancy test negative ke saath), ya cycles bahut irregular hon',
      'Period ka dard jo daily life rok de ya painkillers se na jaye',
      'Periods ke beech ya sex ke baad bleeding',
      'Unusual discharge, khujli ya pelvic dard',
      'Irregular periods ke saath chehre par extra baal, zyada acne, ya weight change jaise signs',
      '**Same day/emergency**: achanak tez dard, behoshi, chakkar ke saath heavy bleeding, ya pelvic dard ke saath bukhaar',
    ],
    why: 'Pehli visit mein zyaadatar baat hoti hai: periods, symptoms aur history. Internal exam hamesha zaroori nahi hota, aur aap sawaal puch sakti ho ya jis cheez mein comfortable nahi ho use mana kar sakti ho.',
    doctor: 'Care Connect mein eSanjeevani (free online sarkaari doctors) aur “mere paas gynaecologist” button hai. Apni SheSync report saath le jao.',
  }),
};

/** Follow-up chips and quick prompts, in Hinglish (keys are the English wording). */
export const HINGLISH_QUESTIONS: Record<string, string> = {
  'Can I exercise during my period?': 'Kya period mein exercise kar sakti hoon?',
  'Can I wash my hair or bathe during my period?': 'Kya period mein baal dho sakti hoon ya naha sakti hoon?',
  'Can stress delay my period?': 'Kya stress se period late ho sakta hai?',
  'Can thyroid problems affect periods?': 'Kya thyroid se periods par asar padta hai?',
  'Could my pain be endometriosis?': 'Kya mera dard endometriosis ho sakta hai?',
  'Do birth control pills affect periods?': 'Kya birth control pills se periods badalte hain?',
  'First period — what do I need to know?': 'Pehla period — kya jaanna zaroori hai?',
  'Help me calm down with a breathing exercise': 'Breathing exercise se mujhe shaant karo',
  'Help me plan a Minimum Viable Day': 'Minimum Viable Day plan karne mein help karo',
  'Help me reframe a negative thought': 'Negative thought ko badalne mein help karo',
  'How can I reduce facial hair and acne?': 'Chehre ke baal aur acne kaise kam karun?',
  'How can I reduce period cramps?': 'Period cramps kaise kam karun?',
  'How do I explain my period pain or mood to others?': 'Doosron ko apna period dard ya mood kaise samjhaun?',
  'How do I know if my bleeding is too heavy?': 'Kaise pata chale ki bleeding zyada heavy hai?',
  'How does the emergency pill work?': 'Emergency pill kaise kaam karti hai?',
  'I can’t focus on studying': 'Padhai mein focus nahi ho raha',
  'I can’t sleep before my period': 'Period se pehle neend nahi aati',
  'I feel angry and irritable all the time': 'Hamesha gussa aur chidchidapan rehta hai',
  'I feel anxious all the time': 'Hamesha anxiety rehti hai',
  'I feel guilty for being lazy': 'Aalsi hone ka guilt feel hota hai',
  'I feel low and unmotivated': 'Low aur unmotivated feel ho raha hai',
  'I get mood swings and cry easily before my period': 'Period se pehle mood swings hote hain aur rona aa jaata hai',
  'I have exams and I’m panicking': 'Exams hain aur panic ho raha hai',
  'I have spotting between periods': 'Periods ke beech spotting ho rahi hai',
  'I have zero motivation today': 'Aaj bilkul motivation nahi hai',
  'I want to talk to a counsellor': 'Mujhe counsellor se baat karni hai',
  'Is brown period blood normal?': 'Kya brown period blood normal hai?',
  'Is white discharge normal?': 'Kya safed discharge normal hai?',
  'It burns when I pee': 'Peshab mein jalan hoti hai',
  'My period is late. What should I do?': 'Period late hai. Kya karun?',
  'Pads, tampons or a menstrual cup — which is best?': 'Pad, tampon ya menstrual cup — kaunsa best hai?',
  'Walk me through a quick grounding exercise': 'Ek quick grounding exercise karwao',
  'What are the phases of the menstrual cycle?': 'Menstrual cycle ke phases kya hain?',
  'What helps with PMS?': 'PMS mein kya help karta hai?',
  'What is PCOS?': 'PCOS kya hai?',
  'What is a normal menstrual cycle?': 'Normal menstrual cycle kya hota hai?',
  'What phase am I in right now?': 'Main abhi kis phase mein hoon?',
  'What should I eat during my period?': 'Period mein kya khaun?',
  'What should I eat if I have PCOS?': 'PCOS mein kya khaun?',
  'When do I ovulate?': 'Mera ovulation kab hota hai?',
  'When is my next period?': 'Mera agla period kab aayega?',
  'When should I see a gynaecologist?': 'Gynaecologist ko kab dikhana chahiye?',
  'When should I take a pregnancy test?': 'Pregnancy test kab karun?',
  'Which painkiller is safe for period pain?': 'Period dard ke liye kaunsi painkiller safe hai?',
  'Why are my periods irregular?': 'Mere periods irregular kyun hain?',
  'Why do I crave sugar before my period?': 'Period se pehle meetha khaane ka mann kyun karta hai?',
  'Why do I feel so tired during my period?': 'Period mein itni thakaan kyun lagti hai?',
  'Help me prepare questions for my doctor visit': 'Doctor visit ke liye sawaal taiyaar karo',
};
