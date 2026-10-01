// Structured-data and link-preview guard (#350). It reads the JSON-LD and the
// head tags of the pages a visitor or a crawler meets first and checks them
// against what Google's Rich Results documentation asks for each type the
// site uses, so a redesign cannot quietly break a node. The page-specific
// tests (about, how-i-work, work-jsonld, ...) pin each page's own content;
// this one pins the shape every page shares.
import { assert, assertEquals, assertMatch } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { jsonLd } from "./html.ts";

type Node = Record<string, unknown>;

/** The six sample pages from #350, one of each kind. */
const SAMPLE_PAGES = [
  "/",
  "/about",
  "/how-i-work",
  "/work/smartlite",
  "/tools/mig",
  "/blog/building-mcp-servers-with-deno",
];

/** Pages that carry the types the six samples do not (lists, offers, TechArticle, ContactPage). */
const TYPE_PAGES = [
  "/work",
  "/tools",
  "/blog",
  "/catalog",
  "/catalog/codebase-health-audit",
  "/infrastructure",
  "/book",
];

const ABSOLUTE_URL = /^https:\/\/[^\s/]+(\/\S*)?$/;
/** ISO 8601: a year, a date, or a date with a time. */
const ISO_DATE =
  /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;
/** Properties whose value is a URL (a string, or an array of strings). */
const URL_KEYS = [
  "url",
  "item",
  "image",
  "sameAs",
  "codeRepository",
  "license",
];
const DATE_KEYS = ["datePublished", "dateModified", "dateCreated"];
const FORBIDDEN_TYPES = ["Review", "AggregateRating", "Rating"];
/**
 * Every type the site renders today (all 53 sitemap pages and `/pay`: 29 types).
 * A page that starts using another one fails here until the type is listed, and
 * a type Google gives a rich result needs a case in `checkType()` first.
 */
const KNOWN_TYPES = new Set([
  "Answer",
  "Blog",
  "BlogPosting",
  "BreadcrumbList",
  "CollectionPage",
  "ContactPage",
  "ContactPoint",
  "CreativeWork",
  "FAQPage",
  "ImageObject",
  "ItemList",
  "ListItem",
  "Offer",
  "OfferCatalog",
  "Organization",
  "Person",
  "Place",
  "PriceSpecification",
  "ProfilePage",
  "PropertyValue",
  "Question",
  "Role",
  "Service",
  "SoftwareApplication",
  "SoftwareSourceCode",
  "TechArticle",
  "UnitPriceSpecification",
  "WebPage",
  "WebSite",
]);

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

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function typesOf(node: Node): string[] {
  const type = node["@type"];
  return Array.isArray(type)
    ? type.map(String)
    : typeof type === "string"
    ? [type]
    : [];
}

/** Every object under `value`, including `value` itself, with its path for messages. */
function* walk(value: unknown, path = "$"): Generator<[Node, string]> {
  if (Array.isArray(value)) {
    for (const [i, v] of value.entries()) yield* walk(v, `${path}[${i}]`);
  } else if (isNode(value)) {
    yield [value, path];
    for (const [k, v] of Object.entries(value)) yield* walk(v, `${path}.${k}`);
  }
}

/** Flattens a page's `<script type="application/ld+json">` blocks into their nodes. */
function allNodes(html: string): [Node, string][] {
  const out: [Node, string][] = [];
  for (const [i, block] of jsonLd(html).entries()) {
    assert(isNode(block), `block ${i} is not an object`);
    assertEquals(
      block["@context"],
      "https://schema.org",
      `block ${i}: @context`,
    );
    for (const [node, path] of walk(block, `block${i}`)) out.push([node, path]);
  }
  return out;
}

/** A node that names another node without describing it: `{ @id }` or `{ @type, @id }`. */
function isReference(node: Node): boolean {
  return Object.keys(node).every((k) => k === "@id" || k === "@type");
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (isNode(value) && typeof value["url"] === "string") return [value["url"]];
  return [];
}

function nonEmpty(node: Node, key: string, where: string) {
  const v = node[key];
  assert(
    typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null,
    `${where}: ${typesOf(node).join("/")} has no ${key}`,
  );
}

