import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  appendFailedLead,
  type FailedLead,
  failedLeadsMaxBytes,
} from "./failed-leads.ts";
import type { Lead } from "./lead-mail.ts";

const lead = (n: number): Lead => ({
  name: `Jane ${n}`,
  email: `jane${n}@example.com`,
  techStack: `Deno\nline "${n}"`,
});

async function withDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("appends each failed lead as one JSON line, creating the directory, file-private", async () => {
  await withDir(async (dir) => {
    const path = `${dir}/data/leads-failed.jsonl`;
    await appendFailedLead(lead(1), path, new Date("2026-09-30T10:00:00.000Z"));
    await appendFailedLead(lead(2), path, new Date("2026-09-30T11:00:00.000Z"));
    const lines = (await Deno.readTextFile(path)).trimEnd().split("\n");
    const parsed = lines.map((l) => JSON.parse(l) as FailedLead);
    assertEquals(parsed, [
      { failedAt: "2026-09-30T10:00:00.000Z", lead: lead(1) },
      { failedAt: "2026-09-30T11:00:00.000Z", lead: lead(2) },
    ]);
    assertEquals((await Deno.stat(path)).mode! & 0o777, 0o600);
  });
});

Deno.test("twenty concurrent failures leave twenty whole lines", async () => {
  await withDir(async (dir) => {
    const path = `${dir}/leads-failed.jsonl`;
    const all = Array.from({ length: 20 }, (_, i) => lead(i));
    await Promise.all(all.map((l) => appendFailedLead(l, path)));
    const lines = (await Deno.readTextFile(path)).trimEnd().split("\n");
    const names = lines.map((l) => (JSON.parse(l) as FailedLead).lead.name);
    assertEquals(names.sort(), all.map((l) => l.name).sort());
  });
});

Deno.test("at the size cap a failed lead leaves the file unchanged and logs one line without the lead", async () => {
  await withDir(async (dir) => {
    const path = `${dir}/leads-failed.jsonl`;
    const now = new Date("2026-09-30T10:00:00.000Z");
    const one = new TextEncoder().encode(
      JSON.stringify({ failedAt: now.toISOString(), lead: lead(1) }) + "\n",
    ).length;
    const logged: unknown[][] = [];
    const log = { error: (...args: unknown[]) => void logged.push(args) };
    // The cap fits exactly two lines of this size.
    const cap = one * 2;
    assertEquals(await appendFailedLead(lead(1), path, now, cap, log), true);
    assertEquals(await appendFailedLead(lead(2), path, now, cap, log), true);
    const before = await Deno.readTextFile(path);
    assertEquals(logged.length, 0);
    assertEquals(await appendFailedLead(lead(3), path, now, cap, log), false);
    assertEquals(await Deno.readTextFile(path), before);
    assertEquals(logged.length, 1);
    assertEquals(logged[0].join(" ").includes("jane3"), false);
    assertEquals(logged[0].join(" ").includes("Jane 3"), false);
  });
});

Deno.test("the size cap defaults to 10 MB and LEADS_FAILED_MAX_BYTES overrides it", () => {
  const before = Deno.env.get("LEADS_FAILED_MAX_BYTES");
  try {
    Deno.env.delete("LEADS_FAILED_MAX_BYTES");
    assertEquals(failedLeadsMaxBytes(), 10 * 1024 * 1024);
    Deno.env.set("LEADS_FAILED_MAX_BYTES", "2048");
    assertEquals(failedLeadsMaxBytes(), 2048);
    Deno.env.set("LEADS_FAILED_MAX_BYTES", "nonsense");
    assertEquals(failedLeadsMaxBytes(), 10 * 1024 * 1024);
  } finally {
    if (before === undefined) Deno.env.delete("LEADS_FAILED_MAX_BYTES");
    else Deno.env.set("LEADS_FAILED_MAX_BYTES", before);
  }
});
