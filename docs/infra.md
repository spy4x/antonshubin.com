# Infra

Production architecture on homelab.

## Stack

| Layer     | What                                       |
| --------- | ------------------------------------------ |
| Runtime   | `denoland/deno:2.9.0`                      |
| Framework | Fresh 2.2 (SSR)                            |
| Build     | Vite 7 + Tailwind 4                        |
| Container | Docker Compose                             |
| Proxy     | Traefik (external, shared `proxy` network) |
| Host      | Homelab (Fedora, Hetzner)                  |

## Docker Compose

`compose.yml`:

- Builds image with `deno install` + `vite build`
- Connects to shared `proxy` Docker network (external)
- Traefik reads Docker labels for routing

No host port mapping — Traefik handles ingress.

## Traefik (external)

Traefik runs as a separate stack on the `proxy` network. It:

- Routes `antonshubin.com` + `www.antonshubin.com` → container:8000
- TLS via Let's Encrypt (certresolver: `myresolver`)
- Redirects `www` → naked domain
- See homelab `stacks/traefik/` for config

## Updates

```bash
deno task deploy
```

The deploy task syncs tracked source and environment files separately, then
rebuilds the Docker Compose service on the production host. Remote host aliases,
paths, and access details stay outside public documentation.

## Resource Limits

- CPU: 0.5 cores
- Memory: 256 MB
