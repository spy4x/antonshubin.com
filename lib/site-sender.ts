// The site's mail sender, built once from the SMTP_* environment values, for
// the routes of the newsletter sign-up. `null` when SMTP is not configured.
import {
  BASE_URL,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from "./config.ts";
import { createSiteSender, type EmailSender, smtpSettings } from "./mail.ts";

const SMTP = smtpSettings({
  host: SMTP_HOST,
  port: SMTP_PORT,
  user: SMTP_USERNAME,
  pass: SMTP_PASSWORD,
  from: SMTP_FROM,
  ehloName: new URL(BASE_URL).hostname,
});

/** The relay sender, or `null` without SMTP settings. */
export const SITE_SENDER: EmailSender | null = SMTP
  ? createSiteSender(SMTP)
  : null;
