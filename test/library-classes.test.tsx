// Guard for #195: the `@spy4x/preact-ui` components the site renders get
// their CSS. Tailwind never scans the library (it lives in Deno's cache), so
// assets/styles.css lists their classes in `@source inline(...)` by hand. A
// class missing from that list still renders in the HTML and the build still
// passes; only the built stylesheet shows it has no rule.
import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import {
  StatusMark,
  type StatusMarkStatus,
} from "@spy4x/preact-ui/status-mark";
import Button from "../components/Button.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import { CiPill } from "../components/CiPill.tsx";
import type { CiSnapshot } from "../lib/github-snapshot.ts";
import { startSite } from "./harness.ts";

const STATUSES: StatusMarkStatus[] = [
  "ready",
  "in-use",
  "beta",
  "wip",
  "paused",
  "archived",
  "known-issue",
  "outcome",
  "live",
  "offline",
];

const CI_STATES: (CiSnapshot | null)[] = [
  null,
  { status: "success" } as CiSnapshot,
  { status: "failure" } as CiSnapshot,
  { status: "running" } as CiSnapshot,
];

/** Every library-backed piece the site renders, in each of its forms. */
function renderedLibraryMarkup(): string {
  return [
    ...STATUSES.map((s) => render(<StatusMark status={s} />)),
    render(<Button href="/a">Link</Button>),
    render(<Button href="/a" variant="primary">Book</Button>),
    render(<Button>Button</Button>),
    render(<Button variant="primary">Book</Button>),
    render(<BookCallLink url="/book">Book</BookCallLink>),
    render(
      <BookCallLink url="/book" variant="secondary" target="_blank">
        Book
      </BookCallLink>,
    ),
    ...CI_STATES.map((ci) =>
      render(<CiPill ci={ci} pipelinesUrl="https://ci.example.com" />)
    ),
  ].join("\n");
}

/** A class name as Tailwind writes it in a selector: `hover:x` → `hover\:x`. */
function selectorFor(className: string): string {
  return "." + className.replace(/[:.\[\]\/]/g, (c) => `\\${c}`);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

Deno.test("every class a library component renders on the site has a rule in the built stylesheet", async () => {
  const classes = new Set<string>();
  for (const [, list] of renderedLibraryMarkup().matchAll(/class="([^"]*)"/g)) {
    for (const c of list.split(/\s+/)) {
      // The site has no `.dark` ancestor, so the library's dark variants
      // never apply and need no rule.
      if (c && !c.startsWith("dark:")) classes.add(c);
    }
  }
  assert(classes.size > 20, `only ${classes.size} classes rendered`);

  const site = await startSite();
  try {
    const html = await site.html("/");
    const cssHref = html.match(/href="(\/assets\/client-entry-[^"?]+\.css)/)
      ?.[1];
    assert(cssHref, "could not find the client CSS href in / 's HTML");
    const css = await site.html(cssHref);

    const missing = [...classes].filter((c) =>
      !new RegExp(`${escapeRegExp(selectorFor(c))}(?![\\w\\\\-])`).test(css)
    );
    assert(
      missing.length === 0,
      `no rule in the built CSS for: ${missing.join(", ")} — add them to ` +
        `assets/styles.css's @source inline(...) lines`,
    );
  } finally {
    await site.stop();
  }
});
