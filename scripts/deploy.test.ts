// Guards the three settings that keep the newsletter subscriber list
// (data/subscribers.json) alive across deploys. Losing any one of them lets a
// deploy empty or overwrite the list, and nothing else would notice until a
// newsletter reached nobody. See docs/deploy.md "Subscriber data".
import { assert } from "jsr:@std/assert@^1.0.0";

function read(path: string): string {
  return Deno.readTextFileSync(new URL(`../${path}`, import.meta.url));
}

/** The lines of a file, trimmed, so a check matches a whole entry, not a substring. */
function lines(path: string): string[] {
  return read(path).split("\n").map((line) => line.trim());
}

Deno.test("compose mounts data/ from the host, so a recreated container keeps it", () => {
  assert(
    lines("compose.yml").includes("- ./data:/app/data:z"),
    "compose.yml must bind-mount ./data at /app/data with the SELinux :z label",
  );
});

Deno.test("deploy rsync excludes /data/, so --delete never touches the list", () => {
  const rsync = read("scripts/deploy.ts").split("\n").find((line) =>
    line.includes("rsync -avz --delete")
  );
  assert(rsync, "scripts/deploy.ts no longer has the rsync --delete step");
  assert(
    rsync.includes("--exclude='/data/'"),
    "the rsync --delete step must exclude '/data/'",
  );
  // Either of these would bring data/ back into the transfer: --delete-excluded
  // deletes excluded paths too, and an --include wins over a later --exclude.
  assert(
    !rsync.includes("--delete-excluded"),
    "rsync must not use --delete-excluded",
  );
  assert(
    !rsync.includes("--include"),
    "rsync must not --include anything back",
  );
});

Deno.test("the image never carries a local data/ directory", () => {
  assert(
    lines(".dockerignore").includes("/data/"),
    ".dockerignore must list /data/",
  );
});
