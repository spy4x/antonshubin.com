#!/usr/bin/env -S deno run -A
/**
 * Deploy to homelab: rsync source + env files, docker compose up --build
 *
 * Usage: deno task deploy
 *
 * Steps:
 *  1. Rsync source (excluding .git, node_modules, _fresh, and .dockerignore patterns)
 *  2. Rsync .env + .env.prod separately (blocked by .dockerignore from step 1)
 *  3. SSH to homelab: docker compose --env-file .env.prod up -d --build
 */

const SERVER = "homelab";
const REMOTE_PATH = "~/ssd-2tb/apps/anton/antonshubin.com/";
const REMOTE = `${SERVER}:${REMOTE_PATH}`;

// Step 0: bump SW cache version so browsers detect an update
const swPath = "static/sw.js";
let sw = Deno.readTextFileSync(swPath);
const match = sw.match(/const CACHE = "antonshubin-v(\d+)"/);
if (match) {
  const ver = parseInt(match[1]) + 1;
  sw = sw.replace(`antonshubin-v${match[1]}`, `antonshubin-v${ver}`);
  Deno.writeTextFileSync(swPath, sw);
  console.log(`  sw cache: antonshubin-v${match[1]} → v${ver}`);
} else {
  console.log("  sw cache: version pattern not found — skipping bump");
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

// Step 1: source code (exclude env files via dockerignore filter)
console.log("  rsync source...");
const r1 = await run(
  `rsync -avz --delete --exclude='.git/' --exclude='node_modules/' --exclude='_fresh/' --filter=':- .dockerignore' ./ ${REMOTE}`,
);
if (r1.code !== 0) {
  console.error(r1.stderr);
  Deno.exit(1);
}
console.log(r1.stdout);

// Step 2: env files (bypass dockerignore)
console.log("  rsync env files...");
const r2 = await run(`rsync -avz .env .env.prod ${REMOTE}`);
if (r2.code !== 0) {
  console.error(r2.stderr);
  Deno.exit(1);
}
console.log(r2.stdout);

// Step 3: build and restart on remote
console.log("  docker compose...");
const r3 = await run(
  `ssh ${SERVER} 'cd ${REMOTE_PATH} && docker compose --env-file .env.prod up -d --build'`,
);
if (r3.code !== 0) {
  console.error(r3.stderr);
  Deno.exit(1);
}
console.log(r3.stdout);

console.log("✅ Deploy complete");
