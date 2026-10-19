/**
 * Records the /tools/oko demo clip (#464) from a staged dashboard:
 *
 *   deno run -A scripts/clips/oko/record.ts [--warmup 600] [--out static/video/tools/oko]
 *
 * It starts oko, gatus and a few nginx "services" on a Docker network of their
 * own, with the example.com catalog in this folder. gatus checks them over
 * `--warmup` seconds so the 30-day uptime pills hold real numbers: the Git
 * service is stopped for 30 s on the way, and Email is stopped for the last
 * 75 s, so it shows as down. File sync has no gatus endpoint, so it shows as
 * unknown. Then it records the browser (dashboard, reload, search, hover),
 * pauses the browser while `vhs` records `edit.tape` pasting a service into
 * the same config.json oko serves, and joins the three parts into
 * demo.webm, demo.mp4 and poster.webp (plus poster-640.webp). Containers, network, browser and the
 * work directory are removed on success, failure and Ctrl-C.
 *
 * Needs Docker, vhs, ffmpeg, openssl, nano and the pinned Playwright Chromium.
 * Not part of `deno task check`.
 */
import { join, resolve } from "@std/path";
import { chromium, type Page } from "playwright";
import { moveLike } from "./human-mouse.ts";

export const HERE = resolve(new URL(".", import.meta.url).pathname);
export const ROOT = resolve(HERE, "../../..");
/** Pinned by digest, so a new release cannot change the clip unnoticed. */
const IMAGES = {
  oko:
    "ghcr.io/spy4x/oko@sha256:f315d02506878db813c559ccc01d4d176585d4981a27e93e0ed1da3ac08db860",
  gatus:
    "twinproduction/gatus@sha256:215787ef82f7bd16c3b8e9055630b66f938914c8ff764ef9508e7d1d4d550bf0",
  nginx:
    "nginx@sha256:892bb2152464f0c5d8972593a5f5afaf8054552580b699d95f8ff4af08c2d33d",
};
const W = 1280;
const H = 800;
const MAX_BYTES = 2.5 * 1024 * 1024;

interface Args {
  warmup: number;
  out: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { warmup: 600, out: join(ROOT, "static/video/tools/oko") };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--warmup") args.warmup = Number(argv[++i]);
    else if (argv[i] === "--out") args.out = resolve(argv[++i]);
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!(args.warmup >= 120)) {
    throw new Error("--warmup must be at least 120 seconds");
  }
  return args;
}

