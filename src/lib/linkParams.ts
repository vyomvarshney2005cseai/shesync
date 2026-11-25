/**
 * Values that arrive in a link (shesync://login?email=…) come from outside the
 * app, so they are checked before use: anything unexpected is ignored.
 */
const EMAIL = /^[^\s@<>"'`]{1,64}@[^\s@<>"'`]{1,190}\.[^\s@<>"'`.]{2,24}$/;

/** A plausible email address from a link parameter, or '' if it is not one. */
export function emailParam(value: unknown): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== 'string') return '';
  const email = v.trim();
  return email.length <= 254 && EMAIL.test(email) ? email : '';
}
