// #232: /work splits client work into Highlights and Archive, the home
// page's work cards take the first three highlights, and every card or row
// shows its period. #270 rebuilt the page from four reviews: one <h1>, the
// title as each project's one link, outcome and review on the cards, the
// status and "Hired again" marks, a dated archive, the ItemList JSON-LD, one
// Book in the closing band, and lazy card images. Also guards what #231 (#239) added without a test: the
// margin notes on the FoodRazor, Corecircle and Sogroya pages. Checked on the
// built pages, since the wiring lives in the route files.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { ROLE } from "../lib/head.ts";
import { projectLead } from "../lib/llms.ts";
import { promise } from "../lib/promises.ts";
import {
  archiveProjects,
  formatPeriod,
  highlightProjects,
  highlightSlugs,
  projects,
} from "../lib/data.ts";
import { tools } from "../lib/tools.ts";
import {
  projectTestimonials,
  repeatClients,
  repeatClientsLine,
} from "../lib/testimonials.ts";

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

/** The HTML of one `data-projects-section` on /work; throws when it is missing. */
function section(html: string, name: string): string {
  const start = html.indexOf(`data-projects-section="${name}"`);
  assert(start > 0, `/work has no ${name} section`);
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
  "/work lists every client project once, in Highlights or Archive, and no tool",
  async (site) => {
    const html = await site.html("/work");
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
    for (const t of tools) {
      assert(
        !highlights.includes(t.slug) && !archive.includes(t.slug),
        `tool ${t.slug} is listed as client work`,
      );
    }
  },
);

siteTest(
  "/work links no tool page and no channel, only client work",
  async (site) => {
    const html = await site.html("/work");
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    assert(main.length > 0, "/work has no <main>");
    for (const t of tools) {
      assert(
        !main.includes(`href="/work/${t.slug}"`) &&
          !main.includes(`href="/tools/${t.slug}"`),
        `/work links tool page ${t.slug}`,
      );
    }
    for (const p of projects.my) {
      if (p.externalURL) {
        assert(
          !main.includes(`href="${p.externalURL}"`),
          `/work links ${p.title} (${p.externalURL})`,
        );
      }
    }
  },
);

