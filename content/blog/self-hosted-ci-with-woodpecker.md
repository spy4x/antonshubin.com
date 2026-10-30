---
title: "Self-hosted CI with Woodpecker: server, pipelines, secrets and releases"
seoTitle: "Self-hosted CI with Woodpecker: my real setup"
description: "How I run self-hosted CI with Woodpecker: one server and agent in Docker Compose, a pipeline file per repo, scoped secrets, browser tests and image releases on a tag."
tldr:
  - "A Woodpecker server and agent in Docker Compose run CI for this site and my open-source tools; each repository keeps its pipeline in .woodpecker.yml."
  - "Give each secret to the steps that need it, for the events that need it, and write shell variables as $$NAME, or Woodpecker blanks them before the shell runs."
  - "A release builds the image with kaniko, no secret and no push; a separate crane step that runs no repository code is the only one with the registry login."
  - "Open sign-up, a locked SQLite database and 4 GB of logs inside it were the real problems, each fixed in the stack's compose file."
intro: "My Drone CI post from 2023 still gets read, and it no longer describes what I run. This is the current setup: the Woodpecker server and agent, the pipeline files of my public repositories, how secrets reach a step and how a tag turns into a published image. It is for developers who want CI on their own server and want to see real files, mistakes included."
coverImage: "/img/blog/self-hosted-ci-with-woodpecker/cover.png"
coverAlt: "The Woodpecker pipeline list of the public mig repository in the dark theme: a green pipeline success badge and three passed pipelines, a v2.2.0 tag, a push to main and a pull request."
publishedAt: "2026-10-30"
readTime: 10
topic: "self-hosting"
relatedTool: "rostok"
catalogSlug: "cto-advisory-retainer"
---

![The pipeline list of spy4x/mig on ci.antonshubin.com: a green "pipeline success" badge, then passed pipelines for the v2.2.0 tag, the push of the release commit to main and the pull request before it, each with its commit and duration](/img/blog/self-hosted-ci-with-woodpecker/pipeline-list.webp "mig's pipelines on my Woodpecker server, open to anyone")

In 2023 I wrote how to
[set up your own CI/CD server with Drone CI](/blog/setting-up-your-own-ci-cd-server-with-drone-ci).
Today I run self-hosted CI with Woodpecker, a community fork of Drone. The idea
is the same: a server talks to GitHub, an agent runs each step in a container,
and the pipeline is a YAML file in the repository.

This post shows the real setup behind `ci.antonshubin.com`: the server and agent
I deploy, the pipeline files of this site and my open-source tools, how secrets
reach a step, the Chromium install for browser tests, image releases on a tag,
and status badges. Every file is quoted from a public repository at a pinned
commit, so you can open it and copy it. Where something went wrong, I link the
pull request that fixed it.

