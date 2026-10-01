// Guards issue #162: with SCHEDULE_URL unset, BookCallLink and MeetEmbed
// already render nothing (#156, #159, #161), but several pages kept the
// prose introducing the button — a heading, a paragraph, or the words
// "Rather write?" — over the spot where the button used to sit. These
// tests pin each lead-in phrase absent when SCHEDULE_URL is unset and
// present when it is set, for every page the issue names, plus the
// /book <meta description> wording that
// regressed once silently before (main's pre-#161 wording, restored in
// the reviewer gate on #161 with every other test still green).
import { assert, assertEquals, assertFalse } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { catalogItem, INTRO_CALL } from "../lib/catalog.ts";
import { TIMEZONE_LABEL } from "../lib/config.ts";
import { ROLE } from "../lib/head.ts";
import { promise } from "../lib/promises.ts";
import { testimonial } from "../lib/testimonials.ts";
import { INITIAL_EMBED_HEIGHT_PX } from "../islands/MeetEmbed.tsx";
import { BOOK_LABEL } from "../lib/nav.ts";

/** The page's `<main>`, without the frame's nav and footer. */
function mainOf(html: string): string {
  return html.slice(html.indexOf("<main"), html.indexOf("</main>"));
}

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

    // The home page's Book buttons render nothing without SCHEDULE_URL, and
    // no prose promises a call in their place (#269).
    const homeText = visibleText(await site.html("/"));
    assertEquals(
      count(homeText, new RegExp(BOOK_LABEL, "g")),
      0,
      `/ still offers a booking call with SCHEDULE_URL unset`,
    );

    // /book's only pre-#161 regression was in the <meta description>,
    // which visibleText() can't see (it strips tags, attributes with them) —
    // check the raw HTML instead.
    const contactHtml = await site.html("/book");
    assertFalse(
      contactHtml.includes(
        "Book a free 30-minute intro call, email me, or message me on Telegram.",
      ),
      "/book's <meta description> still promises a booking call with SCHEDULE_URL unset",
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

    // The footer's Contact group says it too; count inside <main> only.
    const homeMain = visibleText(mainOf(await site.html("/")));
    assert(
      count(homeMain, new RegExp(BOOK_LABEL, "g")) === 2,
      `/ should offer Book twice (hero and closing band) with SCHEDULE_URL set`,
    );
  } finally {
    await site.stop();
  }
});

/** The booking page's heading with a scheduler: the call, from `INTRO_CALL`. */
const BOOK_H1 = `Book a ${INTRO_CALL}`;

/** The text of every `<h1>` in `html`. */
function h1s(html: string): string[] {
  return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
    visibleText(m[1]).trim()
  );
}

Deno.test("the booking page leads with one h1 naming the call and the calendar under it", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    const html = await site.html("/book");
    assertEquals(h1s(html), [BOOK_H1]);
    assert(
      html.includes(
        "<title>Contact Anton Shubin: book a free 30-minute call</title>",
      ),
      "/book: the title does not name the call",
    );

    // Heading, then the skip link, then the calendar, then the brief.
    const order = [
      html.indexOf("<h1"),
      html.search(/href="#brief"[^>]*data-contact-skip/),
      html.indexOf("data-meet-embed-placeholder"),
      html.indexOf('id="brief"'),
    ];
    assert(
      order.every((i) => i >= 0),
      `/book: missing a first-screen element: ${order}`,
    );
    assertEquals(
      [...order].sort((a, b) => a - b),
      order,
      "/book: heading, skip link, calendar and brief are out of order",
    );
    assert(
      visibleText(html).includes("Loading the calendar…"),
      "/book: the calendar placeholder says nothing while it loads",
    );
    // The placeholder reserves the frame's starting height, so nothing under
    // it moves when the calendar arrives.
    assert(
      new RegExp(
        `data-meet-embed-placeholder[^>]*height:\\s*${INITIAL_EMBED_HEIGHT_PX}px`,
      ).test(html),
      "/book: the calendar placeholder reserves no height",
    );

    // The old page's pieces are gone: the cards, the icon row, the QR code.
    assertEquals(count(html, /data-contact-option/g), 0);
    assertEquals(count(html, /qr-share/g), 0);
    assertFalse(visibleText(html).includes("Get in touch"));
  } finally {
    await site.stop();
  }
});

Deno.test("the booking page's side panel states who, time zone, email, Telegram, Upwork and invoicing", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    const html = await site.html("/book");
    const start = html.indexOf("data-contact-facts");
    assert(start >= 0, "/book: no side panel");
    const panel = visibleText(
      html.slice(start, html.indexOf("</aside>", start)),
    );
    for (
      const fact of [
        "Anton Shubin",
        ROLE,
        TIMEZONE_LABEL,
        "hi@antonshubin.com",
        "@spy4x",
        "Hire me there",
        "Invoices are issued by NeatSoft PTE LTD, Singapore (UEN 202300222R), where I'm co-founder and CEO.",
      ]
    ) {
      assert(panel.includes(fact), `/book: side panel lacks "${fact}"`);
    }
  } finally {
    await site.stop();
  }
});