siteTest(
  "every /work highlight card and archive row shows its project's period",
  async (site) => {
    const html = await site.html("/work");
    const cards = new Map([
      ...chunks(section(html, "highlights"), "data-highlight"),
      ...chunks(section(html, "archive"), "data-archive-row"),
    ]);
    for (const p of projects.freelance) {
      const chunk = cards.get(p.slug!);
      assert(chunk, `/work has no card or row for ${p.slug}`);
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
      section(await site.html("/work"), "archive"),
      "data-archive-row",
    );
    let excerpts = 0;
    for (const p of archiveProjects()) {
      const row = rows.get(p.slug!)!;
      const text = visibleText(row);
      assert(text.includes(p.role!), `${p.slug}'s row lacks its role`);
      assert(
        row.includes(`href="/work/${p.slug}"`),
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
      section(await site.html("/work"), "archive"),
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

siteTest(
  "/work leads with the repeat-clients line and links each project it names",
  async (site) => {
    const html = await site.html("/work");
    const start = html.indexOf("data-repeat-clients");
    assert(start > 0, "no repeat-clients line");
    const line = html.slice(
      html.indexOf(">", start) + 1,
      html.indexOf("</p>", start),
    );
    assertEquals(
      line.replace(/<[^>]+>/g, ""),
      repeatClientsLine(),
      "the repeat-clients line does not read as derived",
    );
    const r = repeatClients();
    const named = [
      ...r.rehiredOnSameProject,
      ...r.followOn.flatMap((x) => [x.from, x.to]),
    ];
    assert(named.length > 0, "the line names no project — checked nothing");
    for (const p of named) {
      const name = p.title.split(" — ")[0];
      assert(
        line.includes(`href="/work/${p.slug}"`) &&
          new RegExp(`<a href="/work/${p.slug}"[^>]*>${name}</a>`).test(line),
        `${name} in the repeat-clients line does not link /work/${p.slug}`,
      );
    }
  },
);

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
      const html = await site.html(`/work/${slug}`);
      assert(
        html.includes(`data-note-ref="${id}"`),
        `/work/${slug} lacks margin note ${id}`,
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
    const list = await site.html("/work");
    for (const p of all) {
      if (!p.logoImageURL) continue;
      const pages = [["/work", list]];
      if (p.slug) {
        pages.push([
          `/work/${p.slug}`,
          await site.html(`/work/${p.slug}`),
        ]);
      }
      for (const [path, html] of pages) {
        const cls = imgClass(html, p.logoImageURL);
        // Archive rows on /work show no logo; a project page always does.
        if (cls === undefined && path === "/work") continue;
        assert(cls !== undefined, `${p.slug} page renders no logo`);
        const onPlate = cls.split(" ").includes("bg-parchment");
        assertEquals(
          onPlate,
          !!p.logoPlate,
          `${p.slug ?? p.title} logo on ${path}`,
        );
      }
    }
    // Roley is a Highlight, so its /work card must have been checked too.
    assert(
      imgClass(list, "/img/projects/roley/logo.svg")?.includes("bg-parchment"),
    );
  },
);

/** The page's `<main>`, where the nav's own Book (#185) is not. */
function main(html: string): string {
  const start = html.indexOf(`id="main-content"`);
  assert(start > 0, "/work has no main-content");
  return html.slice(start, html.indexOf("</main>", start));
}

/** The client projects in the order /work shows them: highlights, then the archive. */
const pageOrder =
  () => [...highlightSlugs, ...archiveProjects().map((p) => p.slug!)];

siteTest(
  "/work has one <h1>, Client work, and a scope line counted from the data",
  async (site) => {
    const html = await site.html("/work");
    assertEquals(count(html, /<h1[\s>]/g), 1);
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1];
    assertEquals(visibleText(h1), "Client work");
    const from = Math.min(...projects.freelance.map((p) => p.period!.from));
    const ongoing = projects.freelance.some((p) => p.period!.ongoing);
    assert(ongoing, "no ongoing client project: the line would not say now");
    const start = html.indexOf("data-work-scope");
    assert(start > 0, "no scope line");
    assertEquals(
      visibleText(
        html.slice(html.indexOf(">", start) + 1, html.indexOf("</p>", start)),
      ),
      `${ROLE} · ${projects.freelance.length} client projects, ${from}–now`,
    );
  },
);

siteTest(
  "each /work project's one link is its title, and no View details link is left",
  async (site) => {
    const html = await site.html("/work");
    const body = main(html);
    assert(!visibleText(body).includes("View details"), "a View details link");
    const links = [
      ...body.matchAll(
        /<a href="\/work\/([^"]+)"[^>]*data-work-link[^>]*>([\s\S]*?)<\/a>/g,
      ),
    ];
    assertEquals(links.map((m) => m[1]), pageOrder());
    for (const [, slug, text] of links) {
      const p = projects.freelance.find((x) => x.slug === slug)!;
      assertEquals(visibleText(text), p.title, `${slug}'s link text`);
    }
    const cards = chunks(section(html, "highlights"), "data-highlight");
    for (const [slug, card] of cards) {
      assertEquals(
        count(card, new RegExp(`href="/work/${slug}"`, "g")),
        1,
        `${slug}'s card links its page more than once`,
      );
    }
  },
);

siteTest(
  "each highlight card leads with the outcome, shows its first review excerpt with its source, and its stack",
  async (site) => {
    const cards = chunks(
      section(await site.html("/work"), "highlights"),
      "data-highlight",
    );
    let excerpts = 0;
    for (const slug of highlightSlugs) {
      const p = projects.freelance.find((x) => x.slug === slug)!;
      const card = cards.get(slug)!;
      const text = visibleText(card);
      assert(text.includes(projectLead(p)), `${slug}'s card lacks its lead`);
      assert(!card.includes("line-clamp"), `${slug}'s card cuts its text`);
      assert(
        text.includes(p.tags!.join(" · ")),
        `${slug}'s card lacks its stack`,
      );
      assert(text.includes(p.madeForName!), `${slug}'s card lacks its client`);
      assert(text.includes(p.role!), `${slug}'s card lacks its role`);
      const review = projectTestimonials(slug)[0];
      if (!review) {
        assert(
          !card.includes("<blockquote"),
          `${slug} shows a quote it has not got`,
        );
        continue;
      }
      excerpts++;
      assert(
        text.includes(review.excerpt),
        `${slug}'s card lacks ${review.id}`,
      );
      assert(
        card.includes(`href="${review.sourceHref}"`),
        `${slug}'s card does not link the source of ${review.id}`,
      );
    }
    assert(excerpts > 0, "no highlight has a review — checked nothing");
  },
);