It is for developers who want CI on their own server. You can
[see mig's pipelines](https://ci.antonshubin.com/repos/12) before reading on.

## The server and the agent

Woodpecker has two parts. The **server** is the web UI, the GitHub webhooks and
the database. The **agent** connects to the server, takes a workflow and runs
each step as a container on its machine's Docker.

I deploy both from the `woodpecker` stack in the catalog of
[rostok](/tools/rostok), my CLI for self-hosted servers. You can use the compose
file without rostok too. The server, from
[`stacks/woodpecker/compose.yml`](https://github.com/spy4x/rostok/blob/470d152167809ad1bd3c415e4b1961a79fa9eebe/stacks/woodpecker/compose.yml#L10-L24):

```yaml
woodpecker-server:
  container_name: hl-woodpecker-server
  image: woodpeckerci/woodpecker-server:${WOODPECKER_SERVER_IMAGE_TAG:-v3.19.0}
  environment:
    - WOODPECKER_OPEN=false
    - WOODPECKER_HOST=https://${WOODPECKER_DOMAIN}
    - WOODPECKER_AGENT_SECRET=${WOODPECKER_AGENT_SECRET}
    # SQLite in WAL mode with a busy timeout. The default (rollback journal, no timeout) fails
    # writes with "database is locked" when several pipelines run, and the agent then loses or
    # re-runs workflows. The "no sqlite3 file found" warning at start is harmless.
    - WOODPECKER_DATABASE_DATASOURCE=file:/var/lib/woodpecker/woodpecker.sqlite?_busy_timeout=30000&_journal_mode=WAL&_txlock=immediate
    # Build logs go to one file per step in logs/, not into the database, which they grew by
    # gigabytes. woodpecker-db moves the logs an older install kept in the database.
    - WOODPECKER_LOG_STORE=file
    - WOODPECKER_LOG_STORE_FILE_PATH=/var/lib/woodpecker/logs
```

1. `WOODPECKER_OPEN=false` closes sign-up, so only people you add can log in.
2. `WOODPECKER_HOST` is the public address, which GitHub's OAuth app sends
   people back to.
3. `WOODPECKER_AGENT_SECRET` is shared with the agent. It is the only thing that
   stops a stranger's agent from connecting and receiving your pipelines with
   their secrets, so it is long and generated.
4. The datasource and the log store are the two fixes in the next section.

Further down, the file sets `WOODPECKER_GITHUB=true` with the OAuth app's client
id and secret, and `WOODPECKER_ADMIN` with the GitHub login that runs the
server. Traefik puts the UI on HTTPS.

The agent, from
[the same file](https://github.com/spy4x/rostok/blob/470d152167809ad1bd3c415e4b1961a79fa9eebe/stacks/woodpecker/compose.yml#L114-L129):

```yaml
woodpecker-agent:
  container_name: hl-woodpecker-agent
  image: woodpeckerci/woodpecker-agent:${WOODPECKER_AGENT_IMAGE_TAG:-v3.19.0}
  user: "${PUID:-1000}:${PGID:-1000}"
  group_add:
    - "${DOCKER_GROUP_ID:-990}" # Allow access to docker.sock
  environment:
    - WOODPECKER_SERVER=woodpecker-server:9000
    - WOODPECKER_AGENT_SECRET=${WOODPECKER_AGENT_SECRET}
    - WOODPECKER_BACKEND=docker
    # Workflows the agent runs at once. Each one runs as its own containers beside the agent,
    # outside the agent's limits below, so size it to the host's free memory and cores.
    - WOODPECKER_MAX_WORKFLOWS=${WOODPECKER_MAX_WORKFLOWS:-4}
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ${VOLUMES_PATH}/woodpecker-agent/cache:/woodpecker/cache # Cache for faster builds
```

The agent needs the Docker socket to start step containers, which makes it root
on that machine in practice. That is why the pipelines below never get the
socket themselves.

With rostok, setup is three steps: create an OAuth app in GitHub, run
`rostok stack add woodpecker --server=<name>` (it asks for the OAuth client id,
secret and admin login, and generates the agent secret), then
`rostok deploy <name>`. When one machine is not enough, the
[`ci-agent` stack](https://github.com/spy4x/rostok/blob/470d152167809ad1bd3c415e4b1961a79fa9eebe/stacks/ci-agent/README.md)
on rostok's main branch runs a second agent on another server, which connects
out to the server over TLS on port 443 and needs no open port.

### What went wrong on the server

Three things, each fixed in that compose file:

- **Sign-up was open.** The server first ran without `WOODPECKER_OPEN=false`.
  [rostok#202](https://github.com/spy4x/rostok/pull/202) closed it.
- **"database is locked".** With the default SQLite settings, parallel pipelines
  made the server's writes fail. The agent then failed to start a workflow or
  ran one twice, and both copies collided over the same containers.
  [rostok#442](https://github.com/spy4x/rostok/pull/442) opens SQLite in WAL
  mode with a 30-second busy timeout.
- **Logs inside the database.** Build logs grew the SQLite file to 4 GB, and the
  nightly backup stopped the whole stack, killing the pipelines that were
  running. [rostok#446](https://github.com/spy4x/rostok/pull/446) moved logs to
  one file per step and added a small helper container that writes a consistent
  copy of the database every 15 minutes, so the backup no longer stops anything.

## One pipeline file per repository

Each repository has a `.woodpecker.yml` at its root. Once you enable the
repository in Woodpecker's UI, GitHub sends it a webhook on every push, pull
request and tag.

This site's file starts with the events it runs on, from
[`.woodpecker.yml`](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/.woodpecker.yml#L1-L7):

```yaml
# Runs on pull requests into main, pushes to main and the cron trigger.
# `branch` matches a pull request by its target branch, so a commit on a PR
# branch builds once, as a pull_request, not again as a push.
when:
  - event: [push, pull_request]
    branch: main
  - event: cron
```

Without the `branch: main` filter, every commit on a pull request branch built
twice, once as a push and once as a pull request. The same three lines went into
this site, rostok and mig on one day
([#478](https://github.com/spy4x/antonshubin.com/pull/478),
[rostok#459](https://github.com/spy4x/rostok/pull/459),
[mig#123](https://github.com/spy4x/mig/pull/123)).

Then come the steps. Each one names a Docker image and the commands to run in
it, and all steps share the cloned workspace. The test steps call the
repository's own task (`deno task check`, `go test`) instead of repeating its
commands, so CI cannot drift from what runs locally. mig learned that the hard
way: its first pipeline
[never passed from a clean checkout](https://github.com/spy4x/mig/pull/16),
because it skipped `deno install`, and its Alpine image could not load a native
Tailwind binding. It now uses the Debian Deno image, the same one its Dockerfile
builds with.

## Browser tests: install Chromium in the step

This site's tests drive a real Chromium through Playwright: forms,
accessibility, contrast, the Content-Security-Policy. The Deno image has no
browser, so the check step installs one, from
[`.woodpecker.yml`](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/.woodpecker.yml#L10-L31)
(the comment listing the test files is shortened here):

```yaml
check:
  image: denoland/deno:2.9.0
  commands:
    - deno install
    # ... (deno task test:browser, run inside "deno task check") drive a real
    # Chromium. The base image has none,
    # so install it at the version
    # pinned in deno.json's "playwright" import (and test/browser.ts), so
    # the download lands on the browser build that version expects, with
    # OS deps included, since this container has none of the desktop libs
    # a headless Chromium needs.
    - deno run -A npm:playwright@1.63.0 install --with-deps chromium
    # scripts/video-cut.test.ts renders a generated clip with ffmpeg (libass
    # burns the captions, so it needs a font); the base image has neither.
    - apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core
    - deno task check
  when:
    event: [push, pull_request]
```

1. `deno install` fills `node_modules` from the lockfile.
2. The Playwright version in the install command must match the one the tests
   import. Each Playwright release expects one Chromium build, and a mismatch
   fails with a missing browser.
3. `--with-deps` also installs the system libraries a headless Chromium needs,
   which a server image does not have.
4. `deno task check` runs formatting, lint, type checks, unit tests and the
   browser tests.

The next step, `lighthouse`, takes the other route: it runs in Microsoft's
Playwright image, which already has Node, Chromium and its libraries, pinned by
digest, and downloads Deno into it with a checksum.

## Secrets: by name, per repository, per event

A secret lives in Woodpecker, never in the pipeline file. You add it in the
repository's settings, choose which events may use it, and a step asks for it by
name. This site's weekly report step reads analytics and YouTube keys that way:

```yaml
environment:
  UMAMI_API_TOKEN:
    from_secret: umami_api_token
  YOUTUBE_API_KEY:
    from_secret: youtube_api_key
```

That excerpt is shortened from the
[`weekly-numbers` step](https://github.com/spy4x/antonshubin.com/blob/78f79f2d3ebe84d05497b51af9f5e50cb60280e8/.woodpecker.yml#L64-L88),
which runs only on its cron trigger, never on a push or a pull request.

The event setting is the part that matters. zond's file says how its registry
token is set up, from
[`.woodpecker.yml`](https://github.com/spy4x/zond/blob/7744aaab8e64f31379bda47626aeaeaee911ecd5/.woodpecker.yml#L40-L49):

```yaml
# To set up the secret:
#   Woodpecker UI → repo → Secrets → add GHCR_PUSH_TOKEN
#   Value: GitHub PAT with `write:packages` scope (classic `ghp_*` or
#   fine-grained with Packages: write on spy4x/zond).
#   Events: tag only. Never pull_request.
#
# Every shell variable in a command is written `$$NAME`: Woodpecker
# substitutes `$NAME` in this file before the step runs and blanks any
# name it does not know, so a single `$` would erase the script's own
# variables and the secret.
```

A pull request can change the pipeline file, so a secret allowed on
`pull_request` is a secret anyone who opens one can print. Tag-only secrets are
safe from that, as long as only you can push tags.

The second paragraph is the gotcha that costs everyone an afternoon. Woodpecker
replaces `${VAR}` in the whole file before it even parses the YAML. mig's
pipeline once could not start by hand at all: on a manual run `${CI_COMMIT_TAG}`
was empty, and the release command around it turned into a YAML map
([mig#20](https://github.com/spy4x/mig/pull/20)). Write `$${VAR}` for anything
the shell should read.

## Releases: build an image on a tag

Pushing a tag such as `v2.2.0` to mig publishes `antonshubin/mig` to Docker Hub.
Here is that release in Woodpecker:

![Pipeline 437 of spy4x/mig, the v2.2.0 tag: six passed steps in order, clone, release-guard, check, build, push and dockerhub-overview, beside the clone step's log](/img/blog/self-hosted-ci-with-woodpecker/release-pipeline.webp "A release: guard, check, build without secrets, then push")

The first version of this release
([mig#22](https://github.com/spy4x/mig/pull/22)) built and pushed through the
agent's Docker socket. That needs a trusted repository, and it makes every such
pipeline root on the agent's machine.
[mig#103](https://github.com/spy4x/mig/pull/103) replaced it with two ordinary
containers. The build step, from
[`.woodpecker.yml`](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/.woodpecker.yml#L73-L84):

```yaml
build:
  image: martizih/kaniko:v1.28.5-alpine@sha256:6ba327d49f75147a44e39e8a977e9cde11b483832214b307ccf11f9da360693c
  depends_on: [release-guard, check]
  commands:
    # --destination only names the image inside the tar; nothing is pushed.
    - /kaniko/executor --context "$$CI_WORKSPACE" --dockerfile Dockerfile
      --build-arg "MIG_VERSION=$${CI_COMMIT_TAG#v}"
      --destination "antonshubin/mig:$${CI_COMMIT_TAG}"
      --no-push --tar-path "$$CI_WORKSPACE/image.tar"
  when:
    event: tag
    ref: refs/tags/v[0-9]*
```

kaniko builds an image from a Dockerfile in user space, with no Docker daemon
and no privileges. It also runs the Dockerfile's `RUN` lines, and every
dependency they download, inside this container. So this step holds no secret:
it writes `image.tar` into the workspace and pushes nothing.

The push step, from
[the same file](https://github.com/spy4x/mig/blob/766fa1d7585cf2845bcbbc6351b7c11e86755158/.woodpecker.yml#L86-L121):

```yaml
push:
  # crane v0.22.1, its debug build, because the release builds have no
  # shell. Its shell is /busybox/sh and it has no /bin/sh, so the entrypoint
  # Woodpecker runs the commands with is named here. The tags come from
  # CI_COMMIT_TAG, never from a file in the workspace.
  image: gcr.io/go-containerregistry/crane/debug:v0.22.1@sha256:e78770b31258a3846f878036d9c1f63fbe4c871f9f56990bf77fd95c013e3c1b
  entrypoint: [
    "/busybox/sh",
    "-c",
    "echo $$CI_SCRIPT | /busybox/base64 -d | /busybox/sh -e",
  ]
  depends_on: [build]
  environment:
    DOCKER_USERNAME:
      from_secret: DOCKER_USERNAME
    DOCKER_PASSWORD:
      from_secret: DOCKER_PASSWORD
  commands:
    - |
        set -eu
        IMAGE=antonshubin/mig
        # The login stays in this container, outside the workspace.
        export DOCKER_CONFIG=/tmp/docker
        printf '%s' "$$DOCKER_PASSWORD" |
          crane auth login index.docker.io -u "$$DOCKER_USERNAME" --password-stdin
        crane push image.tar "$$IMAGE:$${CI_COMMIT_TAG}"
        # A pre-release tag (v1.2.3-rc.1) is published under its own name
        # only; it never moves latest.
        case "$${CI_COMMIT_TAG}" in
          *-*) ;;
          *) crane tag "$$IMAGE:$${CI_COMMIT_TAG}" latest ;;
        esac
  when:
    event: tag
    ref: refs/tags/v[0-9]*
```

1. crane only copies images to a registry. It runs no code from the repository,
   so this is the one step that gets the Docker Hub login.
2. The image is pinned by digest, so a moved tag on Docker Hub cannot change
   what runs next to the login.
3. The image name and tags come from Woodpecker's variables, not from the
   workspace, which the build step could have written to.
4. The password goes in through standard input, so it never shows in a process
   list.

Two more steps sit around it. Before anything, `release-guard` fails when the
tag points at a commit that is not on `main`. Its comment is honest about its
limits: it stops a mistaken tag, but it is not a security boundary, because a
tag build runs the tagged commit's own pipeline file, which could drop the
guard. And on every pull request, `image-build` runs the same kaniko with
`--no-push` and no secrets, so a Dockerfile that breaks fails before the merge,
not at the next release.

zond and oko use the same pattern for GitHub's registry, pushing `:X.Y.Z`,
`:X.Y` and `:latest` for each release. rostok publishes to JSR instead: its
publish step
[retries a stalled upload](https://github.com/spy4x/rostok/pull/484) three
times, ten minutes each, because uploads to JSR stalled.

## Status badges

Woodpecker serves a status badge for every repository. mig's README carries this
line:

```markdown
[![CI](https://ci.antonshubin.com/api/badges/12/status.svg)](https://ci.antonshubin.com/repos/12)
```

The number is the repository's id in Woodpecker, the one in its URL. The badge
shows the last pipeline on the default branch, and the link opens the public
list from the screenshot at the top. On this site, the
[tool pages](/tools/rostok) show each tool's CI status, read from a snapshot of
the same public API.

## What you get

My own Woodpecker runs the checks, browser tests and releases of my public
repositories, and the pipeline files sit next to the code they test. The price
is the work above: closing sign-up, tuning SQLite, keeping secrets away from
code that should not see them.

[How I run production](/infrastructure) shows where this CI sits among the rest
of my servers. If you want this kind of setup for your product, with someone who
looks after it every week, that is my
[ongoing work](/catalog/cto-advisory-retainer). Or take the stack from
[rostok's catalog](https://github.com/spy4x/rostok/tree/470d152167809ad1bd3c415e4b1961a79fa9eebe/stacks/woodpecker),
push a tag, and watch your first release build itself.
