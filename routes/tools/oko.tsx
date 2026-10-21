import { define } from "../../lib/utils.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import { loadToolPage } from "../../components/tool-frame/tool-page.ts"
import { ConfigToCard } from "../../components/tools/oko/ConfigToCard.tsx"
import { CodeBlock } from "../../components/tools/oko/CodeBlock.tsx"

/** "What it is not": oko's docs/how-it-works.md "What Oko is NOT", shortened in its own words. */
const NOT = [
  "Not a status page generator.",
  "Not a metrics dashboard: oko reads gatus badges.",
  "Not a gatus replacement.",
  "Not a health-check tool: oko never probes services itself.",
]

/** The README's quick start, verbatim. */
const COMPOSE = `# compose.yml
services:
  oko:
    image: ghcr.io/spy4x/oko:latest
    restart: unless-stopped
    ports: ["8080:8080"]
    environment:
      DOMAIN: example.com                # replaces \${DOMAIN} in service URLs
      UPTIME_HOSTS: uptime.example.com   # your gatus host(s), comma-separated
      CONFIG_PATH: /config/config.json
    volumes: ["./oko:/config:ro,z"]`

/**
 * The README's config.json, verbatim but for the icon, written as its JSON
 * escape (the site renders no emoji; oko reads the same value).
 */
const CONFIG = `{
  "title": "Jane Doe's servers",
  "servers": [
    {
      "name": "Home",
      "services": [
        {
          "name": "Photos",
          "url": "https://photos.\${DOMAIN}",
          "icon": "\\ud83d\\udcf7",
          "endpoint": "home_photos",
          "gatus_host": "uptime"
        }
      ]
    }
  ]
}`

/** /tools/oko (#464): the tool frame with "From config to card", "What it is not" and the quick start. */
export default define.page(async function OkoPage(ctx) {
  const data = await loadToolPage("oko")
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  return (
    <ToolFrame data={data} currentPath={ctx.url.pathname}>
      <ConfigToCard />
      <section aria-labelledby="not">
        <h2 id="not" class="text-2xl sm:text-3xl text-parchment">
          What it is not
        </h2>
        <ul class="mt-4 grid gap-x-8 gap-y-2 text-graphite sm:grid-cols-2">
          {NOT.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
      <section aria-labelledby="quick-start">
        <h2 id="quick-start" class="text-2xl sm:text-3xl text-parchment">
          Quick start
        </h2>
        <div class="mt-6 grid max-w-3xl gap-6">
          <CodeBlock id="oko-compose" file="compose.yml" code={COMPOSE} />
          <CodeBlock id="oko-config" file="oko/config.json" code={CONFIG} />
        </div>
        <p class="mt-4 text-graphite">
          Save the second block as <code>oko/config.json</code>, run{" "}
          <code>docker compose up -d</code> and open{" "}
          <code>http://localhost:8080</code>. <code>endpoint</code>{" "}
          is the gatus endpoint's key, and <code>gatus_host</code>{" "}
          is the first label of a host in <code>UPTIME_HOSTS</code>.
        </p>
      </section>
    </ToolFrame>
  )
})
