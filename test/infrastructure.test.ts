// Guards /infrastructure (#295) against the built site: one H1, the three live
// links on the first screen, a box and an arrow for every entry of
// lib/infrastructure.ts, no probe-home anywhere, the TechArticle node, the
// closing band, and the crawler files. Asserts structure, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd } from "./html.ts";
import { blogArticles } from "../lib/data.ts";
import {
  infraEdges,
  infraLanes,
  infraLayers,
  infraNodes,
  laneConnections,
  liveLinks,
  mentionedToolIds,
} from "../lib/infrastructure.ts";

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

siteTest(
  "/infrastructure has one H1 and the three live links in its first block",
  async (site) => {
    const html = await site.html("/infrastructure");
    assertEquals(count(html, /<h1[\s>]/), 1);
    const hero = html.slice(
      html.indexOf("data-infra-live"),
      html.indexOf("data-infra-map"),
    );
    for (const l of liveLinks) {
      assert(
        hero.includes(`href="${l.href}"`),
        `${l.id} is not linked in the first block`,
      );
      assert(
        hero.includes(`data-live-link="${l.id}"`),
        `${l.id} lost its marker`,
      );
    }
    assertEquals(count(hero, /data-note-ref="infra-live-checked"/), 1);
  },
);

siteTest(
  "/infrastructure draws every box and every arrow of the map",
  async (site) => {
    const html = await site.html("/infrastructure");
    assertEquals(count(html, /data-infra-lane="/), infraLanes.length);
    assertEquals(count(html, /data-infra-node="/), infraNodes.length);
    assertEquals(count(html, /data-infra-edge/), infraEdges.length);
    for (const n of infraNodes) {
      assert(
        html.includes(`data-infra-node="${n.id}"`),
        `${n.id} is not drawn`,
      );
      assert(html.includes(`href="${n.href}"`), `${n.id} is not linked`);
    }
    for (const e of infraEdges) {
      assert(
        html.includes(`data-infra-edge="${e.from}-${e.to}"`),
        `${e.from} ${e.verb} ${e.to} is not drawn`,
      );
    }
  },
);

siteTest(
  "/infrastructure draws every arrow with its verb as text and a decorative arrow",
  async (site) => {
    const html = await site.html("/infrastructure");
    for (const e of infraEdges) {
      const start = html.indexOf(`data-infra-edge="${e.from}-${e.to}"`);
      const item = html.slice(start, html.indexOf("</li>", start));
      assert(item.includes(`>${e.verb}<`), `${e.verb} is not visible text`);
      assert(
        item.includes('aria-hidden="true"'),
        `${e.verb}: arrow is not decorative`,
      );
    }
  },
);

siteTest(
  "/infrastructure points each arrow the way its edge runs",
  async (site) => {
    const html = await site.html("/infrastructure");
    for (const lane of infraLanes) {
      for (const { edge, forward } of laneConnections(lane)) {
        const start = html.indexOf(`data-infra-edge="${edge.from}-${edge.to}"`);
        const item = html.slice(start, html.indexOf("</li>", start));
        assertEquals(
          item.includes("flex-col-reverse lg:flex-row-reverse"),
          !forward,
          `${edge.from} ${edge.verb} ${edge.to} points the wrong way`,
        );
      }
    }
  },
);

siteTest(
  "the TechArticle mentions exactly the tool pages the map links",
  async (site) => {
    const html = await site.html("/infrastructure");
    const map = html.slice(
      html.indexOf("data-infra-map"),
      html.indexOf("</section>", html.indexOf("data-infra-map")),
    );
    const linked = [
      ...new Set(
        [...map.matchAll(
          /data-infra-node="[^"]+"[^>]*>\s*<a[^>]+href="\/tools\/([^"]+)"/g,
        )]
          .map((m) => `https://antonshubin.com/tools/${m[1]}#tool`),
      ),
    ].sort();
    const article = jsonLd(html).find((n) =>
      (n as { "@type"?: string })["@type"] === "TechArticle"
    ) as { mentions: { "@id": string }[] };
    assert(linked.length > 0, "the map links no tool page");
    assertEquals(article.mentions.map((m) => m["@id"]).sort(), linked);
    assertEquals(mentionedToolIds().sort(), linked);
  },
);

siteTest("no page of the site links probe-home", async (site) => {
  const xml = await (await site.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
  assert(paths.includes("/infrastructure"));
  for (const path of [...paths, "/llms.txt", "/llms-full.txt"]) {
    const res = await site.get(path);
    const text = await res.text();
    assert(!/probe-home/i.test(text), `${path} mentions probe-home`);
  }
});

siteTest(
  "/infrastructure is a TechArticle by the site's person that mentions the tools",
  async (site) => {
    const html = await site.html("/infrastructure");
    const article = jsonLd(html).find((n) =>
      (n as { "@type"?: string })["@type"] === "TechArticle"
    ) as { author: { "@id": string }; mentions: { "@id": string }[] };
    assert(article, "no TechArticle node");
    assertEquals(article.author["@id"], "https://antonshubin.com/#person");
    assert(
      article.mentions.some((m) => m["@id"].endsWith("/tools/rostok#tool")),
    );
  },
);

siteTest(
  "/infrastructure ends with one closing band and shows two service prices",
  async (site) => {
    const html = await site.html("/infrastructure");
    assertEquals(count(html, /data-closing-band/), 1);
    // The nav's own Book sits outside <main>: the page adds two, the card's and the band's.
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    const bookLinks = [...main.matchAll(/<a[^>]*data-primary-book[^>]*>/g)]
      .map((m) => m[0]);
    assertEquals(bookLinks.length, 2);
    for (const a of bookLinks) {
      assert(a.includes('href="/book"'), `Book does not go to /book: ${a}`);
      assert(!a.includes("_blank"), `Book opens a new tab: ${a}`);
    }
    assert(!html.includes("/#audit-form"), "the old form link");
    assert(html.includes('href="/book#brief"'), "the brief link");
    assertEquals(count(html, /data-infra-layer="/), infraLayers.length);
    assertEquals(count(html, /data-infra-posts/), 0);
    assertEquals(
      count(
        html.slice(html.indexOf("data-infra-services")),
        /<li[^>]*class="[^"]*bg-paper/,
      ),
      2,
    );
  },
);

siteTest("the crawler files list the page and its map", async (site) => {
  const short = await (await site.get("/llms.txt")).text();
  const full = await (await site.get("/llms-full.txt")).text();
  assert(short.includes("/infrastructure"));
  assert(full.includes("/infrastructure"));
  for (const e of infraEdges) assert(full.includes(` ${e.verb} `));
});

/** The posts about a layer of the map: each links back to the page (SEO 6 on #295). */
const POSTS_LINKING_BACK = [
  "cost-optimization-laboratory",
  "rostok-self-hosted-scaffolder",
  "zond-sso-probe-bridge",
  "mig-tiny-self-hosted-scheduler",
];

siteTest(
  "each post about a layer of the map links back to /infrastructure",
  async (site) => {
    for (const slug of POSTS_LINKING_BACK) {
      const article = blogArticles.find((a) => a.slug === slug);
      assert(article, `no post "${slug}"`);
      assert(
        !article.archived,
        `${slug} is archived: it keeps its text as written`,
      );
      // The post's own text, not the page: the nav or the footer also links /infrastructure.
      const source = await Deno.readTextFile(
        new URL(`../content/blog/${slug}.md`, import.meta.url),
      );
      assert(
        /\]\(\/infrastructure\)/.test(source),
        `/blog/${slug} does not link /infrastructure in its text`,
      );
      const html = await site.html(`/blog/${slug}`);
      assert(
        count(html, /<a[^>]+href="\/infrastructure"/) >= 1,
        `/blog/${slug} does not link /infrastructure`,
      );
    }
  },
);
