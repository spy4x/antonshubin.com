import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { webpForPng } from "./image-path.ts";

Deno.test("webpForPng swaps .png extension for .webp", () => {
  assertEquals(
    webpForPng("/img/projects/foo/01-home.png"),
    "/img/projects/foo/01-home.webp",
  );
});

Deno.test("webpForPng handles uppercase .PNG", () => {
  assertEquals(
    webpForPng("/img/projects/foo/01-home.PNG"),
    "/img/projects/foo/01-home.webp",
  );
  assertEquals(
    webpForPng("/img/projects/foo/01-home.Png"),
    "/img/projects/foo/01-home.webp",
  );
});

Deno.test("webpForPng returns null for non-png inputs", () => {
  assertEquals(webpForPng("/img/projects/foo/01-home.webp"), null);
  assertEquals(webpForPng("/img/projects/foo/01-home.jpg"), null);
  assertEquals(webpForPng("/img/projects/foo/01-home"), null);
});

Deno.test("webpForPng returns null for empty / weird inputs", () => {
  assertEquals(webpForPng(""), null);
  assertEquals(webpForPng(".png"), ".webp");
  assertEquals(webpForPng("a.png"), "a.webp");
});
