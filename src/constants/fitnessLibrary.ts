// ============================================================
// SheSync Fitness Library — gym, home exercise and yoga sessions.
//
// Every session is a list of steps the in-app workout player walks
// through. A step is either rep-based (sets × reps, then a rest timer)
// or timed (a countdown per set). MET values follow the Compendium of
// Physical Activities and are only used for a rough calorie estimate.
// ============================================================
import type { CyclePhase } from '@/types';

export type WorkoutCategory = 'gym' | 'home' | 'yoga';
export type WorkoutIntensity = 'restorative' | 'gentle' | 'moderate' | 'vigorous';

export interface ExerciseStep {
  id: string;
  name: string;
  /** One-line instruction. */
  how: string;
  /** Number of sets (default 1). */
  sets?: number;
  /** Rep target for rep-based steps, e.g. "10" or "10 / side". */
  reps?: string;
  /** Duration of each set for timed steps. */
  seconds?: number;
  /** Rest after each set. */
  restSeconds?: number;
  /** Form or safety cue. */
  tip?: string;
  /** Easier option, e.g. for low-energy or period days. */
  easier?: string;
}

export interface LibraryWorkout {
  id: string;
  title: string;
  category: WorkoutCategory;
  level: 'Beginner' | 'Intermediate';
  intensity: WorkoutIntensity;
  minutes: number;
  met: number;
  equipment: string;
  focus: string;
  /** Cycle phases where this session usually feels best. */
  bestPhases: CyclePhase[];
  summary: string;
  steps: ExerciseStep[];
}

export const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  gym: 'Gym',
  home: 'Home & Outdoor',
  yoga: 'Yoga',
};

export const INTENSITY_LABELS: Record<WorkoutIntensity, string> = {
  restorative: 'Restorative',
  gentle: 'Gentle',
  moderate: 'Moderate',
  vigorous: 'Vigorous',
};