/** Runs a command, throws with its output when it fails. */
export async function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number } = {},
) {
  const out = await new Deno.Command(cmd, {
    args,
    cwd: opts.cwd,
    stdout: "piped",
    stderr: "piped",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
  }).output();
  const text = new TextDecoder().decode(out.stdout) +
    new TextDecoder().decode(out.stderr);
  if (!out.success) {
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${text}`);
  }
  return text.trim();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const log = (msg: string) =>
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

/** A throwaway CA and a certificate for uptime.example.com, because oko
 *  talks to gatus over HTTPS only. */
export async function makeCerts(dir: string) {
  await Deno.mkdir(dir);
  const ssl = (...a: string[]) => run("openssl", a, { cwd: dir });
  const ec = ["-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:P-256", "-nodes"];
  await ssl(
    "req",
    "-x509",
    ...ec,
    "-keyout",
    "ca-key.pem",
    "-out",
    "ca.pem",
    "-days",
    "2",
    "-subj",
    "/CN=oko demo CA",
  );
  await ssl(
    "req",
    ...ec,
    "-keyout",
    "uptime-key.pem",
    "-out",
    "uptime.csr",
    "-subj",
    "/CN=uptime.example.com",
  );
  await Deno.writeTextFile(
    join(dir, "san.ext"),
    "subjectAltName=DNS:uptime.example.com\n",
  );
  await ssl(
    "x509",
    "-req",
    "-in",
    "uptime.csr",
    "-CA",
    "ca.pem",
    "-CAkey",
    "ca-key.pem",
    "-CAcreateserial",
    "-days",
    "2",
    "-out",
    "uptime.pem",
    "-extfile",
    "san.ext",
  );
  for (const f of ["ca.pem", "uptime.pem", "uptime-key.pem"]) {
    await Deno.chmod(join(dir, f), 0o644);
  }
}

/** Starts the staged services; returns oko's local URL. */
export async function stage(net: string, work: string): Promise<string> {
  const docker = (...a: string[]) => run("docker", a);
  await docker("network", "create", net);
  const aliases = [
    "books",
    "photos",
    "links",
    "notes",
    "passwords",
    "cal",
    "speed",
  ]
    .flatMap((h) => ["--network-alias", `${h}.example.com`]);
  await docker(
    "run",
    "-d",
    "--name",
    `${net}-web`,
    "--network",
    net,
    ...aliases,
    IMAGES.nginx,
  );
  await docker(
    "run",
    "-d",
    "--name",
    `${net}-git`,
    "--network",
    net,
    "--network-alias",
    "git.example.com",
    IMAGES.nginx,
  );
  await docker(
    "run",
    "-d",
    "--name",
    `${net}-mail`,
    "--network",
    net,
    "--network-alias",
    "mail.example.com",
    IMAGES.nginx,
  );
  await docker(
    "run",
    "-d",
    "--name",
    `${net}-gatus`,
    "--network",
    net,
    "--network-alias",
    "uptime.example.com",
    "-v",
    `${join(work, "gatus.yaml")}:/config/config.yaml:ro,z`,
    "-v",
    `${join(work, "certs")}:/certs:ro,z`,
    IMAGES.gatus,
  );
  await docker(
    "run",
    "-d",
    "--name",
    `${net}-oko`,
    "--network",
    net,
    "-p",
    "127.0.0.1::8080",
    "-e",
    "DOMAIN=example.com",
    "-e",
    "UPTIME_HOSTS=uptime.example.com",
    "-e",
    "CONFIG_PATH=/config/config.json",
    "-e",
    "SSL_CERT_FILE=/certs/ca.pem",
    "-v",
    `${join(work, "stage")}:/config:ro,z`,
    "-v",
    `${join(work, "certs")}:/certs:ro,z`,
    IMAGES.oko,
  );
  const port = (await docker("port", `${net}-oko`, "8080/tcp")).split("\n")[0]
    .split(":").pop();
  const url = `http://127.0.0.1:${port}/`;
  const deadline = Date.now() + 30_000;
  while (true) {
    try {
      if ((await fetch(url)).ok) return url;
    } catch { /* not listening yet */ }
    if (Date.now() > deadline) {
      throw new Error(`oko did not answer at ${url} within 30 s`);
    }
    await sleep(500);
  }
}

/** Lets gatus build history: a short Git outage, then Email goes down. */
async function warmUp(net: string, seconds: number) {
  const docker = (...a: string[]) => run("docker", a);
  const t0 = Date.now();
  const at = (s: number) => sleep(Math.max(0, t0 + s * 1000 - Date.now()));
  log(`warming up gatus for ${seconds} s`);
  await at(seconds * 0.3);
  log("Git service down for 30 s");
  await docker("stop", "-t", "1", `${net}-git`);
  await at(seconds * 0.3 + 30);
  await docker("start", `${net}-git`);
  await at(seconds - 75);
  log("Email down from here on");
  await docker("stop", "-t", "1", `${net}-mail`);
  await at(seconds);
}

interface Marks {
  start: number;
  editStart: number;
  editEnd: number;
  end: number;
}

/** Records the browser parts; `edit` runs while the browser idles. */
async function recordBrowser(
  url: string,
  work: string,
  edit: () => Promise<void>,
) {
  const browser = await chromium.launch();
  const videoDir = join(work, "video");
  try {
    const context = await browser.newContext({
      viewport: { width: W, height: H },
      recordVideo: { dir: videoDir, size: { width: W, height: H } },
      colorScheme: "dark",
      timezoneId: "UTC",
      locale: "en-US",
    });
    const pointer = { x: 1060, y: 150 };
    await context.addInitScript(
      `window.__demoPointerStart = ${JSON.stringify(pointer)}`,
    );
    await context.addInitScript({ path: join(HERE, "pointer.js") });
    await context.addInitScript({ path: join(HERE, "keys.js") });
    const page = await context.newPage();
    const t0 = Date.now();
    const now = () => (Date.now() - t0) / 1000;
    const card = (name: string) =>
      page.locator(".service").filter({
        has: page.getByText(name, { exact: true }),
      }).first();
    const glideTo = async (p: Page, name: string) => {
      const box = await card(name).boundingBox();
      if (!box) throw new Error(`no card ${name}`);
      await moveLike(p, pointer, {
        x: Math.round(box.x + box.width * 0.55),
        y: Math.round(box.y + box.height * 0.45),
      });
    };
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.mouse.move(pointer.x, pointer.y);
    await page.waitForTimeout(300);
    const marks: Marks = { start: now(), editStart: 0, editEnd: 0, end: 0 };

    // 1. The dashboard: sections, cards, pills, the section counters.
    await page.waitForTimeout(1800);
    const counter = page.locator(".section").nth(1).locator(".pill").first();
    const cbox = await counter.boundingBox();
    if (!cbox) throw new Error("no section counter");
    await moveLike(page, pointer, {
      x: Math.round(cbox.x + cbox.width / 2),
      y: Math.round(cbox.y + cbox.height + 14),
    });
    await page.waitForTimeout(1800);
    marks.editStart = now();

    // 2. The editor (vhs) while the browser waits; cut out of the clip.
    await edit();
    marks.editEnd = now();

    // 3. Reload: the new card is there, with its pill. No restart.
    await page.evaluate(() =>
      (globalThis as unknown as { __demoKey(k: string): void }).__demoKey("F5")
    );
    await page.waitForTimeout(800);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await page.waitForTimeout(700);
    await glideTo(page, "Speed test");
    await page.waitForTimeout(1600);

    // 4. Search: oko focuses the box on load, so typing filters at once.
    await page.keyboard.type("pho", { delay: 180 });
    await page.waitForTimeout(1800);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1200);

    // 5. The down card, then the dashed unknown card.
    await glideTo(page, "Email");
    await page.waitForTimeout(1400);
    await glideTo(page, "File sync");
    await page.waitForTimeout(1400);

    // 6. Final frame: the whole dashboard, pointer out of the way.
    await moveLike(page, pointer, { x: 1180, y: 120 });
    await page.waitForTimeout(2400);
    marks.end = now();

    const video = page.video();
    const closedAt = now();
    await context.close();
    if (!video) throw new Error("no video was recorded");
    const path = await video.path();
    // The video starts a moment after newPage() returns, so wall-clock marks
    // run ahead of it. The gap is the wall time at close minus the video's
    // length; shift every mark back by it.
    const length = Number(
      await run("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        path,
      ]),
    );
    const lag = Math.max(0, closedAt - length);
    log(`video lags the clock by ${lag.toFixed(3)} s`);
    for (const k of Object.keys(marks) as (keyof Marks)[]) {
      marks[k] = Math.max(0, marks[k] - lag);
    }
    return { path, marks };
  } finally {
    await browser.close();
  }
}

