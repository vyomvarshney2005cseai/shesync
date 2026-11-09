# SheSync — November 2026 update

Run `npm install` once after pulling these changes (adds `expo-keep-awake`, plus `eslint` and `eslint-config-expo` for `npx expo lint`).

## 1. Critical fixes

| # | Problem | Fix |
|---|---------|-----|
| 1 | **All data was lost on every restart** — the Zustand store was memory-only. | Every store is saved on the device (AsyncStorage / localStorage on web). Signed-in users skip the welcome screen; derived numbers are recomputed on launch. |
| 2 | **App crashed on launch without a `.env`** (`supabaseUrl is required`). | `isSupabaseConfigured` check; without keys the app runs in on-device mode and never calls the network. |
| 3 | **Login accepted any password** — every error, including "Invalid login credentials", fell back to a local login. Sign-up also hid "User already registered". | Only network/unconfigured errors fall back to on-device mode (`isOfflineAuthError`). Wrong passwords, unconfirmed emails and existing accounts now show a clear message. |
| 4 | **Sign-out left the previous person's health data on the phone** (and a new account inherited it). | Sign-out (with a confirmation) and sign-up wipe all health, fitness, study and game data on the device. Logging in with a different email starts fresh. |
| 5 | **SOS buttons did nothing**, and the only number shown was the US 988 line. | Working buttons: breathe-with-me, **call Tele-MANAS 14416** (free, 24×7), message a friend (SMS), and **112** for emergencies. |
| 6 | **Invented health data shown as real**: demo user "Maya", demo logs and cycles, fake workout history, made-up HRV and sleep values, a permanent "High Cortisol 28.3 µg/dL" banner, a canned voice-journal entry, sine-wave "90-day trend", and fake "voice biomarker" analysis. | New accounts start empty. Snapshot shows **Readiness** (from the strain engine) and **Sleep you log yourself**; no HRV/cortisol numbers anywhere. The trend chart and doctor PDF use only what was logged. The journal starts empty and says audio is not stored. |
| 7 | **Every user was labelled PCOS + PMDD** (hard-coded), and one low-mood log added "PMDD". | Focus areas come from what she picks at sign-up. Logged patterns are shown as observations ("Heavy flow logged on 2 days") with when-to-see-a-doctor guidance — never as diagnoses. |
| 8 | **Predictions never moved forward in time** — the cycle engine used the `daysAgo` saved on day one. | Cycle day, phase and "next period in N days" are computed from the real start date every time. |
| 9 | **A heavy-flow log kept her in the "menstrual phase" for weeks.** | Only recent logs describe today (flow: today/yesterday; pain and mood: last 2 days). |
| 10 | **Logs between midnight and 5:30 AM IST were saved under the previous day** (`toISOString()` is UTC). | Local calendar dates everywhere (`src/lib/dates.ts`). |
| 11 | **"Workout overridden" was always shown**, even on low-strain days, and "Start" did nothing. | Today's plan is chosen from cycle phase + strain + pain/flow; the banner only warns when a plan was really changed; Start opens the guided workout player; adaptation history records real changes. |
| 12 | **Sign-out froze the web app** ("Maximum update depth exceeded"): the welcome screen and the Home tab were both `/`. | Welcome screen moved to `/welcome`; one auth guard (`AuthGate`) protects all signed-in screens and deep links. |
| 13 | Unreadable grey text on the dark "high strain" background; SOS sheet was see-through. | Softer background veil on mid/high strain; opaque SOS sheet. |
| 14 | 18 lint errors (React Compiler rules) and no lint config. | `eslint.config.js` added; **0 lint errors**, `tsc` clean. |

## 2. New: Fitness & Weight dashboard (`/fitness`)
- **Today's plan** for her cycle phase and strain, at home or gym, with a one-tap guided session.
- **14 sessions** — Gym (full body, glutes & legs, upper body & posture, intervals, low-impact), Home & Outdoor (15-min full body, low-impact fat burn, core & pelvic floor, HIIT Tabata, brisk walk) and Yoga (period cramp relief, Surya Namaskar, PCOS-friendly, sleep & calm).
- **Guided player**: timed sets, rest timers, pause/skip/back, easier options, calorie estimate, "how did it feel?".
- **Body & weight**: BMI with the Asian-Indian risk note, BMR/TDEE, a safe calorie target (never below 1,200 kcal or BMR; no loss target for BMI < 18.5 or under-18s; goal weight cannot go below BMI 18.5), protein and water targets, goal progress and ETA.
- **Weight log** with chart, week-on-week change, too-fast-loss warning and a period water-retention note.
- **Weekly activity** against WHO's 150 min + 2 strength days, water and steps trackers, recent sessions, curated YouTube classes.

## 3. New: Study Focus & Confidence dashboard (`/study`)
- **Today's focus mode** from cycle phase and what she logged (pain, flow, brain fog, mood, energy) — e.g. *Gentle Focus 15/5* on a heavy-cramp day, *Deep Learning 45/10* after her period.
- **Pomodoro timer** that survives leaving the screen (stores the end time), long break every 4 rounds, minutes saved automatically.
- Study plan (tasks with subject and blocks), **confidence check-in** with 7-day trend, **wins journal**, rotating affirmations, **period-day study kit** checklist, brain-fog quick resets.
- **Curated YouTube videos**: periods & focus, study-with-me, confidence, exam stress, period-day comfort. Tele-MANAS link for persistent low mood.

## 4. New: Mind Games dashboard (`/games`)
Calm Breathing (box 4-4-4-4, 4-7-8, even 5-5), Memory Match, Quick Maths (60-s sprint or calm 15-question mode, 3 levels), Sliding Puzzle (3×3 / 4×4, always solvable), Mini Sudoku (4×4 / 6×6, unique solution, hints), Focus Grid (Schulte table). Personal bests, weekly calm time, streaks and a "how do you feel now?" check after each game.

Entry points: Home (wellness hub), Move tab (fitness), Mind tab (games and study), SOS (breathing).

## 5. How this was tested
- `npx tsc --noEmit` and `npx expo lint`: 0 errors.
- Web build driven in a phone-sized browser: 28/28 end-to-end checks (wrong password rejected, sign-up → onboarding, persistence after reload, workout player, fitness profile & safety limits, study timer with a fast-forwarded clock, all six games played to completion, SOS, report, PDF, sign-out wipe, deep-link guard).
- 23 unit checks on fitness maths, workout recommendation, player state machine and study forecasts; game generators checked over thousands of runs (maths answers, sliding-puzzle solvability, sudoku uniqueness).
- India time zone check: a log at 1:00 AM IST is saved under the correct date.
- Build without `.env` starts and signs up on-device with no network calls.

## 6. Notes
- Not yet tested on a physical Android/iOS device — please run `npx expo start -c` (the `-c` clears the cache, also needed after editing `.env`) and try it in Expo Go.
- Supabase sync still covers daily logs and cycles only; fitness, study and game data stay on the device.
- YouTube videos open in the YouTube app/browser; creators are named only where YouTube confirmed them.
- `src/lib/yourGoGirlEngine.ts` (the YourGoGirl counsellor, added separately while this update was being copied in) needs the `CounsellorMode` and `YourGoGirlMessage` types; they are now in `src/types/index.ts`, matching how the engine uses them. The engine is not connected to any screen yet.
