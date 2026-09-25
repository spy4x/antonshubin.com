// Guards the /tools hub and the tool pages (#189) against the built site:
// every tool in lib/tools.ts is listed, each page has one H1, the CI status
// from the committed snapshot, a pinned install (or an honest "not yet"),
// a PNG preview, and the sitemap and llms files list the tools from the
// registry. Asserts structure and short phrases, never prose.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count, jsonLd, visibleText } from "./html.ts";
import { groupedTools, tools } from "../lib/tools.ts";
import { ciReading, repoSnapshot } from "../lib/github-snapshot.ts";

/** The word components/StatusMark.tsx prints for each tool status. */
const STATUS_WORDS = {
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
    assertEquals(count(html, /data-tool="/g), tools.length);
    for (const { group, tools: inGroup } of groupedTools()) {
      const section = groupSection(html, group.id);
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
  "every tool page shows the CI status recorded in the snapshot",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      const word = ciReading(repoSnapshot(t.repo).ci).word;
      const shown = [...html.matchAll(/data-ci-status="([^"]+)"/g)].map((m) =>
        m[1]
      );
      assert(shown.length > 0, `${t.slug} shows no CI status`);
      for (const s of shown) assertEquals(s, word, t.slug);
    }
  },
);

siteTest(
  "an install command gets a copy button only once it is on its registry",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      assert(
        html.includes(t.registry.install),
        `${t.slug} shows no install command`,
      );
      const copyButtons = count(html, /aria-label="Copy the install command/g);
      if (t.registry.published) {
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
      assertEquals(node.codeRepository, `https://github.com/${t.repo}`);
      assertEquals(
        "version" in node,
        t.registry.published,
        `${t.slug}: version`,
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
  "a planned link between repos is marked planned, not stated as fact",
  async (site) => {
    for (const t of tools) {
      const html = await site.html(`/tools/${t.slug}`);
      assertEquals(
        count(html, /data-relation="planned"/g),
        t.fits.filter((f) => f.planned).length,
        t.slug,
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
    const unpublished = tools.filter((t) => !t.registry.published);
    const llms = await site.html("/llms.txt");
    for (const t of unpublished) {
      assert(
        !llms.includes(t.registry.install),
        `${t.slug}: llms.txt offers its install`,
      );
    }
  },
);