Deno.test("the booking page says what follows the call, quotes one client and offers the brief without a second calendar", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    const html = await site.html("/book");
    const text = visibleText(html);
    for (const id of ["first-milestone", "ownership"]) {
      assert(
        text.includes(promise(id).desc),
        `/book: "After the call" lacks the ${id} promise`,
      );
    }
    assert(
      text.includes(testimonial("roley-2").excerpt),
      "/book: the roley-2 quote is missing",
    );
    assert(text.includes("Prefer writing?"));
    // Under "Prefer writing?" the form's own heading is hidden, so the phrase
    // shows once: the "Rather write?" link under the H1.
    assertEquals(count(text, /Send a written brief/g), 1);
    // One calendar on the page: the brief's success panel points up to it.
    assertEquals(count(html, /data-meet-embed="/g), 1);
    const success = html.slice(html.indexOf("data-lead-success"));
    assert(
      /href="#book"/.test(success),
      "/book: the brief's success panel does not point up to #book",
    );
    // A click on submit is not a sent brief: only the island's
    // `brief-sent`, after the server accepted it, counts (#318).
    const submit = html.match(/<button[^>]*type="submit"[^>]*>/)?.[0] ?? "";
    assert(submit, "/book: no submit button");
    assert(
      !submit.includes("data-umami-event"),
      "/book: the brief's submit click is counted as an event",
    );
  } finally {
    await site.stop();
  }
});

Deno.test("without SCHEDULE_URL the booking page leads with the written brief", async () => {
  const site = await startSite({ env: { SCHEDULE_URL: "" } });
  try {
    const html = await site.html("/book");
    assertEquals(h1s(html), ["Send a written brief"]);
    // The form hides its own "Send a written brief" heading under this H1.
    assertEquals(count(visibleText(html), /Send a written brief/g), 1);
    assert(
      /<section\b[^>]*id="brief"/.test(html) && html.includes("data-lead-form"),
      "/book: the brief form is not on the page without a scheduler",
    );
    const text = visibleText(html);
    assertFalse(text.includes(BOOK_H1));
    assertFalse(text.includes("After the call"));
    assert(text.includes("hi@antonshubin.com"));
  } finally {
    await site.stop();
  }
});

Deno.test("?service= with a catalog slug prefills the brief, and any other value is never echoed", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    const slug = "codebase-health-audit";
    const known = await site.html(`/book?service=${slug}`);
    const about = `About: ${catalogItem(slug).shortTitle}`;
    assert(
      known.includes(`value="${about}`),
      `/book?service=${slug}: the brief is not prefilled with "${about}"`,
    );
    assert(known.includes(slug), "the slug is not passed to the form");

    const probe = "zz-not-a-service-7431";
    const unknown = await site.html(`/book?service=${probe}`);
    assertFalse(
      unknown.includes(probe),
      "an unknown ?service= value is echoed",
    );
    assertFalse(visibleText(unknown).includes("About: "));
  } finally {
    await site.stop();
  }
});

Deno.test("the booking page carries a ContactPage node, and every page a contactPoint on the Person", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: PLACEHOLDER_SCHEDULE_URL },
  });
  try {
    const nodes = (html: string) =>
      jsonLd(html).flatMap((
        d,
      ) => ((d as { "@graph"?: Record<string, unknown>[] })["@graph"] ?? []));
    const contact = nodes(await site.html("/book"));
    const page = contact.find((n) => n["@type"] === "ContactPage");
    assert(page, "/book: no ContactPage node");
    assertEquals(page["@id"], "https://antonshubin.com/book#webpage");
    assertEquals(page["about"], { "@id": "https://antonshubin.com/#person" });
    assertEquals(page["breadcrumb"], {
      "@id": "https://antonshubin.com/book#breadcrumb",
    });
    assertFalse(
      contact.some((n) =>
        ["ScheduleAction", "Review"].includes(String(n["@type"]))
      ),
    );

    const other = nodes(await site.html("/how-i-work"));
    assertFalse(other.some((n) => n["@type"] === "ContactPage"));
    const person = other.find((n) => n["@type"] === "Person");
    assertEquals(person?.["contactPoint"], {
      "@type": "ContactPoint",
      "contactType": "sales",
      "email": "hi@antonshubin.com",
      "url": "https://antonshubin.com/book",
      "availableLanguage": ["en", "ru"],
    });
  } finally {
    await site.stop();
  }
});