siteTest(
  "every /work card and row marks an offline site offline and a live one live",
  async (site) => {
    const html = await site.html("/work");
    const cards = new Map([
      ...chunks(section(html, "highlights"), "data-highlight"),
      ...chunks(section(html, "archive"), "data-archive-row"),
    ]);
    let offline = 0;
    for (const p of projects.freelance) {
      const text = visibleText(cards.get(p.slug!)!);
      if (p.externalURL && p.externalURLDead) {
        offline++;
        assert(text.includes("Offline"), `${p.slug} is not marked offline`);
        assert(!text.includes("Live"), `${p.slug} is marked live`);
      } else if (p.externalURL && !p.externalURLLabel && !p.archived) {
        assert(text.includes("Live"), `${p.slug} is not marked live`);
      }
    }
    assert(offline > 0, "no offline project — checked nothing");
  },
);

siteTest(
  "Hired again shows on exactly the projects a client came back to",
  async (site) => {
    const html = await site.html("/work");
    const cards = new Map([
      ...chunks(section(html, "highlights"), "data-highlight"),
      ...chunks(section(html, "archive"), "data-archive-row"),
    ]);
    const marked = [...cards].filter(([, c]) => c.includes("data-hired-again"))
      .map(([slug]) => slug).sort();
    // Rehired on the same project, plus Corecircle, the follow-on product
    // Connectful's founder hired me for (lib/testimonials.ts).
    assertEquals(marked, ["corecircle", "foodrazor", "microwork", "roley"]);
  },
);

siteTest(
  "the archive heading spans its years and its sentence counts the offline products",
  async (site) => {
    const html = await site.html("/work");
    const archive = section(html, "archive");
    const list = archiveProjects();
    const from = Math.min(...list.map((p) => p.period!.from));
    const to = Math.max(...list.map((p) => p.period!.to ?? p.period!.from));
    const h2 = archive.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)![1];
    assertEquals(visibleText(h2), `Archive, ${from}–${to}`);
    const dead = list.filter((p) => p.externalURLDead).length;
    assert(dead > 0, "no offline archive project — checked nothing");
    assert(
      visibleText(archive).includes(
        `${dead} of these ${list.length} projects are no longer online.`,
      ),
      "the archive sentence does not count the offline products",
    );
  },
);

siteTest(
  "the /work ItemList lists every client project in page order and carries no review markup",
  async (site) => {
    const html = await site.html("/work");
    const blocks = jsonLd(html);
    const nodes = blocks.flatMap((b) =>
      (b as { "@graph"?: unknown[] })["@graph"] ?? [b]
    ) as Record<string, unknown>[];
    const list = nodes.find((n) => n["@type"] === "ItemList") as {
      "@id": string;
      numberOfItems: number;
      itemListElement: {
        position: number;
        url: string;
        name: string;
        item: { "@id": string };
      }[];
    };
    assert(list, "no ItemList");
    const page = nodes.find((n) => n["@type"] === "CollectionPage")!;
    assert(page, "no CollectionPage");
    assertEquals((page.mainEntity as { "@id": string })["@id"], list["@id"]);
    assertEquals(
      (page.breadcrumb as { "@id": string })["@id"],
      "https://antonshubin.com/work#breadcrumb",
    );
    const order = pageOrder();
    assertEquals(list.numberOfItems, order.length);
    assertEquals(
      list.itemListElement.map((e) => e.url),
      order.map((s) => `https://antonshubin.com/work/${s}`),
    );
    list.itemListElement.forEach((e, i) => {
      assertEquals(e.position, i + 1);
      assertEquals(e.item["@id"], `${e.url}#project`);
    });
    const raw = JSON.stringify(blocks);
    assert(!/"(Review|AggregateRating)"/.test(raw), "review markup on /work");
  },
);

