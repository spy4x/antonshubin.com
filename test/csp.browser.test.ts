// Browser-driven guard for #177's Content-Security-Policy (lib/csp.ts,
// wired into main.ts). A plain HTML fetch can read the header but can't tell
// whether the browser actually enforces it against everything the site
// loads — an inline script with the wrong nonce, a stray unnoticed
// `unsafe-inline`, a frame source the policy forgot — so this drives real
// Chromium the same way test/a11y.browser.test.ts and
// test/contrast.browser.test.ts do, listening for the browser's own
// `securitypolicyviolation` event instead of re-parsing the header.
//
// Coverage:
// - Every static page, plus one representative page per dynamic route
//   pattern (/blog/[slug], /projects/[slug], /catalog/[slug],
//   /hackathons/[slug] if any exist) — see representativePaths()'s docs for
//   why this isn't a full ~48-page sitemap crawl.
// - An unmatched URL (/no-such-page, see #177 R-001): zero violations, same
//   as any other page, plus a mobile-viewport check that the mobile menu
//   still hydrates there (proof client JS actually ran, not just that
//   nothing tried to and so violated nothing).
// - The /contact-me booking facade: clicking it inserts a same-policy
//   cross-origin <iframe> (frame-src) at runtime, which only exists after
//   client JS runs (islands/MeetEmbed.tsx) — never in the server-rendered
//   HTML the other rendered-page tests read.
// - A real unsubscribe link end to end: GET the confirm page, POST the form.
// - Two negative controls, proving the listener and the policy actually do
//   something rather than the tests above passing vacuously: an inline
//   `<script>` with no nonce is blocked (its side effect never runs) and
//   reported, and an iframe to a disallowed origin is reported.
//
// Runs under `deno task test:browser` (its own -A task) — see AGENTS.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { type Site, startSite } from "./harness.ts";
import { launchChromium } from "./browser.ts";
import { createUnsubscribeToken } from "../lib/unsubscribe.ts";

// RFC 2606 reserved hosts: a real DNS lookup for these either fails or hits
// no server this test controls, which is fine — a network failure is not a
// CSP violation. The policy must allow them (script/connect-src for Umami,
// frame-src for the booking widget) without ever letting the *browser*
// refuse to even attempt the request.
const SCHEDULE_URL = "https://meet.example.com";
const UMAMI_URL = "https://umami.example.com/script.js";
const UMAMI_ID = "00000000-0000-0000-0000-000000000000";
const TEST_SECRET = "t".repeat(32);
const MOBILE_VIEWPORT = { width: 390, height: 844 };

interface Violation {
  directive: string;
  blockedURI: string;
}

/** Registers a `securitypolicyviolation` listener before any page script
 * runs, via `addInitScript` — re-injected on every navigation this `page`
 * makes, so `violationsOn` below always reflects the current document. */
async function registerViolationListener(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (globalThis as unknown as { __cspViolations: Violation[] })
      .__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (globalThis as unknown as { __cspViolations: Violation[] })
        .__cspViolations.push({
          directive: e.violatedDirective,
          blockedURI: e.blockedURI,
        });
    });
  });
}

function violationsOn(page: Page): Promise<Violation[]> {
  return page.evaluate(() =>
    (globalThis as unknown as { __cspViolations: Violation[] })
      .__cspViolations
  );
}

async function assertNoViolations(page: Page, context: string): Promise<void> {
  assertEquals(
    await violationsOn(page),
    [],
    `expected zero CSP violations ${context}`,
  );
}