/** Joins browser, editor and browser parts and encodes the deliverables. */
async function encode(
  browserVideo: string,
  editVideo: string,
  m: Marks,
  out: string,
  work: string,
) {
  const joined = join(work, "joined.mkv");
  const f = (n: number) => n.toFixed(3);
  const norm = `fps=30,scale=${W}:${H}:flags=lanczos,setsar=1,format=yuv420p`;
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    browserVideo,
    "-i",
    editVideo,
    "-filter_complex",
    `[0:v]trim=${f(m.start)}:${
      f(m.editStart)
    },setpts=PTS-STARTPTS,${norm}[a];` +
    `[1:v]setpts=PTS-STARTPTS,${norm}[b];` +
    `[0:v]trim=${f(m.editEnd)}:${f(m.end)},setpts=PTS-STARTPTS,${norm}[c];` +
    `[a][b][c]concat=n=3:v=1:a=0[v]`,
    "-map",
    "[v]",
    "-an",
    "-c:v",
    "ffv1",
    joined,
  ], { timeoutMs: 300_000 });
  await Deno.mkdir(out, { recursive: true });
  const mp4 = join(out, "demo.mp4");
  const webm = join(out, "demo.webm");
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    joined,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4,
  ], { timeoutMs: 300_000 });
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    joined,
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "40",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-deadline",
    "good",
    "-cpu-used",
    "2",
    webm,
  ], { timeoutMs: 600_000 });
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-sseof",
    "-0.5",
    "-i",
    joined,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "85",
    join(out, "poster.webp"),
  ]);
  // The phone's poster, for the hero's srcset.
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    join(out, "poster.webp"),
    "-vf",
    "scale=640:-1:flags=lanczos",
    "-c:v",
    "libwebp",
    "-quality",
    "85",
    join(out, "poster-640.webp"),
  ]);
  for (const file of [mp4, webm]) {
    const { size } = await Deno.stat(file);
    log(`${file}: ${(size / 1024 / 1024).toFixed(2)} MB`);
    if (size > MAX_BYTES) {
      throw new Error(`${file} is over 2.5 MB; raise its -crf`);
    }
  }
}

