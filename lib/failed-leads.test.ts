import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { appendFailedLead, type FailedLead } from "./failed-leads.ts";
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