export const FITNESS_LIBRARY: LibraryWorkout[] = [
  // ─── GYM ──────────────────────────────────────────────────
  {
    id: 'gym-full-body-a',
    title: 'Gym Foundations: Full Body',
    category: 'gym',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 40,
    met: 5.0,
    equipment: 'Dumbbells, lat-pulldown & cable machines, bench',
    focus: 'All major muscles — an ideal first gym routine',
    bestPhases: ['follicular', 'ovulatory', 'luteal', 'irregular'],
    summary:
      'Six basic lifts that teach squat, hinge, push and pull patterns. Do it 2–3 times a week and add a little weight when the last reps feel easy.',
    steps: [
      { id: 'wu', name: 'Warm-up: treadmill or cycle', how: 'Easy pace for 5 minutes until you feel warm but can still talk.', seconds: 300 },
      { id: 'goblet', name: 'Goblet squat', how: 'Hold one dumbbell at your chest, sit hips back and down, knees track over toes.', sets: 3, reps: '10', restSeconds: 75, tip: 'Start light — 4–8 kg is plenty to learn the movement.', easier: 'Squat down to a bench and stand back up.' },
      { id: 'pulldown', name: 'Lat pulldown', how: 'Pull the bar to your upper chest, elbows down and back, chest proud.', sets: 3, reps: '10', restSeconds: 75 },
      { id: 'rdl', name: 'Dumbbell Romanian deadlift', how: 'Soft knees, push hips back, dumbbells slide down your thighs with a flat back.', sets: 3, reps: '10', restSeconds: 75, tip: 'Feel it in the back of your thighs, not your lower back.' },
      { id: 'row', name: 'Seated cable row', how: 'Sit tall, pull the handle to your ribs and squeeze your shoulder blades.', sets: 3, reps: '12', restSeconds: 60 },
      { id: 'press', name: 'Seated dumbbell shoulder press', how: 'Press the dumbbells overhead without arching your back.', sets: 3, reps: '10', restSeconds: 60 },
      { id: 'plank', name: 'Forearm plank', how: 'Elbows under shoulders, squeeze glutes, breathe slowly.', sets: 3, seconds: 30, restSeconds: 30, easier: 'Drop to your knees.' },
      { id: 'cd', name: 'Cool-down stretch', how: 'Hamstrings, hip flexors and chest — about 40 seconds each.', seconds: 240 },
    ],
  },
  {
    id: 'gym-glutes-legs',
    title: 'Glutes & Legs Strength',
    category: 'gym',
    level: 'Intermediate',
    intensity: 'vigorous',
    minutes: 45,
    met: 6.0,
    equipment: 'Barbell or Smith machine, leg press, dumbbells, cable',
    focus: 'Lower-body strength, glutes and knee stability',
    bestPhases: ['follicular', 'ovulatory'],
    summary:
      'A heavier lower-body day for when energy is high. Strong glutes and legs support your knees, back and posture.',
    steps: [
      { id: 'wu', name: 'Warm-up: cycle + bodyweight squats', how: '4 minutes easy cycling, then 10 slow bodyweight squats.', seconds: 300 },
      { id: 'thrust', name: 'Hip thrust', how: 'Upper back on a bench, drive through your heels, pause 1 second at the top with chin tucked.', sets: 4, reps: '8–10', restSeconds: 90 },
      { id: 'legpress', name: 'Leg press', how: 'Feet hip-width, lower until knees are about 90°, do not lock out.', sets: 3, reps: '12', restSeconds: 90 },
      { id: 'lunge', name: 'Walking lunges', how: 'Long steps, back knee hovers above the floor, torso upright.', sets: 3, reps: '10 / leg', restSeconds: 75, easier: 'Static split squats holding a support.' },
      { id: 'curl', name: 'Leg curl machine', how: 'Curl slowly, control the way back.', sets: 3, reps: '12', restSeconds: 60 },
      { id: 'kickback', name: 'Cable glute kickback', how: 'Slight hinge, kick back and up without arching your lower back.', sets: 3, reps: '12 / leg', restSeconds: 45 },
      { id: 'sideplank', name: 'Side plank', how: 'Elbow under shoulder, hips lifted in a straight line.', sets: 2, reps: '30 s / side', restSeconds: 30, easier: 'Bottom knee on the floor.' },
      { id: 'cd', name: 'Cool-down stretch', how: 'Glutes, quads and hamstrings.', seconds: 240 },
    ],
  },
  {
    id: 'gym-upper-posture',
    title: 'Upper Body & Posture',
    category: 'gym',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 35,
    met: 4.5,
    equipment: 'Dumbbells, cable machine, incline bench',
    focus: 'Back, shoulders and arms — undoes desk & study slouch',
    bestPhases: ['follicular', 'ovulatory', 'luteal', 'irregular'],
    summary: 'Pulling and pressing work that strengthens the upper back and improves posture after long hours of sitting.',
    steps: [
      { id: 'wu', name: 'Warm-up: rower + arm circles', how: '3 minutes easy rowing, then 20 arm circles each way.', seconds: 300 },
      { id: 'incline', name: 'Incline dumbbell press', how: 'Bench at 30°, lower the dumbbells to chest level and press up.', sets: 3, reps: '10', restSeconds: 75 },
      { id: 'row1', name: 'One-arm dumbbell row', how: 'Hand and knee on bench, pull the dumbbell to your hip.', sets: 3, reps: '10 / side', restSeconds: 60 },
      { id: 'facepull', name: 'Face pull', how: 'Pull the rope towards eye level with elbows high.', sets: 3, reps: '12', restSeconds: 60, tip: 'Great for rounded “phone shoulders”.' },
      { id: 'bicep', name: 'Dumbbell biceps curl', how: 'Elbows by your sides, curl up, lower slowly.', sets: 2, reps: '12', restSeconds: 45 },
      { id: 'triceps', name: 'Triceps rope pushdown', how: 'Elbows fixed, push the rope down and apart.', sets: 2, reps: '12', restSeconds: 45 },
      { id: 'deadbug', name: 'Dead bug', how: 'Lower back pressed down, extend opposite arm and leg slowly.', sets: 3, reps: '8 / side', restSeconds: 30 },
      { id: 'cd', name: 'Chest & upper-back stretch', how: 'Doorway chest stretch and child’s pose reach.', seconds: 180 },
    ],
  },
  {
    id: 'gym-cardio-intervals',
    title: 'Treadmill or Bike Intervals',
    category: 'gym',
    level: 'Intermediate',
    intensity: 'vigorous',
    minutes: 25,
    met: 7.5,
    equipment: 'Treadmill, spin bike or cross-trainer',
    focus: 'Heart & lung fitness in a short session',
    bestPhases: ['follicular', 'ovulatory'],
    summary: 'Eight rounds of one fast minute and one easy minute. Short, effective cardio for high-energy days.',
    steps: [
      { id: 'wu', name: 'Easy warm-up', how: 'Walk or pedal easily, raising the pace slowly.', seconds: 300 },
      { id: 'int', name: 'Fast interval', how: 'Brisk incline walk, jog or fast pedalling — hard but controlled. Rest = 1 easy minute.', sets: 8, seconds: 60, restSeconds: 60, easier: 'Use an incline walk instead of running.' },
      { id: 'cd', name: 'Cool-down walk', how: 'Slow down gradually and let your breathing settle.', seconds: 240 },
    ],
  },
  {
    id: 'gym-low-impact',
    title: 'Low-Impact Gym Day',
    category: 'gym',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 35,
    met: 4.3,
    equipment: 'Treadmill, leg press, row & chest-press machines',
    focus: 'Steady cardio + light machines for lower-energy days',
    bestPhases: ['luteal', 'menstrual', 'irregular'],
    summary: 'Incline walking and a light machine circuit — you still train, without leaving the gym exhausted.',
    steps: [
      { id: 'incline', name: 'Incline treadmill walk', how: '5–8% incline at a pace where you can still talk.', seconds: 1200 },
      { id: 'legpress', name: 'Leg press (light)', how: 'Comfortable weight, smooth reps.', sets: 2, reps: '12', restSeconds: 60 },
      { id: 'row', name: 'Seated row machine', how: 'Sit tall and pull to your ribs.', sets: 2, reps: '12', restSeconds: 60 },
      { id: 'chest', name: 'Chest press machine', how: 'Press out, control the way back.', sets: 2, reps: '12', restSeconds: 60 },
      { id: 'cd', name: 'Stretch & breathe', how: 'Gentle full-body stretch with slow exhales.', seconds: 240 },
    ],
  },

  // ─── HOME & OUTDOOR ───────────────────────────────────────
  {
    id: 'home-full-body-15',
    title: '15-Min Beginner Full Body',
    category: 'home',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 15,
    met: 3.8,
    equipment: 'No equipment',
    focus: 'Whole-body strength in a small space',
    bestPhases: ['follicular', 'ovulatory', 'luteal', 'irregular'],
    summary: '40 seconds of work, 20 seconds of rest. Six simple moves you can do in a hostel room.',
    steps: [
      { id: 'wu', name: 'Warm-up: march + arm swings', how: 'March on the spot and swing your arms.', seconds: 120 },
      { id: 'squat', name: 'Bodyweight squat', how: 'Feet shoulder-width, sit back and stand tall.', sets: 2, seconds: 40, restSeconds: 20 },
      { id: 'pushup', name: 'Knee or wall push-up', how: 'Body in a line, chest to the floor or wall.', sets: 2, seconds: 40, restSeconds: 20 },
      { id: 'bridge', name: 'Glute bridge', how: 'Lie on your back, push through heels and lift hips.', sets: 2, seconds: 40, restSeconds: 20 },
      { id: 'lunge', name: 'Reverse lunge (alternating)', how: 'Step back, lower gently, return to standing.', sets: 2, seconds: 40, restSeconds: 20, easier: 'Hold a chair for balance.' },
      { id: 'birddog', name: 'Bird-dog', how: 'On all fours, reach opposite arm and leg long, then switch.', sets: 2, seconds: 40, restSeconds: 20 },
      { id: 'plank', name: 'Plank (knees okay)', how: 'Hold a straight line and breathe.', sets: 2, seconds: 30, restSeconds: 30 },
      { id: 'cd', name: 'Cool-down stretch', how: 'Quads, hamstrings and shoulders.', seconds: 90 },
    ],
  },
  {
    id: 'home-low-impact-burn',
    title: '20-Min Low-Impact Fat Burn',
    category: 'home',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 20,
    met: 5.0,
    equipment: 'No equipment · no jumping',
    focus: 'Calorie burn that is kind to knees and neighbours',
    bestPhases: ['follicular', 'ovulatory', 'luteal'],
    summary: 'Standing cardio moves with no jumping — gets your heart rate up quietly.',
    steps: [
      { id: 'wu', name: 'Warm-up march', how: 'Brisk march, gradually lifting knees higher.', seconds: 120 },
      { id: 'stepjack', name: 'Step jacks', how: 'Step out to the side while raising arms overhead, alternate sides.', sets: 3, seconds: 45, restSeconds: 15 },
      { id: 'squatreach', name: 'Squat to overhead reach', how: 'Squat down, stand and reach both arms up.', sets: 3, seconds: 45, restSeconds: 15 },
      { id: 'knee', name: 'Standing knee drives', how: 'Drive one knee up as you pull your arms down, alternate.', sets: 3, seconds: 45, restSeconds: 15 },
      { id: 'skater', name: 'Low-impact skaters', how: 'Step side to side, sweeping the back leg behind.', sets: 3, seconds: 45, restSeconds: 15 },
      { id: 'oblique', name: 'Standing oblique crunch', how: 'Hands behind head, bring knee to the same-side elbow.', sets: 3, seconds: 45, restSeconds: 15 },
      { id: 'cd', name: 'Cool-down', how: 'Slow march and stretch.', seconds: 120 },
    ],
  },
  {
    id: 'home-core-pelvic',
    title: 'Core & Pelvic-Floor Friendly Strength',
    category: 'home',
    level: 'Beginner',
    intensity: 'gentle',
    minutes: 15,
    met: 2.8,
    equipment: 'Yoga mat',
    focus: 'Deep core, hips and pelvic floor — good on period days',
    bestPhases: ['menstrual', 'luteal', 'irregular'],
    summary: 'Slow, breath-led strength for days when you want to move without pushing hard.',
    steps: [
      { id: 'breath', name: '360° breathing', how: 'Breathe into your ribs and belly; on each exhale gently lift the pelvic floor.', seconds: 90 },
      { id: 'bridge', name: 'Glute bridge with exhale', how: 'Exhale as you lift, inhale as you lower.', sets: 3, reps: '12', restSeconds: 30 },
      { id: 'clam', name: 'Clamshell', how: 'Lie on your side, knees bent, open the top knee without rolling back.', sets: 2, reps: '12 / side', restSeconds: 20 },
      { id: 'deadbug', name: 'Slow dead bug', how: 'Lower back down, move opposite arm and leg slowly.', sets: 2, reps: '8 / side', restSeconds: 30 },
      { id: 'birddog', name: 'Bird-dog', how: 'Reach long, pause, return with control.', sets: 2, reps: '8 / side', restSeconds: 30 },
      { id: 'legraise', name: 'Side-lying leg lift', how: 'Top leg straight, lift and lower slowly.', sets: 2, reps: '12 / side', restSeconds: 20 },
      { id: 'child', name: 'Child’s pose', how: 'Knees wide, rest your forehead, breathe into your back.', seconds: 90 },
    ],
  },
  {
    id: 'home-hiit-tabata',
    title: '20-Min HIIT Tabata',
    category: 'home',
    level: 'Intermediate',
    intensity: 'vigorous',
    minutes: 22,
    met: 8.0,
    equipment: 'No equipment',
    focus: 'Short, intense cardio for high-energy days',
    bestPhases: ['follicular', 'ovulatory'],
    summary: 'Four Tabata blocks of 20 seconds hard, 10 seconds rest. Each block lasts 4 minutes.',
    steps: [
      { id: 'wu', name: 'Warm-up', how: 'March, arm circles and a few gentle squats.', seconds: 180 },
      { id: 'jumpsquat', name: 'Tabata A: squat jumps', how: 'Squat, then jump softly; land quietly.', sets: 8, seconds: 20, restSeconds: 10, easier: 'Fast squats without the jump.' },
      { id: 'climber', name: 'Tabata B: mountain climbers', how: 'Plank position, drive knees in quickly.', sets: 8, seconds: 20, restSeconds: 10, easier: 'Slow climbers with hands on a bed.' },
      { id: 'highknee', name: 'Tabata C: high knees', how: 'Run on the spot, knees to hip height.', sets: 8, seconds: 20, restSeconds: 10, easier: 'Fast marching.' },
      { id: 'plankjack', name: 'Tabata D: plank jacks', how: 'Plank, jump feet wide and back together.', sets: 8, seconds: 20, restSeconds: 10, easier: 'Plank shoulder taps.' },
      { id: 'cd', name: 'Cool-down', how: 'Walk around and stretch while your breathing settles.', seconds: 180 },
    ],
  },
  {
    id: 'walk-brisk',
    title: 'Brisk Walk + Mobility',
    category: 'home',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 32,
    met: 4.3,
    equipment: 'Good shoes — outdoors, campus track or indoors',
    focus: 'Easy cardio that counts towards your weekly 150 minutes',
    bestPhases: ['menstrual', 'follicular', 'ovulatory', 'luteal', 'irregular'],
    summary: 'The most underrated workout: a brisk walk where you can talk but not sing.',
    steps: [
      { id: 'easy1', name: 'Easy walk', how: 'Relaxed pace to warm up.', seconds: 300 },
      { id: 'brisk', name: 'Brisk walk', how: 'Quick pace — you can talk but not sing. Swing your arms.', seconds: 1200 },
      { id: 'easy2', name: 'Easy walk', how: 'Slow down and let your heart rate settle.', seconds: 300 },
      { id: 'stretch', name: 'Calf & hip-flexor stretch', how: 'Hold each stretch for 30 seconds per side.', seconds: 120 },
    ],
  },

  // ─── YOGA ─────────────────────────────────────────────────
  {
    id: 'yoga-cramp-relief',
    title: 'Period Cramp Relief Yoga',
    category: 'yoga',
    level: 'Beginner',
    intensity: 'restorative',
    minutes: 14,
    met: 2.3,
    equipment: 'Mat, 2 pillows',
    focus: 'Lower back, hips and belly — eases cramp tension',
    bestPhases: ['menstrual', 'luteal'],
    summary: 'Slow, supported poses and belly breathing. Many people find gentle movement eases period cramps.',
    steps: [
      { id: 'child', name: 'Supported child’s pose (Balasana)', how: 'Knees wide, pillow under your chest, breathe into your lower back.', seconds: 90 },
      { id: 'catcow', name: 'Cat–cow (Marjaryasana–Bitilasana)', how: 'Round and arch your spine slowly with the breath.', seconds: 60 },
      { id: 'lunge', name: 'Low lunge side stretch (Anjaneyasana)', how: 'Back knee down, reach the same-side arm up and over.', sets: 2, seconds: 45, restSeconds: 5, tip: 'One side per set.' },
      { id: 'bound', name: 'Reclined bound angle (Supta Baddha Konasana)', how: 'Soles together, pillows under knees, one hand on your belly.', seconds: 120 },
      { id: 'twist', name: 'Supine twist (Supta Matsyendrasana)', how: 'Knees fall to one side, look the other way.', sets: 2, seconds: 60, restSeconds: 5, tip: 'One side per set.' },
      { id: 'apana', name: 'Knees-to-chest (Apanasana)', how: 'Hug knees in and rock gently side to side.', seconds: 60 },
      { id: 'legsup', name: 'Legs up the wall (Viparita Karani)', how: 'Hips near the wall, legs resting up it.', seconds: 120, tip: 'Skip it if it feels uncomfortable on heavy-flow days.' },
      { id: 'sav', name: 'Savasana with belly breathing', how: 'Lie still, slow 4-count inhale and 6-count exhale.', seconds: 120 },
    ],
  },
  {
    id: 'yoga-surya-flow',
    title: 'Surya Namaskar Energy Flow',
    category: 'yoga',
    level: 'Beginner',
    intensity: 'moderate',
    minutes: 20,
    met: 3.3,
    equipment: 'Mat',
    focus: 'Full-body flexibility, strength and morning energy',
    bestPhases: ['follicular', 'ovulatory'],
    summary: 'Six slow rounds of Sun Salutation followed by standing balance poses.',
    steps: [
      { id: 'center', name: 'Centering breath', how: 'Stand tall in Tadasana, 6 slow breaths.', seconds: 60 },
      { id: 'surya', name: 'Sun Salutation (Surya Namaskar)', how: 'One full round per set, moving with your breath.', sets: 6, seconds: 90, restSeconds: 15 },
      { id: 'warrior', name: 'Warrior II (Virabhadrasana II)', how: 'Front knee over ankle, arms long, gaze forward.', sets: 2, seconds: 45, restSeconds: 5, tip: 'One side per set.' },
      { id: 'triangle', name: 'Triangle (Trikonasana)', how: 'Long legs, reach forward then down, top arm up.', sets: 2, seconds: 45, restSeconds: 5, tip: 'One side per set.' },
      { id: 'tree', name: 'Tree pose (Vrksasana)', how: 'Foot on calf or thigh (never the knee), hands at heart.', sets: 2, seconds: 40, restSeconds: 5 },
      { id: 'bridge', name: 'Bridge pose (Setu Bandhasana)', how: 'Lift hips, roll shoulders under.', sets: 3, seconds: 30, restSeconds: 15 },
      { id: 'sav', name: 'Savasana', how: 'Rest and let your breath slow down.', seconds: 120 },
    ],
  },
  {
    id: 'yoga-pcos-flow',
    title: 'PCOS-Friendly Calm Strength Yoga',
    category: 'yoga',
    level: 'Beginner',
    intensity: 'gentle',
    minutes: 18,
    met: 2.8,
    equipment: 'Mat',
    focus: 'Hips, core and slow breathing for stress balance',
    bestPhases: ['menstrual', 'follicular', 'ovulatory', 'luteal', 'irregular'],
    summary:
      'Gentle strength poses and alternate-nostril breathing. Regular movement of any kind supports insulin sensitivity — choose what you enjoy.',
    steps: [
      { id: 'butterfly', name: 'Butterfly (Baddha Konasana)', how: 'Soles together, sit tall, gently flutter knees.', seconds: 90 },
      { id: 'cobra', name: 'Cobra (Bhujangasana)', how: 'Lift your chest using your back, elbows soft.', sets: 3, seconds: 20, restSeconds: 10 },
      { id: 'boat', name: 'Boat pose (Navasana, knees bent)', how: 'Sit back on your sit bones, lift shins, chest proud.', sets: 3, seconds: 20, restSeconds: 20 },
      { id: 'bridge', name: 'Bridge (Setu Bandhasana)', how: 'Lift hips and hold, breathing steadily.', sets: 3, seconds: 30, restSeconds: 15 },
      { id: 'fold', name: 'Seated forward fold (Paschimottanasana)', how: 'Knees bent if needed, fold from your hips.', seconds: 90 },
      { id: 'malasana', name: 'Garland squat (Malasana)', how: 'Feet wide, sink hips down, palms together.', seconds: 60, easier: 'Sit on a folded blanket or block.' },
      { id: 'anulom', name: 'Anulom Vilom (alternate-nostril breathing)', how: 'Inhale left, exhale right, inhale right, exhale left — slowly.', seconds: 300 },
      { id: 'sav', name: 'Savasana', how: 'Rest completely.', seconds: 120 },
    ],
  },
  {
    id: 'yoga-sleep-calm',
    title: 'Sleep & Calm Yin',
    category: 'yoga',
    level: 'Beginner',
    intensity: 'restorative',
    minutes: 14,
    met: 2.0,
    equipment: 'Mat, pillow',
    focus: 'Wind down before bed, ease PMS restlessness',
    bestPhases: ['menstrual', 'luteal', 'irregular'],
    summary: 'Long, quiet holds and humming-bee breath to help your body switch off for the night.',
    steps: [
      { id: 'child', name: 'Supported child’s pose', how: 'Pillow under chest, let your whole body soften.', seconds: 120 },
      { id: 'twist', name: 'Reclined twist', how: 'Knees to one side, arms wide, breathe slowly.', sets: 2, seconds: 60, restSeconds: 5, tip: 'One side per set.' },
      { id: 'legsup', name: 'Legs up the wall', how: 'Rest your legs on the wall, arms by your sides.', seconds: 180 },
      { id: 'bhramari', name: 'Bhramari (humming-bee breath)', how: 'Inhale through the nose, hum softly as you exhale.', seconds: 120 },
      { id: 'scan', name: 'Body-scan Savasana', how: 'Move your attention slowly from toes to head, relaxing each part.', seconds: 300 },
    ],
  },
];

export function getLibraryWorkout(id: string | undefined): LibraryWorkout | undefined {
  return FITNESS_LIBRARY.find((w) => w.id === id);
}

/** Planned length of a session in seconds (work + rest), used by the player. */
export function plannedSeconds(workout: LibraryWorkout): number {
  return workout.steps.reduce((sum, s) => {
    const sets = s.sets ?? 1;
    const work = s.seconds ? s.seconds * sets : sets * 45; // ~45 s per rep-based set
    const rest = (s.restSeconds ?? 0) * Math.max(0, sets - 1);
    return sum + work + rest;
  }, 0);
}

/** Sessions that count as muscle-strengthening (WHO: at least 2 days a week). */
export const STRENGTH_WORKOUT_IDS = new Set([
  'gym-full-body-a',
  'gym-glutes-legs',
  'gym-upper-posture',
  'gym-low-impact',
  'home-full-body-15',
  'home-core-pelvic',
  'home-low-impact-burn',
  'yoga-pcos-flow',
]);