/** What Google's documentation lists as required (and the recommended ones this site can state). */
function checkType(
  node: Node,
  type: string,
  where: string,
  resolve: (id: string) => Node | undefined,
) {
  switch (type) {
    case "Person":
    case "Organization":
    case "WebSite":
      nonEmpty(node, "name", where);
      break;
    case "BreadcrumbList": {
      const items = node["itemListElement"];
      assert(
        Array.isArray(items) && items.length >= 1,
        `${where}: no itemListElement`,
      );
      for (const [i, item] of (items as Node[]).entries()) {
        assertEquals(item["@type"], "ListItem", `${where}: item ${i} type`);
        assertEquals(item["position"], i + 1, `${where}: item ${i} position`);
        nonEmpty(item, "name", `${where} item ${i}`);
        nonEmpty(item, "item", `${where} item ${i}`);
      }
      break;
    }
    case "FAQPage": {
      const questions = node["mainEntity"];
      assert(
        Array.isArray(questions) && questions.length >= 1,
        `${where}: no questions`,
      );
      for (const q of questions as Node[]) {
        assertEquals(q["@type"], "Question", `${where}: question type`);
        nonEmpty(q, "name", where);
        const answer = q["acceptedAnswer"];
        assert(isNode(answer), `${where}: ${q["name"]} has no acceptedAnswer`);
        assertEquals(answer["@type"], "Answer");
        nonEmpty(answer, "text", `${where} answer`);
      }
      break;
    }
    case "BlogPosting":
    case "TechArticle":
    case "Article": {
      // The /blog index lists posts as short entries; the full set belongs to the post's page.
      if (where.includes(".blogPost[")) {
        nonEmpty(node, "headline", where);
        nonEmpty(node, "url", where);
        break;
      }
      // Google: headline, image, dates and author are the recommended set.
      nonEmpty(node, "headline", where);
      assert(
        String(node["headline"]).length <= 110,
        `${where}: headline over 110 characters (a site rule: Google truncates longer ones)`,
      );
      nonEmpty(node, "image", where);
      // A post has a publication date; the infrastructure write-up is a living page with none.
      if (type === "BlogPosting") {
        nonEmpty(node, "datePublished", where);
        nonEmpty(node, "dateModified", where);
      }
      const author = node["author"];
      assert(isNode(author), `${where}: no author`);
      assert(
        author["@id"] || author["name"],
        `${where}: author has neither @id nor name`,
      );
      break;
    }
    case "ProfilePage": {
      // Google's required property: mainEntity, a Person or Organization with a name.
      const ref = node["mainEntity"];
      assert(isNode(ref), `${where}: ProfilePage has no mainEntity`);
      const entity = typeof ref["@id"] === "string" && isReference(ref)
        ? resolve(ref["@id"])
        : ref;
      assert(entity, `${where}: mainEntity points at a node the page lacks`);
      assert(
        typesOf(entity).some((t) => t === "Person" || t === "Organization"),
        `${where}: mainEntity is ${
          typesOf(entity).join("/")
        }, not a Person or Organization`,
      );
      nonEmpty(entity, "name", `${where} mainEntity`);
      break;
    }
    case "CollectionPage":
      assert(
        isNode(node["mainEntity"]),
        `${where}: CollectionPage has no mainEntity`,
      );
      break;
    case "ItemList": {
      const items = node["itemListElement"];
      assert(
        Array.isArray(items) && items.length >= 1,
        `${where}: empty ItemList`,
      );
      if (node["numberOfItems"] !== undefined) {
        assertEquals(
          node["numberOfItems"],
          items.length,
          `${where}: numberOfItems`,
        );
      }
      for (const [i, item] of (items as Node[]).entries()) {
        assertEquals(
          item["position"],
          i + 1,
          `${where}: list item ${i} position`,
        );
        assert(
          item["url"] || item["item"],
          `${where}: list item ${i} has no url`,
        );
      }
      break;
    }
    case "Offer":
      nonEmpty(node, "priceCurrency", where);
      assert(
        node["price"] !== undefined || isNode(node["priceSpecification"]),
        `${where}: Offer has neither price nor priceSpecification`,
      );
      break;
    case "SoftwareApplication":
      // Google's software rich result needs name, offers.price and an
      // aggregateRating or review. The site never marks up its own reviews, so
      // this node is entity data and can never earn that rich result; the test
      // holds it to name and, as a site rule, an author.
      nonEmpty(node, "name", where);
      assert(
        node["author"] || node["creator"],
        `${where}: no author (site rule)`,
      );
      break;
    case "SoftwareSourceCode":
      nonEmpty(node, "name", where);
      assert(
        node["author"] || node["creator"],
        `${where}: no author (site rule)`,
      );
      break;
    case "ContactPage":
    case "WebPage":
      assert(node["url"] || node["@id"], `${where}: ${type} has no url`);
      break;
  }
}

