// Guards the facts Anton supplied on #301 (30 Sep 2026): each one is a
// sentence on a built page, and each test fails if its page loses it.
import { assert, assertEquals, assertFalse } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { count, visibleText } from "./html.ts";
import { promise } from "../lib/promises.ts";
import { INTERNATIONAL_BANK } from "../lib/about.ts";

/** RFC 2606 example domain, so `/book` renders its calendar branch. */
const PLACEHOLDER_SCHEDULE_URL = "https://example.com/book";

/** The page's `<main>`, without the frame's nav and footer. */
function mainOf(html: string): string {
  return html.slice(html.indexOf("<main"), html.indexOf("</main>"));
}

Deno.test("the owner's #301 facts are on their pages", async (t) => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    await t.step(
      "the strategy session and the audit show the refund",
      async () => {
        for (const slug of ["strategy-call", "codebase-health-audit"]) {
          const text = visibleText(mainOf(await site.html(`/catalog/${slug}`)));
          assert(text.includes(promise("refund").title), `${slug}: no refund`);
          assertFalse(
            text.includes(promise("free-bugfixes").title),
            `${slug}: bug fixes`,
          );
        }
      },
    );

    await t.step(
      "the strategy session is booked through the brief and an invoice",
      async () => {
        const text = visibleText(await site.html("/catalog/strategy-call"));
        assert(text.includes("Stripe invoice"), "no invoice step");
      },
    );

    await t.step(
      "/book says who you talk to, the time zone and the invite",
      async () => {
        const text = visibleText(await site.html("/book"));
        for (
          const phrase of [
            "not a salesperson",
            "your own time zone",
            "calendar invite",
          ]
        ) {
          assert(text.includes(phrase), `/book lacks "${phrase}"`);
        }
        assert(text.includes("within one working day"), "/book: no reply time");
      },
    );

    await t.step(
      "How I work answers the refund process and AI providers",
      async () => {
        const html = await site.html("/how-i-work");
        assertEquals(count(html, /id="faq-ai-and-your-code"/g), 1);
        assert(
          count(html, /href="#faq-ai-and-your-code"/g) >= 1,
          "AI paragraph link",
        );
        assert(
          visibleText(html).includes("by email or on Upwork"),
          "no refund process",
        );
      },
    );

    await t.step(
      "/pay and /about name the international bank rails",
      async () => {
        for (const path of ["/pay", "/about"]) {
          assert(
            visibleText(await site.html(path)).includes(INTERNATIONAL_BANK),
            path,
          );
        }
      },
    );

    await t.step(
      "the About bike photo is lazy, so the portrait stays the one eager image",
      async () => {
        const html = await site.html("/about");
        const bike = html.match(/<img[^>]*data-about-bike[^>]*>/)?.[0] ?? "";
        assert(bike.includes(`loading="lazy"`), "bike photo not lazy");
        assertFalse(
          bike.includes("fetchpriority"),
          "bike photo has fetchpriority",
        );
      },
    );

    await t.step(
      "/infrastructure names the host and the restore test",
      async () => {
        const text = visibleText(await site.html("/infrastructure"));
        assert(text.includes("Hetzner Cloud server in Germany"), "no host");
        assert(
          text.includes("Restore last tested on 30 September 2026"),
          "no restore date",
        );
      },
    );

    await t.step("an archived post shows its note", async () => {
      const text = visibleText(
        await site.html("/blog/setting-up-your-own-ci-cd-server-with-drone-ci"),
      );
      assert(text.includes("I now run Woodpecker CI"), "no archive note");
    });

    await t.step("/privacy states retention and the mail server", async () => {
      const text = visibleText(await site.html("/privacy"));
      assert(text.includes("until you unsubscribe"), "no retention");
      assert(text.includes("Stalwart"), "no mail server");
    });
  } finally {
    await site.stop();
  }
});
