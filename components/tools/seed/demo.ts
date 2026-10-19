// Seed's live demo (#455): its hosts and where each "try it" link goes. The
// one-click sign-in these links rely on is `libs/ui/demo-notice.tsx` in
// spy4x/seed (docs/demo.md there); if it is ever removed, the demo note and
// the links come off in the same change.

/** The demo's SPA, where a visitor signs in as the demo user in one click. */
export const DEMO_APP = "https://app.seedsaas.com";
/** The demo's admin panel, where a visitor signs in as the demo operator. */
export const DEMO_ADMIN = "https://admin.seedsaas.com";

/** One link from a "What you get" card into the demo. */
export interface TryLink {
  label: string;
  href: string;
  /** The `outbound` event's `to`. */
  to: "demo-app" | "demo-admin";
}

/**
 * The "try it" link of each "What you get" card, by the feature's title.
 * Billing per member has none: the demo's billing is unconfirmed.
 */
export const TRY_LINKS: Readonly<Record<string, TryLink>> = {
  "Teams from the first sign-up": {
    label: "Try it in the demo",
    href: DEMO_APP,
    to: "demo-app",
  },
  "Realtime by default": {
    label: "Try it: open the demo in two windows",
    href: DEMO_APP,
    to: "demo-app",
  },
  "Works offline": {
    label: "Try it: open the demo, then go offline",
    href: DEMO_APP,
    to: "demo-app",
  },
  "Sign-in done properly": {
    label: "Open the sign-in screen",
    href: DEMO_APP,
    to: "demo-app",
  },
  "An admin area": {
    label: "Open the admin panel",
    href: DEMO_ADMIN,
    to: "demo-admin",
  },
};

/** The demo note under "See it running", from spy4x/seed's docs/demo.md. */
export const DEMO_NOTE =
  "The demo signs you in with one click, as the demo user in the app or the demo operator in the admin panel. Its data is made up, it takes no real e-mail address, and it is wiped every night at midnight Pacific time.";
