// #232: /projects splits client work into Highlights and Archive, the home
// page's work cards take the first three highlights, and every card or row
// shows its period. Also guards what #231 (#239) added without a test: the
// margin notes on the FoodRazor, Corecircle and Sogroya pages. Checked on the
// built pages, since the wiring lives in the route files.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { visibleText } from "./html.ts";
import {
  archiveProjects,
  formatPeriod,
  highlightSlugs,
  projects,
} from "../lib/data.ts";
import { projectTestimonials, repeatClientsLine } from "../lib/testimonials.ts";

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

/** The HTML of one `data-projects-section` on /projects; throws when it is missing. */
function section(html: string, name: string): string {
  const start = html.indexOf(`data-projects-section="${name}"`);
  assert(start > 0, `/projects has no ${name} section`);
  return html.slice(start, html.indexOf("</section>", start));
}

/** The values of one data attribute, in document order. */
function attrValues(html: string, attr: string): string[] {
  return [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))].map((m) =>
    m[1]
  );
}

/** Each element marked with `attr`, from its marker up to the next one or the end. */
function chunks(html: string, attr: string): Map<string, string> {
  const parts = html.split(`${attr}="`).slice(1);
  return new Map(parts.map((p) => [p.slice(0, p.indexOf('"')), p]));
}

siteTest(
  "/projects lists every client project once, in Highlights or Archive, and no tool",
  async (site) => {
    const html = await site.html("/projects");
    const highlights = attrValues(
      section(html, "highlights"),
      "data-highlight",
    );
    const archive = attrValues(section(html, "archive"), "data-archive-row");
    assertEquals(highlights, highlightSlugs);
    assertEquals(archive, archiveProjects().map((p) => p.slug));
    for (const p of projects.freelance) {
      const seen = [...highlights, ...archive].filter((s) => s === p.slug);
      assertEquals(seen.length, 1, `${p.slug} appears ${seen.length} times`);
    }
    for (const p of projects.my) {
      if (!p.slug) continue;
      assert(
        !highlights.includes(p.slug) && !archive.includes(p.slug),
        `tool ${p.slug} is listed as client work`,
      );
    }
  },
);

siteTest(
  "every /projects highlight card and archive row shows its project's period",
  async (site) => {
    const html = await site.html("/projects");
    const cards = new Map([
      ...chunks(section(html, "highlights"), "data-highlight"),
      ...chunks(section(html, "archive"), "data-archive-row"),
    ]);
    for (const p of projects.freelance) {
      const chunk = cards.get(p.slug!);
      assert(chunk, `/projects has no card or row for ${p.slug}`);
      assert(
        /data-project-period/.test(chunk) &&
          visibleText(chunk).includes(formatPeriod(p.period!)),
        `${p.slug}'s card or row does not show ${formatPeriod(p.period!)}`,
      );
    }
  },
);

siteTest(
  "each archive row shows its role, its first review excerpt with its source link, and links its page",
  async (site) => {
    const rows = chunks(
      section(await site.html("/projects"), "archive"),
      "data-archive-row",
    );
    let excerpts = 0;
    for (const p of archiveProjects()) {
      const row = rows.get(p.slug!)!;
      const text = visibleText(row);
      assert(text.includes(p.role!), `${p.slug}'s row lacks its role`);
      assert(
        row.includes(`href="/projects/${p.slug}"`),
        `${p.slug}'s row does not link its page`,
      );
      const review = projectTestimonials(p.slug!)[0];
      if (!review) continue;
      excerpts++;
      assert(
        text.includes(review.excerpt),
        `${p.slug}'s row lacks the excerpt of ${review.id}`,
      );
      assert(
        review.sourceHref && row.includes(`href="${review.sourceHref}"`),
        `${p.slug}'s row does not link the source of ${review.id}`,
      );
      assert(
        !p.madeForName || row.includes(`${p.madeForName}`),
        `${p.slug}'s row does not name its reviewer ${p.madeForName}`,
      );
    }
    assert(excerpts > 0, "no archive row has a review — checked nothing");
  },
);

