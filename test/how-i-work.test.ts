// Guards for the How I work page (#275): its search structure, the timeline,
// the pricing card, the FAQ and the links in and out that the merged spec
// adopted. They read the built site through test/harness.ts; see AGENTS.md
// "Rendered-page tests". Assert structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { catalogItems, priceLabel } from "../lib/catalog.ts";
import { faqs, MAX_FAQS } from "../lib/faqs.ts";
import { HOW_I_WORK_TITLE, PRICING_RULE } from "../lib/how-i-work.ts";
import { promises } from "../lib/promises.ts";
import { repeatClientsLine } from "../lib/testimonials.ts";

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

/** The HTML of the first element that starts with `marker`, up to `end`. */
function slice(html: string, marker: string, end: string): string {
  const start = html.indexOf(marker);
  assert(start >= 0, `"${marker}" not found`);
  return html.slice(start, html.indexOf(end, start));
}

siteTest("how-i-work has one H1 and the title names the page", async (site) => {
  const html = await site.html("/how-i-work");
  assertEquals(count(html, /<h1[ >]/g), 1);
  const h1 = slice(html, "<h1", "</h1>");
  assert(visibleText(h1).includes("How I work"), h1);
  assert(html.includes(`<title>${HOW_I_WORK_TITLE}</title>`), "title");
  assert(!/How I deliver/i.test(visibleText(html)), "old name still shown");
});

siteTest(
  "how-i-work outlines Five promises, the promises as H3 and the sections as H2",
  async (site) => {
    const html = await site.html("/how-i-work");
    const main = html.slice(html.indexOf('id="main-content"'));
    const h2 = [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
      visibleText(m[1])
    );
    for (
      const name of [
        "Who this suits",
        "Five promises",
        "My AI-agent setup",
        "Frequently asked questions",
      ]
    ) {
      assert(h2.includes(name), `no H2 "${name}" in ${h2.join(" | ")}`);
    }
    const timeline = slice(html, 'data-promise-timeline="full"', "</ol>");
    assertEquals(count(timeline, /<h3[ >]/g), promises.length);
    assertEquals(count(timeline, /<h2[ >]/g), 0);
  },
);

siteTest(
  "how-i-work shows the promises as one timeline in engagement order, each linkable",
  async (site) => {
    const html = await site.html("/how-i-work");
    const timeline = slice(html, 'data-promise-timeline="full"', "</ol>");
    assertEquals(count(timeline, /<li /g), 5);
    let at = -1;
    for (const p of promises) {
      const i = timeline.indexOf(`id="${p.id}"`);
      assert(i > at, `${p.id} is missing or out of order`);
      at = i;
      assert(visibleText(timeline).includes(p.when), `no "${p.when}" label`);
      assert(visibleText(timeline).includes(p.why), `no reason for ${p.id}`);
    }
    // The timeline is vertical at every width here, and uses no accent colour.
    assert(timeline.includes('data-promise-layout="stack"'), "not stacked");
    assert(!/lg:grid-cols-5/.test(timeline), "five columns in a narrow column");
    assert(
      !/accent/.test(timeline.replace(/hover:text-accent/g, "")),
      "accent",
    );
    // Two promises lead to the catalog item they sell.
    assert(
      timeline.includes('href="/catalog/zero-to-production-saas-mvp"'),
      "mvp",
    );
    assert(
      timeline.includes('href="/catalog/cto-advisory-retainer"'),
      "ongoing",
    );
  },
);

siteTest(
  "how-i-work opens on a card with the pricing rule and every catalog price, before the promises",
  async (site) => {
    const html = await site.html("/how-i-work");
    const card = slice(html, '<aside aria-label="Pricing"', "</aside>");
    const text = visibleText(card);
    assert(text.includes(PRICING_RULE), "pricing rule missing from the card");
    assertEquals(count(card, /<li /g), catalogItems.length);
    for (const item of catalogItems) {
      assert(text.includes(priceLabel(item)), `no price for ${item.slug}`);
      assert(card.includes(`href="/catalog/${item.slug}"`), item.slug);
    }
    assert(
      html.indexOf('aria-label="Pricing"') <
        html.indexOf("data-promise-timeline"),
      "the card comes after the promises",
    );
    // The rule is said once on the page: the FAQ answer reads it from the same
    // constant, but no other block repeats it.
    assertEquals(count(html, /data-pricing-rule/g), 1);
  },
);

Deno.test(
  "how-i-work sends Book to /book and the brief to /book#brief, with no calendar on the page",
  async () => {
    // With a calendar URL set, a leftover embed would render: the assertion below can fail.
    const site = await startSite({
      env: { SCHEDULE_URL: "https://meet.example.com/book" },
    });
    try {
      const page = await site.html("/how-i-work");
      // The nav's own Book links are outside the page's content.
      const html = page.slice(page.indexOf('id="main-content"'));
      const book = [...html.matchAll(/<a [^>]*data-primary-book[^>]*>/g)].map((
        m,
      ) => m[0]);
      assertEquals(book.length, 2, "Book appears in the card and the band");
      for (const a of book) {
        assert(a.includes('href="/book"'), a);
        assert(!a.includes("_blank"), a);
      }
      assert(count(html, /href="\/book#brief"/g) >= 3, "brief links");
      assert(!/<iframe/.test(html), "an embedded calendar");
      assert(
        !/mig:height|MeetEmbed|meet-embed/i.test(html),
        "the scheduler facade",
      );
      assert(!html.includes("/#audit-form"), "the old form link");
    } finally {
      await site.stop();
    }
  },
);

