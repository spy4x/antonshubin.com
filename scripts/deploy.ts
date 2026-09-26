#!/usr/bin/env -S deno run -A
/**
 * Deploy to the cloud server: rsync source + env files, docker compose up --build
 *
 * Never edits a tracked file — the service-worker cache name (routes/sw.js.ts)
 * comes from BUILD_ID, set below to the local commit hash and passed to the
 * remote build, so `git status` stays clean before and after a deploy.
 *
 * Usage:
 *   deno task deploy           # production → antonshubin.com
 *   deno task deploy:stag      # staging   → website-stag.antonshubin.com
 *
 * Steps:
 *  1. Rsync source (excluding .git, .age, node_modules, _fresh, data, and .dockerignore patterns)
 *  2. Rsync env files separately (blocked by .dockerignore from step 1)
 *  3. SSH to the server: mkdir -p data, then BUILD_ID=<commit hash> docker compose up -d --build
 *
 * `data/` on the server holds the newsletter subscriber list, bind-mounted into
 * the container by compose.yml. Step 1 never deletes or overwrites it, and step
 * 3 creates it on a fresh target so it belongs to the deploy user, not to root
 * (Docker creates a missing bind-mount source as root). See docs/deploy.md.
 */

import { stagingEnv } from "./staging-env.ts";

// Cloud server (23.88.101.28). antonshubin.com used to run on the home server
// as well; it was consolidated onto cloud, where Umami also lives — which is
// what lets the first-party /umami/ proxy work from Traefik labels alone.
const SERVER = "cloudlab";
const isStaging = Deno.env.get("DEPLOY_ENV") === "staging";

const TARGET = isStaging
  ? {
    name: "staging",
    project: "antonshubincom-stag",
    envFile: ".env.staging.local",
    domain: "website-stag.antonshubin.com",
  }
  : {
    name: "production",
    project: "antonshubincom",
    envFile: ".env.prod",
    domain: "antonshubin.com",
  };

const REMOTE_PATH = isStaging
  ? "~/cloudlab/apps/antonshubin.com-stag/"
  : "~/cloudlab/apps/antonshubin.com/";
const REMOTE = `${SERVER}:${REMOTE_PATH}`;

console.log(`\n  🎯 Deploying to ${TARGET.name} (${TARGET.domain})\n`);

if (isStaging) {
  // Create .env.staging.local on the fly (used for docker compose
  // --env-file). The .local suffix keeps it matched by the .gitignore rule
  // .env.*.local, so a deploy that fails midway leaves no untracked,
  // un-ignored copy of the environment values behind.
  const stagEnv = stagingEnv(
    Deno.readTextFileSync(".env.prod"),
    TARGET.domain,
  );
  Deno.writeTextFileSync(TARGET.envFile, stagEnv);
}

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

// Runs every deploy step, wrapped so a failure at any point still lets the
// caller clean up the temp env file below instead of exiting mid-deploy.
let failed = false;
try {
  // Build id for the service worker's cache name (routes/sw.js.ts). Computed
  // locally instead of writing it into a tracked file, so the working tree
  // stays clean.
  const buildIdResult = await run("git rev-parse --short HEAD");
  if (buildIdResult.code !== 0) {
    throw new Error(buildIdResult.stderr);
  }
  const BUILD_ID = buildIdResult.stdout.trim();

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
  const composeCmd = isStaging
    // Staging: cp .env.staging.local → .env.prod for compose.yml's env_file,
    // and set PROJECT for the container_name variable in compose.yml
    ? `cd ${REMOTE_PATH} && mkdir -p data && cp -f ${TARGET.envFile} .env.prod && PROJECT=${TARGET.project} BUILD_ID=${BUILD_ID} docker compose -p ${TARGET.project} --env-file ${TARGET.envFile} up -d --build`
    : `cd ${REMOTE_PATH} && mkdir -p data && BUILD_ID=${BUILD_ID} docker compose -p ${TARGET.project} --env-file ${TARGET.envFile} up -d --build`;
  const r3 = await run(
    `ssh ${SERVER} '${composeCmd}'`,
  );
  if (r3.code !== 0) {
    throw new Error(r3.stderr);
  }
  console.log(r3.stdout);

  console.log(`✅ Deploy to ${TARGET.name} complete`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  failed = true;
} finally {
  // Clean up temp env file, including on a failed/early-exiting deploy.
  if (isStaging) {
    try {
      Deno.removeSync(TARGET.envFile);
    } catch { /* already gone */ }
  }
}

if (failed) {
  Deno.exit(1);
}
