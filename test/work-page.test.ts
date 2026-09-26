// #246: the project page as a case study. Checked on the built pages, since
// the wiring lives in routes/projects/[slug].tsx and its components: a real
// <h1>, the lead line, the fact card, one Book in the card and one in the
// closing band, the catalog link, the meta description, the JSON-LD fields
// and the one high-priority hero image.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { formatPeriod, projects } from "../lib/data.ts";
import { catalogItems } from "../lib/catalog.ts";
import { firstSentence } from "../lib/llms.ts";

/** Registers a test that gets a running copy of the built site, served with a booking URL. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const previous = Deno.env.get("SCHEDULE_URL");
    Deno.env.set("SCHEDULE_URL", "https://meet.example.com/book");
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
      if (previous === undefined) Deno.env.delete("SCHEDULE_URL");
      else Deno.env.set("SCHEDULE_URL", previous);
    }
  });
}

const clients = projects.freelance;

/** The HTML from the element carrying `marker` to the end of its closing `tag`. */
function region(html: string, marker: string, tag: string): string {
  const start = html.indexOf(marker);
  assert(start > 0, `no ${marker}`);
  return html.slice(start, html.indexOf(`</${tag}>`, start));
}

/** The raw `content` attribute of `<meta name="description">`, entities still encoded. */
function metaDescription(html: string): string {
  const m = html.match(/<meta name="description" content="([^"]*)"/);
  assert(m, "no meta description");
  return m[1];
}

siteTest(
  "every client project page has one real <h1> holding its title",
  async (site) => {
    assert(clients.length > 0);
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
      assertEquals(h1s.length, 1, `/projects/${p.slug} has ${h1s.length} <h1>`);
      assertEquals(visibleText(h1s[0][1]), p.title, p.slug);
      assert(!/role="heading"/.test(html), `${p.slug} fakes a heading`);
    }
  },
);

siteTest(
  "the lead line is the outcome, or the description's first sentence",
  async (site) => {
    let fallback = 0;
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      const lead = visibleText(region(html, "data-project-lead", "p"));
      const expected = p.outcome ??
        firstSentence(p.description.replace(/\s+/g, " "));
      if (!p.outcome) fallback++;
      assert(lead.endsWith(expected), `${p.slug} lead: ${lead}`);
    }
    assert(fallback > 0, "no project without an outcome was checked");
  },
);

siteTest(
  "the fact card shows client, role, period, status and stack",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      const card = region(html, "data-project-facts", "aside");
      const text = visibleText(card);
      assert(/data-project-period/.test(card), `${p.slug}: no period marker`);
      assert(
        text.includes(`Period ${formatPeriod(p.period!)}`),
        `${p.slug}: no period`,
      );
      if (p.madeForName) {
        assert(
          text.includes(`Client ${p.madeForName}`),
          `${p.slug}: no client`,
        );
      }
      assert(text.includes(`Role ${p.role}`), `${p.slug}: no role`);
      if (p.externalURLLabel) {
        assert(!text.includes("Status"), `${p.slug}: a document has a status`);
      } else if (p.externalURL) {
        const word = p.externalURLDead ? "Offline" : "Live";
        assert(text.includes(`Status ${word}`), `${p.slug}: not ${word}`);
      }
      if (p.externalURLDead) {
        assert(
          !card.includes(`href="${p.externalURL}"`),
          `${p.slug}: links its offline site`,
        );
      }
      for (const tag of p.tags ?? []) {
        assert(text.includes(tag), `${p.slug}: stack lacks ${tag}`);
      }
    }
  },
);

siteTest(
  "the code review's live link reads as the audit report",
  async (site) => {
    const html = await site.html("/projects/code-review");
    const card = visibleText(region(html, "data-project-facts", "aside"));
    assert(card.includes("Read the audit report"), card);
  },
);

siteTest(
  "Book shows once in the fact card and once in the closing band",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      // The page body only: the nav's own Book (#185) sits before <main>.
      const main = html.slice(html.indexOf(`id="main-content"`));
      assertEquals(count(main, /data-primary-book/), 2, p.slug);
      const card = region(html, "data-project-facts", "aside");
      const band = region(html, "data-closing-band", "section");
      assertEquals(count(card, /data-primary-book/), 1, `${p.slug} card`);
      assertEquals(count(band, /data-primary-book/), 1, `${p.slug} band`);
      assert(
        card.includes(`data-umami-event="project-cta-${p.slug}-schedule-card"`),
      );
      assert(
        band.includes(
          `data-umami-event="project-cta-${p.slug}-schedule-bottom"`,
        ),
      );
    }
  },
);

