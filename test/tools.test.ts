// Guards the /tools hub and the tool pages (#189) against the built site:
// every tool in lib/tools.ts is listed, each page has one H1, the CI status
// from the committed snapshot, a pinned install (or an honest "not yet"),
// a PNG preview, and the sitemap and llms files list the tools from the
// registry. Asserts structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import {
  ciUrl,
  groupedTools,
  tool,
  toolLicence,
  toolRows,
  tools,
} from "../lib/tools.ts";
import { ciReading, repoSnapshot } from "../lib/github-snapshot.ts";

/** The word `@spy4x/preact-ui/status-mark` prints for each tool status. */
const STATUS_WORDS = {
  "in-use": "In use",
  ready: "Ready",
  beta: "Beta",
  wip: "WIP",
  paused: "Paused",
  archived: "Archived",
} as const;

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

/** The HTML between `data-tool-group="<id>"` and the next group (or the end). */
function groupSection(html: string, id: string): string {
  const start = html.indexOf(`data-tool-group="${id}"`);
  assert(start !== -1, `/tools has no group "${id}"`);
  const next = html.indexOf("data-tool-group=", start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

siteTest(
  "/tools lists every registry tool in its group with a status mark",
  async (site) => {
    const html = await site.html("/tools");
    assertEquals(count(html, /<h1[\s>]/g), 1);
    assert(visibleText(html).includes("Tools I build and run myself"));
    assertEquals(count(html, /data-tool="/g), tools.length + toolRows.length);
    for (const { group, tools: inGroup, rows } of groupedTools()) {
      const section = groupSection(html, group.id);
      for (const r of rows) {
        assert(
          section.includes(`data-tool="${r.slug}"`),
          `${r.slug} not in ${group.id}`,
        );
        for (const l of r.links) {
          assert(section.includes(`href="${l.href}"`), `${r.slug}: ${l.href}`);
        }
        const rowStart = section.indexOf(`data-tool="${r.slug}"`);
        const row = section.slice(rowStart, section.indexOf("</li>", rowStart));
        assert(
          visibleText(`<x ${row}`).includes(STATUS_WORDS[r.status]),
          `${r.slug}'s row has no "${STATUS_WORDS[r.status]}" status mark`,
        );
        assert(
          !section.includes(`href="/tools/${r.slug}"`),
          `${r.slug} has no page but the hub links one`,
        );
      }
      for (const t of inGroup) {
        assert(
          section.includes(`data-tool="${t.slug}"`),
          `${t.slug} not in ${group.id}`,
        );
        assert(
          section.includes(`href="/tools/${t.slug}"`),
          `${t.slug} has no page link`,
        );
        const rowStart = section.indexOf(`data-tool="${t.slug}"`);
        const row = section.slice(rowStart, section.indexOf("</li>", rowStart));
        assert(
          visibleText(`<x ${row}`).includes(STATUS_WORDS[t.status]),
          `${t.slug}'s row has no "${STATUS_WORDS[t.status]}" status mark`,
        );
      }
    }
    assert(
      html.includes("data-status-key") &&
        visibleText(html).includes("What the status marks mean"),
      "/tools has no status key",
    );
  },
);

siteTest(
  "every tool page has exactly one h1 reading name: job",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
      assertEquals(h1s.length, 1, t.slug);
      assertEquals(visibleText(h1s[0][1]), `${t.name}: ${t.job}`);
    }
  },
);

siteTest(
  "every CI pill reads the status recorded in the snapshot",
  async (site) => {
    for (const path of ["/tools", ...tools.map((t) => `/tools/${t.slug}`)]) {
      const html = await site.html(path);
      const pills = [
        ...html.matchAll(/<a[^>]*data-ci-status="[^"]*"[^>]*>([\s\S]*?)<\/a>/g),
      ]
        .map((m) => visibleText(m[1]));
      const withCi = path === "/tools"
        ? tools.filter((t) => t.ci)
        : [tool(path.slice(7))].filter((t) => t.ci);
      const expected = withCi.map((t) =>
        `CI ${ciReading(repoSnapshot(t.repo!).ci).word}`
      );
      assertEquals(pills, expected, path);
    }
  },
);

siteTest(
  "every CI pill links the tool's repository on Woodpecker, not one pipeline",
  async (site) => {
    for (const t of tools.filter((t) => t.ci)) {
      for (const path of ["/tools", `/tools/${t.slug}`]) {
        const html = await site.html(path);
        const hrefs = [
          ...html.matchAll(/<a[^>]*href="([^"]*)"[^>]*data-ci-status=/g),
        ]
          .map((m) => m[1]);
        assert(
          hrefs.includes(ciUrl(t)!),
          `${path}: no CI pill links ${ciUrl(t)}`,
        );
        assert(
          !hrefs.some((h) => h.includes("/pipeline/")),
          `${path}: a CI pill links one pipeline`,
        );
      }
    }
  },
);

siteTest(
  "an unpublished tool's version reads as publishing on the hub row and the fact card",
  async (site) => {
    const hub = await site.html("/tools");
    for (const t of tools.filter((t) => t.registry)) {
      const rowStart = hub.indexOf(`data-tool="${t.slug}"`);
      const row = hub.slice(rowStart, hub.indexOf("</li>", rowStart));
      const hubVersion = visibleText(
        row.match(/<span data-version[^>]*>([\s\S]*?)<\/span>/)![1],
      );
      const page = await site.html(`/tools/${t.slug}`);
      const cardVersion = visibleText(
        page.match(/<span data-version[^>]*>([\s\S]*?)<\/span>/)![1],
      );
      const { version, name, published } = t.registry!;
      if (published) {
        assertEquals(hubVersion, `${version} on ${name}`, t.slug);
        assertEquals(cardVersion, version, t.slug);
      } else {
        assertEquals(hubVersion, `Publishing ${version} to ${name}`, t.slug);
        assertEquals(cardVersion, `${version}, publishing to ${name}`, t.slug);
      }
    }
  },
);

siteTest(
  "an install command gets a copy button only once it is on its registry",
  async (site) => {
    for (const t of tools.filter((t) => t.registry)) {
      const html = await site.html(`/tools/${t.slug}`);
      assert(
        html.includes(t.registry!.install),
        `${t.slug} shows no install command`,
      );
      const copyButtons = count(html, /aria-label="Copy the install command/g);
      if (t.registry!.published) {
        assert(
          copyButtons > 0,
          `${t.slug} is published but has no copy button`,
        );
        assertEquals(count(html, /data-install="not-yet"/g), 0, t.slug);
      } else {
        assertEquals(
          copyButtons,
          0,
          `${t.slug} offers to copy a command that cannot work yet`,
        );
        assert(visibleText(html).includes("Not yet available"), t.slug);
      }
    }
  },
);

siteTest(
  "every tool page points og:image at its own served PNG preview",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      const image = html.match(
        /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/,
      )?.[1];
      assertEquals(image, `https://antonshubin.com/img/og/tools/${t.slug}.png`);
      const res = await site.get(new URL(image!).pathname);
      await res.body?.cancel();
      assertEquals(res.status, 200, `${t.slug}: preview PNG is not served`);
    }
  },
);

