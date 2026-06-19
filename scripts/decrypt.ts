#!/usr/bin/env -S deno run -A
/**
 * Decrypt .env.prod.age -> .env.prod using SOPS+age.
 * Key file: .age/key.txt (gitignored) — copy from ~/sync/code/homelab/.age/ if missing.
 */

const KEY = ".age/key.txt";
const SRC = ".env.prod.age";
const DST = ".env.prod";

const missing = [KEY, SRC].filter((f) => {
  try {
    Deno.statSync(f);
    return false;
  } catch {
    return true;
  }
});
if (missing.length) {
  console.error(`❌ Missing: ${missing.join(", ")}`);
  Deno.exit(1);
}

const cmd = new Deno.Command("sops", {
  args: ["--decrypt", SRC],
  env: { SOPS_AGE_KEY_FILE: KEY },
  stdout: "piped",
  stderr: "piped",
});
const o = await cmd.output();
if (o.code !== 0) {
  console.error(`❌ decrypt failed:\n${new TextDecoder().decode(o.stderr)}`);
  Deno.exit(1);
}

Deno.writeFileSync(DST, o.stdout);
console.log(`✅ ${SRC} -> ${DST}`);
