// Removes things that could identify a person before anything is reported:
// emails, phone numbers, long digit runs and URL query strings.

export function scrub(text: string | null | undefined, max = 1000): string {
  return String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/(https?:\/\/[^\s?#"')]+)\?[^\s#"')]*/g, '$1?[query]')
    .replace(/\+?\d[\d\s-]{7,}\d/g, '[number]')
    .slice(0, max);
}

/** First "at …" line of a stack, used to group the same crash together. */
export function firstFrame(stack: string | undefined): string {
  // Hermes/V8: "    at fn (file:1:2)"; Safari/Firefox: "fn@file:1:2". The first
  // line of a V8 stack is the message itself, so it is never a frame.
  const line = (stack ?? '').split('\n').find((l) => /^\s*at\s|^[^\s@]*@\S+:\d+/.test(l)) ?? '';
  return line
    .trim()
    .replace(/:\d+:\d+\)?$/, '') // line:column change with every build
    .replace(/https?:\/\/[^\s)]*\//, '') // keep the file name, not the host
    .replace(/-[0-9a-f]{16,}(?=\.)/, '') // web bundle content hash
    .slice(0, 120);
}