siteTest(
  "a tool page carries SoftwareSourceCode for its repo, SoftwareApplication for a runnable tool, and no rating, review or offer",
  async (site) => {
    for (const t of tools) {
      const nodes = jsonLd(await site.html(`/tools/${t.slug}`)) as Record<
        string,
        unknown
      >[];
      const code = nodes.find((n) => n["@type"] === "SoftwareSourceCode");
      const app = nodes.find((n) => n["@type"] === "SoftwareApplication");
      assertEquals(Boolean(code), Boolean(t.repo), `${t.slug}: code node`);
      if (code) {
        assertEquals(code.codeRepository, `https://github.com/${t.repo}`);
        assertEquals(
          "version" in code,
          t.registry?.published ?? false,
          `${t.slug}: version`,
        );
        assertEquals(
          code.programmingLanguage,
          t.programmingLanguage,
          `${t.slug}: programmingLanguage`,
        );
      }
      assertEquals(Boolean(app), Boolean(t.deployable), `${t.slug}: app node`);
      if (app) {
        assertEquals("url" in app, Boolean(t.live), `${t.slug}: app url`);
        assert(
          !String(app.url ?? "").includes("github.com"),
          `${t.slug}: app url is a repository`,
        );
      }
      const text = JSON.stringify(
        nodes.filter((n) =>
          n["@type"] === "SoftwareSourceCode" ||
          n["@type"] === "SoftwareApplication"
        ),
      );
      for (const banned of ["Review", "AggregateRating", "Offer"]) {
        assert(!text.includes(banned), `${t.slug}: ${banned} in JSON-LD`);
      }
    }
  },
);

