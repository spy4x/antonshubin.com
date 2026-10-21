import { assertEquals } from "jsr:@std/assert@^1.0.0"
import { dropModulePreload } from "./late-scripts.ts"

Deno.test("dropModulePreload removes the modulepreload entries and keeps the others", () => {
  const headers = new Headers({
    link:
      '</assets/a.js>; rel="modulepreload"; as="script", <https://stats.example.com>; rel="preconnect", </assets/b.js>; rel="modulepreload"; as="script"',
  })
  dropModulePreload(headers)
  assertEquals(
    headers.get("link"),
    '<https://stats.example.com>; rel="preconnect"',
  )
})

Deno.test("dropModulePreload deletes a Link header that held only modulepreloads", () => {
  const headers = new Headers({
    link: '</assets/a.js>; rel="modulepreload"; as="script"',
  })
  dropModulePreload(headers)
  assertEquals(headers.has("link"), false)
})
