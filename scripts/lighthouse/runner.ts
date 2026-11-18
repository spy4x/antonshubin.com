// Runs the Lighthouse budget of lighthouserc.json: `deno run ... runner.ts <config> <report dir>`,
// called by run.sh with `--no-config --no-lock`, so Lighthouse and chrome-launcher stay out of
// deno.json and deno.lock. One Chrome for every run; Lighthouse mobile with its default config and
// the config's settings; a page stops after two runs when they settle every category's median
// (verdict.ts). Writes each run's JSON and HTML report to the report dir. Exits 1 when a page fails.
import { median, needsAnotherRun, readPlan, verdict } from "./verdict.ts"

// Imported through variables, so the project's `deno check` checks this file but never resolves
// these two packages: under deno.json they would need node_modules entries and deno.lock lines.
const LIGHTHOUSE = `npm:lighthouse@12.6.1`
const CHROME_LAUNCHER = `npm:chrome-launcher@1.2.0`
const { default: lighthouse } = await import(LIGHTHOUSE)
const { launch } = await import(CHROME_LAUNCHER)

const [configPath, reportDir] = Deno.args
if (!configPath || !reportDir) {
  throw new Error(`usage: runner.ts <lighthouserc.json> <report dir>`)
}
const chromePath = Deno.env.get(`CHROME_PATH`)
if (!chromePath) throw new Error(`CHROME_PATH is not set`)

const plan = readPlan(JSON.parse(await Deno.readTextFile(configPath)))
await Deno.remove(reportDir, { recursive: true }).catch(() => {})
await Deno.mkdir(reportDir, { recursive: true })

const failures: string[] = []
const started = Date.now()
const chrome = await launch({ chromePath, chromeFlags: plan.chromeFlags })
try {
  for (const url of plan.urls) {
    const done: Record<string, number | null>[] = []
    const slug = new URL(url).pathname.replaceAll(`/`, `_`)
    do {
      const result = await lighthouse(url, {
        port: chrome.port,
        output: [`json`, `html`],
        logLevel: `error`,
        disableFullPageScreenshot: plan.disableFullPageScreenshot,
        blockedUrlPatterns: plan.blockedUrlPatterns,
      })
      if (!result) throw new Error(`Lighthouse returned no result for ${url}`)
      const { lhr, report } = result
      if (lhr.runtimeError) console.error(`${url}: ${lhr.runtimeError.message}`)
      const name = `${reportDir}/${slug}-run${done.length + 1}.report`
      const [json, html] = report as string[]
      await Deno.writeTextFile(`${name}.json`, json)
      await Deno.writeTextFile(`${name}.html`, html)
      const score = (id: string) => lhr.categories[id]?.score ?? null
      done.push(
        Object.fromEntries(
          plan.budgets.map((b) => [b.category, score(b.category)]),
        ),
      )
    } while (needsAnotherRun(done, plan.budgets, plan.runs))

    const parts = plan.budgets.map((b) => {
      const scores = done.map((r) => r[b.category])
      const ok = verdict(scores, b.minScore, plan.runs) === `pass`
      const line = `${b.category} ${median(scores)}`
      if (!ok) {
        const runs = scores.join(`, `)
        failures.push(`${url} ${line} [${runs}], budget ${b.minScore}`)
      }
      return `${line} ${ok ? `pass` : `FAIL`}`
    })
    console.log(`${url}  ${parts.join(`  `)}  (${done.length} runs)`)
  }
} finally {
  await chrome.kill()
}

const seconds = Math.round((Date.now() - started) / 1000)
console.log(`Lighthouse: ${plan.urls.length} pages in ${seconds} s`)
if (failures.length > 0) {
  console.error(`Below the Lighthouse budget:\n${failures.join(`\n`)}`)
  Deno.exit(1)
}
