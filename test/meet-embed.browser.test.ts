// Browser-driven guard for mig#44's parent-side half: islands/MeetEmbed.tsx's
// `message` listener actually resizes the iframe to the height mig reports,
// and ignores a spoofed message from a different window on the page. A plain
// rendered-page test (test/meet-embed.test.ts) can't reach this — it's
// client-JS runtime behaviour, exactly like the CSP enforcement and focus
// tests in the other *.browser.test.ts files (see AGENTS.md "Browser-driven
// tests").
//
// Rather than depend on a real mig instance, this frames a tiny stub server
// this test controls: its `/embed` page posts `{ type: "mig:height", height
// }` to `window.parent`. That proves MeetEmbed's own filter and resize logic
// end to end, independent of mig's own implementation (which
// test/csp.browser.test.ts already exercises against the real
// `/embed?theme=dark` URL, without needing it to actually resize).
//
// Runs under `deno task test:browser` (its own -A task).
//
// Not covered here: that the `message` listener's cleanup
// (`removeEventListener`) actually fires on unmount. Every route that
// renders MeetEmbed (routes/contact-me.tsx, routes/how-i-work.tsx,
// islands/LeadForm.tsx's success panel) keeps it mounted for the page's
// whole life — LeadForm's success panel only CSS-collapses it
// (`max-height`/`inert`), it never unmounts — so there's no reachable UI
// interaction that tears MeetEmbed down while staying on the page. A full
// page navigation does destroy it, but a hard navigation doesn't reliably
// run Preact's effect-cleanup functions before the document is torn down,
// so a test built on that signal wouldn't actually prove the cleanup ran.
// Proving it directly would need mounting/unmounting the island through
// Preact's own render API outside the app (no DOM testing library is in
// this repo's dependency budget — see AGENTS.md "No third-party deps
// without justification" — and adding one for a single lifecycle assertion
// isn't worth it). The cleanup function itself is one line
// (`globalThis.removeEventListener("message", onMessage)`, mirroring the
// `addEventListener` two lines above it) — low-risk enough to leave
// covered by code review rather than a test that would need new
// infrastructure to write honestly.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser } from "playwright";
import { startSite } from "./harness.ts";
import { launchChromium, newPage } from "./browser.ts";

/** Starts a stub "mig" server whose `/embed` page posts `mig:height`
 * messages to `window.parent`, and whose `/spoof.html` page posts one that
 * claims the same origin but comes from a different window (a same-origin
 * iframe not embedded by MeetEmbed) — the "wrong source" guard's real-browser
 * counterpart to the unit test in test/meet-embed.test.ts. */
function startStubMig(): { origin: string; stop: () => void } {
  const controller = new AbortController();
  const server = Deno.serve(
    { port: 0, signal: controller.signal, onListen: () => {} },
    (req) => {
      const { pathname } = new URL(req.url);
      if (pathname === "/embed") {
        // Heights stay under MeetEmbed.tsx's MAX_EMBED_HEIGHT_PX (2000) so a
        // rejection in the tests below is unambiguously about the guard
        // under test (origin/source), never a side effect of the cap.
        return new Response(
          `<!doctype html><html><body>mig stub
            <script>
              setTimeout(() => {
                window.parent.postMessage({ type: "mig:height", height: 650 }, "*");
              }, 150);
              setTimeout(() => {
                window.parent.postMessage({ type: "mig:height", height: 950 }, "*");
              }, 300);
            </script>
          </body></html>`,
          { headers: { "content-type": "text/html" } },
        );
      }
      if (pathname === "/once/embed") {
        // Posts a single height while the page is still parsing and never
        // again — like mig on a step whose content never resizes after load.
        // A listener attached late misses it, and nothing corrects the frame.
        return new Response(
          `<!doctype html><html><body>mig stub, one message
            <script>
              window.parent.postMessage({ type: "mig:height", height: 654 }, "*");
            </script>
          </body></html>`,
          { headers: { "content-type": "text/html" } },
        );
      }
      if (pathname === "/spoof.html") {
        return new Response(
          `<!doctype html><html><body>spoofed source
            <script>
              window.parent.postMessage({ type: "mig:height", height: 900 }, "*");
            </script>
          </body></html>`,
          { headers: { "content-type": "text/html" } },
        );
      }
      return new Response("not found", { status: 404 });
    },
  );
  const addr = server.addr as Deno.NetAddr;
  return {
    origin: `http://127.0.0.1:${addr.port}`,
    stop: () => controller.abort(),
  };
}

