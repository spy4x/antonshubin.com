// Seed's live demo (#455): its hosts and where each "try it" link goes. The
// one-click sign-in these links rely on is `libs/ui/demo-notice.tsx` in
// spy4x/seed (docs/demo.md there); if it is ever removed, the demo note and
// the links come off in the same change.

/** The demo's SPA, where a visitor signs in as the demo user in one click. */
export const DEMO_APP = "https://app.seedsaas.com"

/** One link from a "What you get" card into the demo. */
export interface TryLink {
  label: string
  href: string
  /** The `outbound` event's `to`. */
  to: "demo-app"
}

/**
 * The "try it" link of each "What you get" card, by the feature's title.
 * Billing per member has none: the demo's billing is unconfirmed. The admin
 * area has none either: visitors get no admin sign-in, so they watch
 * {@link ADMIN_VIDEO} instead (#521).
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
}

/** The demo note under "See it running", from spy4x/seed's docs/demo.md. */
export const DEMO_NOTE =
  "The demo signs you in to the app with one click, as the demo user. Its data is made up, it takes no real e-mail address, and it is wiped every night at midnight Pacific time."

/**
 * Seed's admin panel video, pulled from spy4x/seed (`lib/video-sources.ts`)
 * into `/video/tools/seed/`. It replaces the admin panel link (#521).
 */
export const ADMIN_VIDEO = {
  title: "Seed's admin panel",
  caption:
    "What an operator sees: the last 30 days at a glance, anyone found by name or address with their sessions and history, actions that ask first, every group and its members, who pays and every refund, and the health of every service. Sample data, 1\u00a0min, with captions and music.",
  sources: [
    { src: "/video/tools/seed/admin-panel.webm", type: "video/webm" },
    { src: "/video/tools/seed/admin-panel.mp4", type: "video/mp4" },
  ],
  poster: {
    src: "/video/tools/seed/admin-panel-poster-1280.webp",
    srcset:
      "/video/tools/seed/admin-panel-poster-1280.webp 1280w, /video/tools/seed/admin-panel-poster-1920.webp 1920w",
    width: 1280,
    height: 800,
  },
}