siteTest(
  "/tools carries CollectionPage JSON-LD listing every page tool in hub order",
  async (site) => {
    const nodes = jsonLd(await site.html("/tools")) as Record<
      string,
      unknown
    >[];
    const page = nodes.find((n) => n["@type"] === "CollectionPage");
    assert(page, "no CollectionPage node");
    const list = page.mainEntity as {
      "@type": string;
      itemListElement: { position: number; url: string }[];
    };
    assertEquals(list["@type"], "ItemList");
    const expected = groupedTools().flatMap((g) => g.tools).map((t) =>
      `https://antonshubin.com/tools/${t.slug}`
    );
    assertEquals(list.itemListElement.map((i) => i.url), expected);
    assertEquals(
      list.itemListElement.map((i) => i.position),
      expected.map((_, i) => i + 1),
    );
  },
);

siteTest(
  "the hub shows tools first and puts the status key in a closed details at the end",
  async (site) => {
    const html = await site.html("/tools");
    const order = [...html.matchAll(/data-tool-group="([^"]+)"/g)].map((m) =>
      m[1]
    );
    assertEquals(order, ["tools", "products", "archive"]);
    assert(
      html.indexOf("data-status-key") >
        html.indexOf('data-tool-group="archive"'),
      "status key is not after the groups",
    );
    assert(
      !/<details[^>]*data-status-key[^>]*\sopen/.test(html),
      "key is open",
    );
    assertEquals(count(html, /install-/g), 0, "the hub offers an install line");
  },
);

siteTest(
  "every page saying CI status says whether it is the committed snapshot",
  async (site) => {
    for (const path of ["/tools", "/tools/mig", "/tools/ts-libs"]) {
      const text = visibleText(await site.html(path));
      assert(text.includes("committed snapshot"), `${path}: no freshness note`);
    }
  },
);

siteTest(
  "each tool with posts links them, and each of those posts links its tool page back",
  async (site) => {
    const withPosts = tools.filter((t) => t.posts?.length);
    assertEquals(withPosts.length, 7);
    for (const t of withPosts) {
      const page = await site.html(`/tools/${t.slug}`);
      for (const slug of t.posts!) {
        assert(page.includes(`href="/blog/${slug}"`), `${t.slug} -> ${slug}`);
        const post = await site.html(`/blog/${slug}`);
        assert(
          post.includes(`href="/tools/${t.slug}"`),
          `/blog/${slug} does not link /tools/${t.slug}`,
        );
        assert(
          post.includes(
            `href="/tools/${t.slug}" data-umami-event="cta" data-umami-event-place="top" data-umami-event-target="/tools/${t.slug}"`,
          ),
          `/blog/${slug} link to /tools/${t.slug} carries no Umami event`,
        );
      }
    }
  },
);

