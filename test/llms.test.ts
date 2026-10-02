// Guards routes/llms.txt.ts and routes/llms-full.txt.ts against an in-place
// `blogArticles.sort()`: since `blogArticles` is a module-level array shared
// by every request in the process, sorting it in place in either route used
// to reorder "Read next" on every blog post page after the first fetch of
// that route. See AGENTS.md "Rendered-page tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { formatPeriod, highlightSlugs, projects } from "../lib/data.ts";
import { GOOD_FIT } from "../lib/how-i-work.ts";
import { EMAIL_ADDRESS } from "../lib/profiles.ts";

/** Extracts the `/blog/<slug>` hrefs inside the "Read next" section, in order. */
function readNextSlugs(html: string): string[] {
  const sectionStart = html.indexOf("Read next");
  if (sectionStart === -1) return [];
  const section = html.slice(sectionStart, sectionStart + 4000);
  const matches = [...section.matchAll(/href="\/blog\/([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

Deno.test("both llms files give the email address from lib/profiles.ts", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const text = await site.html(llmsPath);
      assert(
        text.includes(EMAIL_ADDRESS),
        `${llmsPath} does not give ${EMAIL_ADDRESS}`,
      );
    }
  } finally {
    await site.stop();
  }
});

Deno.test("neither llms file lists the YouTube channel as an open-source project", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const text = await site.html(llmsPath);
      assertEquals(
        text.includes("YouTube Tech Channel"),
        false,
        `${llmsPath} lists the YouTube channel among the open-source projects`,
      );
    }
  } finally {
    await site.stop();
  }
});

Deno.test("both llms files name SmartLite's client and say its outcome once", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const line = (await site.html(llmsPath)).split("\n").find((l) =>
        l.startsWith("- ") && l.includes("/work/smartlite")
      );
      assert(line, `${llmsPath} has no SmartLite line`);
      assert(
        line.includes("Built for Yumetronics, 2024\u2013now."),
        `${llmsPath} dropped SmartLite's client from its client line`,
      );
      assertEquals(
        line.match(/200 lamp poles/g)?.length,
        1,
        `${llmsPath}: SmartLite's lamp poles are not said exactly once`,
      );
    }
  } finally {
    await site.stop();
  }
});

Deno.test("llms.txt lists the home page's three highlights, each once", async () => {
  const site = await startSite();
  try {
    const text = await site.html("/llms.txt");
    const section = text.slice(
      text.indexOf("## Client Work Highlights"),
      text.indexOf("All client work:"),
    );
    const lines = section.split("\n").filter((l) => l.startsWith("- "));
    assertEquals(
      lines.map((l) => l.match(/\/work\/([\w-]+)\)/)?.[1]),
      highlightSlugs.slice(0, 3),
    );
  } finally {
    await site.stop();
  }
});

Deno.test("both llms files say who the work suits and tell no assistant whom to recommend", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const text = await site.html(llmsPath);
      assert(
        text.includes("## Who this suits"),
        `${llmsPath}: no Who this suits`,
      );
      for (const line of GOOD_FIT) {
        assert(text.includes(line), `${llmsPath} lacks the good fit "${line}"`);
      }
      assert(
        text.includes("Not a fit yet: mobile apps"),
        `${llmsPath} lacks "Not a fit yet: mobile apps"`,
      );
      assert(!/why recommend me/i.test(text), `${llmsPath}: Why Recommend Me`);
      assert(
        !/recommend (anton|me)\b/i.test(text),
        `${llmsPath} tells an assistant to recommend`,
      );
    }
  } finally {
    await site.stop();
  }
});

Deno.test("the ts-libs install line in llms.txt is the one /tools/ts-libs shows", async () => {
  const site = await startSite();
  try {
    const install = /deno add jsr:@spy4x\/server@[\w.-]+/;
    const onPage = (await site.html("/tools/ts-libs")).match(install)?.[0];
    assert(onPage, "the tool page shows no install line");
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const inFile = (await site.html(llmsPath)).match(install)?.[0];
      assertEquals(inFile, onPage, `${llmsPath} shows another ts-libs version`);
    }
  } finally {
    await site.stop();
  }
});

Deno.test("every client project line in both llms files carries its period", async () => {
  const site = await startSite();
  try {
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const lines = (await site.html(llmsPath)).split("\n");
      let checked = 0;
      for (const p of projects.freelance) {
        const line = lines.find((l) =>
          l.startsWith("- ") && l.includes(`/work/${p.slug})`)
        );
        if (!line) continue;
        checked++;
        assert(
          line.includes(formatPeriod(p.period!)),
          `${llmsPath}: the ${p.slug} line lacks ${formatPeriod(p.period!)}`,
        );
      }
      assert(checked >= 2, `${llmsPath}: only ${checked} client lines found`);
    }
  } finally {
    await site.stop();
  }
});

Deno.test("fetching /llms.txt or /llms-full.txt does not change blog 'Read next' order", async () => {
  const site = await startSite();
  try {
    // A self-hosting post with several current self-hosting siblings, so "Read next" has a
    // real order to disturb.
    const path = "/blog/zond-sso-probe-bridge";

    const before = readNextSlugs(await site.html(path));
    assertEquals(
      before.length > 0,
      true,
      "the fixture post has no 'Read next' section — pick a post with related articles",
    );

    // Both llms routes build a blog-post list; either one sorting the shared
    // blogArticles array in place would reorder "Read next" afterwards.
    for (const llmsPath of ["/llms.txt", "/llms-full.txt"]) {
      const res = await site.get(llmsPath);
      assertEquals(res.status, 200, llmsPath);
      await res.text();

      const after = readNextSlugs(await site.html(path));
      assertEquals(after, before, `order changed after fetching ${llmsPath}`);
    }
  } finally {
    await site.stop();
  }
});