siteTest(
  "how-i-work says who it suits, in the recorded words, with one proof line and its note",
  async (site) => {
    const html = await site.html("/how-i-work");
    const fit = slice(html, '<section aria-labelledby="hiw-fit"', "</section>");
    const text = visibleText(fit);
    for (const h of ["A good fit", "Not a fit yet"]) {
      assert(text.includes(h), h);
    }
    assert(/Capacitor/.test(text), "the mobile line");
    assert(text.includes(repeatClientsLine()), "repeat-clients line");
    assert(/100% Job Success/.test(text), "Job Success figure");
    assert(
      fit.includes('data-note-ref="upwork-profile"'),
      "note on the proof line",
    );
  },
);

siteTest(
  "how-i-work's AI-agent section names the setup, links the public rules repository and drops the vs cards",
  async (site) => {
    const html = await site.html("/how-i-work");
    const ai = slice(html, '<section aria-labelledby="hiw-ai"', "</section>");
    assert(ai.includes('href="https://github.com/spy4x/dotfiles"'), "dotfiles");
    assertEquals(count(ai, /<p[ >]/g), 1);
    const text = visibleText(ai);
    for (
      const w of ["Claude Code", "OpenCode", "DSH", "worktree", "reviewer"]
    ) {
      assert(text.includes(w), `AI section does not say "${w}"`);
    }
    const all = visibleText(html);
    assert(!/Vs vibe-coding|Vs code-first/i.test(all), "a vs card is back");
  },
);

siteTest(
  "how-i-work answers every question in the open, with an anchor, fit question last",
  async (site) => {
    const html = await site.html("/how-i-work");
    assert(faqs.length <= MAX_FAQS, `${faqs.length} questions`);
    assertEquals(count(html, /<details/g), 0, "answers are behind a click");
    for (const f of faqs) {
      assert(html.includes(`id="faq-${f.id}"`), `no anchor for ${f.id}`);
    }
    const positions = faqs.map((f) => html.indexOf(`id="faq-${f.id}"`));
    assertEquals([...positions].sort((a, b) => a - b), positions);
    assertEquals(faqs.at(-1)?.id, "not-a-good-fit");
    for (const id of ["who-does-the-work", "mobile", "ownership"]) {
      assert(faqs.some((f) => f.id === id), `no ${id} question`);
    }
  },
);

siteTest(
  "how-i-work's FAQPage joins the site graph and lists the same questions as the page",
  async (site) => {
    const html = await site.html("/how-i-work");
    const faq = jsonLd(html).find((d) =>
      (d as { "@type"?: string })["@type"] === "FAQPage"
    ) as {
      "@id": string;
      isPartOf: { "@id": string };
      mainEntity: { name: string }[];
    };
    assert(faq, "no FAQPage");
    assertEquals(faq["@id"], "https://antonshubin.com/how-i-work#faq");
    assertEquals(faq.isPartOf["@id"], "https://antonshubin.com/#website");
    assertEquals(faq.mainEntity.map((q) => q.name), faqs.map((f) => f.q));
  },
);

siteTest(
  "how-i-work's own share image and both llms files carry the new page",
  async (site) => {
    const html = await site.html("/how-i-work");
    assert(
      html.includes('content="https://antonshubin.com/img/og/how-i-work.png"'),
      "og:image",
    );
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      const res = await site.get(path);
      const text = await res.text();
      assert(/\/how-i-work\)? — /.test(text), `${path}: How I work line`);
      assert(
        !text.includes("How I Work"),
        `${path}: link text is "How I Work"`,
      );
      assert(
        !/Five promises, pricing, and FAQ/.test(text),
        `${path}: old line`,
      );
    }
    const full = await (await site.get("/llms-full.txt")).text();
    for (const f of faqs) assert(full.includes(`### ${f.q}`), f.q);
    assert(full.includes("Frequently Asked Questions"), "no FAQ section");
  },
);

siteTest(
  "how-i-work has a closing band with Book, the brief and Services",
  async (site) => {
    const html = await site.html("/how-i-work");
    const band = slice(html, "<section data-closing-band", "</section>");
    assert(band.includes('href="/book"'), "Book");
    assert(band.includes('href="/book#brief"'), "brief");
    assert(band.includes('href="/catalog"'), "Services");
    assertEquals(count(band, /<ul/g), 0, "the band repeats promises");
  },
);

siteTest(
  "the home page's promise timeline keeps its five columns and gains no link from how-i-work's options",
  async (site) => {
    const html = await site.html("/");
    const timeline = slice(html, 'data-promise-timeline="compact"', "</ol>");
    assert(
      timeline.includes('data-promise-layout="row"'),
      "not the row layout",
    );
    assert(/lg:grid-cols-5/.test(timeline), "five columns lost");
    assert(
      !timeline.includes("how-i-work-promise-"),
      "a how-i-work link leaked",
    );
  },
);

Deno.test("a closing band with no bookHref sends Book to /book in the same tab", async () => {
  const url = "https://meet.example.com/book";
  const site = await startSite({ env: { SCHEDULE_URL: url } });
  try {
    const html = await site.html("/work");
    const band = slice(html, "<section data-closing-band", "</section>");
    const book = band.match(/<a [^>]*data-primary-book[^>]*>/)?.[0] ?? "";
    assert(book.includes('href="/book"'), `Book does not go to /book: ${book}`);
    assert(!book.includes("target="), `Book opens a new tab: ${book}`);
  } finally {
    await site.stop();
  }
});
