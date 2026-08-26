---
title: "rostok: scaffold a self-hosted homelab from a curated service catalog"
description: "The CLI I built to remove 80% of the friction between 'I want to self-host X' and 'X is running, secrets are committed, deploy is one command'. One wizard, a few prompts, and the same IaC structure I use for my own infrastructure."
publishedAt: "2026-08-26"
readTime: 8
previewImageURL: "cover.svg"
---

Every homelab I have ever stood up started the same way: a folder, a README, a
bunch of `compose.yml` files I copy-pasted from my last homelab, and a
`secrets-not-committed.txt` file that immediately drifts from reality.

`rostok` is the CLI I built to stop doing that. One wizard, a few prompts, and
you go from a fresh folder to a deployable infrastructure-as-code repo for your
servers — with secrets in `.env.age` so the whole thing is safe to push to a
public Git mirror or share with a teammate.

## The shape of the problem

Self-hosting is not the hard part. The hard part is the _plumbing around it_:

- Which services fit together, and which ones duplicate functionality
- Where secrets live — encrypted at rest, decryptable on deploy, never pasted
  into a Slack DM
- The deploy story — same `docker compose up -d` works on a fresh box, on a
  reinstall, and after a migration
- Recoverability — if the box dies tonight, can you rebuild from the repo alone?

Every self-hosted stack has these questions. Most answers are local decisions
("I keep secrets in a Vaultwarden note") and never migrate to a reusable
pattern. `rostok` is my attempt to make the answers reusable.

## What the wizard actually does

```
$ rostok
Welcome to rostok (росток) — scaffold your homelab

? What is your project name? > home
? Add a server now? (y/n) > y
  ? Server name? > home
  ? Server role? (home / cloud / offsite) > home
  ? Hostname or IP? > 192.168.1.10
  ? SSH user? > deploy
? Add a stack from the catalog? (y/n) > y
  ? Stack name? (gatus / authentik / umami / woodpecker / ...) > gatus
    Loaded meta for stacks/gatus: 4 variables
    ? GATUS_TITLE > Home uptime
    ? SLACK_WEBHOOK_URL > <REDACTED:WEBHOOK_URL>
    ? ADMIN_EMAIL > ops@example.com
  Add another stack? (y/n) > y
  ? Stack name? > umami
    ...
```

At the end the wizard writes:

```
.
├── deno.jsonc              # import map for @rostok/cli
├── .gitignore              # plaintext .env never committed
├── .env.root               # CLI-managed, gitignored
├── .env.root.age           # safe to commit
└── servers/
    └── home/
        ├── config.json     # which stacks run on this server (committed)
        ├── .env            # per-server vars (gitignored)
        ├── .env.age        # safe to commit
        └── README.md
```

Every `.env` mutation runs the age64 encryptor. The catalog ships with
`+meta.ts` per stack declaring its variables, defaults, and validation, so the
wizard cannot accidentally write invalid config.

## The catalog is the product

The CLI is a thin shell around the catalog. `stacks/<name>/+meta.ts` is a typed
schema that drives both the wizard prompts and the deploy-time substitution into
`compose.yml`. Adding a new stack is a single PR:

```
stacks/gatus/
├── +meta.ts          # variables, defaults, validation
├── compose.yml       # the actual service
├── backup.ts         # optional: restic backup rules
└── README.md
```

I currently run 30+ stacks through this catalog on my own homelab (see
[/infrastructure](https://antonshubin.com/infrastructure) for the live
breakdown). Each one is a PR-shaped contribution — easy to vendor, easy to fork,
easy to retire.

## What I learned shipping it

Three things that surprised me:

**1. age64 is the right primitive for solo homelabbers.** I used to think "real"
secret management meant Vaultwarden or Doppler or HashiCorp Vault. Those are
overkill when the threat model is "lose the box, lose the secrets, can't
rebuild". `age` is one binary, the `.env.age` files are commit-safe, and the
decryption happens at deploy time with a key that lives on the deployer's
machine. No service to keep alive.

**2. The catalog wants to be committed, not vendored.** I started with "vendor
the catalog as a git submodule". That made adding a stack a multi-repo PR.
Folding the catalog into the CLI itself means adding `stacks/<name>/+meta.ts` is
a one-PR contribution that anyone with `rostok` installed gets next time they
update.

**3. The wizard is doing less work than I thought.** Most of the time, the
wizard is reading the meta and writing into the right file. The hard part is the
_encryption posture_: after every mutation, re-encrypt. After a fresh clone,
prompt to decrypt. After the secret rotates, the `.env.age` on disk is the new
one. This is all small, but it has to be invisible.

## Try it

```
deno install -A -n rostok jsr:@rostok/cli
mkdir ~/rostok && cd ~/rostok
rostok
```

Source: [github.com/spy4x/rostok](https://github.com/spy4x/rostok). The catalog
of stacks is open-source under the same repo. PRs welcome.

If you want me to set up the same IaC for a small company replacing
SaaS-with-self-hosted, the engagement model is on
[/how-i-work](https://antonshubin.com/how-i-work).
