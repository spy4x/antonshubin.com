// The owner's notification for an audit request from `/api/lead`.
import { type EmailSender, type MailLog, subjectSafe } from "./mail.ts";

/** A validated lead, as `routes/api/lead.ts` hands it over. */
export interface Lead {
  name: string;
  email: string;
  techStack: string;
  /** The catalog item the visitor came from (`/book?service=<slug>`), when it is a real one. */
  service?: { slug: string; shortTitle: string };
}

/** What {@link notifyOwner} sends with; `sender` is `null` when SMTP is not configured. */
export interface LeadMailDeps {
  sender: EmailSender | null;
  contactEmail: string;
  /** Shown in the "sending via" log line, as before. */
  relay: string;
  /** Called with the lead when the relay refused or dropped the mail, so the
   * lead can be kept (#266). Not called when SMTP is not configured: the lead
   * is logged in that case. Resolves `false` when it declined the lead (and
   * logged why). May throw; the failure is logged without the lead. */
  keep?(lead: Lead): Promise<void | boolean>;
  log?: MailLog;
}

/**
 * Mails the lead to the owner. Never throws: without SMTP or a contact address
 * the lead is logged instead, and a failed send is logged as `[LEAD] failed:`
 * and handed to `deps.keep`.
 * Resolves `true` only when the relay accepted the mail.
 */
export async function notifyOwner(
  lead: Lead,
  deps: LeadMailDeps,
): Promise<boolean> {
  const log = deps.log ?? console;
  if (!deps.sender || !deps.contactEmail) {
    log.log("[LEAD] SMTP not configured, logging lead:", JSON.stringify(lead));
    return false;
  }

  log.log("[LEAD] sending via " + deps.relay);
  const result = await deps.sender.send({
    to: deps.contactEmail,
    subject: `[Lead] Architecture audit request from ${subjectSafe(lead.name)}`,
    // Replying to the notification reaches the visitor.
    replyTo: lead.email,
    text: `New audit request from ${lead.name} (${lead.email}):\n\n` +
      (lead.service
        ? `Service: ${lead.service.shortTitle} (${lead.service.slug})\n\n`
        : "") +
      lead.techStack,
  });
  if (!result.ok) {
    log.error("[LEAD] failed:", result.error);
    if (deps.keep) {
      try {
        // `false` means the store declined the lead and logged why.
        if (await deps.keep(lead) !== false) {
          log.error("[LEAD] kept the lead for a retry");
        }
      } catch (err) {
        // Never the lead itself: only the reason the file could not be written.
        log.error(
          "[LEAD] could not keep the lead:",
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    return false;
  }
  log.log("[LEAD] sent OK");
  return true;
}
