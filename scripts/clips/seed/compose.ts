/**
 * Joins the recorded scenes of the Seed demo clip into one silent 1440x900,
 * 30 fps video and encodes the deliverables with ffmpeg:
 * `demo.webm` (VP9), `demo.mp4` (H.264, yuv420p, faststart) and `poster.webp`
 * (the last frame: the Notes list with the new note on top).
 *
 * Terminal scenes play at real speed except the waits for a command that ran
 * longer than `LONG_WAIT_S`, which are squeezed to `SQUEEZED_S` under a
 * "Sped up N×" caption. The start of scene 2 carries a caption for the cut
 * that hides the secrets. Browser scenes are trimmed to `cuts.json` and set
 * inside the drawn browser window.
 *
 * Usage: deno run -A scripts/clips/seed/compose.ts <work-dir> <out-dir>
 * `<work-dir>` holds what record.sh made: terminal-1.mp4, terminal-2.mp4,
 * log-1/, log-2/ and browser/cuts.json. CLIP_DENO_CONFIG names the deno.json
 * whose import map gives overlays.ts its Playwright.
 */

/** A command whose wait is longer than this is sped up. */
const LONG_WAIT_S = 1.5
/** How long a sped-up wait lasts in the clip. */
const SQUEEZED_S = 0.9
/** Hidden setup ends with `Sleep 500ms` before `Show`: the video starts there. */
const SHOW_DELAY_S = 0.5
const CUT_CAPTION = "Secrets filled in off camera"
const CUT_CAPTION_S = 2

interface Piece {
  input: string
  from: number
  to: number
  speed: number
  /** PNG layered over the whole piece. */
  overlays: string[]
  /** The input is a browser page video, set at (32, 72) on the ink background. */
  page: boolean
}

interface Cut {
  scene: string
  file: string
  start: number
  end: number
}

async function ffmpeg(args: string[]): Promise<void> {
  const { code, stderr } = await new Deno.Command("ffmpeg", {
    args: ["-hide_banner", "-loglevel", "error", "-y", ...args],
    stderr: "piped",
  }).output()
  if (code !== 0) {
    throw new Error(`ffmpeg failed: ${new TextDecoder().decode(stderr)}`)
  }
}

async function duration(file: string): Promise<number> {
  const { stdout } = await new Deno.Command("ffprobe", {
    args: [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      file,
    ],
    stdout: "piped",
  }).output()
  return Number(new TextDecoder().decode(stdout).trim())
}

async function times(file: string): Promise<number[]> {
  return (await Deno.readTextFile(file)).trim().split("\n").filter(Boolean).map(
    Number,
  )
}

/**
 * Splits a terminal scene into real-speed and sped-up pieces from its logs:
 * `end[0]` is the first prompt (the video starts `SHOW_DELAY_S` later), and
 * command `i` runs from `start[i]` to `end[i + 1]`.
 */
export function terminalPieces(
  input: string,
  length: number,
  start: number[],
  end: number[],
  caption: (speed: number) => string,
): Piece[] {
  const t0 = end[0] + SHOW_DELAY_S
  const pieces: Piece[] = []
  let at = 0
  for (const [i, began] of start.entries()) {
    const from = began - t0 + 0.1
    const to = end[i + 1] - t0 - 0.05
    if (to - from <= LONG_WAIT_S) continue
    pieces.push({
      input,
      from: at,
      to: from,
      speed: 1,
      overlays: [],
      page: false,
    })
    const speed = (to - from) / SQUEEZED_S
    pieces.push({
      input,
      from,
      to,
      speed,
      overlays: [caption(speed)],
      page: false,
    })
    at = to
  }
  pieces.push({
    input,
    from: at,
    to: length,
    speed: 1,
    overlays: [],
    page: false,
  })
  return pieces.filter((p) => p.to - p.from > 0.02)
}

