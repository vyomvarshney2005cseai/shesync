# SheSync — Clean UI, cloud backend, optimisation (9 Nov 2026)

**Cleaner UI** — removed filler text, decorative icons and jargon only; every feature stays.
- Headers, auth screens, Home cards, Report, Mind, Move, Profile, log screens and the chat header now say one thing each, in plain words (e.g. “Next period”, “Points for your doctor”).
- Questionnaire result types renamed in plain language: Cycle Balance, Pre-period Care, Rest & Recover, Cycle in Sync (saved answers are kept; names update automatically).
- iOS app icon is now the SheSync logo (it was the Expo template icon); app name shows as “SheSync”; system dialogs stay light to match the app.

**Backend (Supabase)** — `supabase/migrations/20261109000000_shesync_backend.sql`
- Tables: `profiles`, `cycles`, `symptom_logs`, `sleep_logs`, `care_contacts`, `app_documents` (Fitness/Study/Games). Row Level Security on every table: each user sees only her own rows; signed-out requests get nothing.
- Profile row created automatically at sign-up; `delete_my_account()` erases the account and all of its data (also the old `daily_logs` table if present).
- Safe on existing projects: upgrades the old `profiles`/`cycles` tables, removes duplicate old cycle rows, can be run again.
- App side (`src/lib/sync/`): offline-first automatic backup. Only changes are uploaded, ~2.5 s after they happen and when the app goes to the background. Signing in on a new phone restores her data; a new/empty phone can never overwrite the cloud copy. Replaces the old per-log uploads, which overwrote earlier logs from the same day and never uploaded sleep, care contacts, settings or Fitness/Study/Games.
- Profile: backup status (“Backed up · 2 min ago”, “Saved on this device only”, “Backup paused — Retry”, “Sign in”) and **Delete account**.
- Setup steps are in README.md (`.env.example` added). Without a backend the app still runs fully on-device.

**Optimisation**
- Release builds use tree shaking (eas.json) — Android bundle 7.8 MB → 5.3 MB, web JS 4.9 MB → 2.6 MB. Modules load on first use (inline requires).
- Saved data is written to the phone in batches instead of rewriting everything on every tap (flushed immediately when the app goes to the background).
- Background redraws only when its colour mood changes; the hidden duplicate background behind every screen and the web blur filter are gone.
- Images: welcome slides as JPEG (790 KB → 160 KB, visually identical), small logo file for the 28–36 pt logos, other PNGs recompressed; assets folder 3.0 MB → 0.8 MB.
- Removed unused code (GlassCard, VagusAudioPlayer, FeministQuoteCard + quotes, colour-scheme hooks, Expo `reset-project` script) and unused packages (@expo/ui, expo-device, expo-glass-effect, expo-image, expo-symbols, expo-web-browser, expo-sharing, nativewind, tailwindcss) — 58 fewer packages installed.
- Chat keeps the latest 150 messages. Metro, TypeScript, ESLint and EAS uploads skip the old copies in `sheshync/` and `YourGoGirl/`.

**Tested**: `tsc` + ESLint clean; 447 YourGoGirl checks; referral checks; database test in real Postgres (RLS isolation, sign-up trigger, upgrade of old tables, account deletion); 10 sync-engine tests (new phone restore, offline retry, deletes, batching, account switch); supabase-js request test; web + Android/iOS release bundles build; web run-through with no console errors.

**After pulling this**: run `npm install`. To turn on the backend, follow README → Backend.

---

# SheSync — Details for Sync update (9 Nov 2026)

**What changed**
- **Login / sign-up go straight to Home.** Until setup is finished, Home shows *Good afternoon, <name>*, one big **Details for Sync** card (all six forms/logs with live ticks and a Start/Continue button) and **six feature squares**: YourGoGirl, Fitness & Weight, Care Connect, Study Focus, Mind Games, Breathe.
- **Details for Sync** = 10 questions → period dates → pain → flow → mood → **new Health safety check** (11 yes/no red-flag questions). Each step hands over to the next unfinished one (`src/lib/syncDetails.ts`).
- **Referable / not referable window** (`/sync-result`) at the end. Rules in `src/lib/referral.ts` follow NHS “see a doctor if…” signs and FIGO normal-cycle limits (24–38 days, ≤ 8 days bleeding): levels *urgent today / within 1–2 weeks / next check-up*, separate counsellor suggestion, crisis lines if self-harm is mentioned, pregnancy-test-first note. After it, Home switches to the full dashboard (as before) plus a sync-result card.
- **Care Connect** (`/care`): eSanjeevani (free govt video OPD), gynaecologists near me (Google Maps), visit checklist + doctor PDF, counsellors (Tele-MANAS 14416, iCALL 9152987821, Vandrevala +91 9999 666 555 with WhatsApp), women’s safety (181, NCW 14490, 112), and **My care team** (save your own doctor/counsellor).
- **YourGoGirl rebuilt (built-in, offline).** `src/lib/yourGoGirlKnowledge.ts` has 60+ answer topics (cramps, late/irregular periods, PCOS, heavy flow, discharge, UTI, hygiene, myths, PMS/PMDD, anxiety, low mood, focus, exams, …) with “When to see a doctor” and action buttons. Safety first: self-harm, abuse, heavy bleeding with fainting, pregnancy + pain, fever with tampon/cup, sudden severe pain. Understands typos and common Hinglish. No more invented HRV/cortisol numbers. Old chats are cleared once on update.
- **Softer, soothing UI**: “Soft Bloom” palette (dusty rose, lavender, sage, peach), plum text instead of black, calm lavender background on hard days (no more crimson), lighter font weights.
- Fixes: flow log defaulted to “moderate” (made every user “bleeding today”) → now “none”; Enter sends in the web chat; tab bar full width on web; can’t save period setup with no dates.

**Tested**: `tsc` + `expo lint` clean; 447 YourGoGirl matching checks + held-out phrasing set; referral/sync unit checks; full web run-through (sign-up → Details for Sync → result → dashboard → Care Connect → chat) with no console errors.

---

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