Deno.test("/work shows Book once in its body, in the closing band, beside the catalog, How I work and Infrastructure", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  try {
    const html = await site.html("/work");
    const body = main(html);
    assertEquals(count(body, /data-primary-book/g), 1);
    const start = body.indexOf("data-closing-band");
    assert(start > 0, "/work has no closing band");
    const band = body.slice(start, body.indexOf("</section>", start));
    assertEquals(count(band, /data-primary-book/g), 1);
    assert(
      band.includes(`data-umami-event="book" data-umami-event-place="band"`),
      "Book's event",
    );
    for (const href of ["/catalog", "/how-i-work", "/infrastructure"]) {
      assert(band.includes(`href="${href}"`), `the band does not link ${href}`);
    }
    const after = body.slice(body.indexOf("</section>", start));
    assert(after.includes(`href="/tools"`), "no line to /tools after the band");
  } finally {
    await site.stop();
  }
});

siteTest(
  "only the first /work card's picture loads eagerly, none is high priority, and every image is sized",
  async (site) => {
    const body = main(await site.html("/work"));
    const imgs = [...body.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    assert(imgs.length >= highlightSlugs.length, "fewer images than cards");
    assert(
      !imgs.some((t) => /fetchpriority/i.test(t)),
      "a high-priority image",
    );
    for (const t of imgs) {
      assert(
        /\swidth="\d+"/.test(t) && /\sheight="\d+"/.test(t),
        `unsized: ${t}`,
      );
    }
    const first = highlightProjects()[0];
    const eager = imgs.filter((t) => !/loading="lazy"/.test(t));
    assertEquals(eager.length, 1, `eager images: ${eager.join("\n")}`);
    assert(
      eager[0].includes(`src="${first.cardImage!.src}`),
      `the eager image is not the first card's picture: ${eager[0]}`,
    );
    for (const p of highlightProjects()) {
      assert(p.cardImage, `${p.slug} has no card image`);
      assert(
        body.includes(`src="${p.cardImage.src}`),
        `${p.slug}'s card image`,
      );
    }
  },
);

siteTest(
  "/work's title, description and preview image name the client work",
  async (site) => {
    const html = await site.html("/work");
    assertEquals(
      visibleText(html.match(/<title>([^<]*)<\/title>/)![1]),
      "Client work and case studies — Anton Shubin",
    );
    const description = visibleText(
      html.match(/<meta name="description" content="([^"]*)"/)![1],
    );
    assert(description.length <= 160, `${description.length} characters`);
    assert(
      description.includes(`${projects.freelance.length} client projects`),
      description,
    );
    for (const p of highlightProjects().slice(0, 3)) {
      assert(
        description.includes(p.title.split(" — ")[0]),
        `${p.slug}: ${description}`,
      );
    }
    assert(
      html.includes(`content="https://antonshubin.com/img/og/work.png"`),
      "/work does not preview with work.png",
    );
  },
);

siteTest(
  "the llms files list client work in the /work order and point to the whole list",
  async (site) => {
    const full = await site.html("/llms-full.txt");
    const slugs = [...full.matchAll(/\/work\/([a-z0-9-]+)\)/g)].map((m) => m[1])
      .filter((s) => projects.freelance.some((p) => p.slug === s));
    assertEquals(slugs, pageOrder(), "llms-full.txt client work order");
    assert(
      full.includes(`${projects.freelance.length} client projects`),
      "llms-full.txt does not describe /work from the data",
    );
    const short = await site.html("/llms.txt");
    assert(
      /\nAll client work: \S+\/work\n/.test(short),
      "llms.txt does not point to /work",
    );
  },
);

siteTest(
  "the closing band on /work and on a project page shows the refund and first-milestone promises",
  async (site) => {
    const expected = [promise("refund"), promise("first-milestone")];
    for (const path of ["/work", "/work/smartlite"]) {
      const html = await site.html(path);
      const start = html.indexOf("<section data-closing-band");
      assert(start > 0, `${path} has no closing band`);
      const band = html.slice(start, html.indexOf("</section>", start));
      const list = band.slice(band.indexOf("<ul"), band.indexOf("</ul>"));
      assertEquals(
        count(list, /<li[\s>]/g),
        expected.length,
        `${path} promises`,
      );
      const text = visibleText(list);
      for (const p of expected) {
        assert(text.includes(p.title), `${path}'s band lacks "${p.title}"`);
        assert(
          text.includes(p.desc),
          `${path}'s band lacks the ${p.id} promise's text`,
        );
      }
    }
  },
);
