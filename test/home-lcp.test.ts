// Home LCP guard (#368): on a phone the lead paragraph is the largest
// element, and the layout work of the sections under the hero delayed its
// paint under CPU throttling. Those sections skip layout until they scroll
// near (`content-visibility: auto`); the hero must never be skipped.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { startSite } from "./harness.ts";

Deno.test("the home page's sections under the hero skip layout until near, the hero never does", async () => {
  const site = await startSite();
  try {
    const html = await site.html("/");
    const href = html.match(/<link rel="stylesheet" href="([^"]+\.css[^"]*)"/)
      ?.[1];
    assert(href, "home page links no stylesheet");
    const css = await (await site.get(href)).text();
    const rule = css.match(
      /([^{}]*\[data-home-section\][^{}]*)\{[^}]*content-visibility:\s*auto[^}]*\}/,
    );
    assert(rule, "no content-visibility rule for [data-home-section]");
    assert(
      /:not\(\[data-home-section=["']?hero["']?\]\)/.test(rule[1]),
      `the rule must exclude the hero, got "${rule[1]}"`,
    );
    const sections = [...html.matchAll(/data-home-section="([^"]+)"/g)].map((
      m,
    ) => m[1]);
    assertEquals(sections[0], "hero");
    assert(sections.length > 1, "no section under the hero");
  } finally {
    await site.stop();
  }
});
