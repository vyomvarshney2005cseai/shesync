// ============================================================
// Pad Care content: how long each period product can be worn,
// what to look for when choosing a pad, hygiene basics and when
// to see a doctor.
//
// This is general guidance, never a diagnosis and never a brand
// ranking. Wear times follow the sources in PAD_CARE_SOURCES.
// ============================================================

export type PeriodProduct = 'pad' | 'cloth_pad' | 'tampon' | 'cup' | 'period_underwear';

export interface ProductGuide {
  id: PeriodProduct;
  label: string;
  /** Noun used in reminders: "Time to change your …". */
  noun: string;
  /** Verb used in reminders: "change" or "empty". */
  verb: 'change' | 'empty';
  /** Plain-language wear time shown on the guide card. */
  wearTime: string;
  /** Suggested daytime reminder interval, in hours. */
  defaultHours: number;
  /** Longest daytime interval the timer allows, in hours. */
  maxDayHours: number;
  /** When the single overnight reminder fires, in hours after bedtime. */
  nightHours: number;
  /** Past this many hours the timer says "change now" and sends a second reminder. */
  overHours: number;
  tips: string[];
}

export const PRODUCT_ORDER: PeriodProduct[] = ['pad', 'cloth_pad', 'tampon', 'cup', 'period_underwear'];

export const PRODUCT_GUIDES: Record<PeriodProduct, ProductGuide> = {
  pad: {
    id: 'pad',
    label: 'Pad',
    noun: 'pad',
    verb: 'change',
    wearTime:
      'Every 4–6 hours, sooner if it feels wet or full. Do not wear one pad for more than 8 hours — at night, use an overnight pad and change it as soon as you wake up.',
    defaultHours: 4,
    maxDayHours: 6,
    nightHours: 8,
    overHours: 8,
    tips: [
      'Match the absorbency to your flow: regular for most days, heavy or overnight for heavy days.',
      'Change it even if it looks lightly used — dampness against the skin causes rashes.',
      'Wrap the used pad in its wrapper or paper and put it in a bin. Never flush pads.',
    ],
  },
  cloth_pad: {
    id: 'cloth_pad',
    label: 'Cloth pad',
    noun: 'cloth pad',
    verb: 'change',
    wearTime:
      'Every 4–6 hours, like a disposable pad. Rinse it in cold water, wash with soap and dry it completely in direct sunlight before using it again.',
    defaultHours: 4,
    maxDayHours: 6,
    nightHours: 8,
    overHours: 8,
    tips: [
      'Rinse in cold water first — hot water sets the stain.',
      'Dry it fully in direct sunlight; a damp pad grows germs.',
      'Store it only when completely dry, and never share cloth pads.',
    ],
  },
  tampon: {
    id: 'tampon',
    label: 'Tampon',
    noun: 'tampon',
    verb: 'change',
    wearTime:
      'Every 4–8 hours, even on light days. Never leave one in for more than 8 hours, and use the lowest absorbency that works for your flow.',
    defaultHours: 4,
    maxDayHours: 8,
    nightHours: 8,
    overHours: 8,
    tips: [
      'Sleeping longer than 8 hours? Use a pad at night instead.',
      'Wash your hands before and after inserting one.',
      'Sudden high fever, vomiting, a sunburn-like rash or dizziness while using a tampon: take it out and get medical help right away.',
    ],
  },
  cup: {
    id: 'cup',
    label: 'Menstrual cup',
    noun: 'cup',
    verb: 'empty',
    wearTime: 'Empty and rinse it at least every 12 hours — more often on heavy days.',
    defaultHours: 8,
    maxDayHours: 12,
    nightHours: 12,
    overHours: 12,
    tips: [
      'Wash your hands, empty the cup and rinse it with clean water before putting it back.',
      'Clean it between periods the way the maker’s instructions say.',
      'Same warning signs as tampons: sudden fever, rash or dizziness — take it out and get help.',
    ],
  },
  period_underwear: {
    id: 'period_underwear',
    label: 'Period underwear',
    noun: 'period underwear',
    verb: 'change',
    wearTime:
      'Depends on the brand and absorbency — follow the label, and change sooner if it feels damp.',
    defaultHours: 6,
    maxDayHours: 12,
    nightHours: 8,
    overHours: 12,
    tips: [
      'Rinse in cold water after use, then wash as the label says.',
      'Let it dry fully before wearing it again.',
      'Works well as backup with a cup or tampon on heavy days.',
    ],
  },
};

