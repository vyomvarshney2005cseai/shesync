/** The whole privacy story in three lines. Kept in step with what the code actually does. */
export const PRIVACY_LINES = [
  {
    id: 'phone',
    title: 'Stays on your phone',
    text: 'Voice recordings, your app-lock PIN, YourGoGirl chats, Pad Care and your SOS contact never leave this phone.',
  },
  {
    id: 'backup',
    title: 'Backed up — only with an account',
    text: 'Your logs, cycles, journal text and dashboards, sent over an encrypted connection so they come back on a new phone.',
  },
  {
    id: 'never',
    title: 'What we never do',
    text: 'Sell your data, show ads, use ad or tracking SDKs, or track your location. Crash reports and 👍/👎 are anonymous.',
  },
] as const;