siteTest(
  "the catalog link names a real catalog item in the card and the band, and is absent without a catalogSlug",
  async (site) => {
    const slugs = new Set(catalogItems.map((i) => i.slug));
    let absent = 0;
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      if (!p.catalogSlug) {
        absent++;
        assert(
          !html.includes("data-catalog-link"),
          `${p.slug}: a catalog link`,
        );
        continue;
      }
      for (
        const [where, tag, place] of [
          ["data-project-facts", "aside", "card"],
          ["data-closing-band", "section", "bottom"],
        ]
      ) {
        const part = region(html, where, tag);
        const m = part.match(/href="\/catalog\/([^"]+)"[^>]*data-catalog-link/);
        assert(m, `${p.slug} ${place}: no catalog link`);
        assertEquals(m[1], p.catalogSlug, `${p.slug} ${place}`);
        assert(
          slugs.has(m[1]),
          `${p.slug} ${place}: ${m[1]} is not in the catalog`,
        );
        const res = await site.get(`/catalog/${m[1]}`);
        await res.body?.cancel();
        assertEquals(res.status, 200, `/catalog/${m[1]}`);
      }
    }
    assert(absent > 0, "no project without a catalogSlug was checked");
  },
);

siteTest(
  "a project page's meta description is one line of at most 160 characters",
  async (site) => {
    for (const p of [...projects.my, ...clients].filter((x) => x.slug)) {
      const raw = metaDescription(await site.html(`/projects/${p.slug}`));
      assert(!/[\n\r]/.test(raw), `${p.slug}: a newline`);
      const description = visibleText(raw);
      assert(description.length > 0, `${p.slug}: empty description`);
      assert(
        description.length <= 160,
        `${p.slug}: ${description.length} characters`,
      );
    }
  },
);

siteTest(
  "a project page's JSON-LD has temporalCoverage and isPartOf, and no review markup",
  async (site) => {
    const expected: Record<string, string> = {
      smartlite: "2024/..",
      foodrazor: "2018/2019",
      corecircle: "2021",
    };
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      const node = jsonLd(html).find((d) =>
        (d as { "@id"?: string })["@id"]?.endsWith("#project")
      ) as Record<string, unknown> | undefined;
      assert(node, `${p.slug}: no project node`);
      assert(node.temporalCoverage, `${p.slug}: no temporalCoverage`);
      if (expected[p.slug!]) {
        assertEquals(node.temporalCoverage, expected[p.slug!], p.slug);
      }
      assertEquals(node.isPartOf, {
        "@id": "https://antonshubin.com/#website",
      });
      assertEquals(node.creator, { "@id": "https://antonshubin.com/#person" });
      assert(typeof node.abstract === "string" && node.abstract.length > 0);
      assert(!/"Review"|"AggregateRating"|aggregateRating/.test(html), p.slug);
      if (p.screenshotURLs?.length) {
        assert(
          (node.image as string[])[0].endsWith(
            `/${p.slug}/${p.screenshotURLs[0]}`,
          ),
          `${p.slug}: the hero is not the first image`,
        );
      }
    }
  },
);

siteTest(
  "only the hero screenshot loads eagerly with high priority",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      assertEquals(count(html, /fetchpriority="high"/), 1, p.slug);
      const tag = html.match(/<img\b[^>]*fetchpriority="high"[^>]*>/)![0];
      assert(tag.includes(`/${p.slug}/${p.screenshotURLs![0]}`), tag);
      assert(/loading="eager"/.test(tag), `${p.slug}: hero is not eager`);
      const images = count(
        html,
        /<img\b[^>]*src="\/img\/projects\/[^"]+\/(?!logo)/,
      );
      const lazy = count(
        html,
        /<img\b[^>]*src="\/img\/projects\/[^"]+\/(?!logo)[^"]*"[^>]*loading="lazy"/,
      );
      assertEquals(
        lazy,
        images - 1,
        `${p.slug}: not every other screenshot is lazy`,
      );
    }
  },
);

siteTest(
  "More work shows three other client projects with their periods",
  async (site) => {
    for (const p of clients) {
      const html = await site.html(`/projects/${p.slug}`);
      const cards = [...html.matchAll(/data-more-work="([^"]+)"/g)].map((m) =>
        m[1]
      );
      assertEquals(cards.length, 3, p.slug);
      assert(!cards.includes(p.slug!), `${p.slug} lists itself`);
    }
  },
);
