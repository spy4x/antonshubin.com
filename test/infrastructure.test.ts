// Guards /infrastructure (#295) against the built site: one H1, the three live
// links on the first screen, a box and an arrow for every entry of
// lib/infrastructure.ts, no probe-home anywhere, the TechArticle node, the
// closing band, and the crawler files. Asserts structure, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd } from "./html.ts";
import {
  infraEdges,
  infraGroups,
  infraNodes,
  liveLinks,
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
    assertEquals(count(html, /data-infra-group="/), infraGroups.length);
    assertEquals(count(html, /data-infra-node="/), infraNodes.length);
    assertEquals(count(html, /data-infra-edge/), infraEdges.length);
    for (const n of infraNodes) {
      assert(html.includes(`href="${n.href}"`), `${n.id} is not linked`);
    }
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
    assertEquals(count(html, /data-primary-book/), 2);
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
