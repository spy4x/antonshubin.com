// Guards issue #162: with SCHEDULE_URL unset, BookCallLink and MeetEmbed
// already render nothing (#156, #159, #161), but several pages kept the
// prose line that introduces the button next to it, e.g. "Book a free
// 30-minute intro call. No pitch, just advice." over a spot with no button.
// These tests pin the unset case (no lead-in line) and the set case (the
// page is unchanged from before this fix) for every page the issue names.
import { assert, assertFalse } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { visibleText } from "./html.ts";

/** RFC 2606 example domain — never a real scheduler, safe in a rendered test. */
const PLACEHOLDER_SCHEDULE_URL = "https://example.com/book";

/**
 * Lead-in phrases that introduce a booking button and must disappear along
 * with it when `SCHEDULE_URL` is unset. Each entry names the page it was
 * found on (issue #162's evidence) plus the how-i-work FAQ answer that
 * regressed silently once before (main's pre-#161 wording, restored in the
 * reviewer gate on #161 with every test still green).
 */
const UNSET_LEAD_INS: Array<{ path: string; phrase: string }> = [
  { path: "/", phrase: "Thirty minutes, free, no pitch" },
  {
    path: "/saas-architecture-guide",
    phrase: "Book a free 30-minute intro call. No pitch, just advice.",
  },
  { path: "/catalog", phrase: "Not sure which fits your project?" },
  {
    path: "/how-i-work",
    phrase: "Book the free 30-minute intro call",
  },
];

Deno.test("booking lead-in lines are gone when SCHEDULE_URL is unset", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  try {
    for (const { path, phrase } of UNSET_LEAD_INS) {
      const text = visibleText(await site.html(path));
      assertFalse(
        text.includes(phrase),
        `${path} still shows the booking lead-in "${phrase}" with SCHEDULE_URL unset`,
      );
    }
    // /contact-me's only pre-#161 regression was in the <meta description>,
    // which visibleText() can't see (it strips tags, attributes with them) —
    // check the raw HTML instead.
    const contactHtml = await site.html("/contact-me");
    assertFalse(
      contactHtml.includes(
        "Book a free 30-minute intro call, email me, or message me on Telegram.",
      ),
      "/contact-me's <meta description> still promises a booking call with SCHEDULE_URL unset",
    );
  } finally {
    await site.stop();
  }
});

Deno.test("booking lead-in lines render when SCHEDULE_URL is set", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    for (const { path, phrase } of UNSET_LEAD_INS) {
      const text = visibleText(await site.html(path));
      assert(
        text.includes(phrase),
        `${path} is missing the booking lead-in "${phrase}" with SCHEDULE_URL set`,
      );
    }
  } finally {
    await site.stop();
  }
});
