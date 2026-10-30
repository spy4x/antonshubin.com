---
title: "oko: a homelab dashboard that takes its status from Gatus"
seoTitle: "oko: a homelab dashboard with Gatus status"
description: "oko is a small self-hosted dashboard: one JSON file lists your services, and each card shows its status and 30-day uptime from Gatus. How it compares with Homepage, Homarr and Dashy."
tldr:
  - "oko is a homelab dashboard: you list services in one JSON file, and each card shows whether Gatus sees it up and its 30-day uptime."
  - "It never checks a service itself. When Gatus has no answer, the card says unknown, never green."
  - "Homepage, Homarr and Dashy do far more, but none puts the Gatus status on each card: Homepage and Homarr show totals in a widget, Dashy runs its own checks."
  - "It is one Go binary in an 11 MB image. The server renders the whole page; the only script is the search box."
intro: "I keep one page with every service I self-host, and I want that page to tell me the truth about what is up. This post is for people who already run Gatus: what oko does, what it leaves out on purpose, and how to run it."
coverImage: "/img/blog/oko-homelab-dashboard/cover.png"
coverAlt: "The top of the oko demo dashboard: a search box with the hint to press slash to focus, the Home section at 5/5 healthy, and cards for Audiobooks, Git service and Photo library with their uptime."
publishedAt: "2026-10-30"
readTime: 7
topic: "self-hosting"
relatedTool: "oko"
catalogSlug: "cto-advisory-retainer"
---

