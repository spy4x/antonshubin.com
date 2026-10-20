// Guards for the "Why not just AI?" page (#486): the answer in the first
// screen, the comparison table, the questions that are also the FAQPage
// JSON-LD, and the links that lead to the page. They read the built site
// through test/harness.ts; see docs/testing.md "Rendered-page tests". Assert
// structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, pageBody, visibleText } from "./html.ts";
import {
  COMPARISON_PRODUCTS,
  comparisonRows,
  processSteps,
  WEEKLY_AUDIT,
  WHY_NOT_JUST_AI_H1,
  WHY_NOT_JUST_AI_LEAD,
  WHY_NOT_JUST_AI_PATH,
  WHY_NOT_JUST_AI_TITLE,
  whyNotJustAiFaqs,
} from "../lib/why-not-just-ai.ts";
import { BOOK_LABEL } from "../lib/nav.ts";
import { promise, promises } from "../lib/promises.ts";

const PAGE = WHY_NOT_JUST_AI_PATH;
const URL_OF_PAGE = `https://antonshubin.com${PAGE}`;

/** Registers a test that gets a running copy of the built site and always stops it. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
    }
  });
}

/** The HTML from the first `marker` up to the first `end` after it. */
function slice(html: string, marker: string, end: string): string {
  const start = html.indexOf(marker);
  assert(start >= 0, `"${marker}" not found`);
  return html.slice(start, html.indexOf(end, start));
}

/** Every node of every JSON-LD block, `@graph` members included. */
function nodes(html: string): Record<string, unknown>[] {
  return jsonLd(html).flatMap((block) => {
    const b = block as Record<string, unknown>;
    return Array.isArray(b["@graph"])
      ? b["@graph"] as Record<string, unknown>[]
      : [b];
  });
}

siteTest(
  "why-not-just-ai has one H1 asking the question, and the title names the page",
  async (site) => {
    const html = await site.html(PAGE);
    assertEquals(count(html, /<h1[ >]/g), 1);
    assertEquals(visibleText(slice(html, "<h1", "</h1>")), WHY_NOT_JUST_AI_H1);
    assert(html.includes(`<title>${WHY_NOT_JUST_AI_TITLE}</title>`), "title");
  },
);

siteTest(
  "why-not-just-ai answers in the first screen: the lead after the H1, then the card with Book, before the main column",
  async (site) => {
    const body = pageBody(await site.html(PAGE));
    const h1 = body.indexOf("<h1");
    const lead = body.indexOf("data-lead");
    const card = body.indexOf('aria-label="The short answer"');
    const first = body.indexOf("data-enough");
    assert(h1 >= 0 && lead > h1, "the lead does not follow the H1");
    assertEquals(
      visibleText(slice(body, "data-lead", "</p>").replace(/^[^>]*>/, "")),
      WHY_NOT_JUST_AI_LEAD,
    );
    assert(card > lead, "the card does not follow the lead");
    assert(first > card, "the card is not first at 390px");
    const aside = slice(body, 'aria-label="The short answer"', "</aside>");
    const book = aside.match(/<a\b[^>]*data-primary-book[^>]*>([\s\S]*?)<\/a>/);
    assert(book, "no Book in the card");
    assert(/href="\/book"/.test(book[0]), book[0]);
    assertEquals(visibleText(book[1]), BOOK_LABEL);
  },
);

siteTest(
  "why-not-just-ai compares the two in a real table: a column per product, a row per capability",
  async (site) => {
    const table = slice(await site.html(PAGE), "<table", "</table>");
    const cols = [
      ...table.matchAll(/<th[^>]*scope="col"[^>]*>([\s\S]*?)<\/th>/g),
    ]
      .map((m) => visibleText(m[1]));
    assertEquals(cols.slice(1), [...COMPARISON_PRODUCTS]);
    const rows = [
      ...table.matchAll(/<th[^>]*scope="row"[^>]*>([\s\S]*?)<\/th>/g),
    ]
      .map((m) => visibleText(m[1]));
    const expected = comparisonRows();
    assertEquals(rows.length, expected.length);
    for (const [i, r] of expected.entries()) {
      assert(
        rows[i].startsWith(r.capability),
        `${rows[i]} is not ${r.capability}`,
      );
    }
    // The honest row: the subscription costs less.
    const cost = slice(table, ">Costs less", "</tr>");
    assertEquals(
      [...cost.matchAll(/data-value="(\w+)"/g)].map((m) => m[1]),
      ["no", "yes"],
    );
  },
);

