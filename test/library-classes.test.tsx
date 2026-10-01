// Guard for #195: the `@spy4x/preact-ui` components the site renders get
// their CSS. Tailwind never scans the library (it lives in Deno's cache), so
// assets/styles.css lists their classes in `@source inline(...)` by hand. A
// class missing from that list still renders in the HTML and the build still
// passes; only the built stylesheet shows it has no rule.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import {
  StatusMark,
  type StatusMarkStatus,
} from "@spy4x/preact-ui/status-mark";
import { honeypotField } from "@spy4x/preact-ui/honeypot";
import { cn } from "@spy4x/preact-cn";
import { buttonClasses } from "@spy4x/preact-ui/button";
import Button, {
  buttonClass,
  type ButtonVariant,
  LIBRARY_VARIANT,
  SITE_LOOK,
  SITE_VARIANT,
  SIZE_RESET,
} from "../components/Button.tsx";
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
    render(honeypotField("_website", "Website")),
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

Deno.test("buttonClass gives each variant the library button's classes with the site's look", () => {
  const reset = new Set(SIZE_RESET.split(" "));
  for (const variant of ["primary", "secondary"] as ButtonVariant[]) {
    const expected = buttonClasses(
      LIBRARY_VARIANT[variant],
      "md",
      cn(SITE_LOOK, SIZE_RESET, SITE_VARIANT[variant]),
    ).split(" ").filter((c) => !reset.has(c) && !c.startsWith("dark:"));
    assertEquals(
      new Set(buttonClass(variant).split(" ")),
      new Set(expected),
      `buttonClass("${variant}") drifted from @spy4x/preact-ui/button`,
    );
  }
});

Deno.test("a Button without href is a type=button with the secondary button's classes", () => {
  const html = render(<Button>x</Button>);
  assert(html.includes(`type="button"`), html);
  assert(html.includes(`class="${buttonClass("secondary")}"`), html);
});

// tailwind-merge (behind the library's `cn()`) is about 28 KB minified. An
// island that imports a helper calling `cn()` ships all of it, as the project
// gallery did through `buttonClass`. "fvn-normal" is one of its class-group
// names, a string minification keeps.
Deno.test("no client JS chunk carries tailwind-merge", async () => {
  const dir = new URL("../_fresh/client/assets/", import.meta.url);
  const chunks: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.name.endsWith(".js")) chunks.push(entry.name);
  }
  assert(
    chunks.some((name) => name.startsWith("fresh-island__")),
    "no island chunk in _fresh/client/assets — run `deno task build` first",
  );
  const withMerge: string[] = [];
  for (const name of chunks) {
    const code = await Deno.readTextFile(new URL(name, dir));
    if (code.includes("fvn-normal")) withMerge.push(name);
  }
  assertEquals(withMerge, [], "tailwind-merge reached the browser");
});