siteTest(
  "a tool page ends with two doors and three more tools, and its links carry Umami events",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      assertEquals(count(html, /data-tool-doors/g), 1, t.slug);
      // The two doors sit in ClosingBand's children slot, which ends the page.
      assertEquals(count(html, /data-closing-band/g), 1, t.slug);
      const band = html.slice(html.indexOf("data-closing-band"));
      assert(band.includes("data-tool-doors"), `${t.slug}: doors in the band`);
      assert(
        html.indexOf('id="more"') < html.indexOf("data-closing-band"),
        `${t.slug}: the band ends the page, after More tools`,
      );
      const doors = visibleText(
        band.slice(band.indexOf(">", band.indexOf("data-tool-doors")) + 1),
      );
      assertEquals(
        doors.startsWith("Use it"),
        !!t.repo,
        `${t.slug}: first door`,
      );
      assert(
        doors.includes("Need something like this for your team?"),
        `${t.slug}: second door`,
      );
      const more = html.slice(
        html.indexOf('id="more"'),
        html.indexOf("data-closing-band"),
      );
      assertEquals(count(more, /<h3/g), 3, `${t.slug}: more tools`);
      assert(
        /data-umami-event="cta" data-umami-event-place="band" data-umami-event-target="\/catalog/
          .test(html),
        `${t.slug}: catalog event`,
      );
      if (t.repo) {
        // An archived repository takes no issues, so its door links the repository.
        const door = t.status === "archived" ? t.repo : `${t.repo}/issues`;
        assert(
          html.includes(
            `href="https://github.com/${door}" data-umami-event="outbound" data-umami-event-to="github" data-umami-event-item="${t.slug}"`,
          ),
          `${t.slug}: issue event`,
        );
      }
      if (t.registry?.published) {
        assert(
          html.includes(
            `data-umami-event="tool-install-copy" data-umami-event-item="${t.slug}"`,
          ),
          `${t.slug}: install copy event`,
        );
      }
    }
  },
);

siteTest(
  "the hub and the tool pages are cached for an hour, not three days",
  async (site) => {
    for (const path of ["/tools", "/tools/mig"]) {
      const res = await site.get(path);
      await res.body?.cancel();
      assertEquals(
        res.headers.get("cache-control"),
        "public, max-age=3600, stale-while-revalidate=600",
        path,
      );
    }
  },
);

siteTest(
  "preact-components credits Eirene visibly, with both links",
  async (site) => {
    const html = await site.html("/tools/preact-components");
    const credit = html.match(/<p[^>]*data-credit[^>]*>([\s\S]*?)<\/p>/)?.[1] ??
      "";
    assert(visibleText(credit).includes("Eirene"), "no visible Eirene credit");
    assert(credit.includes('href="https://github.com/Eirene"'));
    assert(credit.includes('href="https://isorokina.com/"'));
  },
);

siteTest(
  "each link between repos is labelled Planned or Today, as lib/tools.ts says",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      const labels = [
        ...html.matchAll(
          /<li[^>]*data-relation="[^"]*"[^>]*>([\s\S]*?)<\/li>/g,
        ),
      ]
        .map((m) => visibleText(m[1]).split(" ")[0]);
      assertEquals(
        labels,
        (t.fits ?? []).map((f) => (f.planned ? "Planned" : "Today")),
        t.slug,
      );
    }
  },
);

siteTest(
  "the /tools row and both llms files credit Eirene for preact-components",
  async (site) => {
    const hub = await site.html("/tools");
    const rowStart = hub.indexOf('data-tool="preact-components"');
    const row = hub.slice(rowStart, hub.indexOf("</li>", rowStart));
    const credit = row.match(/<p[^>]*data-credit[^>]*>([\s\S]*?)<\/p>/)?.[1] ??
      "";
    assert(
      visibleText(credit).includes("Eirene"),
      "no visible Eirene credit on the /tools row",
    );
    assert(credit.includes('href="https://github.com/Eirene"'));
    assert(credit.includes('href="https://isorokina.com/"'));
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      const line = (await site.html(path)).split("\n")
        .find((l) => l.startsWith("- [preact-components](")) ?? "";
      assert(
        line.includes("Eirene"),
        `${path}: the preact-components line does not name Eirene`,
      );
    }
  },
);

