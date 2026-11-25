/**
 * fetch with a time limit, for the Supabase client.
 *
 * Without one, a request that never answers (a dropped mobile connection, a
 * stalled server) keeps the backup queue waiting forever: every later backup
 * waits behind it until the app is restarted. With a limit the request fails,
 * the backup shows "error", and the next change or app launch retries it.
 */
export const REQUEST_TIMEOUT_MS = 20_000;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export function withTimeout(fetchImpl: FetchLike, ms = REQUEST_TIMEOUT_MS): FetchLike {
  return (input, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    // Keep honouring a caller's own cancel signal.
    const outer = init.signal;
    if (outer) {
      if (outer.aborted) controller.abort();
      else outer.addEventListener('abort', () => controller.abort(), { once: true });
    }
    return fetchImpl(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}
