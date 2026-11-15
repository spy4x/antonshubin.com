// Guards the three settings that keep the newsletter subscriber list
// (data/subscribers.json) alive across deploys. Losing any one of them lets a
// deploy empty or overwrite the list, and nothing else would notice until a
// newsletter reached nobody. See docs/deploy.md "Subscriber data".
import { assert } from "jsr:@std/assert@^1.0.0"

function read(path: string): string {
  return Deno.readTextFileSync(new URL(`../${path}`, import.meta.url))
}

/** The lines of a file, trimmed, so a check matches a whole entry, not a substring. */
function lines(path: string): string[] {
  return read(path).split("\n").map((line) => line.trim())
}

Deno.test("compose mounts data/ from the host, so a recreated container keeps it", () => {
  assert(
    lines("compose.yml").includes("- ./data:/app/data:z"),
    "compose.yml must bind-mount ./data at /app/data with the SELinux :z label",
  )
})

Deno.test("deploy rsync excludes /data/, so --delete never touches the list", () => {
  const rsync = read("scripts/deploy.ts").split("\n").find((line) =>
    line.includes("rsync -avz --delete")
  )
  assert(rsync, "scripts/deploy.ts no longer has the rsync --delete step")
  assert(
    rsync.includes("--exclude='/data/'"),
    "the rsync --delete step must exclude '/data/'",
  )
  // Either of these would bring data/ back into the transfer: --delete-excluded
  // deletes excluded paths too, and an --include wins over a later --exclude.
  assert(
    !rsync.includes("--delete-excluded"),
    "rsync must not use --delete-excluded",
  )
  assert(
    !rsync.includes("--include"),
    "rsync must not --include anything back",
  )
})

Deno.test("the image never carries a local data/ directory", () => {
  assert(
    lines(".dockerignore").includes("/data/"),
    ".dockerignore must list /data/",
  )
})

// .env.deploy holds the Cloudflare token (#268). It stays on the deploying
// machine: git ignores it, and neither rsync step may carry it to the server.
Deno.test("the Cloudflare token file is never committed or uploaded", () => {
  assert(
    lines(".gitignore").includes(".env.deploy"),
    ".gitignore must list .env.deploy",
  )
  assert(
    lines(".dockerignore").includes(".env.*"),
    ".dockerignore must list .env.*, which keeps .env.deploy out of the source rsync",
  )
  const envRsync = read("scripts/deploy.ts").split("\n").find((line) =>
    line.includes("rsync -avz .env")
  )
  assert(envRsync, "scripts/deploy.ts no longer has the env-file rsync step")
  assert(
    !envRsync.includes(".env.deploy"),
    "the env-file rsync must not upload .env.deploy",
  )
})

// Fresh needs one build id for the server HTML and the client bundle, or every
// hydrated image downloads twice (#593). The image has no git, so the id must
// reach the build step through DENO_DEPLOYMENT_ID.
Deno.test("the Dockerfile declares BUILD_ID before the build that reads it", () => {
  const dockerfile = lines("Dockerfile")
  const arg = dockerfile.findIndex((line) => line.startsWith("ARG BUILD_ID"))
  const build = dockerfile.findIndex((line) =>
    line.startsWith("RUN") && line.includes("deno task build")
  )
  assert(build >= 0, "the Dockerfile no longer runs deno task build")
  assert(arg >= 0 && arg < build, "ARG BUILD_ID must come before the build")
})

Deno.test("the Dockerfile build sets DENO_DEPLOYMENT_ID from BUILD_ID", () => {
  const build = lines("Dockerfile").find((line) =>
    line.startsWith("RUN") && line.includes("deno task build")
  )
  assert(build, "the Dockerfile no longer runs deno task build")
  assert(
    build.includes("DENO_DEPLOYMENT_ID=${BUILD_ID}"),
    "the build must run with DENO_DEPLOYMENT_ID=${BUILD_ID}",
  )
})

// The build id check reads the live site, so it runs once compose has started
// the new build and the purge has waited for it.
Deno.test("the deploy checks the live build id after the purge", () => {
  const source = read("scripts/deploy.ts")
  const purge = source.indexOf("await purgeAfterDeploy(")
  const check = source.indexOf(
    "await checkLiveBuildId(TARGET.domain, BUILD_ID)",
  )
  assert(check >= 0, "scripts/deploy.ts must call checkLiveBuildId")
  assert(check > purge, "checkLiveBuildId must run after purgeAfterDeploy")
})

// The purge needs the build that was live before anything is uploaded, and it
// may only run once compose has started the new build (#268).
Deno.test("the deploy reads the live build before the upload and purges after compose", () => {
  const source = read("scripts/deploy.ts")
  const liveRead = source.indexOf("await liveBuildId(TARGET.domain")
  const upload = source.indexOf("rsync -avz --delete")
  const compose = source.indexOf("docker compose -p")
  const composeRun = source.indexOf("`ssh ${SERVER} '${composeCmd}'`")
  const purge = source.indexOf("await purgeAfterDeploy(")
  assert(
    liveRead >= 0,
    "scripts/deploy.ts must read the live build with liveBuildId",
  )
  assert(purge >= 0, "scripts/deploy.ts must call purgeAfterDeploy")
  assert(
    upload >= 0 && compose >= 0 && composeRun >= 0,
    "deploy steps not found",
  )
  assert(liveRead < upload, "liveBuildId must run before the first rsync")
  assert(purge > composeRun, "purgeAfterDeploy must run after docker compose")
})
