// Guards issue #162: with SCHEDULE_URL unset, BookCallLink and MeetEmbed
// already render nothing (#156, #159, #161), but several pages kept the
// prose introducing the button — a heading, a paragraph, or the words
// "Rather write?" — over the spot where the button used to sit. These
// tests pin each lead-in phrase absent when SCHEDULE_URL is unset and
// present when it is set, for every page the issue names, plus the
// how-i-work FAQ and contact-me <meta description> wording that
// regressed once silently before (main's pre-#161 wording, restored in
// the reviewer gate on #161 with every other test still green).
import { assert, assertEquals, assertFalse } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { count, visibleText } from "./html.ts";

/** RFC 2606 example domain — never a real scheduler, safe in a rendered test. */
const PLACEHOLDER_SCHEDULE_URL = "https://example.com/book";

/**
 * Lead-in phrases that introduce a booking button and must disappear along
 * with it when `SCHEDULE_URL` is unset, and reappear when it is set. The
 * saas-architecture-guide card's heading is included separately from its
 * paragraph: both sit inside the same `{SCHEDULE_URL && (...)}` block, so a
 * mutation that unwraps only one of them still leaves the other to catch it.
 */
const UNSET_LEAD_INS: Array<{ path: string; phrase: string }> = [
  {
    path: "/saas-architecture-guide",
    phrase: "Need help with your architecture?",
  },
  {
    path: "/saas-architecture-guide",
    phrase: "Book a free 30-minute intro call. No pitch, just advice.",
  },
  { path: "/catalog", phrase: "Not sure which fits your project?" },
  { path: "/", phrase: "Thirty minutes, free, no pitch" },
  { path: "/how-i-work", phrase: "Book the free 30-minute intro call" },
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

    // The home page has two "Rather write?" lead-ins (hero and closing
    // section), each guarding its own button independently — count both
    // away rather than checking presence/absence of one occurrence.
    const homeText = visibleText(await site.html("/"));
    assertEquals(
      count(homeText, /Rather write\?/g),
      0,
      `/ still shows "Rather write?" with SCHEDULE_URL unset`,
    );

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

    const homeText = visibleText(await site.html("/"));
    assertEquals(
      count(homeText, /Rather write\?/g),
      2,
      `/ should show "Rather write?" in both the hero and the closing section with SCHEDULE_URL set`,
    );
  } finally {
    await site.stop();
  }
});
