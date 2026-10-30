---
title: "zond: a probe bridge so Gatus can see through your SSO proxy"
seoTitle: "zond: Gatus health checks behind an SSO proxy"
description: "Behind Authelia or Authentik, Gatus gets the same 302 to the login page from every service, up or down. zond runs beside your containers, probes them directly and answers 200 ok or 503 unreachable, with no monitoring login."
tldr:
  - "Behind an SSO proxy, Gatus gets the same 302 to the login page from every service, whether the service runs or not."
  - "zond runs on the same Docker network as your services, sends each one a plain HTTP GET and answers 200 ok or 503 unreachable. No login, no auth bypass."
  - "Its image is a 3.7 MB download. On my laptop it used about 3 MB of memory idle and stayed under 14 MB through 1,000 requests."
  - "I rewrote it from Deno to Go in July 2026. The last Deno version, rebuilt for comparison, is a 117 MB image that idles at 19 MB."
intro: "If your self-hosted services sit behind Authelia or Authentik, your monitor sees a login page instead of your services. This post shows how zond checks them from the inside without a monitoring account, how to set it up, and what it costs in memory and disk."
publishedAt: "2026-08-26"
updatedAt: "2026-10-30"
readTime: 7
topic: "self-hosting"
relatedTool: "zond"
catalogSlug: "cto-advisory-retainer"
---

You put Authelia or Authentik in front of your self-hosted services, and now
nobody gets in without logging in. That includes your monitor.

This post is for people who run their own services and want honest health checks
for them. I'll show what zond does, the whole setup, why it has no login of its
own, and what it costs to run, with numbers you can check yourself.

## Why your monitor sees only the login page

Gatus asks `https://metube.example.com/` and gets a `302` to the login page. It
gets the same `302` when metube runs, when it crashes on every request, and when
its container is gone, because the proxy checks the session before it forwards
anything to metube.

That leaves two bad options:

1. Count the redirect as healthy. Now a dead service shows a green check.
2. Give the monitor its own account. Now you keep a password alive on every
   service, for a robot.

A TCP check from inside the network is not the answer either.
`tcp://hl-metube:8081` tells you a port is open. A service can listen on its
port and still answer `500` to every request.

## What zond does

zond is a small Go service that runs beside your services, on the same Docker
network. Your monitor asks it about a service on a public URL that sits outside
the SSO. zond sends that service a plain HTTP GET by its Docker name and answers
with a status code. The name is Russian for "probe".

![You reach metube through the SSO proxy and log in. Gatus, in the cloud, asks zond for /health/metube on a public URL outside the SSO. zond runs on the same Docker network as metube, sends it a plain HTTP GET without logging in, and answers 200 ok or 503 unreachable.](/img/blog/zond-sso-probe-bridge/how-zond-works.svg "People go through the login. The health check goes to zond, which asks metube directly.")

Nothing gets around the login. The proxy still guards metube for everyone. zond
never talks to the proxy: it reaches metube the way metube's neighbours on that
network do, by its container name, and tells the outside world one word.

