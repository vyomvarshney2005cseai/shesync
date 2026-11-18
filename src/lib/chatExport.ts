import type { YourGoGirlMessage } from '@/types';

/** Removes the **bold** markers used in chat bubbles. */
const plain = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '$1');

function stamp(m: YourGoGirlMessage): string {
  if (!m.createdAt) return m.timestamp;
  const d = new Date(m.createdAt);
  if (Number.isNaN(d.getTime())) return m.timestamp;
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** The whole YourGoGirl chat as a readable text file. */
export function chatToText(messages: YourGoGirlMessage[], userName: string, now = new Date()): string {
  const you = (userName || '').trim().split(' ')[0] || 'You';
  const lines: string[] = [
    'SheSync — YourGoGirl chat',
    `Exported ${now.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    'YourGoGirl is a built-in guide, not a doctor. In an emergency call 112; Tele-MANAS 14416 is free and 24×7.',
    '',
  ];
  for (const m of messages) {
    const who = m.sender === 'user' ? you : 'YourGoGirl';
    lines.push(`[${stamp(m)}] ${who}:`);
    lines.push(plain(m.text));
    if (m.sender === 'bot') {
      if (m.biologicalWhy) lines.push('', `Why: ${plain(m.biologicalWhy)}`);
      if (m.gentleActionSteps?.length) {
        lines.push('', 'What can help:');
        m.gentleActionSteps.forEach((s) => lines.push(`  • ${plain(s).replace(/\n/g, '\n    ')}`));
      }
      if (m.whenToSeeDoctor) lines.push('', `When to see a doctor: ${plain(m.whenToSeeDoctor)}`);
      if (m.affirmation) lines.push('', `“${m.affirmation}”`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Text of one message (for copying). */
export function messageToText(m: YourGoGirlMessage): string {
  const parts = [plain(m.text)];
  if (m.gentleActionSteps?.length) parts.push(m.gentleActionSteps.map((s) => `• ${plain(s)}`).join('\n'));
  if (m.whenToSeeDoctor) parts.push(plain(m.whenToSeeDoctor));
  return parts.join('\n\n');
}

export function chatFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `shesync-chat-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.txt`;
}