/** Encodes one piece to a near-lossless 1440x900, 30 fps intermediate. */
async function render(piece: Piece, file: string): Promise<void> {
  const inputs = [
    "-ss",
    piece.from.toFixed(3),
    "-to",
    piece.to.toFixed(3),
    "-i",
    piece.input,
  ]
  for (const png of piece.overlays) inputs.push("-i", png)
  const chain: string[] = []
  let last = "[0:v]setpts=(PTS-STARTPTS)/" + piece.speed.toFixed(4) + ",fps=30"
  if (piece.page) {
    chain.push(`color=c=0x15120f:s=1440x900:r=30[bg]`)
    chain.push(`${last}[p]`)
    last = `[bg][p]overlay=32:72:shortest=1`
  }
  piece.overlays.forEach((_, i) => {
    chain.push(`${last}[l${i}]`)
    last = `[l${i}][${i + 1}:v]overlay`
  })
  chain.push(`${last},format=yuv420p[out]`)
  await ffmpeg([
    ...inputs,
    "-filter_complex",
    chain.join(";"),
    "-map",
    "[out]",
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "8",
    "-preset",
    "veryfast",
    file,
  ])
}

async function main() {
  const [work, out] = Deno.args
  if (!work || !out) throw new Error("usage: compose.ts <work-dir> <out-dir>")
  const captions = new Map<string, string>()
  const captionFor = (speed: number) => {
    const text = `Sped up ${Math.round(speed)}×`
    if (!captions.has(text)) {
      captions.set(text, `${work}/caption-${captions.size}.png`)
    }
    return captions.get(text)!
  }

  const pieces: Piece[] = []
  for (const n of [1, 2]) {
    const input = `${work}/terminal-${n}.mp4`
    const scene = terminalPieces(
      input,
      await duration(input),
      await times(`${work}/log-${n}/start`),
      await times(`${work}/log-${n}/end`),
      captionFor,
    )
    if (n === 2) {
      // The hard cut after scene 1 hides the secrets: say so over the first seconds.
      const first = scene[0]
      const split = Math.min(first.to, first.from + CUT_CAPTION_S)
      scene.splice(0, 1, {
        ...first,
        to: split,
        overlays: [`${work}/caption-cut.png`],
      }, {
        ...first,
        from: split,
      })
    }
    pieces.push(...scene.filter((p) => p.to - p.from > 0.02))
  }
  const cuts = JSON.parse(
    await Deno.readTextFile(`${work}/browser/cuts.json`),
  ) as Cut[]
  const frames: Record<string, string> = {
    app: `${work}/frame-app.localhost.png`,
    admin: `${work}/frame-admin.localhost.png`,
    result: `${work}/frame-app.localhost.png`,
  }
  for (const cut of cuts) {
    pieces.push({
      input: cut.file,
      from: cut.start,
      to: cut.end,
      speed: 1,
      overlays: [frames[cut.scene]],
      page: true,
    })
  }

  // The layers are drawn now that the caption texts are known.
  const overlays = new URL("./overlays.ts", import.meta.url).pathname
  const config = Deno.env.get("CLIP_DENO_CONFIG")
  const texts = [...captions.keys()]
  const drawn = await new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      ...(config ? ["--config", config] : []),
      overlays,
      work,
      "app.localhost",
      "admin.localhost",
      "--",
      ...texts,
      CUT_CAPTION,
    ],
  }).output()
  if (drawn.code !== 0) throw new Error(new TextDecoder().decode(drawn.stderr))
  await Deno.rename(
    `${work}/caption-${texts.length}.png`,
    `${work}/caption-cut.png`,
  )

  const list: string[] = []
  for (const [i, piece] of pieces.entries()) {
    const file = `${work}/piece-${String(i).padStart(2, "0")}.mp4`
    await render(piece, file)
    list.push(`file '${file}'`)
  }
  await Deno.writeTextFile(`${work}/pieces.txt`, list.join("\n") + "\n")
  const joined = `${work}/joined.mp4`
  await ffmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    `${work}/pieces.txt`,
    "-c",
    "copy",
    joined,
  ])

  await ffmpeg([
    "-i",
    joined,
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-crf",
    Deno.env.get("CLIP_VP9_CRF") ?? "32",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-deadline",
    "good",
    "-cpu-used",
    "2",
    "-pix_fmt",
    "yuv420p",
    `${out}/demo.webm`,
  ])
  await ffmpeg([
    "-i",
    joined,
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    Deno.env.get("CLIP_H264_CRF") ?? "22",
    "-preset",
    "slow",
    "-tune",
    "stillimage",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    `${out}/demo.mp4`,
  ])
  await ffmpeg([
    "-sseof",
    "-0.2",
    "-i",
    joined,
    "-frames:v",
    "1",
    "-quality",
    "86",
    `${out}/poster.webp`,
  ])
  console.log(
    `${pieces.length} pieces, ${(await duration(joined)).toFixed(1)} s`,
  )
}

if (import.meta.main) await main()
