import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0"
import { buildIdProblem, checkLiveBuildId, readPage } from "./build-id-check.ts"

const ID = "abc1234"

/** A page shaped like Fresh's output, with every asset id set to `id`. */
function page(id: string, entry = "/assets/client-entry-C317UWLz.js"): string {
  return `<link rel="stylesheet" href="/assets/client-entry-Z7iSqlf_.css?__frsh_c=${id}">` +
    `<img src="/img/photo-64.webp?__frsh_c=${id}" srcset="/img/a.webp?__frsh_c=${id} 1x, /img/b.webp?__frsh_c=${id} 2x">` +
    (entry ? `<script type="module">import "${entry}"</script>` : "")
}

const script = (id: string) => `let Me="${id}";var ht="diffed"`

/** A fetch stub that answers each URL by its path. */
function stubFetch(routes: Record<string, () => Response>) {
  const urls: string[] = []
  const fetch = (input: string | URL | Request) => {
    const url = new URL(String(input))
    urls.push(url.href)
    const route = routes[url.pathname]
    if (!route) return Promise.reject(new TypeError("network error"))
    return Promise.resolve(route())
  }
  return { urls, fetch: fetch as typeof globalThis.fetch }
}

Deno.test("readPage collects each distinct __frsh_c and the client entry", () => {
  assertEquals(readPage(page(ID)), {
    assetIds: [ID],
    clientEntry: "/assets/client-entry-C317UWLz.js",
  })
})

Deno.test("buildIdProblem passes when page and script carry the build id", () => {
  assertEquals(buildIdProblem(ID, readPage(page(ID)), script(ID)), undefined)
})

Deno.test("buildIdProblem names the page id when it differs from the build id", () => {
  const html = page(ID).replace(`__frsh_c=${ID}"`, `__frsh_c=3238153851"`)
  const problem = buildIdProblem(ID, readPage(html), script(ID))
  assertEquals(problem, `the page's __frsh_c is 3238153851, expected ${ID}`)
})

Deno.test("buildIdProblem names the script when it lacks the build id", () => {
  const problem = buildIdProblem(ID, readPage(page(ID)), script("3441718447"))
  assertEquals(
    problem,
    `/assets/client-entry-C317UWLz.js does not carry the build id "${ID}"`,
  )
})

Deno.test("buildIdProblem fails a page without any __frsh_c", () => {
  const html =
    `<script type="module">import "/assets/client-entry-X.js"</script>`
  assertEquals(
    buildIdProblem(ID, readPage(html), script(ID)),
    "the page has no __frsh_c asset id",
  )
})

Deno.test("buildIdProblem fails a page without a client-entry script", () => {
  assertEquals(
    buildIdProblem(ID, readPage(page(ID, "")), undefined),
    "the page links no client-entry script",
  )
})

Deno.test("checkLiveBuildId reads the page past the edge cache and its script", async () => {
  const { urls, fetch } = stubFetch({
    "/tools": () => new Response(page(ID)),
    "/assets/client-entry-C317UWLz.js": () => new Response(script(ID)),
  })
  await checkLiveBuildId("example.com", ID, fetch)
  assertEquals(urls.length, 2)
  assertStringIncludes(urls[0], "https://example.com/tools?deploy-check=")
  assertEquals(urls[1], "https://example.com/assets/client-entry-C317UWLz.js")
})

Deno.test("checkLiveBuildId throws naming the page id and the build id", async () => {
  const { fetch } = stubFetch({
    "/tools": () => new Response(page("3238153851")),
    "/assets/client-entry-C317UWLz.js": () => new Response(script(ID)),
  })
  const error = await assertRejects(() =>
    checkLiveBuildId("example.com", ID, fetch)
  )
  assertStringIncludes(String(error), `__frsh_c is 3238153851, expected ${ID}`)
})

Deno.test("checkLiveBuildId throws when the page answers an error status", async () => {
  const { fetch } = stubFetch({
    "/tools": () => new Response("down", { status: 502 }),
  })
  const error = await assertRejects(() =>
    checkLiveBuildId("example.com", ID, fetch)
  )
  assertStringIncludes(String(error), "answered 502")
})

Deno.test("checkLiveBuildId passes a network failure on as a rejection", async () => {
  const { fetch } = stubFetch({})
  await assertRejects(
    () => checkLiveBuildId("example.com", ID, fetch),
    TypeError,
  )
})
