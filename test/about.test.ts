// Guards for the About page (#294): its search structure, the one ProfilePage
// on the site, and the links in and out that the merged spec adopted. They
// read the built site through test/harness.ts; see AGENTS.md "Rendered-page
// tests". Assert structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { ABOUT_NAME, aboutSteps } from "../lib/about.ts";

const PERSON = { "@id": "https://antonshubin.com/#person" };

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

interface Node {
  "@type"?: string;
  "@id"?: string;
  name?: string;
  mainEntity?: { "@id": string };
  itemListElement?: { name: string; item: string }[];
  homeLocation?: { name: string };
  sameAs?: string[];
}

/** Every JSON-LD node on a page, flattening `@graph`s. */
function nodes(html: string): Node[] {
  return jsonLd(html).flatMap((d) =>
    (d as { "@graph"?: unknown[] })["@graph"] ?? [d]
  ) as Node[];
}

/** Every path in the sitemap. */
async function sitemapPaths(site: Site): Promise<string[]> {
  const sitemap = await site.html("/sitemap.xml");
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname);
  assert(paths.length > 10, "sitemap looks empty");
  return paths;
}

siteTest(
  "exactly one ProfilePage across the sitemap, on /about, about Anton",
  async (site) => {
    const paths = await sitemapPaths(site);
    assert(paths.includes("/about"), "/about is not in the sitemap");
    const found: string[] = [];
    for (const path of paths) {
      const profiles = nodes(await site.html(path))
        .filter((n) => n["@type"] === "ProfilePage");
      for (const p of profiles) {
        found.push(path);
        assertEquals(p.mainEntity, PERSON, `${path}: mainEntity`);
      }
    }
    assertEquals(found, ["/about"]);
  },
);

siteTest(
  "/about has one H1 with the name, a name-first title and a Home / About breadcrumb, with no review or rating",
  async (site) => {
    const html = await site.html("/about");
    assertEquals(count(html, /<h1[\s>]/g), 1);
    const h1 = visibleText(
      html.slice(html.indexOf("<h1"), html.indexOf("</h1>")),
    );
    assert(h1.includes("Anton Shubin"), h1);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    assert(title.startsWith(ABOUT_NAME), title);
    const all = nodes(html);
    const crumbs = all.find((n) => n["@type"] === "BreadcrumbList");
    assertEquals(
      crumbs?.itemListElement?.map((i) => i.name),
      ["Home", "About"],
    );
    for (const type of ["Review", "AggregateRating"]) {
      assert(!all.some((n) => n["@type"] === type), `${type} on /about`);
    }
    // One level deep: no visible breadcrumb (components/Breadcrumb.tsx).
    assertEquals(count(html, /aria-label="Breadcrumb"/g), 0);
  },
);

siteTest(
  "the Person JSON-LD names Anton's home city and lists his vlog channel",
  async (site) => {
    const person = nodes(await site.html("/about"))
      .find((n) => n["@type"] === "Person");
    assert(person, "no Person node");
    assertEquals(person.homeLocation?.name, "Da Nang, Vietnam");
    assert(
      person.sameAs?.includes("https://www.youtube.com/@anton-shubin-live"),
      "sameAs lacks the vlog channel",
    );
  },
);

siteTest(
  "/about shows the portrait as its one eager, high-priority image",
  async (site) => {
    const html = await site.html("/about");
    const main = html.slice(html.indexOf('id="main-content"'));
    assertEquals(count(main, /fetchpriority="high"/g), 1);
    const img = main.match(/<img[^>]*data-about-portrait[^>]*>/)?.[0] ?? "";
    assert(img.includes('fetchpriority="high"'), img);
    assert(img.includes('alt="Anton Shubin"'), img);
  },
);

siteTest(
  "/about tells the story in four dated steps and links the 2022 post as the longer story",
  async (site) => {
    const html = await site.html("/about");
    assertEquals(count(html, /data-about-step/g), aboutSteps.length);
    assert(
      html.includes('href="/blog/from-office-job-to-freelance-to-my-startups"'),
      "no link to the 2022 post",
    );
    for (const href of ["/infrastructure", "/tools", "/pay", "/how-i-work"]) {
      assert(html.includes(`href="${href}"`), `no link to ${href}`);
    }
  },
);

Deno.test("/about shows Book in its card and its closing band only", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  try {
    const html = await site.html("/about");
    const start = html.indexOf('id="main-content"');
    const main = html.slice(start, html.indexOf("</main>", start));
    const events = [...main.matchAll(/<a\b[^>]*data-primary-book[^>]*>/g)]
      .map((m) => m[0].match(/data-umami-event="([^"]*)"/)?.[1]);
    assertEquals(events, ["about-book-top", "about-book-bottom"]);
  } finally {
    await site.stop();
  }
});

siteTest(
  "/about is linked from both llms files, the home proof line and the 2022 post",
  async (site) => {
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      assert(
        (await site.html(path)).includes("https://antonshubin.com/about"),
        `${path} does not link /about`,
      );
    }
    const home = await site.html("/");
    assert(
      /<a\b[^>]*href="\/about"[^>]*data-home-about/.test(home),
      "the home page does not link /about",
    );
    const post = await site.html(
      "/blog/from-office-job-to-freelance-to-my-startups",
    );
    assert(
      post.includes('href="/about"'),
      "the 2022 post does not link /about",
    );
  },
);

siteTest("/about shows two client review cards", async (site) => {
  const html = await site.html("/about");
  const start = html.indexOf('aria-labelledby="about-reviews"');
  assert(start > -1, "/about has no reviews section");
  const section = html.slice(start, html.indexOf("</section>", start));
  assertEquals(count(section, /<figure[\s>]/g), 2);
});

siteTest("/llms-full.txt carries the About career story", async (site) => {
  const txt = await site.html("/llms-full.txt");
  assert(
    txt.includes(aboutSteps[0].text),
    "/llms-full.txt lacks the first About step",
  );
});