This is the rule it applies, from
[`internal/probe/probe.go`](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/internal/probe/probe.go#L78):

```go
return Result{Name: name, OK: resp.StatusCode >= 200 && resp.StatusCode < 400}
```

A `2xx` or `3xx` answer is up. A `4xx`, a `5xx`, a timeout, a refused connection
or a failed DNS lookup is down. zond doesn't follow redirects, so a `302` from
metube to its own `/login` counts as up. That is the same `302` I called useless
above, with one difference: here metube sent it, so metube is running.

This is all a monitor ever sees. The run is from the
[README](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/README.md#L43-L64),
with one service up and one down:

```console
$ curl -i localhost:8080/health/metube
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8

ok

$ curl -i localhost:8080/health/jellyfin
HTTP/1.1 503 Service Unavailable
Content-Type: text/plain; charset=utf-8

unreachable

$ curl -i localhost:8080/health
HTTP/1.1 503 Service Unavailable
Content-Type: text/plain; charset=utf-8

OK metube
KO jellyfin
```

So the answer about one service is `ok` or `unreachable`. `OK` and `KO` appear
only in the list that `/health` returns, one line per service, and that list
answers `503` when any service on it is down. `/health` checks every service at
once, in parallel, so the list takes as long as the slowest service, not the sum
of all of them.

## The setup: one Compose entry and one file

Add zond to the Compose file that runs your services, so it shares their
network. Both blocks are from the
[README](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/README.md#L93-L106):

```yaml
# compose.yml
services:
  zond:
    image: ghcr.io/spy4x/zond:latest
    restart: unless-stopped
    ports: ["8080:8080"]
    volumes: ["./zond.yml:/app/zond.yml:ro,z"]
```

```yaml
# zond.yml
targets:
  - name: metube
    url: http://hl-metube:8081/
```

A fuller `zond.yml`, from
[`docs/configuration.md`](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/docs/configuration.md#L22-L34):

```yaml
# zond.yml
port: 8080
targets:
  - name: metube
    url: http://hl-metube:8081/
  - name: ollama
    url: http://hl-ollama:11434/api/tags
    timeout: 10000 # ms, default 5000
  - name: grafana
    url: http://hl-grafana:3000/api/health
    timeout: 3000
```

1. `port` is where zond listens, 8080 by default. The `ZOND_PORT` environment
   variable overrides it.
2. `name` is the last part of the URL: `/health/metube`. zond refuses to start
   when two targets share a name.
3. `url` is the address zond probes, usually the container's name on the Docker
   network.
4. `timeout` is how long zond waits for that service, in milliseconds. The
   default is 5000.

No file? One environment variable does the same, with the default timeout for
every service:
`ZOND_TARGETS="metube=http://hl-metube:8081/,ollama=http://hl-ollama:11434/api/tags"`.

Then publish zond through your reverse proxy, outside the SSO, and point Gatus
at it:

```yaml
# Gatus
- name: Metube
  url: "https://zond.example.com/health/metube"
  conditions:
    - "[STATUS] == 200"
```

## Why zond has no login

A login on zond would bring back the exact problem it solves: a credential for
the monitor to keep alive. What can an outsider learn from it instead?

- Whether each service is up. Your status page says that already.
- The names you gave your targets, because `/health` lists them. Name them the
  way you'd name them on a public status page.

That is all. zond never returns an internal URL, a response body or a header
from the service. It is not an open proxy either: it looks the name up in its
own config
([`internal/server/server.go`](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/internal/server/server.go#L69)),
answers `404` for a name it doesn't know, and only ever sends a GET to the URLs
you wrote down.

## Where it runs

zond runs on my home server. It feeds Gatus, and [oko](/tools/oko), my one-page
dashboard, reads Gatus to draw my status page. The monitoring lane on
[how I run production](/infrastructure) shows that chain: zond, Gatus, oko, the
dashboard.

## What it costs to run

These numbers are not from my server. They come from a laptop, in a run you can
repeat on any machine.

On 30 October 2026 I pulled the published image (`ghcr.io/spy4x/zond:latest`,
digest `sha256:1ac711d5…`, built 20 August 2026) and ran it with Podman beside
two test containers: a BusyBox web server as metube, and a container with
nothing listening as grafana, so every check had one service up and one down.
Then I sent 1,000 requests to `/health`, ten at a time. Each request probes both
services, so that is 2,000 probes. Memory comes from `podman stats` and the
container's cgroup `memory.peak`, three runs each.

For comparison I rebuilt the last Deno version (the
[`v1.0.0` tag](https://github.com/spy4x/zond/tree/574fe216d6769cccfa953c6212da722435e294fe))
from its own Dockerfile, which runs the code with `deno run` on the Deno Alpine
image, and measured it the same way.

|                              | Go, published image | Deno, last version rebuilt |
| ---------------------------- | ------------------- | -------------------------- |
| Download                     | 3.7 MB              | about 49 MB                |
| On disk                      | 10.1 MB             | 117.2 MB                   |
| Memory, idle                 | 2.8 to 2.9 MB       | 19.0 to 19.2 MB            |
| Memory after 1,000 `/health` | 9.4 to 11.2 MB      | 46.8 to 48.0 MB            |
| Peak memory                  | 12.7 to 13.1 MB     | 49.7 to 50.1 MB            |

Docker reports the same Go image as 9.1 MB on disk; the table uses Podman's
figures for both columns. The sample Compose file in
[`docs/self-hosting.md`](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/docs/self-hosting.md#L42-L45)
caps zond at `32M` of memory, and in these runs it never needed half of that.

## Why I rewrote it in Go

The first version was Deno and TypeScript. I rewrote it in Go in
[PR #1](https://github.com/spy4x/zond/pull/1), merged on 14 July 2026, and kept
the API and the config format as they were.

The PR's reason was Go's standard library, which covers everything zond does:
routing by method and path, structured logs, parallel probes, timeouts and a
clean shutdown. The only dependency left is the YAML parser. The result is one
static binary in a distroless image that runs as a non-root user, with no
runtime inside. The table above shows what that changes for a service that sits
idle most of the day and answers one word.

## Try it

The source is at [github.com/spy4x/zond](https://github.com/spy4x/zond), and the
[tool page](/tools/zond) has a one-minute demo. The published image is
`ghcr.io/spy4x/zond:latest`, built for `linux/amd64`. On another architecture,
`docker build .` makes your own from the same Dockerfile.

Have a service behind your SSO that your monitor can't see? Add zond to its
Compose file, ask it `/health/<name>`, and see whether you get `ok`.

If you'd rather have someone set up monitoring like this for your product and
keep an eye on it, that is part of [Ongoing](/catalog/cto-advisory-retainer):
monitoring, backups and security patches after launch.
