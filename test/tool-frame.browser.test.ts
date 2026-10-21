// #454: the shared browser check a custom tool page's own test calls
// (`toolPageProblems()` in test/tool-frame.ts), run here on a frame page with
// no hero media (oko) and on one with a hero still (toread-today).
// test/a11y.browser.test.ts runs axe and the sideways-scroll check over every
// tool page. Needs a built site and Chromium; see docs/testing.md
// "Browser-driven tests".
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import type { Browser, Page } from "playwright";
import { encodeBase64 } from "jsr:@std/encoding@^1.0.0/base64";
import { startSite } from "./harness.ts";
import {
  launchChromium,
  newPage,
  recordUmami,
  trackedCalls,
  WAIT_MS,
} from "./browser.ts";
import { toolPageProblems } from "./tool-frame.ts";

Deno.test("the shared tool page check finds no axe violation, sideways scroll or extra h1 on a page without and with hero media", async () => {
  const site = await startSite({
    // Book renders only with a booking URL; RFC 2606 host.
    env: { SCHEDULE_URL: "https://meet.example.com/book" },
  });
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser);
    try {
      const problems: string[] = [];
      for (const slug of ["oko", "toread-today"]) {
        problems.push(
          ...await toolPageProblems(page, site.origin, `/tools/${slug}`),
        );
      }
      assertEquals(problems, []);
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("pressing a tool page's hero screenshot opens it full size and sends zoom with the tool's slug", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      await recordUmami(page);
      await page.goto(`${site.origin}/tools/toread-today`, {
        waitUntil: "networkidle",
      });
      const still = page.locator("[data-tool-media] img");
      await still.click({ timeout: WAIT_MS });
      const dialog = page.locator("dialog[open]");
      await dialog.waitFor({ timeout: WAIT_MS });
      assert(
        await dialog.locator("img").count() > 0,
        "the lightbox shows no image",
      );
      assertEquals(
        (await trackedCalls(page)).filter(([name]) => name === "zoom"),
        [["zoom", { item: "toread-today" }]],
      );
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

Deno.test("a screenshot below the hero opens full size from the keyboard", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    const page = await newPage(browser, {
      viewport: { width: 1440, height: 900 },
    });
    try {
      // toread-today's screenshot grid and Seed's "What you get" cards.
      // An image inside a link (Seed's "See it running" cards) keeps its
      // link, so the first zoomable image is the first one outside a link.
      for (const slug of ["toread-today", "seed"]) {
        await page.goto(`${site.origin}/tools/${slug}`, {
          waitUntil: "networkidle",
        });
        const shot = page.locator("[data-tool-middle] img:not(a img)").first();
        const alt = await shot.getAttribute("alt");
        await shot.waitFor({ timeout: WAIT_MS });
        assertEquals(await shot.getAttribute("role"), "button", slug);
        await shot.focus();
        await page.keyboard.press("Enter");
        const dialog = page.locator("dialog[open]");
        await dialog.waitFor({ timeout: WAIT_MS });
        assertEquals(
          await dialog.locator("img").first().getAttribute("alt"),
          alt,
          `${slug}: the lightbox shows another image`,
        );
        await page.keyboard.press("Escape");
      }
    } finally {
      await page.close();
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});

const PARCHMENT = [0xef, 0xeb, 0xe2];
const INK = [0x15, 0x12, 0x0f];

/** The share of pixels in a PNG screenshot within 24 per channel of `rgb`, decoded on a canvas in `page`. */
async function colourShare(
  page: Page,
  png: Uint8Array,
  rgb: number[],
): Promise<number> {
  const url = `data:image/png;base64,${encodeBase64(new Uint8Array(png))}`;
  return await page.evaluate(async ([src, ring]) => {
    const img = new Image();
    img.src = src as string;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(img, 0, 0);
    const { data } = context.getImageData(0, 0, img.width, img.height);
    let near = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (
        (ring as number[]).every((c, k) => Math.abs(data[i + k] - c) <= 24)
      ) near++;
    }
    return near / (data.length / 4);
  }, [url, rgb] as const);
}

Deno.test("a focused screenshot, dark or white, draws a Parchment and Ink ring inside its own edge, which its frame does not clip", async () => {
  const site = await startSite();
  let browser: Browser | undefined;
  try {
    browser = await launchChromium();
    // oko's status cards below the hero are dark screenshots; toread-today's
    // are white. Every other hero is a clip poster now, which is a link.
    const cases = [
      { slug: "oko", shot: "[data-tool-middle] img", width: 1440 },
      { slug: "toread-today", shot: "[data-tool-media] img", width: 1440 },
      { slug: "toread-today", shot: "[data-tool-middle] img", width: 390 },
    ];
    for (const { slug, shot, width } of cases) {
      const page = await newPage(browser, { viewport: { width, height: 900 } });
      try {
        const where = `${slug} ${shot} at ${width}px`;
        await page.goto(`${site.origin}/tools/${slug}`, {
          waitUntil: "networkidle",
        });
        const image = page.locator(shot).first();
        await image.scrollIntoViewIfNeeded();
        const box = (await image.boundingBox())!;
        // Two one-pixel columns on the image's left edge, away from the
        // rounded corners: the ring's outer (Parchment) and inner (Ink) tone.
        const column = (x: number) => ({
          x,
          y: Math.ceil(box.y + box.height / 4),
          width: 1,
          height: Math.floor(box.height / 2),
        });
        const outer = column(Math.ceil(box.x));
        const inner = column(Math.ceil(box.x) + 2);
        const shares = async () => [
          await colourShare(
            page,
            await page.screenshot({ clip: outer }),
            PARCHMENT,
          ),
          await colourShare(page, await page.screenshot({ clip: inner }), INK),
        ];
        const before = await shares();
        // A Tab first, so the focus that follows counts as keyboard focus.
        await page.keyboard.press("Tab");
        await image.focus();
        const after = await shares();
        assert(
          !(before[0] > 0.9 && before[1] > 0.9),
          `${where}: the edge looks focused before focus (${before})`,
        );
        assert(after[0] > 0.9, `${where}: no Parchment outer ring (${after})`);
        assert(after[1] > 0.9, `${where}: no Ink inner ring (${after})`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser?.close();
    await site.stop();
  }
});