![The oko demo dashboard titled Jane Doe's servers: a search box, the Home section with a 5/5 healthy counter and 100.00% over 30 days, and cards for Audiobooks, Git service and Photo library, each with its own uptime](/img/blog/oko-homelab-dashboard/dashboard.webp "The oko demo dashboard, with example services")

Once you self-host more than a handful of services, you need two things every
day: a page to find them, and a way to see that they are fine. The well-known
homelab dashboards do the first job well, and much more. oko does both jobs, and
nothing else.

You list your services in one JSON file. oko renders them as one searchable
page, and for each service that [Gatus](https://github.com/TwiN/gatus) watches,
the card shows whether it is up and its uptime over the last 30 days. I built it
for my own servers and run it at
[dash.antonshubin.com](https://dash.antonshubin.com/).

This post is for you if you already run Gatus, or plan to. If you don't, oko
shows your services as links with no status, and one of the dashboards below
will suit you better.

## What the popular dashboards do

Here is what Homepage, Homarr and Dashy do in their latest releases as of today.
Each does far more than oko.

- **[Homepage](https://github.com/gethomepage/homepage/tree/v2.7.0)** (v2.7.0)
  is a Next.js app, configured through YAML files or Docker labels, with more
  than 100 service integrations and widgets for weather, search and system
  stats. It can check a service itself: `siteMonitor` requests a URL you choose,
  `ping` pings a host. Its
  [Gatus widget](https://github.com/gethomepage/homepage/blob/v2.7.0/src/widgets/gatus/component.jsx)
  is one block that counts how many Gatus endpoints are up and down, plus the
  share of successful checks among the results Gatus returns.
- **[Homarr](https://github.com/homarr-labs/homarr/tree/v2.9.1)** (v2.9.1) is
  set up in the browser, with a drag-and-drop grid and "no YAML involved", as
  its README says. It has users, permissions and sign-in through OIDC or LDAP,
  and keeps everything in a database: SQLite by default, MySQL or PostgreSQL if
  you prefer. Its
  [Gatus integration](https://github.com/homarr-labs/homarr/blob/v2.9.1/packages/integrations/src/stats/providers/gatus.ts)
  feeds a Stats widget with four numbers: up, down, unknown and total.
- **[Dashy](https://github.com/Lissy93/dashy/tree/4.9.0)** (4.9.0) reads one
  YAML file, `conf.yml`, which you can also edit in the browser. It has themes,
  widgets and optional sign-in. Its
  [status indicators](https://github.com/Lissy93/dashy/blob/4.9.0/docs/status-indicators.md)
  are its own checks: Dashy's server calls each URL and reads the HTTP code, or
  pings the host, on page load or on an interval.

So if Gatus is already the place where you decide what "up" means, none of the
three puts its answer on each service's card. You either get a total in one
widget, or a second set of checks that can disagree with Gatus. That gap is what
oko fills.

## What oko does

- **Every service on one page,** grouped by server, in the order you wrote them.
  Press `/` to search by name, product or description, and `Esc` to clear.
- **Status from Gatus, per card.** A red border means Gatus says the service is
  down. The pill in the corner is its 30-day uptime. Each server's heading
  counts what is healthy, down or unknown.
- **Unknown stays unknown.** When Gatus gives no answer for a service, the card
  gets a dashed "unknown" marker. It is not counted as healthy and not drawn as
  down.
- **Edit a file, reload the page.** oko rereads `config.json` when the file
  changes, so the next page load shows your edit. No restart, no database, no
  accounts.

![Two rows of the Cloud section on the oko demo dashboard: the heading says 3/5 healthy and 1 unknown; the Email card has a red border and 82.68% uptime, and the File sync card says unknown in place of an uptime](/img/blog/oko-homelab-dashboard/down-and-unknown.webp "A down service and an unknown one, from oko's demo video")

## What oko is not

oko does one job, and the list of things it leaves out is as important as the
list above. From its
[how it works](https://github.com/spy4x/oko/blob/d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1/docs/how-it-works.md#what-oko-is-not)
page:

1. **Not a status page.** It is a dashboard for you, not a public page for your
   users.
2. **Not a metrics dashboard.** It reads two Gatus badges per service, not
   Prometheus. Use Grafana for graphs.
3. **Not a monitor.** It never checks a service itself. Gatus checks, oko shows.
4. **Not multi-tenant.** One process serves one dashboard.
5. **No sign-in.** Put it behind your reverse proxy, with your SSO in front if
   the page should not be public.

If you need widgets, integrations with your media apps or a page your family can
rearrange in the browser, Homepage, Homarr or Dashy are the better choice.

## How it reads Gatus

oko does not need the Gatus API to return any special format. For each service,
it fetches the two badge SVGs Gatus already serves, in parallel: the health
badge and the 30-day uptime badge. Then it reads the text inside them, from
[`internal/gatus/client.go`](https://github.com/spy4x/oko/blob/d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1/internal/gatus/client.go#L82-L92):

```go
var (
	// healthTextRe matches the badge's value text: "up", "down" or "?".
	healthTextRe = regexp.MustCompile(`>\s*(up|down|\?)\s*<`)
	// Fill colours, used only when the text is missing. Current gatus
	// paints "down" #c7130a; #e05d44 is the shields.io red older
	// setups used.
	healthGreen = "#40cc11"
	healthReds  = []string{"#c7130a", "#e05d44"}
	uptimeRe    = regexp.MustCompile(`>\s*([\d.]+)%\s*<`)
)
```

A `?` badge, a failed request or a badge oko cannot read all end the same way:
the service is unknown. That is the rule behind the dashed card above. A broken
network or a stopped Gatus should never paint your whole dashboard red, or
green.

The results sit in an in-memory cache for 60 seconds by default
(`CACHE_TTL_SECS`), and concurrent requests share one fetch, so ten people
opening the page at once cost Gatus one round of requests. Add `?refresh=1` to
the URL to skip the cache once.

## Rendered on the server

Every page view is one Go handler: read the catalog, get the statuses from the
cache, fill one `html/template`, send the HTML. From
[`internal/render/handler.go`](https://github.com/spy4x/oko/blob/d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1/internal/render/handler.go#L100-L128):

```go
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		file, err := cfg.File()
		if err != nil {
			logger.Error("config load failed", slog.Any("err", err))
			http.Error(w, "config load error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		status, err := fetchStatuses(r.Context(), c, file.EndpointKeys(), r.URL.Query().Get("refresh") == "1")
		if err != nil {
			logger.Warn("gatus fetch failed; rendering with empty status", slog.Any("err", err))
			status = map[string]gatus.Status{}
		}

		data := buildPage(cfg.Domain, file, status)
		if len(cfg.UptimeHosts) > 0 {
			data.UptimeURL = "https://" + cfg.UptimeHosts[0]
		}

		var buf bytes.Buffer
		if err := parsed.ExecuteTemplate(&buf, tmplName, data); err != nil {
			logger.Error("template execute failed", slog.Any("err", err))
			http.Error(w, "render error: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "public, max-age=30")
		_, _ = w.Write(buf.Bytes())
	})
```

What this gives you:

1. **The status is in the HTML.** There is no loading spinner, and the browser
   makes no request to learn the status: the first response already says what is
   up.
2. **Your browser never talks to Gatus.** The server fetches the badges, so
   Gatus does not need to be reachable from the device you open the dashboard
   on.
3. **A failed Gatus fetch still renders the page.** The handler logs a warning
   and draws every card as unknown, so you can still find and open your
   services.
4. **Almost no JavaScript.** The page ships one inline script: the search filter
   and its `/` and `Esc` keys. No client framework and no build step.

The whole program uses only Go's standard library: the
[`go.mod`](https://github.com/spy4x/oko/blob/d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1/go.mod)
has no `require` line. It ships as a static binary in a distroless image that
runs as a non-root user. The image I pulled today is about 11 MB on disk, a 4.8
MB download.

## The config

Two things configure oko: a JSON catalog of your services, and a few environment
variables. Here is a catalog with one service:

```json
{
  "title": "Jane Doe's servers",
  "servers": [
    {
      "name": "Home",
      "services": [
        {
          "name": "Photos",
          "url": "https://photos.${DOMAIN}",
          "description": "Self-hosted photo and video backup",
          "product": "Immich",
          "product_url": "https://immich.app/",
          "endpoint": "home_photos",
          "gatus_host": "uptime"
        }
      ]
    }
  ]
}
```

1. **`title`** is the page heading. Leave it out and you get "Service
   dashboard".
2. **`servers`** are the sections, in the order you list them. Each needs a
   `name`.
3. **`name` and `url`** are the only required fields of a service.
4. **`${DOMAIN}`** in a `url` is replaced with the `DOMAIN` variable, so the
   same file works for a test domain and your real one. No other variable is
   replaced.
5. **`description`, `product` and `product_url`** fill the card. The product
   shows as a small link under the description, only when `product_url` is set.
   An `icon` field takes an emoji or short text.
6. **`endpoint` and `gatus_host`** connect the card to Gatus. `endpoint` is the
   Gatus endpoint's key, its group and name joined by `_` (here `home_photos`).
   `gatus_host` is the first label of a host in `UPTIME_HOSTS` (here `uptime`,
   for `uptime.example.com`). Set both or neither: oko rejects a service with
   only one. With neither, the card is a plain link with no status.

The full list, including `hidden: true` and every environment variable with its
default, is in
[docs/configuration.md](https://github.com/spy4x/oko/blob/d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1/docs/configuration.md).

## Install it

oko has no tagged release yet, so I pin the image by its digest: the build of
commit
[`d93c6b3`](https://github.com/spy4x/oko/commit/d93c6b329fcd47d4a9bef91533fdbe0c52f45cf1),
which is what `latest` points at today. A digest never moves, so an update is
always your decision.

```yaml
# compose.yml
services:
  oko:
    image: ghcr.io/spy4x/oko@sha256:4bc56c2c4693c2e4c1856cb2308b0bc2318e042830cd63f878617b238c05b882
    restart: unless-stopped
    ports: ["8080:8080"]
    environment:
      DOMAIN: example.com
      UPTIME_HOSTS: uptime.example.com
      CONFIG_PATH: /config/config.json
    volumes: ["./oko:/config:ro,z"]
```

Save the catalog above as `oko/config.json`, then:

```bash
docker compose up -d
docker compose exec oko /usr/local/bin/oko -healthcheck && echo healthy
```

Open `http://localhost:8080`. Until `UPTIME_HOSTS` points at your own Gatus,
every card says unknown, which is the rule from above doing its job.

Mount the folder, not the file. Many editors save by replacing the file, and a
single-file bind mount keeps showing the old one until the container restarts.
If you run your homelab with [rostok](/tools/rostok), its catalog has an
[oko stack](https://github.com/spy4x/rostok/tree/6755594ec34dc81cc5d6ae95068428f4e354323c/stacks/oko)
with this already written.

## Where it runs for me

My dashboard is [dash.antonshubin.com](https://dash.antonshubin.com/). On
[How I run production](/infrastructure) you can see where it sits: oko reads
Gatus and draws the dashboard, and [zond](/blog/zond-sso-probe-bridge) feeds
Gatus the checks for services behind my SSO proxy.

If you run Gatus, give oko ten minutes: write three services into `config.json`,
start it, and see whether the page tells you the truth. If something is missing
or wrong, [open an issue](https://github.com/spy4x/oko/issues), or tell me on
the [oko page](/tools/oko).

And if it's your product's production you want watched like this, that is part
of what I do on [ongoing work](/catalog/cto-advisory-retainer): monitoring,
backups and security patches after launch.
