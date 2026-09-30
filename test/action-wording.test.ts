// Guards #190's "one wording per action": every link or button that books
// the call says `BOOK_LABEL`, and every one that opens the written brief
// says `BRIEF_LABEL`, on every sitemap page, `/pay`, the not-found page and
// both llms files. A third wording ("Book a call", "Book a free intro call",
// "Send me your idea") fails here, named with its page. The allowed
// exceptions are listed below with their reason, and each must still be on
// its page, so the list cannot go stale.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { visibleText } from "./html.ts";
import {
  BOOK_LABEL,
  BRIEF_LABEL,
  NAV_BOOK_LABEL,
  NAV_WRITE_LABEL,
} from "../lib/nav.ts";
import { NEW_TAB_LABEL } from "../lib/meet-embed.ts";
import { decapitalize } from "../lib/promises.ts";

/** RFC 2606 host — never a real scheduler. */
const SCHEDULE = "https://meet.example.com";
const SITE = "https://antonshubin.com";

/** Wordings any booking or brief control may use, on any page. */
const BOOK_WORDINGS = [BOOK_LABEL, decapitalize(BOOK_LABEL), NAV_BOOK_LABEL];
const BRIEF_WORDINGS = [BRIEF_LABEL, decapitalize(BRIEF_LABEL)];

/**
 * Controls that reach the booking page or the brief with other words, on
 * purpose. Each is `<page> | <label>`.
 */
const EXCEPTIONS: Record<string, string> = {
  "/book | Skip the calendar":
    "the keyboard skip link names what it skips; the visible link beside it says BRIEF_LABEL",
  "/book | Send my brief":
    "the form's submit button sends the brief, it does not open it",
  "/ | Send my brief":
    "the form's submit button sends the brief, it does not open it",
  "/pay | From outside US? Contact me":
    "a payment question, not a booking; it links the page that lists email and Telegram",
  "/tools/mig | Open the booking page":
    "mig's running instance, the tool page's live link",
  "/tools/mig | The booking page on this site":
    "mig's running instance, in the tool's link list",
  "/blog/cost-optimization-laboratory | free architecture audit":
    "a post's own prose, which names what the brief returns",
  "/blog/mig-tiny-self-hosted-scheduler | /book":
    "a post's own prose, which prints the path",
};

type Kind = "book" | "brief" | "other";

/** What a control does, from its href, or from its words when it has none. */
function kind(href: string | undefined, label: string): Kind {
  const path = href?.replace(SITE, "");
  if (path !== undefined) {
    if (/^\/book(\?[^#]*)?#brief$|^#brief$|^\/?#audit-form$/.test(path)) {
      return "brief";
    }
    if (/^\/book(\?[^#]*)?$|^#book$/.test(path) || path.startsWith(SCHEDULE)) {
      return "book";
    }
  }
  if (/^book\b/i.test(label)) return "book";
  if (/^send\b.*\bbrief\b/i.test(label)) return "brief";
  return "other";
}

/** Every `<a>` and `<button>` whose words or target book the call or open the brief. */
function actionControls(html: string): Array<{ kind: Kind; label: string }> {
  const found: Array<{ kind: Kind; label: string }> = [];
  for (const m of html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const label = visibleText(m[3]).replace(/\s*\(opens in a new tab\)$/, "");
    const href = m[2].match(/\shref="([^"]*)"/)?.[1];
    const k = kind(href, label);
    if (k !== "other") found.push({ kind: k, label });
  }
  return found;
}

/** The pages to scan: the sitemap, `/pay` and a not-found URL. */
async function pagePaths(
  site: Awaited<ReturnType<typeof startSite>>,
): Promise<string[]> {
  const sitemap = await site.html("/sitemap.xml");
  const paths = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname);
  return [...paths, "/pay", "/no-such-page"];
}

/** Scans every page and returns the controls using a wording outside `allowed`. */
async function strayWordings(
  site: Awaited<ReturnType<typeof startSite>>,
  allowed: Record<Exclude<Kind, "other">, string[]>,
  seenExceptions: Set<string>,
): Promise<string[]> {
  const stray: string[] = [];
  for (const path of await pagePaths(site)) {
    const res = await site.get(path);
    const html = await res.text();
    for (const { kind, label } of actionControls(html)) {
      if (allowed[kind as "book" | "brief"].includes(label)) continue;
      const key = `${path} | ${label}`;
      if (key in EXCEPTIONS) {
        seenExceptions.add(key);
        continue;
      }
      stray.push(`${key} (${kind})`);
    }
  }
  return stray;
}

Deno.test("every booking and brief control uses one of the two wordings, with a scheduler", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  try {
    const seen = new Set<string>();
    const stray = await strayWordings(
      site,
      {
        // The scheduler's own page in a new tab is the one other booking link.
        book: [...BOOK_WORDINGS, NEW_TAB_LABEL],
        brief: BRIEF_WORDINGS,
      },
      seen,
    );
    assertEquals(stray, [], "a third booking or brief wording");
    assertEquals(
      Object.keys(EXCEPTIONS).filter((k) => !seen.has(k)),
      [],
      "an exception no page shows any more: drop it from EXCEPTIONS",
    );
  } finally {
    await site.stop();
  }
});

Deno.test("without a scheduler, Book reads Write and the brief keeps its one wording", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  try {
    const stray = await strayWordings(
      site,
      {
        book: [...BOOK_WORDINGS, NAV_WRITE_LABEL],
        brief: [...BRIEF_WORDINGS, NAV_WRITE_LABEL],
      },
      new Set(),
    );
    assertEquals(stray, [], "a third booking or brief wording");
  } finally {
    await site.stop();
  }
});

Deno.test("both llms files book the call and send the brief in the two wordings only", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: SCHEDULE } });
  try {
    const stray: string[] = [];
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      // Blog post descriptions are article text, not the site's actions.
      const text = (await site.html(path)).split("\n")
        .filter((line) => !line.includes("/blog/")).join("\n");
      for (const m of text.matchAll(/\bbook(?: [\w-]+){0,4} call\b/gi)) {
        if (m[0].toLowerCase() !== BOOK_LABEL.toLowerCase()) {
          stray.push(`${path}: ${m[0]}`);
        }
      }
      for (const m of text.matchAll(/\bsend(?: [\w-]+){0,3} brief\b/gi)) {
        if (m[0].toLowerCase() !== BRIEF_LABEL.toLowerCase()) {
          stray.push(`${path}: ${m[0]}`);
        }
      }
    }
    assertEquals(stray, [], "a third booking or brief wording in an llms file");
  } finally {
    await site.stop();
  }
});
