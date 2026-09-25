// Guard for #233: every mail goes through `@spy4x/email` (see AGENTS.md
// "Outgoing mail"). A raw socket or an SMTP verb in the site's own code means
// a hand-written client came back, with the header-injection and
// dot-stuffing bugs the library exists to prevent.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";

const ROOT = new URL("../", import.meta.url);
const DIRS = ["routes", "lib", "islands", "components", "scripts"];
const HAND_SMTP = [
  /Deno\.connectTls\s*\(/,
  /Deno\.connect\s*\(/,
  /Deno\.startTls\s*\(/,
  /AUTH LOGIN/,
  /MAIL FROM:/,
  /RCPT TO:/,
];

async function sourceFiles(dir: URL): Promise<URL[]> {
  const files: URL[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const url = new URL(entry.name + (entry.isDirectory ? "/" : ""), dir);
    if (entry.isDirectory) files.push(...await sourceFiles(url));
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      files.push(url);
    }
  }
  return files;
}

Deno.test("no site code opens an SMTP connection or speaks SMTP by hand", async () => {
  const files = (await Promise.all(
    DIRS.map((dir) => sourceFiles(new URL(`${dir}/`, ROOT))),
  ))
    .flat();
  assert(
    files.length > 20,
    `expected to scan the site's sources, found ${files.length} files`,
  );
  const hits: string[] = [];
  for (const file of files) {
    const text = await Deno.readTextFile(file);
    for (const pattern of HAND_SMTP) {
      if (pattern.test(text)) {
        hits.push(`${file.pathname.slice(ROOT.pathname.length)}: ${pattern}`);
      }
    }
  }
  assertEquals(hits, [], "send mail through lib/mail.ts instead");
});