Deno.test("the booking iframe resizes to the height mig's stub reports", async () => {
  const stub = startStubMig();
  const site = await startSite({ env: { SCHEDULE_URL: stub.origin } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await page.goto(`${site.origin}/contact-me`, {
        waitUntil: "networkidle",
      });
      await page.getByRole("button", { name: "Book a free 30-min intro call" })
        .click();

      const frame = page.locator(
        'iframe[title="Schedule a call with Anton Shubin"]',
      );
      await frame.waitFor({ state: "visible" });

      // Before any message arrives: the pre-mig#44 fallback height, not 0
      // and not the final reported height — this is also what an older mig
      // build that never sends mig:height leaves the frame at forever.
      const initialHeight = await frame.evaluate((el) =>
        parseInt(getComputedStyle(el).height, 10)
      );
      assertEquals(initialHeight, 760);

      await page.waitForFunction(
        () => {
          const el = document.querySelector(
            'iframe[title="Schedule a call with Anton Shubin"]',
          ) as HTMLIFrameElement | null;
          return el?.style.height === "650px";
        },
      );

      // The stub sends a second, larger height shortly after — the listener
      // must keep applying later messages, not just the first one.
      await page.waitForFunction(
        () => {
          const el = document.querySelector(
            'iframe[title="Schedule a call with Anton Shubin"]',
          ) as HTMLIFrameElement | null;
          return el?.style.height === "950px";
        },
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
    stub.stop();
  }
});

// Issue https://github.com/spy4x/antonshubin.com/issues/227: mig posts its
// height on load and from its first resize callback, and on a step that never
// resizes afterwards that is all it ever sends. MeetEmbed used to attach its
// listener in a `useEffect` that Preact runs after the next paint, so a frame
// that loaded first had its only message dropped and stayed at the 760px
// fallback. The stub here posts exactly one message, as early as it can.
// `requestAnimationFrame` is held back on this page so a paint-deferred effect
// runs on Preact's 35ms fallback timer instead. On an idle machine the stub's
// message arrives 16-20ms after the frame is inserted, so a late listener loses
// the race by about 15ms. Keep the stub posting as early as it can: a delay of
// 15ms or more would let the old late-listener code pass.
Deno.test("the booking iframe takes the height from mig's first and only message", async () => {
  const stub = startStubMig();
  const site = await startSite({
    env: { SCHEDULE_URL: `${stub.origin}/once` },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await page.goto(`${site.origin}/contact-me`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => {
        globalThis.requestAnimationFrame = () => 0;
      });
      await page.getByRole("button", { name: "Book a free 30-min intro call" })
        .click();

      const frame = page.locator(
        'iframe[title="Schedule a call with Anton Shubin"]',
      );
      await frame.waitFor({ state: "visible" });
      // The stub's single message is posted during its parse, so it is on its
      // way by the frame's `load`; one more second lets it land before we look.
      await page.frameLocator(
        'iframe[title="Schedule a call with Anton Shubin"]',
      )
        .locator("body").waitFor();
      await page.waitForTimeout(1000);

      const height = await frame.evaluate((el) =>
        parseInt(getComputedStyle(el).height, 10)
      );
      assertEquals(
        height,
        654,
        "the frame missed mig's first height message and kept its fallback height",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
    stub.stop();
  }
});

// A message whose `event.source` genuinely is the booking iframe's own
// `contentWindow` but whose `event.origin` is some other origin cannot
// happen through a real `postMessage` in this test's control — a frame's
// `source` and `origin` are tied together by the browser itself, and this
// site's own CSP `frame-src` only allows the real mig origin into that
// frame in the first place (proven separately by
// test/csp.browser.test.ts's disallowed-iframe-origin negative control), so
// there's no way to navigate it to an attacker origin to produce one. This
// test instead constructs that exact combination synthetically — a real
// `MessageEvent`, referencing the real iframe's real `contentWindow` as its
// `source`, dispatched on the real `window` where MeetEmbed's actual
// bundled listener runs — and proves it's still rejected. This is the
// real-browser counterpart to test/meet-embed.test.ts's pure-function
// "rejects the wrong origin" case: that one proves `isEmbedHeightMessage()`
// itself checks `event.origin`; this one proves `MeetEmbed`'s listener
// passes its own computed `embedOrigin` into that check, not `event.origin`
// itself (which would make the comparison always true and silently disable
// the origin guard in production, without any pure-function test noticing).
Deno.test("the listener ignores a message whose origin is spoofed but whose source is the real iframe", async () => {
  const stub = startStubMig();
  const site = await startSite({ env: { SCHEDULE_URL: stub.origin } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await page.goto(`${site.origin}/contact-me`, {
        waitUntil: "networkidle",
      });
      await page.getByRole("button", { name: "Book a free 30-min intro call" })
        .click();

      const frame = page.locator(
        'iframe[title="Schedule a call with Anton Shubin"]',
      );
      await frame.waitFor({ state: "visible" });

      // Let the stub's own legitimate messages land first (same reasoning
      // as the "different window" test above).
      await page.waitForFunction(() => {
        const el = document.querySelector(
          'iframe[title="Schedule a call with Anton Shubin"]',
        ) as HTMLIFrameElement | null;
        return el?.style.height === "950px";
      });

      await page.evaluate(() => {
        const el = document.querySelector(
          'iframe[title="Schedule a call with Anton Shubin"]',
        ) as HTMLIFrameElement;
        const fake = new MessageEvent("message", {
          origin: "https://evil.example.com",
          source: el.contentWindow,
          data: { type: "mig:height", height: 111 },
        });
        globalThis.dispatchEvent(fake);
      });
      // No real cross-document message to wait on (this is a synthetic,
      // same-task dispatch) — a listener that wrongly accepted it would
      // apply the new height synchronously, so no extra wait is needed
      // before checking.

      const currentHeight = await frame.evaluate((el) =>
        parseInt(getComputedStyle(el).height, 10)
      );
      assertEquals(
        currentHeight,
        950,
        "a message with a spoofed origin (but the real iframe as its source) resized the iframe",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
    stub.stop();
  }
});

Deno.test("a same-origin message from a different window never resizes the iframe", async () => {
  const stub = startStubMig();
  const site = await startSite({ env: { SCHEDULE_URL: stub.origin } });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      await page.goto(`${site.origin}/contact-me`, {
        waitUntil: "networkidle",
      });
      await page.getByRole("button", { name: "Book a free 30-min intro call" })
        .click();

      const frame = page.locator(
        'iframe[title="Schedule a call with Anton Shubin"]',
      );
      await frame.waitFor({ state: "visible" });

      // Let the real /embed stub's own legitimate messages (650, then 950)
      // land first, so the height below isn't just "nothing has happened
      // yet" — the guard has to hold against a resize that already
      // succeeded, not an untouched initial value.
      await page.waitForFunction(() => {
        const el = document.querySelector(
          'iframe[title="Schedule a call with Anton Shubin"]',
        ) as HTMLIFrameElement | null;
        return el?.style.height === "950px";
      });

      // Open a second, unrelated same-origin iframe that posts the spoofed
      // message. event.origin matches, but event.source is that iframe's
      // own contentWindow, not the booking iframe's — MeetEmbed must ignore
      // it. Wait for the spoof frame's own `load` event rather than a fixed
      // timeout: its inline <script> already ran by the time `load` fires
      // (inline scripts run during parse, before `load`), so the message is
      // already queued; one more tick lets the event loop deliver it before
      // we check.
      await page.evaluate((spoofUrl) => {
        return new Promise<void>((resolve) => {
          const spoof = document.createElement("iframe");
          spoof.src = spoofUrl;
          spoof.onload = () => resolve();
          document.body.appendChild(spoof);
        });
      }, `${stub.origin}/spoof.html`);
      await page.evaluate(() => new Promise((r) => setTimeout(r, 0)));

      const currentHeight = await frame.evaluate((el) =>
        parseInt(getComputedStyle(el).height, 10)
      );
      assertEquals(
        currentHeight,
        950,
        "a message from a different window's contentWindow resized the iframe",
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
    stub.stop();
  }
});
