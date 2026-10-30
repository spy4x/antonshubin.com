---
title: "rostok: scaffold a self-hosted homelab from a curated service catalog"
seoTitle: "rostok: scaffold a self-hosted homelab"
description: "rostok is a CLI that turns an empty folder into a Git repo for your servers: a catalog of 50 Docker Compose stacks, encrypted secrets and a deploy over SSH."
tldr:
  - "rostok is a CLI: run it in an empty folder, answer a few questions, pick services from its catalog, and you get a Git repo with one folder per server."
  - "Every .env value is encrypted on its own into .env.age, so the repo is safe to push; the key stays on your machine."
  - "rostok deploy copies a server's files over SSH and starts them with Docker Compose. The server needs only SSH and Docker."
  - "Install with deno install -g -A -n rostok jsr:@rostok/cli. Release 1.21.0 ships 50 stacks."
intro: "rostok grew out of the repo that runs my own servers, and I still deploy with it. This post walks through it from an empty folder to a service live on HTTPS, with the real commands and their output, for anyone who runs Docker on one to a few machines."
coverImage: "/img/blog/rostok-self-hosted-scaffolder/cover.png"
coverAlt: "rostok's stack picker in a terminal: omni-tools and traefik ticked, open-webui, pangolin, piped, playwright, searxng, stalwart, syncthing and traggo not."
publishedAt: "2026-08-26"
updatedAt: "2026-10-30"
readTime: 7
topic: "self-hosting"
relatedTool: "rostok"
catalogSlug: "strategy-call"
---

