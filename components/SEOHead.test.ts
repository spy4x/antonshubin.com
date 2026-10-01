import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { headTags } from "./SEOHead.tsx";
import type { PageHead } from "../lib/head.ts";

const page: PageHead = {
  title: "Page — Anton Shubin",
  description: "A page.",
  canonical: "https://antonshubin.com/page",
  ogImage: "https://antonshubin.com/img/og/default.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogType: "website",
};

const names = (head: PageHead) =>
  headTags(head).map((tag) =>
    tag.tag === "title" ? "title" : tag.attrs.name ?? tag.attrs.property ??
      tag.attrs.rel
  );

Deno.test("head tags keep the site's order: creator after site, image size after image", () => {
  assertEquals(names(page), [
    "title",
    "description",
    "canonical",
    "robots",
    "twitter:card",
    "twitter:site",
    "twitter:creator",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "og:type",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:site_name",
    "og:locale",
  ]);
});

Deno.test("a page whose og:image size is unknown prints no og:image:width or height", () => {
  const tags = names({
    ...page,
    ogImageWidth: undefined,
    ogImageHeight: undefined,
  });
  assertEquals(tags.includes("og:image:width"), false);
  assertEquals(tags.includes("og:image:height"), false);
  assertEquals(tags.includes("og:image"), true);
});