/** Shown when today's logged flow is heavy. */
export const HEAVY_FLOW_TIP =
  'Heavy days often need a change every 2–3 hours. Soaking through a pad or tampon every 1–2 hours, or needing two products at once, is worth checking with a doctor.';

// ─── Choosing a pad ─────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  title: string;
  why: string;
}

export const PAD_CHECKLIST: ChecklistItem[] = [
  {
    id: 'absorbency',
    title: 'Right absorbency for your flow',
    why: 'Light, regular, heavy and overnight pads hold different amounts. Too thin leaks; too thick tempts you to wear it longer.',
  },
  {
    id: 'fragrance',
    title: 'Fragrance-free',
    why: 'Perfumed or “deodorising” pads add chemicals your skin does not need and can cause itching.',
  },
  {
    id: 'topsheet',
    title: 'Soft, breathable top layer',
    why: 'If you get rashes, a cotton or soft cloth-like top layer may suit you better than a plastic mesh one.',
  },
  {
    id: 'materials',
    title: 'Materials listed on the pack',
    why: 'Brands that name the top sheet, core and back sheet are easier to judge. “Organic” on the front is not the same as a full list.',
  },
  {
    id: 'isi',
    title: 'ISI mark / IS 5405 on the pack',
    why: 'IS 5405 is the Bureau of Indian Standards specification for disposable pads.',
  },
  {
    id: 'fit',
    title: 'Length and wings that fit you',
    why: 'Longer pads with wings for nights and heavy days; a shorter one for light days.',
  },
  {
    id: 'sealed',
    title: 'Sealed pack, stored dry',
    why: 'Check the pack is sealed and within its date. Keep pads somewhere dry — not on a damp bathroom shelf.',
  },
];

export const CHEMICALS_NOTE = {
  title: 'What lab testing has found',
  body: 'In 2022 the Delhi NGO Toxics Link tested 10 pad brands sold in India and found phthalates and VOCs in all of them — including pads sold as organic. At the time, India had no clear limits for these chemicals in pads. No pad is proven “chemical-free”, so pick fragrance-free, read the label, change on time and notice how your skin reacts.',
};

// ─── Hygiene and doctor guidance ────────────────────────────

export const HYGIENE_TIPS: string[] = [
  'Wash your hands before and after changing.',
  'Change on time even on light days — a damp pad against the skin causes rashes.',
  'Wash the outside (vulva) with plain water. Skip soaps, sprays and douching inside the vagina.',
  'Wipe from front to back.',
  'Wear clean, breathable cotton underwear and change it daily.',
  'Wrap used pads in the wrapper or paper and bin them — never flush.',
  'Carry a spare pad and a small paper bag for college, work or travel.',
];

export const DOCTOR_SIGNS: string[] = [
  'Soaking through a pad or tampon every 1–2 hours, needing two products at once, clots bigger than a ₹2 coin, or bleeding for more than 7 days.',
  'A rash, itching or burning that lasts more than a few days, even after switching to a fragrance-free pad and changing more often.',
  'Unusual discharge, a strong fishy smell, or pain while peeing.',
];

export const URGENT_SIGN =
  'Sudden high fever, vomiting or diarrhoea, a sunburn-like rash, or dizziness or fainting while using a tampon or cup: take it out and get emergency care. This can be toxic shock syndrome — rare, but serious.';

export const PAD_CARE_SOURCES: { label: string; url: string }[] = [
  { label: 'US FDA — Tampons: facts and safe use', url: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons' },
  { label: 'NHS — Heavy periods', url: 'https://www.nhs.uk/conditions/heavy-periods/' },
  { label: 'Cleveland Clinic — Menstrual cups', url: 'https://health.clevelandclinic.org/tired-of-tampons-here-are-pros-and-cons-of-menstrual-cups' },
  {
    label: 'Toxics Link study (2022), reported by The Wire',
    url: 'https://livewire.thewire.in/livewire/popular-sanitary-pads-sold-in-india-have-harmful-chemicals-cause-serious-health-issues-report/',
  },
  {
    label: 'Bureau of Indian Standards — IS 5405',
    url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/Indian_standards/isdetails/MzI5Mzg=',
  },
];
