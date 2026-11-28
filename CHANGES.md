# Unnmegh — Faster repeat visits, smaller web build, deleted entries stay deleted (25 Nov 2026)

**Web (Vercel)**
- Files whose names contain a content hash (`/_expo/static/*`, `/assets/*`) are cached by browsers for a year (`immutable`); pages still check for a new version every time. A return visit now makes **1 request instead of 13** (measured), which is what Vercel's free plan counts.
- Vercel now builds with `npm run export:web` (tree-shaking on): first-load JavaScript ≈ 572 KB instead of 756 KB (brotli), 3.7 MB instead of 6.1 MB to parse. Tested with 8 users at once: 72/72 flows, 344/344 screens, 0 errors. To make CI build the same thing, change the "Web build" step in `.github/workflows/ci.yml` to `run: npm run export:web -- --output-dir dist-web` (workflow files can't be edited remotely).
- Each deploy changes the file names, so returning visitors download the app once more — deploy in batches rather than many times a day.

**Backup (cloud accounts)** — tests: `tests/unit/sync-deletions.test.ts`
- **Fixed: deleted entries came back.** Deleting a journal entry/log never reached the server, so it reappeared the next time the app was opened from closed (and on a new phone). Periods and care contacts deleted while offline could come back the same way.
- The app now remembers deliberate deletions (`deletedLogIds`, `deletedCycleStarts`, `deletedContactIds`), the backup deletes them on the server (`deleteRows`, only her rows, 50 ids per request), never re-imports them, and then forgets them. A phone whose data was wiped records no deletions, so it restores everything and never deletes server data.
- **Fixed: an edited check-in was never backed up** (saving today's check-in again keeps its id). Logs now carry the version (time stamp) the server has; edits are sent, and when two phones edit the same entry the newer one wins in both directions.
- Updating needs no migration: the first launch reads what the server has, so nothing is re-uploaded.
- **Fixed: two entries saved in the same millisecond shared an id**, so the second replaced the first (on the phone and in the backup). New log ids are now always unique. This was also why the round-4 check-in test failed now and then.

# Unnmegh — Crash audit, live multi-user test, capacity check (25 Nov 2026)

**Live site** (https://shesync-rust.vercel.app — on-device mode, no server)
- **Fixed: every page except `/` returned Vercel's 404** (refresh, bookmarks, shared links). With `cleanUrls: true`, the rewrite must go to `/`, not `/index.html` — `vercel.json` now follows Expo's Vercel setup (`"framework": null`, `/:path*` → `/`). Takes effect on the next Vercel deploy.
- Tested: 4 separate test users on the live site (sign-up, period + pain + chat, reload, 43 screens, sign-out, sign-in) and 8 users at once on an exact copy of the live build (same bundle hashes): 0 crashes, 0 console errors, no data shared between users.
- Load test on the live CDN: 5 → 10 → 25 → 50 simultaneous users, 1,440 requests, 0 errors, no 429s, p95 370 ms at 50 users.

**Crash fixes** (tests: `tests/unit/crash.test.ts`)
- Saved data that cannot be read (cut-off JSON) no longer leaves the app on the splash / loading screen forever: the store starts fresh and keeps a copy as `<name>.unreadable`.
- Saved records of the wrong type (from old versions or edited files) are repaired on launch — good records kept, broken ones left out — and the launch step can no longer throw. `parseDateKey` accepts only text; `focusAreas` that are not a list no longer crash the dashboard.
- Supabase requests now give up after 20 s (`src/lib/fetchWithTimeout.ts`): one stalled request used to hold up every later backup until the app was restarted.

# Unnmegh — Security audit fixes, light theme by default, folder clean-up (25 Nov 2026)

**Security** (full report in the chat of 25 Nov; tests in `tests/unit/security.test.ts` and `tests/db/migrations.test.mjs`)
- Sign-in tokens are kept in the phone's Keychain / Keystore (`expo-secure-store`, split into chunks), not in plain AsyncStorage. Old sessions move over on first launch — nobody is signed out. (`src/lib/secureSessionStorage.ts`, `src/lib/supabase.ts`)
- Web: Content-Security-Policy, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and HSTS in `vercel.json` (checked on the web build: no violations).
- Doctor report: every value in the HTML is escaped (`buildClinicalReportHtml`).
- Backup import: an Unnmegh backup file is checked before merging — known fields only, server text limits, capped lists, no recording file names. (`src/lib/importValidation.ts`)
- Exports (backup JSON / CSV / chat) go to their own cache folder, which is emptied at the next export, at launch and at sign-out.
- App lock: leaving Unnmegh while the share sheet or a picker is open now locks it if she stays away longer than the picker allowance.
- Pad-change reminders: Android hides their text on the lock screen (new channel `pad-care-private`).
- Links open only for https/http/tel/sms/mailto; `noopener` on new tabs. `?email=` in links is used only if it is a plain email address.
- Settings, Privacy dashboard and Voice journal need a signed-in (or guest) session.
- Database: new migration `20261125000000_security_hardening.sql` — owner-only RLS on the legacy `daily_logs` table, invoker rights on the two summary views. **Run it in Supabase → SQL editor.**
- CI workflows: read-only token. Lockfile: `source-map-js` 1.2.4 and `zod` 4.6.7 (fixes the two high npm advisories; build tools only).

**Light by default**
- Every page is light unless she picks Dark or Dark at night. Phones that had the old "Match phone" default switch to Light once (settings version 2); Light, Dark and Dark at night choices are kept.
- The phone's own alerts, keyboard and pickers follow the app's choice (`Appearance.setColorScheme`); only "Match phone" follows the phone.

**Folder clean-up**
- `docs/papers`: kept the final versions only — the 12-page ICNQC and ICOFE papers, and the 5 Nov hackathon deck (renamed `Unnmegh_Hackathon_Deck.pptx`). Removed the 6-page drafts and the 2 Nov deck. Removed Expo build caches in `.expo/`.

# Unnmegh — One design system, light & dark themes, bespoke icons, Settings, privacy dashboard, skeletons, 44pt targets, reduce motion (24 Nov 2026)

Direction: a women's health / period & wellbeing companion, **warm, rounded and gently empowering**.

**One design system** (`src/constants/theme.ts`, `src/components/ds/`)
- Tokens: 46 colours with a designed light *and* dark value; spacing on an 8-pt grid (4 · 8 · 12 · 16 · 24 · 32 · 40 · 48); radius 8 / 12 / 16 / 24; type scale caption 12 → body 14/16 → titles 18–32; 44pt minimum target.
- **One Card** (1px border, 16pt radius, no drop shadow; tones rose, lilac, mint, amber, sky, danger, inverse; pressable cards get hover, pressed and focus states) and **one Button** (primary, secondary, tertiary, danger, link; sm/md/lg; icon-only; “Saving…” instead of a spinner). Plus Chip, list rows, switch rows, skeletons and icon badges. `PrimaryButton` is gone; every screen uses these.
- Clear hierarchy: one filled rose button per screen for the main action, outlined secondary buttons, quiet links. Only floating things (the SOS button) cast a shadow.

**Light & dark mode**
- Profile → Preferences → Appearance: **Light** (default), Match phone, Dark, Dark at night. Dark is deep slate — page #0F172A, cards #1E293B, raised #273449 — never pure black; every token has a hand-picked dark value, other colours convert to slate tones. Photo scrims and YouTube red stay the same in both modes.
- `app.json` → `userInterfaceStyle: "automatic"`, so phones report their dark setting. **This needs a new build** (an over-the-air update can't change it).

**Visibility & accessibility (WCAG AA)**
- Text and interactive icons are at least 4.5:1 in both modes; focus ring and switch outlines at least 3:1. Fixed along the way: grey “None / Dry” (2.3 → 7.6), each flow level's label, teal badges (4.4 → 5.5), YouTube play marks (4.0 → 5.9), the streak flame (2.2 → 5.6), white icons on pink buttons in dark mode, workout badges in dark mode.
- Visible keyboard focus ring (2px violet) on everything you can press, plus hover, pressed and disabled states.
- Every button, chip, row and switch is at least 44 × 44 pt (back/close buttons were 34–40 wide, chips like “7d” 42); text fields are 48pt tall with 16pt text; grounding circles 48; star ratings 44. Switches are drawn by Unnmegh and the whole row is the target (no 40 × 20 control on the web).

**Bespoke icons** (`src/components/icons/`)
- 44 duotone icons: 24 × 24, 1.75px rounded strokes, an 18% accent fill for depth, with metaphors made for Unnmegh (hot-water bottle for pain, droplet with a clock for the pad timer, lotus for Mind, sneaker for Move, heart-check for the daily check-in …).
- Feature icons sit in soft squircle badges that adapt to light and dark; pressing or hovering plays a tiny animation (bell rings, sparkle spins, heart pulses, tilt, bounce). Tab bar: pill highlight with a small hop. Utility icons share the 1.75 stroke.
- Also exported as SVG files in `assets/icons/` (`currentColor` + `--accent-color`, `role="img"` + `aria-label`, `icons.css` hover animations, `preview.html`); `npx tsx scripts/export-icons.ts` rebuilds them.

**Settings** (`/settings`, Profile → Settings): **Account** (status, create account / sign out, leave and delete data) · **Privacy** (privacy dashboard, app lock, anonymous crash reports — moved here from Profile, privacy promise) · **Reminders** (daily check-in at 9 am / 1 pm / 8 pm / 10 pm; a heads-up two days before the predicted period at 9 am; local notifications only, and the lock-screen text never says “period”) · **Data** (last backup, Back up now, export or import) · **About** (version and update, check for updates, not a medical device, Tele-MANAS).

**Privacy dashboard** (`/privacy-dashboard`): last backup (“Backed up 5 min ago”, “Backing up…”, “Backup paused”, “Not backed up”) with Back up now or Create an account; **On this phone only** (voice recordings, chat, Pad Care, SOS contact, app-lock PIN, settings, reports waiting); **Backed up** with counts (periods, daily logs, journal text, sleep, care contacts, answers, study / fitness / games / PCOS / confidence); **Never collected** (location, contacts list, advertising ID, trackers). Fix: a voice entry's file path is no longer sent with the backup — only the text, as the dashboard says.

**Skeleton loaders**: grey placeholders instead of spinners — the whole screen while saved data loads, YourGoGirl “typing”, the doctor report being prepared, video thumbnails. No spinners left in the app.

**Reduce motion** (iOS Reduce Motion, Android Remove animations, the browser setting): screens and sheets appear without sliding; no pulsing (SOS button, plan banner, skeletons, recording halo), no PIN shake, icon wiggles or tab hop; breathing circles hold still while the words, timer and vibration keep guiding; carousels and auto-scroll jump instead of gliding; the strain ring is drawn at its value.

**No new packages. No database change.**

**Tested**: tsc + ESLint clean; `npm test` 12/12 files (16 new round-8 tests: 66 colour pairs × light/dark, badge tones, scales, icon format, exported icons up to date, reminders, privacy dashboard incl. the audio path, settings defaults, reduce motion); privacy check passes; web, Android and iOS bundles build. Audit of all 40 screens in light and dark (axe-core contrast, 44pt targets, icon contrast): 0 issues, plus 15 interactive states (sheet tabs, year view, approximate dates, YourGoGirl answer, health-check answers, game boards, SOS grounding, report ready, reminders): 0 issues. New Maestro flow `06-settings-privacy.yaml`, mirrored on the web build; reduce motion checked on the web build (the SOS pulse stops). The Maestro flows themselves were not run here (no Android emulator) — CI runs them.

---

# Unnmegh — Skip setup, one-calendar period dates, approximate dates, one check-in sheet, answer ratings, crash reports, CI, over-the-air fixes, friendly errors (24 Nov 2026)

**Skip the questionnaire**
- “Skip for now — use sensible defaults” on the Details for Sync card, and Skip / “Not now?” on each setup step (10 questions, period dates, pain, flow, mood, safety check). Setup moves on to the next step.
- Defaults never invent data: no made-up period — the prediction card asks for the first day of her last period (“even roughly”) instead, and the referral card says the safety check is “not done yet”, not “all clear”.
- A **Personalise Unnmegh** card on Home lists the skipped steps with what each one unlocks; “Not now” hides it for 14 days. Skipped rows on the setup card say “Skipped for now · tap to answer”.

**Range date picker** (Log period dates)
- One calendar: tap the first day, then the last day; the days between fill in, marked FIRST / LAST. “Lasted 3d–7d” chips, Clear and one **Save this period**. Tapping before the start moves it; over 14 days starts again; future days can’t be picked.
- A corrected range replaces the overlapping one; any saved period can be deleted. Cycle lengths come from her start dates; with one period she sets her usual length or ticks “My periods are irregular”.

**“I don’t remember exactly”**
- Month (last 6), early / mid / late and about how many days → saved as “≈ Started around mid-October”, dashed on the calendar.
- Lower prediction confidence (−25 when the latest period is approximate, −10 for an older one, never below 45%) and a wider margin (at least ±5 / ±3.5 days), shown as “≈ Based on approximate dates”. Backed up (new `cycles.approximate` column).

**Why we ask** — an ⓘ on each of the 11 health-check questions opens a short “WHY WE ASK” note (heavy bleeding → anaemia, pain with peeing or sex → endometriosis, hair/acne → PCOS, fever → infection / toxic shock, …).

**One check-in sheet** — Mood, Pain and Flow are tabs in one sheet. Choices stay while she switches tabs; saving ticks the tab and moves to the next (“Pain saved ✓ Next: Mood”); a bleeding flow offers the pad timer. `/log-mood`, `/log-pain` and `/log-flow` still work (Home buttons, YourGoGirl’s “Log pain”) and open the sheet on that tab; during setup each stays a single step. The 10-second check-in is unchanged.

**Helpful / not helpful** (YourGoGirl) — 👍 / 👎 under each answer. 👎 asks “What was missing?” (didn’t answer, not for my situation, too long, language, something wrong) with an opt-in “Include my question (no name)”; English, Hinglish, हिन्दी. Sent anonymously (answer id, rating, reason, language, app version; her question only if ticked, emails/numbers removed). `answer_feedback_summary` lists the answers with the most 👎 first.

**Crash reports without trackers**
- Screen crashes, unhandled errors and promise rejections go to Unnmegh’s own Supabase (`crash_reports`): error, stack, screen, app version, update id, platform. No user id, device id, name or email; emails, phone numbers and URL queries scrubbed; same crash once a session, at most 15; nothing from development builds; queued while offline.
- Profile → **Send anonymous crash reports** (on by default). Privacy screen: no ad or tracking SDKs; crash reports and 👍/👎 are anonymous.
- The app can only add rows to the two report tables — never read, change or delete them. You read them in the Supabase dashboard (`crash_summary`, `answer_feedback_summary`).
- `npm run check:privacy` fails on any ad, analytics, attribution or third-party crash SDK (direct or pulled in by another package), tracker addresses in code, or an unblocked Android advertising-ID permission (now blocked in app.json).

**Automated tests in CI** (`.github/workflows/ci.yml`, every push and pull request)
- Typecheck, lint, privacy check, web build and `npm test`: YourGoGirl (447 + held-out guard 45/50), referral & setup, sync engine, Supabase client, export/import, Pad Care, rounds 4/6/7, and every database migration run twice on an in-memory Postgres with RLS checks. Tests now live in `tests/`; `npm test -- round7` runs one file.
- Then a release Android build runs 5 **Maestro** flows on an emulator (`.maestro/`: skip setup, period range + approximate, check-in sheet + deep links, why we ask, 👍/👎). Report and screenshots kept as a build artifact.

**Over-the-air fixes** — expo-updates with a channel per build profile and a fingerprint runtime version: a JavaScript-only fix reaches phones whose build matches; native changes still need a new build. `npm run update:preview` / `update:production`, or Actions → **EAS Update** (runs the tests first). When a fix has downloaded, a small banner offers Restart or Later.

**Friendly error screens** — a crash shows “Something went wrong on this screen — your data is safe” with **Try again**, **Go to Home** and details, instead of a blank screen. Each Home card fails on its own (“This part couldn’t load.”) without taking Home down.

**Also**: “In about 1 day” (not “1 days”), “PMS days may be starting now” (not “in about 0 days”); the Log period screen reads today’s flow like Home does (it used to assume moderate flow when none was logged and always showed “Menstrual Phase”); the report queue never loses or double-sends a report added while sending; backup keeps working against a database that hasn’t had the new migration yet (it leaves the new column out).

**New packages**: expo-updates; dev tools tsx and @electric-sql/pglite. **Database**: run `supabase/migrations/20261124000000_approx_feedback_crashes.sql` (safe to re-run).

**Tested**: tsc + ESLint clean; `npm test` 11/11 files (19 new round-7 tests, 25 database checks, missing-column retry, plus all earlier suites); privacy check passes. Web, Android and iOS bundles build. Web click-through, light and night: skip setup → Personalise card, range picker, approximate period, check-in sheet, why we ask, 👍/👎, crash switch, privacy; the 5 Maestro flows mirrored on the web build; error screen checked by breaking saved data on purpose (friendly screen, crash queued and scrubbed). The Maestro flows themselves were not run here (no Android emulator) — CI runs them.

---

# Unnmegh — Journal prompts, SOS 2.0, exam planner, leave note, focus sounds, easier start (24 Nov 2026)

**Phase-based journal prompts** (Voice Journal)
- A “Today’s prompt” card with a gentle question for her cycle phase (period days, fresh-start, bright days, slow-down days; a general set until she logs a period). 7 per phase in English and हिन्दी (follows the journal language), one featured a day, “Another” for a different one, “Write about this” drops it into the entry.

**SOS 2.0** (`/sos` — Mind tab’s SOS button, Profile → SOS, and YourGoGirl’s crisis/anxiety replies)
- One-tap **Call {her trusted person}** and **Text**, plus **Call Tele-MANAS 14416**; 112 at the bottom. She adds the trusted person right there; it stays on the phone and is cleared on sign-out.
- **5-4-3-2-1 grounding**: one sense at a time, a circle to tap for each thing she notices, then “How do you feel now?” — “Still not okay” scrolls back to the call buttons with a gentle nudge.
- **Haptic breathing**: in 4 · hold 2 · out 6 with a growing circle and vibrations (quick taps in, still for hold, slow taps out) so it works with eyes closed; keeps the screen awake while running.
- A call from SOS doesn’t end at the app-lock screen (lock paused for 30 minutes).

**Exam-cycle planner** (`/exams` — Home box, Study Focus)
- Add exams on a calendar that already shows predicted heavy, period and PMS days. Each exam gets a badge (Heavy day · day 2 of period / Period / PMS / Could overlap / Clear) with an uncertainty margin that grows the further ahead it is, and a dated prep plan (finish hard topics before the period, exam-day kit, restroom-break question, gentle timer on PMS days, sleep, mock paper).
- Heavy days are learned from her own flow logs when she has heavy logs from 2+ periods; otherwise days 1–2. Exams back up with the Study data.

**Period leave note** (`/leave-note` — Study Focus, Pad Care, Exam planner)
- Polite application in the usual Indian format for school (class teacher / principal, parent’s-signature line) or college (HOD / class coordinator / principal), in English or हिन्दी. Reason “Unwell” (private, default), “Period pain” or “Doctor’s advice”; past/today/future wording follows the dates. Her class, roll no. and college are remembered on the phone. Copy or Share.

**Focus sounds** (Study Focus timer)
- Rain, Café and Lo-fi loops, made for Unnmegh and bundled (works offline, ~1.4 MB total). Plays during focus blocks, pauses for breaks, volume slider, short preview when picked.

**Easier start**
- **Welcome**: 3 slides (real app screens: Home, YourGoGirl in Hinglish, app lock) with one promise each, Skip and Next; then a start panel. Seen once per phone.
- **Try without an account** is the first button: Unnmegh starts on the phone with nothing backed up. Home and Profile offer “Create an account” later — signing up keeps everything she logged. Logging in to another account warns that it opens that account instead.
- **Shorter sign-up**: name, email, password (+ confirm). Focus areas moved to a Home card that appears after setup (“What should Unnmegh help you with most?”, Save / Not now) and to Profile.
- **One privacy screen** (welcome, sign-up, Profile): what stays on the phone, what is backed up (only with an account), what we never do — three lines.
- **Password helpers**: strength meter (length, variety, common passwords, her own name), show/hide on both password fields, “Passwords match”, and “Remember my email on this phone” on login (replaces the old “Keep me logged in” box, which did nothing).

**New package**: expo-haptics (`npx expo install` version for SDK 58). No database change: exams ride in the existing study backup.

**Tested**: tsc + ESLint clean; 30 new tests (exam forecasts incl. late period, learned heavy days, margins, prep plans; leave note EN/HI tenses; prompts; password strength; breathing rhythm; trusted contact; exams store; guest → account keeps data, other login wipes it; privacy lines); earlier suites pass (17 round-4, 23 Pad Care, 447 YourGoGirl, referral, 10 sync, 12 export/import). Web, Android and iOS bundles build. Web click-through, light and night: welcome slides/Skip/start panel, privacy, try without account, guest Profile, sign-up as guest with meter/show-hide/match, sign-out, login with remembered email, focus-area card, exam planner (heavy, PMS and clear exams, prep plan), leave note (Hindi + copy), journal prompt, SOS (contact, breathing stages, grounding → reach out), focus sounds — no errors.

---

# Unnmegh — Pad Care added + folder clean-up (18 Nov 2026)

**Pad Care** (`/pad-care`, Home → Pad Care box; it moves next to YourGoGirl during her period or while the timer runs)
- Change timer: tap “I just changed” and a ring shows how long it has been on (All good → Change soon → Time to change → Over 8 hours). It saves the start time, so it stays right when the app is closed.
- Pad, cloth pad, tampon, menstrual cup and period underwear, each with its own safe wear time; “Going to sleep” sets one morning reminder.
- Phone reminders are local notifications (expo-notifications, no server, no push token): one at her interval and one at the hard limit. Tapping one opens Pad Care. They work in Expo Go; the web has the timer but no reminders.
- Heavy flow today → suggests every 3 h and shows when to see a doctor. 3+ changes within 2 h of each other in a day → a gentle check-with-a-doctor note.
- 7-point “choosing a pad” checklist (incl. ISI mark / IS 5405), the 2022 Toxics Link finding (no brand named), private pad ratings with “your best so far”, hygiene basics, doctor signs and a Call 112 button for toxic-shock warning signs.
- Log Flow offers the pad timer after a light, moderate or heavy flow. YourGoGirl’s app help mentions it (English, Hinglish, Hindi).
- Works with the newer app: night mode, app lock (the notification permission prompt doesn’t lock the app) and the device storage used by the other stores. Sign-out wipes Pad Care and cancels its reminders.

**Folder clean-up**
- Removed 90+ duplicate copies (“file 2.tsx”, “tsconfig 3.json” …) — all older versions of files that are still here — plus the old patches and the two old copies of the app (`sheshync/`, the Expo starter, and `YourGoGirl/`, the pre-merge chat files). They are still in git history.
- Papers, decks, flowcharts and paper scripts moved to `docs/`. TypeScript, ESLint, Metro and EAS uploads skip `docs/`.

**Tested**: tsc + ESLint clean; 23 new Pad Care checks (timer states, night and tampon limits, heavy-flow suggestion, short gaps, double-tap guard, interval limits, ratings, sign-out reset) plus all earlier suites. Web, Android and iOS bundles build. Web click-through in light and night mode: Home box, start timer, switch product, checklist, rating, reload keeps the timer, Log Flow → Pad timer → heavy-flow card — no errors.

---

# Unnmegh — Voice journal, app lock, 10-second check-in, tummy symptoms, myth-buster, YourGoGirl in Hindi (18 Nov 2026)

**Real voice journal** (`/voice-journal`)
- Records her voice and turns it into text **on the phone** (expo-speech-recognition with on-device recognition: Apple Speech on iOS 17+, Android 13+ with the offline voice pack). Words appear live while she speaks; English (India) or हिन्दी.
- The recording is saved in the app’s private `journal/` folder (only the file name goes in the entry; audio is never backed up to the cloud). Play it back, re-record, or delete it before saving. 10-minute limit; leaving the app stops the recording.
- Past entries: read, listen, delete (text and audio).
- Older phones (Android 12 and below), Expo Go and the web record audio only (expo-audio) and say so plainly; on Android 13+ without the offline pack it offers a one-tap download.

**App lock** (Profile → App lock)
- 4- or 6-digit PIN, plus fingerprint / Face ID (expo-local-authentication) — never falls back to the phone passcode.
- Locks on launch and the moment she leaves the app; the iOS app-switcher preview is covered. Pickers, the share sheet and permission prompts don’t count as leaving.
- PIN stored only as a salted SHA-256 hash in the phone’s secure storage (expo-secure-store). 5 free tries, then waits of 30 s, 1 min, 2 min… (survives restarts). “Forgot PIN?” signs out (backed-up data returns on sign-in). Sign-out and account switches turn the lock off.

**10-second daily check-in** (`/check-in`, top of Home)
- One sheet: mood, pain, flow and last night’s sleep as sliders, plus tummy chips; one tap saves. Only sliders she touches are saved (no made-up values). One check-in per day — opening it again edits today’s.
- Strong pain or heavy flow shows what helps and when to get help the same day.

**Digestive symptoms** — bloating, constipation, loose motions, nausea
- Logged in the check-in; Report shows a “Tummy · last 30 days” card and how many days fell during or just before a period.
- Pattern card when tummy symptoms show up on 3+ days; “bloating most days for 3 weeks” is flagged to check with a doctor. Included in the doctor PDF, CSV export (new `tummy` column) and cloud backup.

**Daily myth-buster** (Home)
- One card a day from 26 Indian period myths (pickle, bathing/hair-wash, exercise, kitchen, temples/“impure”, curd and sour food, cups for unmarried girls, PCOS and pregnancy, cloth pads in sunlight…). Tap to reveal the fact, the reason and the source (NHS, WHO, UNICEF India, Swim England, India Water Portal); share it.

**YourGoGirl**
- **Hindi & Hinglish replies** with a language switch (Auto · English · Hinglish · हिन्दी). All 68 answers, follow-up chips, buttons and labels are translated; Auto answers in the language she writes in. Hindi typed in Devanagari is now understood too (including safety phrases).
- **Doctor-visit prep**: “Doctor visit prep” chip (or ask “what should I ask my gynaecologist?” / “doctor se kya puchu”) builds 5 questions from her logs and referral result, each saying which data it comes from; share them, open the report. The same 5 questions are printed in the doctor PDF.
- **Chat export & delete**: ⋮ menu → export the chat as a .txt file or delete the whole chat; press and hold a message to copy or delete it.

**New packages** (`npx expo install` versions for SDK 58): expo-audio, expo-speech-recognition, expo-local-authentication, expo-secure-store, expo-crypto, expo-clipboard. Permission texts for microphone, speech recognition and Face ID are set in app.json.

**Build note**: speech-to-text and Face ID need a development or EAS build (`npx expo run:android` / `eas build`). In Expo Go everything else works and the journal records audio only.

**Tested**: tsc + ESLint clean; 17 new tests (language detection, 27 Hindi/Hinglish messages incl. safety, translation completeness for all 68 answers × 10 situations, chips and buttons, Auto language, doctor prep in 3 languages, tummy summary, chat export, myths, speech merging, app-lock hashing/rate-limit/clear, check-in store); earlier suites still pass (447 YourGoGirl checks, referral, 12 export/import, 10 sync, database). Web + Android/iOS bundles build. Web click-through (light and night): check-in, myth reveal, report, app lock set-up/cold-start lock/wrong PIN/unlock, chat in Hindi/Hinglish/Auto, doctor prep, delete one message, export, delete all, voice recording and past entries — no errors.

---

# Unnmegh — PCOS Care, Confidence Booster, export/import, night mode (10 Nov 2026)

**PCOS Care** (`/pcos`, new Home box)
- Signs tab: the 3 things doctors check (2023 International PCOS Guideline / Rotterdam criteria) explained simply, each marked from her own data — irregular cycles from saved periods, androgen signs from a monthly check-in, ovaries from her scan/AMH answer. Clear "worth talking to a gynaecologist" card with a link to Care Connect. Never diagnoses; notes that teenagers are assessed differently.
- Monthly check-in: facial/body hair, acne, scalp thinning, dark skin patches, optional waist and weight; history with delete.
- Food (Indian thali principles + sample day), Move (150 min/week target using her Fitness logs + weekly plan), Doctor (checklist of what to bring, common tests, questions to ask).

**Confidence Booster** (`/confidence`, new Home box)
- Daily affirmation (save favourites), confidence check-in 1–5 with a 7-day chart, one daily "brave step", 7 glow habits (feel good, not look perfect), proud-moments jar, streak. On a low day it shows one of her own proud moments and a link to YourGoGirl.

**Export & import** (Profile → Export or import data)
- Export: full backup (JSON), daily logs (CSV), periods (CSV), doctor PDF. CSV cells are protected against spreadsheet formulas.
- Import: an Unnmegh backup, Flo or Clue exports, or any JSON/CSV with period dates. Shows what was found before saving; only adds — never replaces or duplicates (tested by importing the same file twice). Predictions ignored; future dates ignored; ZIP files get a clear "unzip first" message.

**Night mode** (Profile → Settings: Off / On / Auto 9 pm–6 am)
- Calm deep-plum palette on every screen, including charts, chips and the background. Setting stays on the phone after sign-out.

**Backend**: PCOS and Confidence data are included in cloud backup. Re-run `supabase/migrations/20261109000000_shesync_backend.sql` in the Supabase SQL editor once (it now allows the two new documents).

**Tested**: tsc + ESLint clean; 12 export/import tests (Clue, Flo, CSV, dates, merging, backup round-trip); 10 sync tests; database test; 447 YourGoGirl checks; referral checks; web + Android/iOS builds; web click-through in light and night mode (PCOS check-in, checklist, confidence actions, backup download, Clue import) with no errors.

---

# Unnmegh — Clean UI, cloud backend, optimisation (9 Nov 2026)

**Cleaner UI** — removed filler text, decorative icons and jargon only; every feature stays.
- Headers, auth screens, Home cards, Report, Mind, Move, Profile, log screens and the chat header now say one thing each, in plain words (e.g. “Next period”, “Points for your doctor”).
- Questionnaire result types renamed in plain language: Cycle Balance, Pre-period Care, Rest & Recover, Cycle in Sync (saved answers are kept; names update automatically).
- iOS app icon is now the Unnmegh logo (it was the Expo template icon); app name shows as “Unnmegh”; system dialogs stay light to match the app.

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

# Unnmegh — Details for Sync update (9 Nov 2026)

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

# Unnmegh — November 2026 update

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
