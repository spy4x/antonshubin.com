#!/usr/bin/env -S deno run -A
/**
 * Deploy to the cloud server: rsync source + env files, docker compose up --build
 *
 * Never edits a tracked file — the build id that routes/sw.js.ts prints
 * comes from BUILD_ID, set below to the local commit hash and passed to the
 * remote build, so `git status` stays clean before and after a deploy.
 *
 * Usage:
 *   deno task deploy           # production → antonshubin.com
 *
 * Steps:
 *  1. Rsync source (excluding .git, .age, node_modules, _fresh, data, and .dockerignore patterns)
 *  2. Rsync env files separately (blocked by .dockerignore from step 1)
 *  3. SSH to the server: mkdir -p data, then BUILD_ID=<commit hash> docker compose up -d --build
 *  4. Wait (about 60 s at most) until /sw.js serves the new BUILD_ID, then purge
 *     Cloudflare: /sw.js plus every static/ file changed since the build that
 *     was live before this deploy (#268). Fails open: a purge problem only
 *     warns. The token comes from .env.deploy, which is never uploaded.
 *
 * `data/` on the server holds the newsletter subscriber list, bind-mounted into
 * the container by compose.yml. Step 1 never deletes or overwrites it, and step
 * 3 creates it on a fresh target so it belongs to the deploy user, not to root
 * (Docker creates a missing bind-mount source as root). See docs/deploy.md.
 */

import { envValue, liveBuildId, purgeAfterDeploy } from "./cloudflare-purge.ts";

// Cloud server (23.88.101.28). antonshubin.com used to run on the home server
// as well; it was consolidated onto cloud, where Umami also lives — which is
// what lets the first-party /umami/ proxy work from Traefik labels alone.
const SERVER = "cloudlab";

const TARGET = {
  name: "production",
  project: "antonshubincom",
  envFile: ".env.prod",
  domain: "antonshubin.com",
};

const REMOTE_PATH = "~/cloudlab/apps/antonshubin.com/";
const REMOTE = `${SERVER}:${REMOTE_PATH}`;

console.log(`\n  🎯 Deploying to ${TARGET.name} (${TARGET.domain})\n`);

async function run(
  cmd: string,
  cwd?: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const p = new Deno.Command("bash", {
    args: ["-c", cmd],
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const o = await p.output();
  return {
    code: o.code,
    stdout: new TextDecoder().decode(o.stdout),
    stderr: new TextDecoder().decode(o.stderr),
  };
}

/** Reads CLOUDFLARE_API_TOKEN from the environment or the local .env.deploy. */
function cloudflareToken(): string | undefined {
  const fromEnv = Deno.env.get("CLOUDFLARE_API_TOKEN");
  if (fromEnv) return fromEnv;
  try {
    return envValue(
      Deno.readTextFileSync(".env.deploy"),
      "CLOUDFLARE_API_TOKEN",
    );
  } catch {
    return undefined;
  }
}

/** Runs git in this checkout for step 4's static/ diff. */
async function git(args: string[]): Promise<{ code: number; stdout: string }> {
  const o = await new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "null",
  }).output();
  return { code: o.code, stdout: new TextDecoder().decode(o.stdout) };
}

try {
  // Build id that routes/sw.js.ts prints, for the purge step to read. Computed
  // locally instead of writing it into a tracked file, so the working tree
  // stays clean.
  const buildIdResult = await run("git rev-parse --short HEAD");
  if (buildIdResult.code !== 0) {
    throw new Error(buildIdResult.stderr);
  }
  const BUILD_ID = buildIdResult.stdout.trim();

  // The build live before this deploy, read from its /sw.js, so step 4 knows
  // which static/ files changed. Unknown is fine: step 4 then purges /sw.js only.
  const previousBuildId = await liveBuildId(TARGET.domain);

  // Step 1: source code (exclude env files via dockerignore filter).
  // `/data/` is excluded explicitly, not only through .dockerignore: rsync
  // never deletes an excluded path, even with --delete, and the subscriber
  // list there must survive a later edit of .dockerignore.
  console.log("  rsync source...");
  const r1 = await run(
    `rsync -avz --delete --exclude='.git' --exclude='.age/' --exclude='node_modules/' --exclude='_fresh/' --exclude='/data/' --filter=':- .dockerignore' ./ ${REMOTE}`,
  );
  if (r1.code !== 0) {
    throw new Error(r1.stderr);
  }
  console.log(r1.stdout);

  // Step 2: env files (bypass dockerignore)
  console.log("  rsync env files...");
  const r2 = await run(`rsync -avz .env ${TARGET.envFile} ${REMOTE}`);
  if (r2.code !== 0) {
    throw new Error(r2.stderr);
  }
  console.log(r2.stdout);

  // Step 3: build and restart on remote
  console.log("  docker compose...");
  const composeCmd =
    `cd ${REMOTE_PATH} && mkdir -p data && BUILD_ID=${BUILD_ID} docker compose -p ${TARGET.project} --env-file ${TARGET.envFile} up -d --build`;
  const r3 = await run(
    `ssh ${SERVER} '${composeCmd}'`,
  );
  if (r3.code !== 0) {
    throw new Error(r3.stderr);
  }
  console.log(r3.stdout);

  // Step 4: Cloudflare purge. Never fails the deploy.
  await purgeAfterDeploy({
    domain: TARGET.domain,
    buildId: BUILD_ID,
    previousBuildId,
    git,
    token: cloudflareToken,
  });

  console.log(`✅ Deploy to ${TARGET.name} complete`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  Deno.exit(1);
}
