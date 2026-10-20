/**
 * IndexNow: tells Bing (and Yandex, Seznam, Naver) that a URL changed, so a
 * new post is crawled within hours instead of days. The key is public by
 * design: it only proves the ping comes from whoever controls this host,
 * which serves it at {@linkcode INDEXNOW_KEY_PATH}.
 */
export const INDEXNOW_KEY = "db06b9177c65f37f5b7228895d1ac3ac";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** How long the ping waits before giving up; it never blocks a publish. */
export const INDEXNOW_TIMEOUT_MS = 10_000;

/**
 * Submits `urls` (all on `site`) and resolves to one line for the log. Fails
 * open: a network error or a non-2xx answer is reported, never thrown.
 */
export async function pingIndexNow(
  fetchFn: typeof fetch,
  site: string,
  urls: string[],
): Promise<string> {
  try {
    const res = await fetchFn(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(site).host,
        key: INDEXNOW_KEY,
        keyLocation: `${site}${INDEXNOW_KEY_PATH}`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(INDEXNOW_TIMEOUT_MS),
    });
    await res.body?.cancel();
    return res.ok
      ? `IndexNow: submitted ${urls.length} URL(s), answered ${res.status}.`
      : `IndexNow: answered ${res.status}; nothing else depends on it.`;
  } catch (err) {
    return `IndexNow: ping failed (${
      (err as Error).message
    }); nothing else depends on it.`;
  }
}
