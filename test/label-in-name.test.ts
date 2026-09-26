// Guard for #236: a button or link's visible text must be part of its
// accessible name. A voice-control user says what they see ("click Copy
// account number"); when `aria-label` names something else, that command
// finds nothing. Reads server-rendered HTML for every page in /sitemap.xml
// plus /pay, which the sitemap leaves out.
import { assert } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";
import { visibleText } from "./html.ts";

/** Lower-cased, whitespace-collapsed, so "Copy  Address" matches "copy address". */
function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

Deno.test("every aria-labelled button and link contains its visible text in its name", async () => {
  const site = await startSite();
  try {
    const xml = await site.html("/sitemap.xml");
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]).pathname
    );
    assert(paths.length > 0, "sitemap.xml is empty");

    const bad: string[] = [];
    let checked = 0;
    for (const path of [...paths, "/pay"]) {
      const html = await site.html(path);
      for (const m of html.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
        const label = m[2].match(/\baria-label="([^"]*)"/)?.[1];
        if (label === undefined) continue;
        const text = norm(visibleText(m[3]));
        if (!text) continue;
        checked++;
        if (!norm(visibleText(label)).includes(text)) {
          bad.push(`${path}: shows "${text}" but is named "${label}"`);
        }
      }
    }
    assert(
      checked > 0,
      "no aria-labelled button or link with visible text was found",
    );
    assert(
      bad.length === 0,
      `visible text missing from the accessible name:\n${bad.join("\n")}`,
    );
  } finally {
    await site.stop();
  }
});

Deno.test("each copy button on /pay names the field it copies", async () => {
  const site = await startSite();
  try {
    const html = await site.html("/pay");
    const labels = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)]
      .map((m) => visibleText(m[1]))
      .filter((t) => t.startsWith("Copy"));
    assert(
      labels.length === 7,
      `expected 7 copy buttons, found ${labels.length}`,
    );
    assert(
      !labels.includes("Copy address"),
      `a button still reads "Copy address"`,
    );
    assert(
      new Set(labels).size === labels.length,
      `two buttons share a label: ${labels.join(", ")}`,
    );
  } finally {
    await site.stop();
  }
});
