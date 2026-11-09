import type { ShelfVideo } from '@/components/common/VideoShelf';

// Curated YouTube videos. IDs were checked against YouTube search results
// in November 2026; creators are named only where YouTube confirmed them.

export const FITNESS_VIDEO_CATEGORIES = [
  { id: 'gym', label: 'Gym' },
  { id: 'home', label: 'Home & walking' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'learn', label: 'Learn' },
];

export const FITNESS_VIDEOS: ShelfVideo[] = [
  {
    youtubeId: 'oBs-PE34x7g',
    title: 'How to Use Basic Gym Equipment (Beginner’s Full Body Workout)',
    channel: 'SELF',
    category: 'gym',
    why: 'A trainer walks you through each common machine — great before your first gym day.',
  },
  {
    youtubeId: 'sqPSaf86o5w',
    title: '7 Beginner Weight Training Exercises For Women',
    channel: 'adidas',
    category: 'gym',
    why: 'Seven full-body lifts with clear form cues.',
  },
  {
    youtubeId: '_k4QKzbYgVc',
    title: 'How To Get Started In The Gym for Women (+ Full 4-Day Plan)',
    channel: 'Rise with Lina',
    category: 'gym',
    length: '11:07',
    why: 'How to structure your week once the basics feel easy.',
  },
  {
    youtubeId: 'D6c-5ZT8ngU',
    title: '20 MIN Beginner Full Body Bodyweight Workout | No Equipment',
    channel: 'Marga Banaga',
    category: 'home',
    length: '20 min',
    why: 'Follow-along strength session for a small room.',
  },
  {
    youtubeId: '2Z9g-AZinUc',
    title: '20 MIN Full Body Workout — Small Space, No Jumping',
    channel: 'MadFit',
    category: 'home',
    length: '20 min',
    why: 'Quiet, knee-friendly cardio for hostels and flats.',
  },
  {
    youtubeId: 'Ku8CIgWmT5k',
    title: 'Indoor Walking Workout — Low Impact (1 Mile at Home)',
    channel: 'Caroline Jordan',
    category: 'home',
    why: 'Walk a mile indoors on rainy or late days.',
  },
  {
    youtubeId: 'v7AYKMP6rOE',
    title: 'Yoga For Complete Beginners — 20 Minute Home Yoga',
    channel: 'Yoga With Adriene',
    category: 'yoga',
    length: '20 min',
    why: 'The friendliest place to start yoga.',
  },
  {
    youtubeId: 'GnHTeHAZQhM',
    title: 'Morning Yoga for Beginners — Gentle Morning Yoga',
    channel: 'Yoga With Adriene',
    category: 'yoga',
    length: '20 min',
    why: 'Wake up stiff after studying late? Start here.',
  },
  {
    youtubeId: 'FXPGuNU-BYA',
    title: 'Yoga for Cramps and PMS',
    channel: 'Yoga With Adriene',
    category: 'yoga',
    why: 'Gentle poses for period days and lower-back ache.',
  },
  {
    youtubeId: 'bOFye2u6P5k',
    title: 'Yoga For PCOS | PCOS Exercise At Home',
    channel: 'VentunoYoga',
    category: 'yoga',
    why: 'Indian yoga routine aimed at PCOS-friendly movement.',
  },
  {
    youtubeId: 'M0wqYGCKKj8',
    title: 'Training Around Your Period: Science-Based Tips',
    channel: 'YouTube',
    category: 'learn',
    why: 'What research does (and does not) say about cycle-synced training.',
  },
];

export const STUDY_VIDEO_CATEGORIES = [
  { id: 'cycle', label: 'Periods & focus' },
  { id: 'studywithme', label: 'Study with me' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'stress', label: 'Exam stress' },
  { id: 'comfort', label: 'Period-day comfort' },
];

export const STUDY_VIDEOS: ShelfVideo[] = [
  {
    youtubeId: 'iNgbgFOeJDs',
    title: 'Best Tips to Study During Period Cramps (NEET)',
    channel: 'Beauty Jha',
    category: 'cycle',
    why: 'An Indian student’s practical tips for exam season on period days.',
  },
  {
    youtubeId: 'iL7vgJTaBpU',
    title: 'How to Study Around Your Cycle',
    channel: 'YouTube',
    category: 'cycle',
    why: 'Matching study tasks to each phase of your cycle.',
  },
  {
    youtubeId: '-nRQS3T0Zg4',
    title: 'PMS, PMDD & Your Brain: How Hormones Affect Mood, Energy & Motivation',
    channel: 'YouTube',
    category: 'cycle',
    why: 'Why the week before your period can feel so different — and what helps.',
  },
  {
    youtubeId: '7bLQH4LqtWk',
    title: 'How Hormones and Menstruation Affect Mental Health',
    channel: 'Tory Eisenlohr-Moul, PhD',
    category: 'cycle',
    why: 'A researcher explains who is affected, how much, and when to seek help.',
  },
  {
    youtubeId: 'h4odCPxtfVo',
    title: 'Pomodoro 25/5 Flip Clock Timer — 2 Hours Study With Me',
    channel: 'YouTube',
    category: 'studywithme',
    length: '2 h',
    why: 'No music, just a soft bell at every switch.',
  },
  {
    youtubeId: '4TNu6_De4V4',
    title: '2-Hour Study With Me (Pomodoro 25/5) — Calm Lofi',
    channel: 'YouTube',
    category: 'studywithme',
    length: '2 h',
    why: 'Body-doubling with calm music when it is hard to start.',
  },
  {
    youtubeId: '_X0mgOOSpLU',
    title: 'The Power of Believing That You Can Improve',
    channel: 'Carol Dweck · TED',
    category: 'confidence',
    why: 'Growth mindset: “not yet” instead of “I can’t”.',
  },
  {
    youtubeId: 'RWZluriQUzE',
    title: 'Your Body Language Shapes Who You Are',
    channel: 'Amy Cuddy · TED-Ed',
    category: 'confidence',
    why: 'Small ways to walk into a viva or presentation feeling steadier.',
  },
  {
    youtubeId: '9oWOsocN7qg',
    title: 'How to Make Yourself Study When You Have ZERO Motivation',
    channel: 'Thomas Frank',
    category: 'confidence',
    why: 'Tiny first steps for days when starting feels impossible.',
  },
  {
    youtubeId: '48jlHaxZnig',
    title: 'How to Stop Procrastination & Increase Motivation',
    channel: 'Dr. Andrew Huberman',
    category: 'confidence',
    why: 'The science of motivation, explained simply.',
  },
  {
    youtubeId: '7GTgRBlSNtE',
    title: 'Test Anxiety? 3 Tips to Stay Calm During Exams',
    channel: 'Ask Professor V',
    category: 'stress',
    why: 'Three strategies to use before and during an exam.',
  },
  {
    youtubeId: 'LBbQK2HIvvI',
    title: 'Breathing Through Exams: A Practice to Focus and Calm Stress',
    channel: 'YouTube',
    category: 'stress',
    why: 'A guided breathing break between study blocks.',
  },
  {
    youtubeId: 'FXPGuNU-BYA',
    title: 'Yoga for Cramps and PMS',
    channel: 'Yoga With Adriene',
    category: 'comfort',
    why: 'A gentle reset when cramps break your concentration.',
  },
  {
    youtubeId: 'tD_l3fDTFyg',
    title: 'Yoga To Heal Stress | 20-Minute Practice',
    channel: 'Yoga With Adriene',
    category: 'comfort',
    length: '20:34',
    why: 'Unwind after a long study day.',
  },
];