siteTest(
  "Sajari's archive row links Algolia's acquisition as the company's outcome",
  async (site) => {
    const rows = chunks(
      section(await site.html("/projects"), "archive"),
      "data-archive-row",
    );
    const row = rows.get("sajari")!;
    assert(row.includes("data-company-outcome"), "no company outcome");
    assert(
      row.includes(
        'href="https://www.algolia.com/about/news/algolia-disrupts-market-with-search-io-acquisition-ushering-in-a-new-era-of-search-and-discovery"',
      ),
      "Sajari's row does not link the acquisition news",
    );
    assert(
      visibleText(row).includes(
        "The company: Later renamed Search.io and acquired by Algolia in 2022",
      ),
      "Sajari's outcome is not worded as the company's",
    );
  },
);

siteTest("/projects shows the repeat-clients line", async (site) => {
  const html = await site.html("/projects");
  const start = html.indexOf("data-repeat-clients");
  assert(start > 0, "no repeat-clients line");
  assert(
    visibleText(html.slice(start, html.indexOf("</p>", start))).includes(
      repeatClientsLine(),
    ),
    "the repeat-clients line does not read as derived",
  );
});

siteTest(
  "the home work cards are the first three highlights, each with its period",
  async (site) => {
    const html = await site.html("/");
    const cards = chunks(html, "data-e2e");
    const slugs = [...cards.keys()]
      .filter((k) => k.startsWith("home-view-"))
      .map((k) => k.slice("home-view-".length));
    assertEquals(slugs, highlightSlugs.slice(0, 3));
    for (const slug of slugs) {
      const p = projects.freelance.find((x) => x.slug === slug)!;
      const card = cards.get(`home-view-${slug}`)!;
      assert(
        /data-project-period/.test(card) &&
          visibleText(card.slice(0, card.indexOf("</a>"))).includes(
            formatPeriod(p.period!),
          ),
        `home card ${slug} does not show ${formatPeriod(p.period!)}`,
      );
    }
  },
);

siteTest(
  "the FoodRazor, Corecircle and Sogroya pages carry their margin notes",
  async (site) => {
    const expected: Record<string, string> = {
      foodrazor: "foodrazor-acquired",
      corecircle: "corecircle-users",
      sogroya: "sogroya-live",
    };
    for (const [slug, id] of Object.entries(expected)) {
      const html = await site.html(`/projects/${slug}`);
      assert(
        html.includes(`data-note-ref="${id}"`),
        `/projects/${slug} lacks margin note ${id}`,
      );
    }
  },
);

/** The `class` of the first `<img>` whose `src` starts with `src`, or undefined when none does. */
function imgClass(html: string, src: string): string | undefined {
  const at = html.indexOf(`src="${src}`);
  if (at < 0) return undefined;
  const tag = html.slice(html.lastIndexOf("<img", at), html.indexOf(">", at));
  return tag.match(/class="([^"]*)"/)?.[1] ?? "";
}

siteTest(
  "a logo drawn for a light background sits on the light plate, and no other logo does",
  async (site) => {
    const all = [...projects.my, ...projects.freelance];
    assertEquals(
      all.filter((p) => p.logoPlate).map((p) => p.slug).sort(),
      ["roley", "sogroya"],
    );
    const list = await site.html("/projects");
    for (const p of all) {
      if (!p.logoImageURL) continue;
      const pages = [["/projects", list]];
      if (p.slug) {
        pages.push([
          `/projects/${p.slug}`,
          await site.html(`/projects/${p.slug}`),
        ]);
      }
      for (const [path, html] of pages) {
        const cls = imgClass(html, p.logoImageURL);
        // Archive rows on /projects show no logo; a project page always does.
        if (cls === undefined && path === "/projects") continue;
        assert(cls !== undefined, `${p.slug} page renders no logo`);
        const onPlate = cls.split(" ").includes("bg-parchment");
        assertEquals(
          onPlate,
          !!p.logoPlate,
          `${p.slug ?? p.title} logo on ${path}`,
        );
      }
    }
    // Roley is a Highlight, so its /projects card must have been checked too.
    assert(
      imgClass(list, "/img/projects/roley/logo.svg")?.includes("bg-parchment"),
    );
  },
);
