// Guards the /tools hub and the tool pages (#189) against the built site:
// every tool in lib/tools.ts is listed, each page has one H1, the CI status
// from the committed snapshot, a pinned install (or an honest "not yet"),
// a PNG preview, and the sitemap and llms files list the tools from the
// registry. Asserts structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { ciUrl, groupedTools, tool, toolRows, tools } from "../lib/tools.ts";
import { ciReading, repoSnapshot } from "../lib/github-snapshot.ts";

/** The word components/StatusMark.tsx prints for each tool status. */
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
      visibleText(html).includes("Status key"),
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
  "every tool page carries SoftwareSourceCode JSON-LD for its repo",
  async (site) => {
    for (const t of tools) {
      const nodes = jsonLd(await site.html(`/tools/${t.slug}`)) as Record<
        string,
        unknown
      >[];
      const node = nodes.find((n) => n["@type"] === "SoftwareSourceCode");
      assert(node, `${t.slug} has no SoftwareSourceCode node`);
      if (t.repo) {
        assertEquals(node.codeRepository, `https://github.com/${t.repo}`);
      }
      assertEquals(
        "version" in node,
        t.registry?.published ?? false,
        `${t.slug}: version`,
      );
      assertEquals(
        "codeRepository" in node,
        Boolean(t.repo),
        `${t.slug}: codeRepository`,
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
        .find((l) => l.includes("/tools/preact-components)")) ?? "";
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
    assert(mig.includes('href="/contact-me"'), "mig does not link /contact-me");
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