async function sitemapPaths(site: Site): Promise<string[]> {
  const xml = await site.html("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
}

/**
 * A real Chromium visit to every one of the sitemap's ~48 pages, on every
 * push, is the same cost test/contrast.browser.test.ts's header already
 * argues against for axe-core (there: "six representative pages... not the
 * full sitemap... a full-site crawl belongs in a one-off audit script, not a
 * task that runs on every push") — here it's worse, since each page also
 * waits out `networkidle`. Measured locally: ~48 sequential
 * `networkidle` navigations comfortably exceed the 90s budget in this file's
 * brief.
 *
 * Instead: every static page (there are only a handful, and each is
 * distinct content worth checking on its own) plus one representative page
 * per dynamic route pattern — covering every *kind* of page the CSP has to
 * hold on, not just one instance of each.
 */
function representativePaths(paths: string[]): string[] {
  const dynamicPrefixes = ["/blog/", "/projects/", "/catalog/", "/hackathons/"];
  const isDynamic = (p: string) =>
    dynamicPrefixes.some((prefix) => p.startsWith(prefix));
  const chosen = paths.filter((p) => !isDynamic(p));
  for (const prefix of dynamicPrefixes) {
    const example = paths.find((p) => p.startsWith(prefix));
    if (example) chosen.push(example);
  }
  return chosen;
}

Deno.test("no CSP violations on any static page or representative dynamic page", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL, UMAMI_URL, UMAMI_ID },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage();
    try {
      await registerViolationListener(page);
      // /no-such-page matches no sitemap entry and no route — see #177
      // R-001: it must get the same CSP-enforced middleware chain as every
      // page the sitemap lists, so it's added here explicitly rather than
      // being found by representativePaths().
      const paths = [
        ...representativePaths(await sitemapPaths(site)),
        "/no-such-page",
      ];
      assert(
        paths.length >= 5,
        "expected several representative paths, got too few to be a real check",
      );

      for (const path of paths) {
        await page.goto(`${site.origin}${path}`, { waitUntil: "networkidle" });
        await assertNoViolations(page, `on ${path}`);
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the mobile menu still hydrates on an unmatched URL", async () => {
  // Zero CSP violations alone doesn't prove client JS ran — it's also true
  // of a page where hydration silently never started. This drives the
  // mobile menu open, same as test/a11y.browser.test.ts's Escape-handling
  // tests, as the concrete proof.
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage({ viewport: MOBILE_VIEWPORT });
    try {
      await registerViolationListener(page);
      await page.goto(`${site.origin}/no-such-page`, {
        waitUntil: "networkidle",
      });
      await assertNoViolations(page, "on /no-such-page");

      const toggle = page.getByRole("button", { name: "More", exact: true });
      await toggle.click();
      await page.locator("#mobile-menu").waitFor({ state: "visible" });

      await assertNoViolations(page, "after opening the mobile menu");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("the booking facade's iframe loads without a CSP violation", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL, UMAMI_URL, UMAMI_ID },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage();
    try {
      await registerViolationListener(page);
      await page.goto(`${site.origin}/contact-me`, {
        waitUntil: "networkidle",
      });
      await assertNoViolations(page, "before opening the booking facade");

      await page.getByRole("button", { name: "Book a free 30-min intro call" })
        .click();
      const frame = page.locator(
        'iframe[title="Schedule a call with Anton Shubin"]',
      );
      await frame.waitFor({ state: "visible" });
      assertEquals(
        await frame.getAttribute("src"),
        `${SCHEDULE_URL}/embed?theme=dark`,
      );

      await assertNoViolations(page, "after the booking iframe loaded");
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a signed unsubscribe link loads and its form submits without a CSP violation", async () => {
  const dir = await Deno.makeTempDir();
  const file = `${dir}/subscribers.json`;
  try {
    const email = "reader@example.com";
    await Deno.writeTextFile(
      file,
      JSON.stringify([{ email, subscribedAt: "2026-01-01T00:00:00.000Z" }]),
    );
    const site = await startSite({
      env: { SUBSCRIBERS_FILE: file, UNSUBSCRIBE_SECRET: TEST_SECRET },
    });
    let browser: Browser | undefined;
    try {
      browser = await launchChromium();
      const page = await browser.newPage();
      try {
        await registerViolationListener(page);
        const token = await createUnsubscribeToken(email, TEST_SECRET);
        await page.goto(
          `${site.origin}/unsubscribe?token=${encodeURIComponent(token)}`,
          { waitUntil: "networkidle" },
        );
        await assertNoViolations(page, "on the unsubscribe confirm page");

        await page.getByRole("button", { name: "Unsubscribe" }).click();
        await page.waitForLoadState("networkidle");
        await page.getByRole("heading", { name: "You're unsubscribed" })
          .waitFor({ state: "visible" });
        await assertNoViolations(page, "after submitting the unsubscribe form");
      } finally {
        await page.close();
      }
    } finally {
      await browser?.close();
      await site.stop();
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("negative controls: an unnonced inline script is blocked and reported, a disallowed iframe origin is reported", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await browser.newPage();
    try {
      await registerViolationListener(page);
      await page.goto(site.origin, { waitUntil: "networkidle" });
      await assertNoViolations(page, "right after the home page loads");

      // No `nonce` attribute at all — the CSP must refuse to run it, proving
      // this isn't `'unsafe-inline'` in disguise. The side effect
      // (`__negControlRan`) never happening is the actual proof it was
      // blocked, not just that a violation event fired for something else.
      await page.evaluate(() => {
        const script = document.createElement("script");
        script.textContent = "globalThis.__negControlRan = true;";
        document.body.appendChild(script);
      });
      assertEquals(
        await page.evaluate(() =>
          (globalThis as unknown as { __negControlRan?: boolean })
            .__negControlRan
        ),
        undefined,
        "an unnonced inline script must never execute",
      );
      const afterScript = await violationsOn(page);
      assert(
        afterScript.some((v) => v.directive.startsWith("script-src")),
        `expected a script-src violation, got: ${JSON.stringify(afterScript)}`,
      );

      // frame-src only allows YouTube and (when set) the booking origin —
      // this host is neither.
      await page.evaluate(() => {
        const iframe = document.createElement("iframe");
        iframe.src = "https://blocked.example.org";
        document.body.appendChild(iframe);
      });
      await page.waitForFunction(
        () =>
          (globalThis as unknown as { __cspViolations: Violation[] })
            .__cspViolations.some((v) => v.directive.startsWith("frame-src")),
        undefined,
        { timeout: 5000 },
      ).catch(() => {});
      const afterFrame = await violationsOn(page);
      assert(
        afterFrame.some((v) => v.directive.startsWith("frame-src")),
        `expected a frame-src violation, got: ${JSON.stringify(afterFrame)}`,
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
