/**
 * Care Connect directory — national services in India, checked November 2026.
 * Numbers can change: each card links to the official source where one exists.
 *
 * Sources:
 *  - Tele-MANAS 14416 / 1-800-891-4416 (MoHFW, NIMHANS nodal centre; 24×7, free)
 *  - iCALL, TISS: 9152987821 (Mon–Sat, 10 AM–8 PM; free professional counselling)
 *  - Vandrevala Foundation: +91 9999 666 555 (24×7 call / WhatsApp)
 *  - NCW Women Helpline 14490, linked to 7827170170 (PIB, 3 July 2026; women 18+)
 *  - Women Helpline 181 (Ministry of Women & Child Development; links to One Stop Centres)
 *  - eSanjeevani: esanjeevani.mohfw.gov.in (free video OPD with government doctors)
 */
export interface CareService {
  id: string;
  name: string;
  what: string;
  hours: string;
  call?: string;
  callLabel?: string;
  whatsapp?: string;
  url?: string;
  urlLabel?: string;
  free?: boolean;
}

export const GYNAE_SERVICES: CareService[] = [
  {
    id: 'esanjeevani',
    name: 'eSanjeevani — free online OPD',
    what: 'Video consultation with government doctors (Govt. of India). Register with your mobile number, then pick a general or Obstetrics & Gynaecology OPD if your state offers it.',
    hours: 'OPD timings vary by state',
    url: 'https://esanjeevani.mohfw.gov.in/',
    urlLabel: 'Open eSanjeevani',
    free: true,
  },
  {
    id: 'nearby',
    name: 'Gynaecologists near you',
    what: 'Opens Google Maps with gynaecologists and women’s clinics close to where you are, with ratings and directions. Government hospitals have free OPDs too.',
    hours: 'Check each clinic',
    url: 'https://www.google.com/maps/search/?api=1&query=gynaecologist%20near%20me',
    urlLabel: 'Find near me',
  },
];

export const COUNSELLOR_SERVICES: CareService[] = [
  {
    id: 'telemanas',
    name: 'Tele-MANAS',
    what: 'Government mental-health helpline run with NIMHANS. Trained counsellors in 20+ languages — for stress, low mood, anxiety, exam pressure or relationship worries.',
    hours: '24×7',
    call: '14416',
    callLabel: 'Call 14416',
    free: true,
  },
  {
    id: 'icall',
    name: 'iCALL (TISS)',
    what: 'Free counselling by trained professionals from the Tata Institute of Social Sciences, by phone or email (icall@tiss.edu).',
    hours: 'Mon–Sat, 10 AM – 8 PM',
    call: '9152987821',
    callLabel: 'Call iCALL',
    free: true,
  },
  {
    id: 'vandrevala',
    name: 'Vandrevala Foundation',
    what: 'Free mental-health support and crisis counselling, by call or WhatsApp chat — good if speaking out loud feels hard.',
    hours: '24×7',
    call: '+919999666555',
    callLabel: 'Call',
    whatsapp: '919999666555',
    free: true,
  },
];

export const WOMEN_SAFETY_SERVICES: CareService[] = [
  {
    id: 'whl181',
    name: 'Women Helpline 181',
    what: 'For any woman facing violence or distress at home, work or outside. Connects you to police, medical help, legal aid, counselling and One Stop Centres.',
    hours: '24×7',
    call: '181',
    callLabel: 'Call 181',
    free: true,
  },
  {
    id: 'ncw',
    name: 'NCW Women Helpline',
    what: 'National Commission for Women helpline for women 18+ facing violence or harassment. Helps register complaints and get support.',
    hours: '24×7',
    call: '14490',
    callLabel: 'Call 14490',
    url: 'https://ncwwomenhelpline.ncw.gov.in/',
    urlLabel: 'Website',
    free: true,
  },
  {
    id: 'emergency',
    name: 'Emergency',
    what: 'Police, ambulance and fire — for any emergency, anywhere in India.',
    hours: '24×7',
    call: '112',
    callLabel: 'Call 112',
    free: true,
  },
];

/** What to take to a gynaecologist appointment. */
export const VISIT_CHECKLIST = [
  'Dates of your last 3 periods (SheSync’s report has them)',
  'How many pads/tampons you use on your heaviest day',
  'Your worst pain score and what you tried for it',
  'Any medicines, pills or supplements you take',
  'Your questions — write them down so you do not forget',
];
