// The guards in rendered.test.ts and structure.test.ts stand on these helpers.
// A reviewer made visibleText keep <script> bodies and the FAQ guard went green
// against a broken page, because the JSON-LD it checks lives inside a <script>.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { count, jsonLd, visibleText } from "./html.ts";

const PAGE = `<html><head><style>.a{color:red}</style>
<script type="application/ld+json">{"@type":"FAQPage","secret":"only in json"}</script>
<script type="application/ld+json">{"@type":"Person"}</script>
<script>var hidden = "only in script"</script></head>
<body><h1>Title &amp; more</h1><p>Shown   text</p><img alt="x"><img alt="y"></body></html>`;

Deno.test("visibleText drops script and style bodies and keeps the shown text", () => {
  const text = visibleText(PAGE);
  assert(!text.includes("only in json"), text);
  assert(!text.includes("only in script"), text);
  assert(!text.includes("color:red"), text);
  assert(text.includes("Title & more"), text);
  assert(text.includes("Shown text"), text);
});

Deno.test("jsonLd parses every ld+json block and nothing else", () => {
  assertEquals(
    jsonLd(PAGE).map((d) => (d as { "@type": string })["@type"]),
    ["FAQPage", "Person"],
  );
});

Deno.test("count counts every match", () => {
  assertEquals(count(PAGE, /<img\b/g), 2);
  assertEquals(count(PAGE, /<video\b/g), 0);
});