/** The checks every page's graph has to pass, whatever its types. */
export function checkGraph(html: string, page: string) {
  const entries = allNodes(html);
  assert(entries.length > 0, `${page}: no JSON-LD`);

  const defined = new Map<string, string>();
  const first = new Map<string, Node>();
  for (const [node, path] of entries) {
    const id = node["@id"];
    // `{ @id }` and `{ @type, @id }` alone only point at a node; any other node defines one.
    if (typeof id !== "string" || isReference(node)) continue;
    const earlier = first.get(id);
    if (earlier) {
      // Google reads an author inline, so a second description is allowed when it
      // repeats the first one's values and adds none that differ.
      for (const [key, value] of Object.entries(node)) {
        assertEquals(
          JSON.stringify(value),
          JSON.stringify(earlier[key]),
          `${page}: @id ${id} at ${path} disagrees with ${
            defined.get(id)
          } on ${key}`,
        );
      }
    } else {
      defined.set(id, path);
      first.set(id, node);
    }
  }

  for (const [node, path] of entries) {
    const where = `${page} ${path}`;
    const types = typesOf(node);
    for (const type of types) {
      assert(
        !FORBIDDEN_TYPES.includes(type),
        `${where}: ${type} is not allowed (self-serving)`,
      );
      assert(KNOWN_TYPES.has(type), `${where}: unexpected type ${type}`);
      checkType(node, type, where, (id) => first.get(id));
    }
    assert(
      !("review" in node) && !("aggregateRating" in node),
      `${where}: review markup`,
    );

    // A reference is `{ "@id": ... }` and nothing else.
    const id = node["@id"];
    if (typeof id === "string") {
      assertMatch(
        id,
        ABSOLUTE_URL,
        `${where}: @id is not an absolute https URL`,
      );
      // A bare `{ @id }` must resolve; a typed stub such as mainEntityOfPage's WebPage says what it is.
      // A list entry (or its `item`) and a `mentions` entry point at the page that describes the thing.
      const pointsAtItsPage =
        /\.(itemListElement\[\d+\](\.item)?|mentions\[\d+\])$/.test(path);
      if (types.length === 0 && !pointsAtItsPage) {
        assert(
          defined.has(id),
          `${where}: reference to ${id} that no node on the page defines`,
        );
      }
    }
    for (const key of URL_KEYS) {
      for (const value of strings(node[key])) {
        assertMatch(
          value,
          ABSOLUTE_URL,
          `${where}: ${key} is not an absolute https URL`,
        );
      }
    }
    for (const key of DATE_KEYS) {
      const value = node[key];
      if (value === undefined) continue;
      assert(
        typeof value === "string" && ISO_DATE.test(value),
        `${where}: ${key} ${value}`,
      );
      assert(
        !Number.isNaN(Date.parse(value)),
        `${where}: ${key} ${value} is not a real date`,
      );
    }
  }
  return { entries, defined };
}

/** Reads the value of a `<meta>` or `<link>` tag by its identifying attribute. */
function tag(
  html: string,
  kind: "meta" | "link",
  attr: string,
  value: string,
): string | null {
  for (const m of html.matchAll(new RegExp(`<${kind}\\s[^>]*>`, "g"))) {
    const tagText = m[0];
    if (!new RegExp(`\\b${attr}="${value}"`).test(tagText)) continue;
    const content = tagText.match(/\b(?:content|href)="([^"]*)"/);
    return content ? content[1].replaceAll("&amp;", "&") : null;
  }
  return null;
}

function pngSize(bytes: Uint8Array): [number, number] {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  assert(signature.every((b, i) => bytes[i] === b), "not a PNG");
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  return [view.getUint32(16), view.getUint32(20)];
}

