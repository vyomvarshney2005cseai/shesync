# SheSync

Cycle-aware wellbeing app for women: period and symptom logging, a doctor-referral check, YourGoGirl (an on-device counsellor), fitness, study focus and calming games. Built with Expo (React Native) and an optional Supabase backend.

## Run it

```bash
npm install
npm start          # then press i / a / w for iOS, Android or web
```

Without a backend the app runs fully **on-device**: accounts and health data stay in the phone's storage and nothing is sent anywhere.

## Backend (Supabase) — optional

With a backend, sign-in works across phones and her data is backed up automatically.

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/migrations/20261109000000_shesync_backend.sql`](supabase/migrations/20261109000000_shesync_backend.sql).
   It is safe to run on a project that already has the older `profiles` / `cycles` tables, and safe to run again.
   (With the Supabase CLI: `supabase link` then `supabase db push`.)
3. Copy `.env.example` to `.env` and fill in **Project Settings → API**:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart `npm start`.

### What the backend stores

| Table | Holds |
|---|---|
| `profiles` | name, focus areas, questionnaire answers and settings, "Details for Sync" answers |
| `cycles` | saved periods (one row per start date) |
| `symptom_logs` | pain, flow, mood and voice-journal entries |
| `sleep_logs` | hours slept per night |
| `care_contacts` | her own doctors / counsellors |
| `app_documents` | Fitness, Study and Games data (one JSON document each) |

Every table has Row Level Security: a signed-in user can only read and write her own rows; signed-out (`anon`) requests get nothing. A profile row is created automatically on sign-up. `delete_my_account()` erases the account and all of its rows (Profile → **Delete account**).

### How sync works

The phone is always the working copy (`src/lib/sync/`):

- Changes are uploaded about 2.5 s after they happen, and when the app goes to the background. Only what changed is sent.
- Signing in on a new phone downloads and merges her data before anything is uploaded, so an empty phone can never overwrite the cloud copy.
- Offline changes wait and upload when the connection is back. Profile shows the backup status.

## Checks

```bash
npx tsc --noEmit
npm run lint
```

## Build smaller bundles

Release builds use Expo's tree shaking (set in `eas.json`; locally: `npm run export:web`), which removes unused code such as the parts of the icon library the app doesn't use.

## Project layout

```
src/app/          screens (expo-router)
src/components/   UI by feature (home, report, mind, move, yourgogirl, …)
src/constants/    theme, questionnaire, cycle prediction, referral questions, care directory
src/lib/          logic: dates, referral rules, YourGoGirl engine, Supabase, sync
src/store/        zustand stores saved on the device
supabase/         database migration
```