siteTest("an unknown tool slug answers 404", async (site) => {
  const res = await site.get("/tools/no-such-tool");
  await res.body?.cancel();
  assertEquals(res.status, 404);
});

siteTest(
  "the sitemap and llms files list every tool, and never an unpublished install",
  async (site) => {
    const sitemap = await site.html("/sitemap.xml");
    assert(sitemap.includes("<loc>https://antonshubin.com/tools</loc>"));
    for (const path of ["/llms.txt", "/llms-full.txt"]) {
      const text = await site.html(path);
      for (const t of tools) {
        assert(text.includes(`/tools/${t.slug})`), `${path} misses ${t.slug}`);
      }
    }
    for (const t of tools) {
      assert(
        sitemap.includes(`/tools/${t.slug}</loc>`),
        `sitemap misses ${t.slug}`,
      );
    }
    // The unpublished tool must not offer its command in the llms files either.
    const unpublished = tools.filter((t) => t.registry?.published === false);
    const llms = await site.html("/llms.txt");
    for (const t of unpublished) {
      assert(
        !llms.includes(t.registry!.install),
        `${t.slug}: llms.txt offers its install`,
      );
    }
  },
);

siteTest(
  "a tool with no registry, CI or repository shows no install line, version, CI pill or repository row",
  async (site) => {
    const bare = tools.filter((t) => !t.registry && !t.ci && !t.repo);
    assert(bare.length > 0, "no tool without registry, CI and repo to check");
    for (const t of bare) {
      const page = await site.html(`/tools/${t.slug}`);
      assertEquals(count(page, /data-install=/g), 0, `${t.slug}: install`);
      assertEquals(count(page, /data-version/g), 0, `${t.slug}: version`);
      assertEquals(count(page, /data-ci-status=/g), 0, `${t.slug}: CI`);
      assertEquals(
        count(page, />Repository</g),
        0,
        `${t.slug}: repository row`,
      );
      assert(
        !page.includes("Star it or open an issue"),
        `${t.slug}: a star-it door with no repository`,
      );
      const hub = await site.html("/tools");
      const rowStart = hub.indexOf(`data-tool="${t.slug}"`);
      const row = hub.slice(rowStart, hub.indexOf("</li>", rowStart));
      assertEquals(count(row, /data-install=|data-ci-status=/g), 0, t.slug);
    }
  },
);

siteTest(
  "a running tool shows In use, and no tool page calls a repository link Live",
  async (site) => {
    const mig = visibleText(await site.html("/tools/mig"));
    assert(mig.includes("In use"), "/tools/mig has no In use status");
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      const liveRow = html.match(
        /<dt[^>]*>Live<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/,
      )?.[1];
      if (liveRow) {
        assert(
          !liveRow.includes('href="https://github.com/'),
          `${t.slug}: Live links a repository`,
        );
      } else {
        assert(!t.live, `${t.slug}: live link has no Live row`);
      }
    }
  },
);

siteTest(
  "zond's page no longer names probe-home, and mig's page links the booking page",
  async (site) => {
    const zond = await site.html("/tools/zond");
    assert(!zond.includes("probe-home"), "zond still names probe-home");
    const mig = await site.html("/tools/mig");
    assert(mig.includes('href="/book"'), "mig does not link /book");
  },
);

siteTest(
  "an old /work URL of a moved own project answers one 301 to its tool page, and the tool page answers 200",
  async (site) => {
    for (
      const [from, to] of [
        ["/work/mig", "/tools/mig"],
        ["/projects/rostok", "/tools/rostok"],
        ["/work/todoapp-caldav/", "/tools/caldav-tasks-web"],
        ["/projects/todoapp-caldav", "/tools/caldav-tasks-web"],
      ]
    ) {
      const res = await site.get(from);
      await res.body?.cancel();
      assertEquals(res.status, 301, from);
      assertEquals(
        new URL(res.headers.get("location")!, "http://x").pathname,
        to,
      );
      const target = await site.get(to);
      await target.body?.cancel();
      assertEquals(target.status, 200, to);
    }
  },
);

