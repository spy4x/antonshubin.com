/**
 * The `/tools` hub's arrangement (#456), set by hand: the owner's choice of
 * what is most impressive, not registry order. The spotlight first, then the
 * sections in page order, then the archive. `test/tools/hub.test.ts` fails
 * when a tool in `lib/tools.ts` is in none of them, so a new tool cannot be
 * forgotten; a tool that changes status moves here by an edit.
 */
export interface HubSection {
  id: string;
  title: string;
  /** One line under the heading, when the section needs one. */
  intro?: string;
  /** `media` cards with a clip or screenshot, `text` cards, or one `line` each. */
  kind: "media" | "text" | "line";
  slugs: string[];
}

/** The tool the page opens on: whatever is being launched. */
export const SPOTLIGHT = "seed";

export const SECTIONS: HubSection[] = [
  {
    id: "running",
    title: "Running right now",
    intro: "You can open each of these now.",
    kind: "media",
    slugs: ["mig", "oko", "preact-components"],
  },
  {
    id: "terminal",
    title: "In the terminal",
    kind: "media",
    slugs: ["rostok", "dotfiles", "caldav-mcp"],
  },
  {
    id: "under-the-hood",
    title: "Under the hood",
    kind: "text",
    slugs: ["ts-libs", "zond"],
  },
  {
    id: "being-built",
    title: "Being built",
    kind: "line",
    slugs: ["financy", "caldav-tasks-web"],
  },
];

/** Behind the closed "Archived" disclosure at the end. */
export const ARCHIVE = ["air-quality-sensor", "toread-today"];

/** Every slug the hub shows, in page order: the `ItemList` order too. */
export function hubOrder(): string[] {
  return [SPOTLIGHT, ...SECTIONS.flatMap((s) => s.slugs), ...ARCHIVE];
}