![rostok's wizard in a terminal: server 'home' created at /home/jane/homelab/servers/home, then the stack picker with omni-tools and traefik ticked among open-webui, pangolin, piped, playwright, searxng, stalwart, syncthing and traggo](/img/blog/rostok-self-hosted-scaffolder/wizard-pick-stacks.webp "Picking services from the catalog in the wizard")

Every homelab I stood up started the same way: a folder, a README, and a pile of
`compose.yml` files copied from the last one. The secrets lived somewhere else,
and the note on where they lived drifted from reality right away.

rostok is the CLI I built to stop doing that. It grew out of the repository that
runs my own servers, and I still deploy my services with it. This post is for
anyone who runs Docker on one to a few machines (an old PC, a homelab, or a
small company replacing SaaS) and wants the whole setup in a Git repo. I'll show
what it does, then walk through it from an empty folder to a service live on
HTTPS.

## What is rostok?

You run `rostok` in an empty folder and answer a few questions: the server's
name, its SSH address, your domain and email. The wizard turns that into a Git
repo with one folder per server, adds the stacks you pick from the catalog and
fills in their settings. `rostok deploy home` then copies the files to the
server over SSH and starts them with Docker Compose.

- **Plain files in Git.** Each server is a folder with a `config.json` and a
  `.env`. No database, no daemon, no web UI.
- **Secrets you can commit.** Every value is encrypted on its own into
  `.env.age` with [age](https://age-encryption.org), inside the CLI, with no
  extra binary to install.
- **No agent on the server.** The server needs SSH and Docker, nothing else.

The name is Russian: **росток** means "sprout".

## The problem it solves

Running a service yourself is rarely the hard part. The plumbing around it is:

- Which services fit together, and which ones need a reverse proxy in front.
- Where the secrets live: encrypted at rest, decrypted on deploy, never pasted
  into a chat.
- The deploy: the same command has to work on a fresh box, after a reinstall and
  after a move to another provider.
- Recovery: if the box dies tonight, can you rebuild it from the repo alone?

Every self-hosted setup answers these questions somehow, but the answers stay
local decisions that never become a pattern you can reuse. rostok writes them
down as files.

## From zero to a running service

The [demo video on the tool page](/tools/rostok) shows the whole run, recorded
on a throwaway cloud server that the recipe rents and deletes. Here are the same
steps with the commands I ran while writing this post. I stopped before the
deploy, because I don't run tests against a real server from my laptop; the
deploy pictures below come from that recording.

### 1. Install

rostok needs [Deno](https://deno.com) 2.0 or newer. On Deno 2 the `-g` flag is
required for a named install:

```bash
deno install -g -A -n rostok jsr:@rostok/cli
```

It downloads the CLI and its dependencies from JSR and npm, then prints
"Successfully installed rostok" and the folder to add to your `PATH` if it is
not there yet. `rostok --help` lists every command.

### 2. Run the wizard

Interactively, `rostok` asks one question at a time and offers a default where
it has one, so you press Enter through most of them. For this post I used the
same wizard without prompts, passing the answers as flags. `192.0.2.10` is an
address reserved for documentation, so nothing answers there:

```bash
mkdir ~/homelab && cd ~/homelab
rostok -n --var SERVER_NAME=home --var SSH_ADDRESS=root@192.0.2.10 \
  --var DOMAIN=example.com --var CONTACT_EMAIL=you@example.com \
  --stack traefik --stack omni-tools
```

The output, with my temporary folder shortened to `~/homelab`:

```
Initialized:
  + ~/homelab/deno.jsonc
  + ~/homelab/.gitignore
  + ~/homelab/servers
  + ~/homelab/.env.root
rostok: couldn't probe root@192.0.2.10 over SSH: timed out after 10000ms — using the default DOCKER_GROUP_ID/PUID/PGID.
rostok: no encryption key yet — run `rostok env setup` to enable it.
Server 'home' created at ~/homelab/servers/home
rostok: no encryption key yet — run `rostok env setup` to enable it.
added traefik to home: 8 new values, 0 kept
rostok: no encryption key yet — run `rostok env setup` to enable it.
added omni-tools to home: 4 new values, 0 kept

Wrote:
  servers/home/.env
  servers/home/config.json

Next steps:
  rostok deploy home

DNS records:
  A example.com → 192.0.2.10
  A *.example.com → 192.0.2.10

rostok v1.21.0 — wizard complete.
```

Three things happen here that I used to do by hand:

1. The wizard tries to read the server's Docker group and user ids over SSH, so
   the containers get the right permissions. With no server to ask, it says so
   and keeps the defaults.
2. Each stack's settings go into the server's `.env`: 8 values for Traefik, 4
   for OmniTools, every one with a default I could change later.
3. It prints the DNS records the domain needs before a deploy can get its HTTPS
   certificates.

`servers/home/config.json` is just the list of stacks on that server:

```json
{
  "stacks": [
    {
      "name": "traefik"
    },
    {
      "name": "omni-tools"
    }
  ]
}
```

### 3. Encrypt the secrets

Without a key, the `.env` files stay plaintext and gitignored. One command makes
a key, and the next encrypts every `.env` next to itself:

```bash
rostok env setup
rostok env encrypt
rostok env status
```

`env status` then reports:

```
.age/key.txt:       present
.env files (2):
  .env.root
  servers/home/.env
.env.age files (2):
  .env.root.age
  servers/home/.env.age
```

Each line is encrypted on its own, so the names stay readable and a diff shows
which setting changed. The first lines of `servers/home/.env.age`, cut short:

```
PROJECT=age64:YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IFgyNTUxOSB6L2
SSH_ADDRESS=age64:YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IFgyNTUxOS
SSH_USER=age64:YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IFgyNTUxOSArM
```

The generated `.gitignore` keeps `.env`, `.env.root` and the `.age/` key folder
out of Git. From here on, every change the CLI makes to a `.env` re-encrypts it.

### 4. Deploy

With DNS pointing at the server and Docker installed on it, the last step is:

```bash
rostok deploy home
```

It checks the server first: if Docker's group is missing, it stops with "Install
Docker on the server before deploying." Then it copies the server's files and
starts each stack with Docker Compose. In the recording, the deploy took about a
minute:

![The end of rostok deploy home in a terminal: the deployment summary says 2 of 2 stacks succeeded, traefik and omni-tools, with 0 failed, then Traefik's after-deploy step and "Deployment script finished"](/img/blog/rostok-self-hosted-scaffolder/deploy-summary.webp "The deploy summary: both stacks up")

Then OmniTools answers on its own subdomain, with a certificate Traefik got from
Let's Encrypt:

![OmniTools open in a browser on a tools subdomain with a lock icon: its search box and tool buttons such as Prettify JSON, Compress PNG and Sort a list](/img/blog/rostok-self-hosted-scaffolder/omni-tools-live.webp "OmniTools live on HTTPS after the first deploy")

## What a stack looks like

The CLI is a thin shell around the catalog. Each stack is a folder with an
ordinary `compose.yml`, a `README.md`, an optional `backup.ts`, and a `+meta.ts`
that declares its settings. Here is OmniTools' whole
[`stacks/omni-tools/+meta.ts`](https://github.com/spy4x/rostok/blob/a8331657422316333c430ac115c7f1e167a31b04/stacks/omni-tools/%2Bmeta.ts)
at release 1.21.0:

```ts
// Stack metadata for `omni-tools`.
//
// A static web app of everyday tools; all processing happens in the browser, so the stack is
// stateless (no `backup.ts`). Web UI sits behind Traefik, so the stack requires it.

import type { StackMeta } from "@rostok/cli"

export default {
  name: "omni-tools",
  description:
    "Everyday online tools that run in your browser (iib0011/omni-tools)",
  category: "tools",
  requires: ["traefik"],
  variables: [
    {
      key: "OMNI_TOOLS_IMAGE_TAG",
      default: "latest",
      required: false,
    },
    {
      key: "OMNI_TOOLS_DOMAIN",
      question: "Public domain for OmniTools?",
      default: "tools.${DOMAIN}",
      required: true,
    },
    {
      key: "OMNI_TOOLS_CPU_LIMIT",
      question: "CPU limit for the OmniTools container?",
      default: "0.5",
      required: true,
    },
    {
      key: "OMNI_TOOLS_MEM_LIMIT",
      question: "Memory limit for the OmniTools container?",
      default: "256M",
      required: true,
    },
  ],
} satisfies StackMeta
```

1. `requires: ["traefik"]` says the stack needs the reverse proxy in front of
   it.
2. Each entry in `variables` becomes a line in the server's `.env`. Those are
   the 4 values the wizard added above. `question` is the label the wizard shows
   when it asks for one.
3. `default: "tools.${DOMAIN}"` builds on an answer you already gave, so
   OmniTools gets `tools.example.com` without a new answer.
4. `satisfies StackMeta` lets the type checker catch a mistyped field in a
   stack.

Adding a service to the catalog is one pull request with such a folder.
`rostok stack list` shows what is there today; release 1.21.0 lists 50 stacks in
15 groups, from Traefik and Authelia to Immich, Vaultwarden, Gitea and
Woodpecker CI.

## What runs on my own servers

rostok is not a side demo. Its README says it plainly: the repository's stacks
and deploy code run my machines. I deploy four servers in different regions with
it, each with a different set of services. My
[how I run production](/infrastructure) page describes my four machines: a cloud
server in Germany for the public services, a home lab in Singapore, a mini PC
that travels with me, and a Raspberry Pi in another country that keeps the
offsite backups.

Several stacks in the catalog are tools I wrote:

- [mig](/tools/mig), the scheduler behind my booking page at
  meet.antonshubin.com;
- [oko](/tools/oko), which draws
  [dash.antonshubin.com](https://dash.antonshubin.com), the status page of my
  servers, from Gatus;
- [zond](/tools/zond), which lets Gatus check services that sit behind a sign-in
  proxy;
- [caldav-mcp](/tools/caldav-mcp) and
  [caldav-tasks-web](/tools/caldav-tasks-web), which give an AI assistant and a
  browser the events and tasks of a CalDAV server.

The configuration of my own servers stays private, because it names internal
services. The catalog and the deploy code are the public part.

## Why age, and not Vault

I used to think proper secret management meant a service such as HashiCorp Vault
or Doppler. For a few servers that one person runs, that is one more thing to
keep alive, and the real risk is losing the box together with the only copy of
its secrets.

With age, the encrypted `.env.age` files sit in the same repo as everything
else, and the key lives on the machine I deploy from. A fresh clone plus the key
has every setting a deploy needs. rostok does the encryption inside the CLI, so
there is no binary to install either.

> If the box dies tonight, the repo and the key should be enough to bring it
> back.

## Try it

```bash
deno install -g -A -n rostok jsr:@rostok/cli
mkdir ~/homelab && cd ~/homelab
rostok
```

The code, the catalog and every command are in
[spy4x/rostok](https://github.com/spy4x/rostok), MIT-licensed. If a service you
run is missing, a pull request with its `stacks/<name>/` folder is welcome.

If you run a small company and want to replace some of your SaaS bills with
services on your own servers, start with a
[strategy session](/catalog/strategy-call): one hour on what to move, what to
keep, and what it costs to run.