/** The `<meta name="description">` content of a page. */
function metaDescriptionOf(html: string): string {
  const tag = html.match(/<meta[^>]*name="description"[^>]*>/)?.[0] ?? "";
  return tag.match(/content="([^"]*)"/)?.[1] ?? "";
}

siteTest(
  "every tool page's meta description is one line of at most 160 characters",
  async (site) => {
    for (const t of tools) {
      const raw = metaDescriptionOf(await site.html(`/tools/${t.slug}`));
      assert(!/[\n\r]/.test(raw), `${t.slug}: a newline`);
      const description = visibleText(raw);
      assert(description.length > 0, `${t.slug}: empty description`);
      assert(
        description.length <= 160,
        `${t.slug}: ${description.length} characters`,
      );
    }
  },
);

siteTest(
  "the hub's meta description promises no install command or live proof",
  async (site) => {
    const description = metaDescriptionOf(await site.html("/tools"));
    assert(description.length > 0 && description.length <= 160, description);
    for (const word of ["install", "proof"]) {
      assert(
        !description.toLowerCase().includes(word),
        `hub description says "${word}"`,
      );
    }
  },
);

siteTest(
  "the hub row and the tool page show the same licence",
  async (site) => {
    const hub = await site.html("/tools");
    for (const t of tools) {
      const licence = toolLicence(t);
      const start = hub.indexOf(`data-tool="${t.slug}"`);
      const row = visibleText(
        `<x ${hub.slice(start, hub.indexOf("</li>", start))}`,
      );
      const page = visibleText(await site.html(`/tools/${t.slug}`));
      if (licence) {
        // The archive group is one line per project, without a licence.
        if (t.group !== "archive") {
          assert(row.includes(licence), `${t.slug}: hub row has no ${licence}`);
        }
        assert(page.includes(licence), `${t.slug}: page has no ${licence}`);
      }
    }
    assertEquals(toolLicence(tool("mig")), "AGPL-3.0");
  },
);

siteTest(
  "a tool URL with a trailing slash answers one 301 to the slash-free page",
  async (site) => {
    const res = await site.get("/tools/mig/");
    await res.body?.cancel();
    assertEquals(res.status, 301);
    assertEquals(
      new URL(res.headers.get("location")!, "http://x").pathname,
      "/tools/mig",
    );
  },
);

Deno.test("a tool page's closing band carries a Book action", async () => {
  const site = await startSite({
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  try {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      const band = html.slice(html.indexOf("data-closing-band"));
      assertEquals(count(band, /data-primary-book/g), 1, t.slug);
      assert(
        band.includes(
          `data-umami-event="book" data-umami-event-place="band" data-umami-event-item="${t.slug}"`,
        ),
        `${t.slug}: Book event`,
      );
    }
  } finally {
    await site.stop();
  }
});

siteTest(
  "an archived tool's page offers no way to open an issue",
  async (site) => {
    const archived = tools.filter((t) => t.status === "archived" && t.repo);
    assert(archived.length > 0, "no archived tool with a repository");
    for (const t of archived) {
      const html = await site.html(`/tools/${t.slug}`);
      assert(!html.includes("Report an issue"), `${t.slug}: Report an issue`);
      assert(!html.includes("open an issue"), `${t.slug}: open an issue`);
      assert(!html.includes(`${t.repo}/issues`), `${t.slug}: issues link`);
      assert(
        html.includes(`https://github.com/${t.repo}"`),
        `${t.slug}: repo link`,
      );
    }
  },
);

siteTest("a live tool's page still offers Report an issue", async (site) => {
  const html = await site.html("/tools/ts-libs");
  assert(html.includes("Report an issue"));
});
