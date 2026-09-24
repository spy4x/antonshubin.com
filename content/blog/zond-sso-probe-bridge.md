---
title: "zond: a 10 MB probe bridge so Gatus can see through your SSO proxy"
description: "Health checks behind Authelia fail because Gatus cannot follow SSO redirects. Zond sits beside your services on the Docker network and answers 200 or 503 — no auth bypass, no internal URLs leaked, one config file."
publishedAt: "2026-08-26"
readTime: 6
previewImageURL: "cover.svg"
---

Every self-hosted homelab eventually hits the same monitoring problem: you want
Gatus to tell you that your services are healthy, but the services sit behind
Authelia or Authentik, and Gatus cannot follow SSO redirects without either
accepting 302 as "healthy" (false positive) or standing up a service-specific
monitoring user (operational debt).

`zond` is the 10 MB probe bridge I built to solve this. It runs on the same
Docker network as your services, gets probed by Gatus over the public URL, and
forwards the probe to the internal service over the Docker DNS name. No auth
bypass, no exposed internal URLs.

## Why TCP checks are not enough

The first instinct is to use a TCP check in Gatus: `tcp://hl-metube:8081`. That
tells you a port is open. It does not tell you the HTTP layer is healthy. A
service can listen on its port and still return 500 on every request — and a TCP
check will report it as up.

You need a real HTTP probe. The problem is that the service you want to probe is
behind SSO, and your monitoring tool does not have credentials.

## What Zond actually does

```
┌──────────┐     ┌──────────┐     ┌─────────────┐
│  Gatus   │────>│  Zond    │────>│ hl-metube   │
│ (cloud)  │     │ (home)   │     │ :8081       │
└──────────┘     └──────────┘     └─────────────┘
```

Three containers, one config file:

```yaml
# zond.yml
port: 8080
targets:
  - name: metube
    url: http://hl-metube:8081/
  - name: ollama
    url: http://hl-ollama:11434/api/tags
    timeout: 10000
  - name: grafana
    url: http://hl-grafana:3000/api/health
    timeout: 3000
```

One line in Gatus:

```yaml
- name: Metube
  url: "https://zond.example.com/health/metube"
  conditions:
    - "[STATUS] == 200"
```

That is the whole setup. Zond returns only `ok\n` or `unreachable\n`. No data
leaks. No session to steal. No action to perform on the URL.

## What I learned rewriting it from Deno to Go

The first version was Deno + TypeScript on this homelab. It worked. The image
was ~80 MB stripped. The single binary was nice. Then I tried to ship it on a
friend's lower-end box (Raspberry Pi 4, 1 GB RAM) and the Deno cold start was
180ms — fine for human traffic, ugly for a probe endpoint that fires every 30s.

The Go rewrite:

- ~10 MB distroless image
- 8 MB cold start
- stdlib HTTP server with one external dep (`go.yaml.in/yaml/v3`)
- Single static binary, no runtime to install

The rewrite took two evenings. The Deno version had grown some habits I had to
break: dynamic `Deno.serve`, structured logging, async-ergonomic fan-out. The Go
version has none of that and is easier to reason about.

I am increasingly convinced that monitoring endpoints belong in Go. The perf
ceiling is irrelevant — the predictability matters. Zond will boot in 8 ms on
the same Raspberry Pi in five years. The Deno binary might not.

## Why no authentication

Zond returns `ok` or `ko`. There is nothing to protect. No session, no data, no
action. Adding auth would reintroduce the exact problem Zond solves: now you
have to manage credentials for a monitoring endpoint, and you have an attack
surface that did not exist before.

If you really need to hide the existence of an internal service, proxy Zond
behind your SSO — but the endpoint itself is safe to expose. The worst case is
an attacker learns "metube is up" or "metube is down", which is exactly what
your uptime page already says.

## Try it

Source: [github.com/spy4x/zond](https://github.com/spy4x/zond). The Docker image
is at `ghcr.io/spy4x/zond:latest`. The README has a five-minute setup with
Gatus.

If you want me to wire the same monitoring pattern into a production SaaS
deployment (with sensible alerts, on-call rotation, and a status page), the
engagement model is on
[/catalog/codebase-health-audit](https://antonshubin.com/catalog/codebase-health-audit).
