import { UPWORK_URL } from "./config.ts";

/**
 * Anton's public profiles and contact channels (#293): the one place a
 * profile URL is written. The footer (`components/Footer.tsx`), the
 * `/book` side panel (email, Telegram, Upwork) and the `sameAs` list in
 * the Person JSON-LD (`components/SEOHead.tsx`) all read from here, so a new
 * or renamed profile is one edit.
 */
export interface Profile {
  id: string;
  label: string;
  href: string;
}

/**
 * Every profile, in the order `sameAs` lists them. Checked on 30 Sep 2026:
 * the vlog channel answers 200, while an unknown YouTube handle answers 404.
 */
export const profiles: readonly Profile[] = [
  { id: "upwork", label: "Upwork", href: UPWORK_URL },
  { id: "github", label: "GitHub", href: "https://github.com/spy4x" },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/anton-shubin",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@anton-shubin",
  },
  {
    id: "youtube-vlog",
    label: "YouTube vlog",
    href: "https://www.youtube.com/@anton-shubin-live",
  },
  { id: "x", label: "X", href: "https://x.com/spy4x" },
];

/** One profile by id; throws on a typo so a bad id fails the build. */
export function profile(id: string): Profile {
  const found = profiles.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown profile id: ${id}`);
  return found;
}

function pick(ids: readonly string[]): Profile[] {
  return ids.map(profile);
}

/** The footer's "Elsewhere" group, in reading order. */
export const footerProfiles: Profile[] = pick([
  "github",
  "linkedin",
  "youtube",
  "upwork",
  "x",
]);

/** The Person JSON-LD's `sameAs`. */
export const sameAsUrls: string[] = profiles.map((p) => p.href);

/** Direct contact channels, shown in the footer's "Contact" group. */
export const EMAIL_ADDRESS = "hi@antonshubin.com";
export const emailContact: Profile = {
  id: "email",
  label: "Email",
  href: `mailto:${EMAIL_ADDRESS}`,
};
export const telegramContact: Profile = {
  id: "telegram",
  label: "Telegram",
  href: "https://t.me/spy4x",
};
