// Runs `scripts/send-newsletter.ts --stdin-json` as the production container
// does, against temp files, to prove the refusals hold at the script level and
// not only in `lib/newsletter-log.ts`. SMTP points at 127.0.0.1's discard port
// and the child may only reach 127.0.0.1, so a broken guard fails the test
// instead of mailing anyone.
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";

const ANNOUNCEMENT = {
  slug: "a-post",
  subject: "A post",
  html: "<p>Hello</p>",
  text: "Hello",
};

const EARLIER = {
  slug: "a-post",
  subject: "New article: A post",
  startedAt: "2026-09-25T10:00:00.000Z",
  recipients: [],
  sent: 2,
  failed: 0,
  completedAt: "2026-09-25T10:05:00.000Z",
};

/** An entry written before per-recipient marks existed. */
const LEGACY = {
  slug: "a-post",
  subject: "New article: A post",
  startedAt: "2026-09-25T10:00:00.000Z",
  sent: 2,
  failed: 0,
};

async function runSend(
  dir: string,
  subscribers: string,
  log: string | undefined,
  { extraArgs = [], env = {} }: {
    extraArgs?: string[];
    env?: Record<string, string>;
  } = {},
): Promise<{ code: number; stdout: string; stderr: string; log?: string }> {
  const subscribersFile = `${dir}/subscribers.json`;
  const logFile = `${dir}/newsletter-log.json`;
  await Deno.writeTextFile(subscribersFile, subscribers);
  if (log !== undefined) await Deno.writeTextFile(logFile, log);
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      `--allow-write=${dir}`,
      "--allow-env",
      "--allow-net=127.0.0.1",
      "scripts/send-newsletter.ts",
      "--stdin-json",
      ...extraArgs,
    ],
    env: {
      SUBSCRIBERS_FILE: subscribersFile,
      NEWSLETTER_LOG_FILE: logFile,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "9",
      SMTP_USERNAME: "site@example.com",
      SMTP_PASSWORD: "not-a-real-password",
      SMTP_FROM: "",
      UNSUBSCRIBE_SECRET: "t".repeat(32),
      ...env,
    },
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(ANNOUNCEMENT)));
  await writer.close();
  const { code, stdout, stderr } = await child.output();
  let after: string | undefined;
  try {
    after = await Deno.readTextFile(logFile);
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }
  return {
    code,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    log: after,
  };
}

Deno.test("the container send refuses a slug already in the log, exits 1, prints no Sending line and leaves the log unchanged", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const log = JSON.stringify([EARLIER]);
    const subscribers = JSON.stringify([
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const r = await runSend(dir, subscribers, log);
    assertEquals(r.code, 1);
    assertStringIncludes(r.stderr, `Refused: the newsletter for "a-post"`);
    assertEquals(r.stdout.includes("Sending"), false);
    assertEquals(r.log, log);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("the container send refuses a slug whose log entry predates per-recipient marks", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const log = JSON.stringify([LEGACY]);
    const subscribers = JSON.stringify([
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const r = await runSend(dir, subscribers, log);
    assertEquals(r.code, 1);
    assertStringIncludes(r.stderr, `Refused: the newsletter for "a-post"`);
    assertEquals(r.log, log);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("--test sends only to CONTACT_EMAIL, with a [Test] subject, and writes no log", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const subscribers = JSON.stringify([
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const r = await runSend(dir, subscribers, undefined, {
      extraArgs: ["--test"],
      env: { CONTACT_EMAIL: "owner@example.com" },
    });
    // The relay at the discard port refuses, so the one test copy fails: that
    // proves one mail was tried, and only that one.
    assertEquals(r.code, 1);
    assertStringIncludes(r.stdout, "Test copy done. Sent: 0, Failed: 1");
    assertStringIncludes(r.stderr, "✗ owner@example.com:");
    assertEquals((r.stdout + r.stderr).includes("one@example.com"), false);
    assertEquals(r.log, undefined);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("--test without CONTACT_EMAIL stops and sends nothing", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const r = await runSend(dir, "[]", undefined, {
      extraArgs: ["--test"],
      env: { CONTACT_EMAIL: "" },
    });
    assertEquals(r.code, 1);
    assertStringIncludes(r.stderr, "--test needs CONTACT_EMAIL");
    assertEquals(r.log, undefined);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("the container send refuses an empty subscriber list, exits 1 and records nothing", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const r = await runSend(dir, "[]", undefined);
    assertEquals(r.code, 1);
    assertStringIncludes(r.stderr, "Refused: no subscribers loaded");
    assertEquals(r.stdout.includes("Sending"), false);
    assertEquals(r.log, undefined);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("the container send exits 1 when the relay refuses the only mail, and keeps the post open for a rerun", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const subscribers = JSON.stringify([
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    const r = await runSend(dir, subscribers, undefined);
    assertEquals(r.code, 1);
    assertStringIncludes(r.stdout, "Sent: 0, Failed: 1");
    const [entry] = JSON.parse(r.log ?? "[]");
    assertEquals([entry?.slug, entry?.sent, entry?.failed], ["a-post", 0, 1]);
    assertEquals(entry?.recipients, []);
    assertEquals(entry?.completedAt, undefined);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
