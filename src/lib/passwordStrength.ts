// Simple, honest password strength: length first, then variety, and a
// penalty for the passwords attackers try first.

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Okay' | 'Strong' | 'Very strong';
  hint: string;
}

const COMMON = new Set([
  'password', 'password1', 'password123', '123456', '1234567', '12345678', '123456789', '1234567890', '111111', '000000',
  '123123', 'abc123', 'qwerty', 'qwerty123', 'qwertyuiop', 'iloveyou', 'admin', 'welcome', 'letmein', 'monkey', 'dragon',
  'sunshine', 'princess', 'football', 'india123', 'india@123', 'krishna', 'sairam', 'omsairam', 'shesync', 'asdfgh', 'zxcvbn',
]);

const SEQUENCES = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function isSimple(pw: string): boolean {
  const p = pw.toLowerCase();
  if (/^(.)\1+$/.test(p)) return true; // aaaaaa
  return SEQUENCES.some((seq) => seq.includes(p) || seq.split('').reverse().join('').includes(p));
}

/** `personal` = her name and email, which make a password easy to guess. */
export function passwordStrength(pw: string, personal: string[] = []): Strength {
  if (pw.length < 6) return { score: 0, label: 'Too short', hint: 'Use at least 6 characters — 10 or more is better.' };
  const lower = pw.toLowerCase();
  const words = personal
    .flatMap((p) => p.toLowerCase().split(/[\s@._-]+/))
    .filter((w) => w.length >= 4);
  if (COMMON.has(lower) || isSimple(pw) || words.some((w) => lower.includes(w))) {
    return { score: 1, label: 'Weak', hint: 'Avoid common passwords, your name or simple patterns like 123456.' };
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  let points = 0;
  if (pw.length >= 8) points++;
  if (pw.length >= 12) points++;
  if (pw.length >= 16) points++;
  if (classes >= 2) points++;
  if (classes >= 3) points++;
  const hint =
    pw.length < 12 ? 'Make it longer — a short phrase like “chai-at-7-am” is easy to remember.' : classes < 3 ? 'Add a number or a symbol.' : 'Nice — hard to guess.';
  if (points <= 1) return { score: 1, label: 'Weak', hint };
  if (points === 2) return { score: 2, label: 'Okay', hint };
  if (points === 3) return { score: 3, label: 'Strong', hint };
  return { score: 4, label: 'Very strong', hint: 'Nice — hard to guess.' };
}