async function main() {
  const args = parseArgs(Deno.args);
  const work = await Deno.makeTempDir({ prefix: "oko-clip-" });
  const net = `oko-clip-${Date.now().toString(36)}`;
  const cleanup = async () => {
    for (const c of ["oko", "gatus", "web", "git", "mail"]) {
      await run("docker", ["rm", "-f", "-v", `${net}-${c}`]).catch(() => {});
    }
    await run("docker", ["network", "rm", net]).catch(() => {});
    await Deno.remove(work, { recursive: true }).catch(() => {});
  };
  const onSignal = () => cleanup().finally(() => Deno.exit(130));
  Deno.addSignalListener("SIGINT", onSignal);
  Deno.addSignalListener("SIGTERM", onSignal);
  try {
    await makeCerts(join(work, "certs"));
    await Deno.mkdir(join(work, "stage"));
    await Deno.copyFile(
      join(HERE, "config.json"),
      join(work, "stage/config.json"),
    );
    await Deno.copyFile(join(HERE, "gatus.yaml"), join(work, "gatus.yaml"));
    await Deno.copyFile(join(HERE, "nanorc"), join(work, "stage/nanorc"));
    await Deno.copyFile(join(HERE, "edit.tape"), join(work, "stage/edit.tape"));
    const url = await stage(net, work);
    log(`oko at ${url}`);
    await warmUp(net, args.warmup);
    // Fill oko's cache now, so the first frame already has every pill.
    await fetch(`${url}?refresh=1`).then((r) => r.body?.cancel());
    const edit = async () => {
      log("recording the editor");
      await run("vhs", ["edit.tape"], {
        cwd: join(work, "stage"),
        timeoutMs: 180_000,
      });
      JSON.parse(await Deno.readTextFile(join(work, "stage/config.json")));
    };
    log("recording the browser");
    const { path, marks } = await recordBrowser(url, work, edit);
    log(`marks ${JSON.stringify(marks)}`);
    await encode(path, join(work, "stage/edit.mp4"), marks, args.out, work);
    log(`done: ${args.out}`);
  } finally {
    Deno.removeSignalListener("SIGINT", onSignal);
    Deno.removeSignalListener("SIGTERM", onSignal);
    await cleanup();
  }
}

if (import.meta.main) await main();
