# YourGoGirl — Women's Health & Menstruation AI Counsellor Bot

All files for the **YourGoGirl** Women's Health AI Chatbot have been created inside this isolated `/Users/vyomvarshney2005/Desktop/shesync/YourGoGirl` folder so your main `/Users/vyomvarshney2005/Desktop/shesync` backup remains untouched.

## What YourGoGirl Counsels Women Through
1. **Menstruation & Dysmenorrhea (Period Cramps, Pelvic Pain, Bloating, Heavy Flow)**: Explains prostaglandin (`PGF2α` / `PGE2`) smooth-muscle physiology and provides immediate somatic & thermal relief protocols.
2. **Menstrual Disturbances (PCOS, Irregular/Delayed Periods, Spotting, Menorrhagia, Anovulatory Gaps)**: Explains HPA–HPO axis signalling, cortisol/insulin ovulation delays, blood sugar pacing, and clinical red flags.
3. **Loss of Motivation & Cycle Burnout**: Counsels women out of productivity guilt/shame by explaining mesolimbic dopamine shifts across the infradian rhythm and guiding them through the *"Minimum Viable Day"* and *"5-Minute Cozy Entry"* techniques.
4. **Loss of Focus & Menstrual Brain Fog**: Explains how estrogen and progesterone fluctuations affect prefrontal cortex acetylcholine/dopamine and provides *"12-Minute Gentle Sprints"*, working-memory externalization, and sensory awakening resets.
5. **PMDD, Mood Swings, Tearfulness & Anxiety**: Validates neuro-endocrine GABA-A / allopregnanolone sensitivity and guides physiological sighs, hormonal-weather cognitive reframing, and sensory grounding.

## Included Files in `YourGoGirl/`
- `YourGoGirl_Interactive_App.html` — Instant standalone browser version of **YourGoGirl** you can open directly in Chrome/Safari to test all counselling modes and prompts right away.
- `src/lib/yourGoGirlEngine.ts` — The bio-adaptive AI counsellor engine (with built-in cycle-synced clinical/counselling intelligence + optional `EXPO_PUBLIC_GEMINI_API_KEY` live LLM support).
- `src/components/yourgogirl/YourGoGirlChatView.tsx` — Full React Native / Expo chat interface with 4 counsellor modes, live biometric sync bar, quick-topic chips, biological insight cards, actionable steps, affirmations, and follow-up chips.
- `src/components/yourgogirl/YourGoGirlHomeCard.tsx` — Home screen hero card for launching YourGoGirl.
- `src/app/(tabs)/your-go-girl.tsx` & `src/app/your-go-girl.tsx` — Expo Router tab and modal screen routes.
- `src/types/index.ts`, `src/store/useAppStore.ts`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/mind.tsx`, `src/components/home/QuickActionGrid.tsx` — Updated navigation and state files mirroring the main project structure.

## Applying to the Main App (Whenever Ready)
To copy these files into the root SheSync app when your backup is ready:
```bash
cp -R /Users/vyomvarshney2005/Desktop/shesync/YourGoGirl/src/* /Users/vyomvarshney2005/Desktop/shesync/src/
```
