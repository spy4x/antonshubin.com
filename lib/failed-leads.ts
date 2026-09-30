/**
 * Keeps a lead whose mail could not be sent (#266). The file is
 * `data/leads-failed.jsonl` (override with `LEADS_FAILED_FILE`), one JSON
 * object per line, in the app's bind-mounted `data/` directory like the
 * subscriber list, so it survives a deploy and is backed up with it.
 *
 * Each line is one `write` in append mode, so two failures at once cannot
 * interleave their lines. The file is readable by its owner only, since it
 * holds what visitors typed.
 *
 * The file is capped ({@link failedLeadsMaxBytes}, 10 MB by default), so a
 * flood of failing sends cannot fill the host's disk, which also holds the
 * subscriber list. At the cap a lead is not kept, and one log line says so.
 */
import { dirname } from "@std/path";
import type { Lead } from "./lead-mail.ts";

/** Where failed leads go: `LEADS_FAILED_FILE`, or `data/leads-failed.jsonl`. */
export function failedLeadsPath(): string {
  return Deno.env.get("LEADS_FAILED_FILE") || "data/leads-failed.jsonl";
}

/** Default size limit of the file: 10 MB. */
export const FAILED_LEADS_DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

/** The size limit: `LEADS_FAILED_MAX_BYTES` when it is a positive integer,
 * else {@link FAILED_LEADS_DEFAULT_MAX_BYTES}. */
export function failedLeadsMaxBytes(): number {
  const value = Number(Deno.env.get("LEADS_FAILED_MAX_BYTES"));
  return Number.isSafeInteger(value) && value > 0
    ? value
    : FAILED_LEADS_DEFAULT_MAX_BYTES;
}

/** One line of the file: when the send failed, and the lead as validated. */
export interface FailedLead {
  failedAt: string;
  lead: Lead;
}

/**
 * Appends `lead` to the file at `path`, creating the file and its directory
 * when they are missing. A line that would take the file past `maxBytes` is
 * not written: one line goes to `log` (never the lead) and the call returns
 * `false`. Returns `true` once the lead is written. Throws when it cannot
 * write.
 */
export async function appendFailedLead(
  lead: Lead,
  path: string,
  now: Date = new Date(),
  maxBytes: number = failedLeadsMaxBytes(),
  log: { error(...args: unknown[]): void } = console,
): Promise<boolean> {
  const line: FailedLead = { failedAt: now.toISOString(), lead };
  const bytes = new TextEncoder().encode(JSON.stringify(line) + "\n");
  await Deno.mkdir(dirname(path), { recursive: true });
  const size = await Deno.stat(path).then((s) => s.size, () => 0);
  if (size + bytes.length > maxBytes) {
    log.error(
      `[LEAD] failed-leads file is at its ${maxBytes}-byte cap, lead not kept`,
    );
    return false;
  }
  await Deno.writeFile(path, bytes, {
    append: true,
    create: true,
    mode: 0o600,
  });
  return true;
}
