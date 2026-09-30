// #318: every Umami event on the built site is one of the closed list in
// lib/analytics.ts, with its detail in `data-umami-event-<key>` properties,
// and the pages whose URL carries a credential or payment details never load
// the tracker. The type checker already rejects a misspelt name passed to
// `eventAttrs()`; this catches a hand-written `data-umami-event="..."` string,
// a raw attribute in rendered post markdown, and a missing property.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { count } from "./html.ts";
import { ANALYTICS_EVENTS, type EventProps, PLACES } from "../lib/analytics.ts";

/** Every property key an event may carry; a `Record` so a new key in `EventProps` fails type checking here. */
const PROP_KEYS: Record<keyof EventProps, true> = {
  place: true,
  item: true,
  to: true,
  target: true,
  field: true,
  reason: true,
  service: true,
};

/** The properties each clicked event must carry, per the table in #318. */
const REQUIRED: Partial<Record<string, (keyof EventProps)[]>> = {
  book: ["place"],
  brief: ["place"],
  cta: ["place", "target"],
  outbound: ["to"],
  "tool-install-copy": ["item"],
};

/** RFC 2606 hosts: nothing is fetched from them. */
const ENV = {
  SCHEDULE_URL: "https://meet.example.com",
  UMAMI_URL: "https://stats.example.com/script.js",
  UMAMI_ID: "test-website-id",
};

/** A plain browser, so the tracker decision is about the path, not a crawler. */
const BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

async function sitemapPaths(site: Site): Promise<string[]> {
  const xml = await site.html("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    new URL(m[1]).pathname
  );
}

/** Fetches `path` as a browser, whatever its status, and returns the body. */
async function body(site: Site, path: string): Promise<string> {
  const res = await site.get(path, { headers: { "user-agent": BROWSER } });
  return await res.text();
}

/** Every opening tag that carries `data-umami-event`. */
function eventTags(html: string): string[] {
  return [...html.matchAll(/<[a-z][^>]*\bdata-umami-event="[^>]*>/g)].map((
    m,
  ) => m[0]);
}

Deno.test("every Umami event on the site is in the closed list, with its properties", async (t) => {
  const site = await startSite({ env: ENV });
  try {
    const paths = [
      ...await sitemapPaths(site),
      "/pay",
      "/blog/no-such-post",
    ];
    assert(paths.length > 10, "sitemap.xml is nearly empty");
    const seen = new Set<string>();
    for (const path of paths) {
      await t.step(path, async () => {
        for (const tag of eventTags(await body(site, path))) {
          const name = tag.match(/\bdata-umami-event="([^"]*)"/)![1];
          seen.add(name);
          assert(
            (ANALYTICS_EVENTS as readonly string[]).includes(name),
            `${path}: "${name}" is not an event in lib/analytics.ts: ${tag}`,
          );
          const props = Object.fromEntries(
            [...tag.matchAll(/\bdata-umami-event-([a-z]+)="([^"]*)"/g)].map((
              m,
            ) => [m[1], m[2]]),
          );
          for (const key of Object.keys(props)) {
            assert(key in PROP_KEYS, `${path}: unknown property "${key}"`);
          }
          // A subdomain of this site goes by its short id ("dash", "meet"),
          // so one destination is one row in Umami, not two.
          assert(
            !props.to?.endsWith("antonshubin.com"),
            `${path}: outbound "to" is a host, not a short id: ${tag}`,
          );
          if (props.place) {
            assert(
              (PLACES as readonly string[]).includes(props.place),
              `${path}: unknown place "${props.place}": ${tag}`,
            );
          }
          for (const key of REQUIRED[name] ?? []) {
            assert(props[key], `${path}: ${name} without ${key}: ${tag}`);
          }
        }
      });
    }
    // The walk reached the events the pages are built around, so the loop
    // above did not pass on pages that render none.
    for (const name of ["book", "brief", "cta", "outbound"]) {
      assert(seen.has(name), `no page renders a "${name}" event`);
    }
  } finally {
    await site.stop();
  }
});

Deno.test("the unsubscribe and payment pages load no Umami script, other pages do", async () => {
  const site = await startSite({ env: ENV });
  try {
    for (
      const path of [
        "/unsubscribe?token=abc",
        "/unsubscribe",
        "/subscribe/confirm?token=abc",
        "/pay",
      ]
    ) {
      const html = await body(site, path);
      assert(html.includes("<main"), `${path} did not render a page`);
      assertEquals(
        count(html, /stats\.example\.com|data-website-id=/g),
        0,
        `${path} loads the Umami script or connects to it`,
      );
    }
    assertEquals(
      count(
        await body(site, "/book"),
        /data-website-id="test-website-id"/g,
      ),
      1,
      "/book is missing the Umami script, so the check above proves nothing",
    );
  } finally {
    await site.stop();
  }
});