Deno.test("the checker rejects a dangling @id, a bad date, a Review, review markup and a bad ProfilePage", () => {
  const page = (graph: unknown) =>
    `<script type="application/ld+json">${
      JSON.stringify({ "@context": "https://schema.org", "@graph": graph })
    }</script>`;
  const person = {
    "@type": "Person",
    "@id": "https://example.com/#p",
    "name": "A",
  };
  checkGraph(
    page([person, {
      "@type": "WebPage",
      "url": "https://example.com/",
      "about": { "@id": "https://example.com/#p" },
    }]),
    "ok",
  );
  const failing: [string, unknown, RegExp][] = [
    ["dangling", [person, {
      "@type": "WebPage",
      "url": "https://example.com/",
      "about": { "@id": "https://example.com/#x" },
    }], /no node on the page defines/],
    ["date", [{
      "@type": "BlogPosting",
      "headline": "h",
      "image": "https://example.com/a.png",
      "datePublished": "June 2026",
      "dateModified": "2026-06-01",
      "author": { "@id": "https://example.com/#p" },
    }, person], /datePublished/],
    ["review", [person, { "@type": "Review", "name": "x" }], /not allowed/],
    ["rating property", [{
      ...person,
      "aggregateRating": { "ratingValue": "5" },
    }], /review markup/],
    ["relative url", [{ "@type": "WebPage", "url": "/about" }], /absolute/],
    ["profile of a site", [
      { "@type": "WebSite", "@id": "https://example.com/#w", "name": "S" },
      {
        "@type": "ProfilePage",
        "mainEntity": { "@id": "https://example.com/#w" },
      },
    ], /not a Person or Organization/],
  ];
  for (const [name, graph, message] of failing) {
    let error = "";
    try {
      checkGraph(page(graph), name);
    } catch (e) {
      error = (e as Error).message;
    }
    assertMatch(error, message, `the ${name} case failed for another reason`);
  }
});

siteTest(
  "sample pages carry valid, connected JSON-LD of the types they claim",
  async (site) => {
    for (const page of [...SAMPLE_PAGES, ...TYPE_PAGES]) {
      const html = await site.html(page);
      const { entries } = checkGraph(html, page);

      // Every page: the site's Person, WebSite and NeatSoft organisation.
      const types = new Set(entries.flatMap(([n]) => typesOf(n)));
      for (const type of ["Person", "WebSite", "Organization"]) {
        assert(types.has(type), `${page}: no ${type} node`);
      }
      if (page !== "/") {
        assert(types.has("BreadcrumbList"), `${page}: no BreadcrumbList`);
      }
    }
  },
);

siteTest(
  "each sample page carries the node its kind of page needs",
  async (site) => {
    const expect: Record<string, string[]> = {
      "/": ["WebPage"],
      "/about": ["ProfilePage"],
      "/how-i-work": ["FAQPage"],
      "/work/smartlite": ["CreativeWork"],
      "/tools/mig": ["SoftwareSourceCode", "SoftwareApplication"],
      "/blog/building-mcp-servers-with-deno": ["BlogPosting"],
      "/work": ["CollectionPage", "ItemList"],
      "/tools": ["CollectionPage", "ItemList"],
      "/blog": ["Blog"],
      "/catalog/codebase-health-audit": ["Service", "Offer"],
      "/infrastructure": ["TechArticle"],
      "/book": ["ContactPage"],
    };
    for (const [page, wanted] of Object.entries(expect)) {
      const types = new Set(
        allNodes(await site.html(page)).flatMap(([n]) => typesOf(n)),
      );
      for (const type of wanted) {
        assert(
          types.has(type),
          `${page}: no ${type} node`,
        );
      }
    }
  },
);

siteTest(
  "link-preview tags are complete and point at a real 1200x630 PNG",
  async (site) => {
    const root = new URL("../static", import.meta.url).pathname;
    for (const page of [...SAMPLE_PAGES, ...TYPE_PAGES]) {
      const html = await site.html(page);
      const canonical = tag(html, "link", "rel", "canonical");
      assert(
        canonical && ABSOLUTE_URL.test(canonical),
        `${page}: canonical ${canonical}`,
      );
      assertEquals(
        tag(html, "meta", "property", "og:url"),
        canonical,
        `${page}: og:url`,
      );
      for (const name of ["og:title", "og:description"]) {
        assert(
          tag(html, "meta", "property", name)?.trim(),
          `${page}: no ${name}`,
        );
      }
      assertEquals(
        tag(html, "meta", "name", "twitter:card"),
        "summary_large_image",
        page,
      );
      assert(
        tag(html, "meta", "name", "twitter:title")?.trim(),
        `${page}: no twitter:title`,
      );

      const image = tag(html, "meta", "property", "og:image");
      assert(image && ABSOLUTE_URL.test(image), `${page}: og:image ${image}`);
      assertEquals(
        tag(html, "meta", "name", "twitter:image"),
        image,
        `${page}: twitter:image`,
      );
      const path = new URL(image).pathname;
      assert(path.endsWith(".png"), `${page}: og:image ${path} is not a PNG`);
      assertEquals(
        pngSize(await Deno.readFile(`${root}${path}`)),
        [1200, 630],
        `${page}: ${path} size`,
      );
      assertEquals(
        tag(html, "meta", "property", "og:image:width"),
        "1200",
        page,
      );
      assertEquals(
        tag(html, "meta", "property", "og:image:height"),
        "630",
        page,
      );
    }
  },
);
