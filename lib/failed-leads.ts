/**
 * Keeps a lead whose mail could not be sent (#266). The file is
 * `data/leads-failed.jsonl` (override with `LEADS_FAILED_FILE`), one JSON
 * object per line, in the app's bind-mounted `data/` directory like the
 * subscriber list, so it survives a deploy and is backed up with it.
 *
 * Each line is one `write` in append mode, so two failures at once cannot
 * interleave their lines. The file is readable by its owner only, since it
 * holds what visitors typed.
 */
import { dirname } from "@std/path";
import type { Lead } from "./lead-mail.ts";

/** Where failed leads go: `LEADS_FAILED_FILE`, or `data/leads-failed.jsonl`. */
export function failedLeadsPath(): string {
  return Deno.env.get("LEADS_FAILED_FILE") || "data/leads-failed.jsonl";
}

/** One line of the file: when the send failed, and the lead as validated. */
export interface FailedLead {
  failedAt: string;
  lead: Lead;
}

/**
 * Appends `lead` to the file at `path`, creating the file and its directory
 * when they are missing. Throws when it cannot write.
 */
export async function appendFailedLead(
  lead: Lead,
  path: string,
  now: Date = new Date(),
): Promise<void> {
  const line: FailedLead = { failedAt: now.toISOString(), lead };
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, JSON.stringify(line) + "\n", {
    append: true,
    create: true,
    mode: 0o600,
  });
}
