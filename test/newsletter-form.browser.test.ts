// Browser-driven guard for #733: the newsletter form a visitor fills in on
// /blog posts its honeypot field, empty, next to the address, since
// /api/subscribe refuses a body without it. Runs under `deno task test:browser`
// (docs/testing.md, "Rendered-page tests").
import { assertEquals } from "jsr:@std/assert@^1.0.0"
import type { Browser, Route } from "playwright"
import { startSite } from "./harness.ts"
import { launchChromium, newPage, WAIT_MS } from "./browser.ts"

Deno.test("the newsletter form posts its empty honeypot field with the address and shows the confirm note", async () => {
  const site = await startSite()
  let browser: Browser | undefined
  try {
    browser = await launchChromium()
    const page = await newPage(browser)
    try {
      const posted: unknown[] = []
      await page.route("**/api/subscribe", (route: Route) => {
        posted.push(route.request().postDataJSON())
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        })
      })
      // `networkidle` waits out the island's script, so submit runs its fetch.
      await page.goto(`${site.origin}/blog`, { waitUntil: "networkidle" })
      const form = page.locator("[data-newsletter-ask] form")
      await form.getByLabel("Email address").fill("reader@example.com")
      await form.getByRole("button", { name: "Subscribe" }).click()
      await form.getByText("Check your inbox to confirm your address.")
        .waitFor({ timeout: WAIT_MS })

      assertEquals(posted, [{ email: "reader@example.com", "hp-field": "" }])
    } finally {
      await page.close()
    }
  } finally {
    await browser?.close()
    await site.stop()
  }
})
