/**
 * File-backed newsletter subscriber storage. One module instead of the
 * load/save pair `routes/api/subscribe.ts` and `routes/api/unsubscribe.ts`
 * each carried separately before #177, so both routes (and
 * `scripts/send-newsletter.ts`) agree on the file path and on what a write
 * failure means.
 *
 * The path is read from `SUBSCRIBERS_FILE` at call time (not a module-level
 * constant), so tests can point it at a temp file per run instead of the
 * repo's `data/subscribers.json`.
 */

export interface Subscriber {
  email: string;
  subscribedAt: string;
}

function dataFile(): string {
  return Deno.env.get("SUBSCRIBERS_FILE") || "data/subscribers.json";
}

/** Returns `[]` when the file is missing or unreadable — that's the normal
 * "no subscribers yet" state, not an error. */
export function loadSubscribers(): Subscriber[] {
  try {
    const raw = Deno.readTextFileSync(dataFile());
    return JSON.parse(raw) as Subscriber[];
  } catch {
    return [];
  }
}

/** Throws on failure instead of swallowing it — callers must turn that into
 * a 500 rather than answering success while the write never happened. */
export function saveSubscribers(list: Subscriber[]): void {
  const file = dataFile();
  const slash = file.lastIndexOf("/");
  if (slash !== -1) {
    Deno.mkdirSync(file.slice(0, slash), { recursive: true });
  }
  Deno.writeTextFileSync(file, JSON.stringify(list, null, 2));
}