siteTest(
  "why-not-just-ai shows the same four questions and answers its FAQPage JSON-LD lists, who pays for the AI tools among them",
  async (site) => {
    const html = await site.html(PAGE);
    const faqs = whyNotJustAiFaqs();
    assertEquals(faqs.length, 4);
    assert(
      faqs.some((f) => f.q === "Who pays for the AI tools?"),
      "no question on who pays for the AI tools",
    );
    const section = slice(html, "data-faq-section", "</section>");
    const shown = [...section.matchAll(
      /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g,
    )].map((m) => ({ q: visibleText(m[1]), a: visibleText(m[2]) }));
    assertEquals(shown, faqs.map(({ q, a }) => ({ q, a })));
    const faq = nodes(html).find((n) => n["@type"] === "FAQPage") as {
      "@id": string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    assert(faq, "no FAQPage");
    assertEquals(faq["@id"], `${URL_OF_PAGE}#faq`);
    assertEquals(
      faq.mainEntity.map((q) => ({ q: q.name, a: q.acceptedAnswer.text })),
      shown,
    );
    const page = nodes(html).find((n) => n["@type"] === "WebPage") as {
      about: { "@id": string };
    };
    assertEquals(page?.about["@id"], "https://antonshubin.com/#person");
  },
);

siteTest(
  "why-not-just-ai carries no Review or AggregateRating markup",
  async (site) => {
    const html = await site.html(PAGE);
    const text = JSON.stringify(jsonLd(html));
    assert(!/"(Review|AggregateRating)"/.test(text), text);
    assert(!/"(review|aggregateRating)"\s*:/.test(text), text);
  },
);

siteTest(
  "why-not-just-ai is linked from the footer, How I work, the MVP page, both AI posts, both llms files and the sitemap",
  async (site) => {
    const link = `href="${PAGE}"`;
    const footer = slice(await site.html("/"), "<footer", "</footer>");
    assert(footer.includes(link), "footer");
    const hiw = await site.html("/how-i-work");
    assert(
      slice(hiw, '<section aria-labelledby="hiw-ai"', "</section>")
        .includes(link),
      "/how-i-work's AI paragraph",
    );
    assert(
      // The page alone: the footer links every page to it.
      pageBody(await site.html("/catalog/zero-to-production-saas-mvp"))
        .includes(link),
      "the MVP page",
    );
    for (
      const post of [
        "/blog/claude-code-vs-minimax-m3-30-days",
        "/blog/opus-5-5-vs-sonnet-5-agent-costs",
      ]
    ) {
      assert(pageBody(await site.html(post)).includes(link), post);
    }
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      assert((await site.html(path)).includes(URL_OF_PAGE), path);
    }
    assert(
      (await site.html("/sitemap.xml")).includes(`<loc>${URL_OF_PAGE}</loc>`),
      "sitemap",
    );
  },
);

siteTest(
  "claims only what its linked post and the project data say",
  async (site) => {
    const text = visibleText(pageBody(await site.html(PAGE)));
    // The linked post says a reviewer agent checks every pull request, not Anton.
    assert(!/every change myself/i.test(text), "personal review claim");
    assert(!/most of the jump/i.test(text), "overclaimed cause of the jump");
    // Only SmartLite is still maintained (lib/data.ts); the others were acquired.
    assert(
      !/still running|still runs years/i.test(text),
      "still-running claim",
    );
    for (const word of ["does it", "only part of it", "doesn't"]) {
      assert(text.includes(word), `legend word "${word}"`);
    }
  },
);

siteTest(
  "why-not-just-ai and the AI-provider answer on How I work describe the same process: a reviewer agent, a weekly audit, no personal review of every change",
  async (site) => {
    const page = visibleText(pageBody(await site.html(PAGE)));
    const howIWork = await site.html("/how-i-work");
    const answer = visibleText(
      slice(howIWork, 'id="faq-ai-and-your-code"', "</p>"),
    );
    for (const [name, text] of [["the page", page], ["the answer", answer]]) {
      assert(
        text.includes("separate reviewer agent"),
        `${name}: no reviewer agent`,
      );
      assert(text.includes(WEEKLY_AUDIT), `${name}: no weekly audit`);
      assert(
        !/\bI (read|test|review)\b[^.]*every change/i.test(text),
        `${name} says Anton reviews every change himself`,
      );
    }
    // The audit is a step of the process, before the weekly software.
    const steps = processSteps();
    const weekly = steps.indexOf(
      steps.find((s) => promise("weekly-software").desc.startsWith(s))!,
    );
    assert(weekly > 0, "no weekly software step");
    assertEquals(steps.indexOf(WEEKLY_AUDIT), weekly - 1);
  },
);

siteTest(
  "why-not-just-ai says each promise's full text at most once, so the band does not repeat the last answer",
  async (site) => {
    const text = visibleText(pageBody(await site.html(PAGE)));
    for (const p of promises) {
      assert(
        text.split(p.desc).length - 1 <= 1,
        `"${p.title}" is said more than once`,
      );
    }
  },
);

siteTest(
  "why-not-just-ai names no refund period but the five-day promise",
  async (site) => {
    const text = visibleText(pageBody(await site.html(PAGE)));
    const refund = promise("refund");
    const days =
      /\b(\d+|one|two|three|four|five|six|seven|ten|fourteen|thirty)[- ]days?\b/gi;
    const sentences = text.split(/(?<=[.!?])\s+/)
      .filter((s) => /refund/i.test(s) && s.match(days) !== null);
    assert(sentences.length > 0, "the page names no refund period at all");
    for (const s of sentences) {
      for (const m of s.matchAll(days)) {
        assert(
          /^(five|5)$/i.test(m[1]),
          `"${s}" names a refund period other than ${refund.title}`,
        );
      }
    }
  },
);

for (const tz of ["Pacific/Honolulu", "Asia/Tokyo"]) {
  Deno.test(
    `why-not-just-ai shows the table's checked date as October 20, 2026 on a server in ${tz}`,
    async () => {
      const site = await startSite({ env: { TZ: tz } });
      try {
        const table = visibleText(
          slice(await site.html(PAGE), "<table", "</figure>"),
        );
        assert(
          table.includes("Checked on October 20, 2026."),
          `no checked date of October 20, 2026 in: ${table}`,
        );
      } finally {
        await site.stop();
      }
    },
  );
}
