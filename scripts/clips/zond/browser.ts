// Browser half of the zond demo clip (shots 5-7 of #462's storyboard).
// Headless Chromium has no address bar, so a small local page draws one and
// shows zond's real answer in an iframe scaled to 250%. The status chip shows
// the status code of the iframe's real response, read from Playwright, and
// a live timer while zond answers. record.sh speeds those waits up 4x from
// waits.txt; the timer racing is what tells the viewer.
// Run by record.sh, with zond already listening on localhost:8080.
//
//   deno run -A scripts/clips/zond/browser.ts <out-dir>
import { chromium } from "playwright";
import type { Page } from "playwright";
import { clickLike, moveLike } from "./human-mouse.ts";

const W = 1280;
const H = 800;
const ZOND = "http://localhost:8080";
const outDir = Deno.args[0];
if (!outDir) throw new Error("usage: browser.ts <out-dir>");

const frame = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="color-scheme" content="dark">
<title>zond</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; height: 100%; background: #15120f; color: #efebe2;
    font: 22px/1.4 "Hack", "DejaVu Sans Mono", monospace; }
  .bar { display: flex; gap: 16px; align-items: center; height: 84px;
    padding: 0 28px; background: #1c1916; border-bottom: 1px solid #413c38;
    box-sizing: border-box; }
  .dots { display: flex; gap: 9px; }
  .dots i { width: 14px; height: 14px; border-radius: 50%; background: #413c38; }
  #url { flex: 1; height: 50px; padding: 0 20px; border-radius: 25px;
    border: 1px solid #413c38; background: #15120f; color: #efebe2; font: inherit;
    outline: none; }
  #url:focus { border-color: #857f79; }
  #url::placeholder { color: #857f79; }
  #status { min-width: 260px; text-align: right; color: #bcb7af; font-size: 20px; }
  #status b { font-weight: 600; }
  .ok { color: #83d494; } .ko { color: #f87e77; }
  .view { position: absolute; inset: 84px 0 0 0; }
  iframe { border: 0; width: 40%; height: 40%; transform: scale(2.5); transform-origin: 0 0;
    background: #15120f;
    color-scheme: dark; }
  /* Keeps mouse events in this document, so the drawn pointer keeps moving
     over the iframe. */
  .shield { position: absolute; inset: 0; }
</style></head>
<body>
  <div class="bar">
    <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
    <input id="url" placeholder="Type a URL" autocomplete="off" spellcheck="false">
    <div id="status"></div>
  </div>
  <div class="view"><iframe id="view" title="zond"></iframe><div class="shield"></div></div>
  <script>
    const url = document.getElementById("url")
    url.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return
      const status = document.getElementById("status")
      status.textContent = ""
      const sent = performance.now()
      const tick = () => {
        if (status.querySelector("b")) return
        status.textContent = "Waiting for localhost… " +
          ((performance.now() - sent) / 1000).toFixed(1) + " s"
        requestAnimationFrame(tick)
      }
      tick()
      document.getElementById("view").src = "http://" + url.value
      url.blur()
    })
  </script>
</body></html>`;

const server = Deno.serve(
  { hostname: "127.0.0.1", port: 0, onListen: () => {} },
  () =>
    new Response(frame, {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
);
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: outDir, size: { width: W, height: H } },
    colorScheme: "dark",
    locale: "en-GB",
    timezoneId: "UTC",
  });
  try {
    const pointer = { x: 900, y: 420 };
    await context.addInitScript(
      `window.__demoPointerStart = ${JSON.stringify(pointer)}`,
    );
    await context.addInitScript({
      path: new URL("./pointer.js", import.meta.url).pathname,
    });
    const page = await context.newPage();
    const t0 = Date.now();
    const waits: number[] = [];
    page.on("response", async (res) => {
      if (!res.url().startsWith(ZOND)) return;
      const code = res.status();
      const text = `${code} ${res.statusText()}`;
      await page.evaluate(([t, ok]) => {
        const el = document.getElementById("status")!;
        const took = el.textContent?.match(/([\d.]+ s)$/)?.[1];
        el.innerHTML = "";
        const b = document.createElement("b");
        b.className = ok ? "ok" : "ko";
        b.textContent = t as string;
        el.append("HTTP ", b);
        if (took) el.append(` · ${took}`);
      }, [text, code < 400]).catch(() => {});
    });
    await page.goto(`http://127.0.0.1:${server.addr.port}/`);
    await page.mouse.move(pointer.x, pointer.y);
    await page.waitForTimeout(300);
    const trim = (Date.now() - t0) / 1000;
    await page.waitForTimeout(200);

    // 5. One service that is down.
    await visit(page, pointer, "localhost:8080/health/grafana", 0, waits);
    await page.waitForTimeout(1700);
    // 6-7. Every service at once; held for the poster.
    await visit(
      page,
      pointer,
      "localhost:8080/health",
      "/grafana".length,
      waits,
    );
    await moveLike(page, pointer, { x: 1100, y: 600 });
    await page.waitForTimeout(2400);
    await Deno.writeTextFile(`${outDir}/trim.txt`, `${trim}\n`);
    const rel = waits.map((t) => ((t - t0) / 1000 - trim).toFixed(3));
    await Deno.writeTextFile(`${outDir}/waits.txt`, `${rel.join(" ")}\n`);
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
  await server.shutdown();
}

/** Clicks the address bar, deletes `erase` characters from its end, types
 *  the rest of `url` at a person's pace and loads it. Pushes the times the
 *  wait for zond's answer started and ended onto `waits`. */
async function visit(
  page: Page,
  pointer: { x: number; y: number },
  url: string,
  erase: number,
  waits: number[],
) {
  const field = page.locator("#url");
  await clickLike(page, pointer, field, H);
  await page.keyboard.press("End");
  for (let i = 0; i < erase; i++) {
    await page.keyboard.press("Backspace", { delay: 60 });
  }
  const typed = await field.inputValue();
  await page.keyboard.type(url.slice(typed.length), { delay: 60 });
  await page.waitForTimeout(350);
  await page.keyboard.press("Enter");
  waits.push(Date.now() + 150);
  await page.locator("#status b").waitFor({ timeout: 8000 });
  waits.push(Date.now() - 100);
}
