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
import Button, { buttonClass } from "../components/Button.tsx";
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
    render(<BookCallLink href="/book">Book</BookCallLink>),
    render(
      <BookCallLink href="/book" variant="secondary">
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
  return "." + className.replace(/[:.!\[\]\/]/g, (c) => `\\${c}`);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The client stylesheet of the built site, read off the home page. */
async function builtCss(): Promise<string> {
  const site = await startSite();
  try {
    const html = await site.html("/");
    const cssHref = html.match(/href="(\/assets\/client-entry-[^"?]+\.css)/)
      ?.[1];
    assert(cssHref, "could not find the client CSS href in / 's HTML");
    return await site.html(cssHref);
  } finally {
    await site.stop();
  }
}

/** Every class in the rendered library markup, `dark:` ones apart. */
function renderedClasses(): { light: Set<string>; dark: Set<string> } {
  const light = new Set<string>();
  const dark = new Set<string>();
  for (const [, list] of renderedLibraryMarkup().matchAll(/class="([^"]*)"/g)) {
    for (const c of list.split(/\s+/)) {
      if (c) (c.startsWith("dark:") ? dark : light).add(c);
    }
  }
  return { light, dark };
}

function hasRule(css: string, className: string): boolean {
  return new RegExp(`${escapeRegExp(selectorFor(className))}(?![\\w\\\\-])`)
    .test(css);
}

Deno.test("every class a library component renders on the site has a rule in the built stylesheet", async () => {
  const { light: classes } = renderedClasses();
  assert(classes.size > 20, `only ${classes.size} classes rendered`);
  const css = await builtCss();
  const missing = [...classes].filter((c) => !hasRule(css, c));
  assert(
    missing.length === 0,
    `no rule in the built CSS for: ${missing.join(", ")} — add them to ` +
      `assets/styles.css's @source inline(...) lines`,
  );
});

// The library button carries `dark:` fills for an app with a dark theme.
// Tailwind's `dark:` follows the visitor's system theme and the site maps no
// accent step 600 or 700, so a rule for one would turn Book see-through for
// every visitor whose system is dark.
Deno.test("no dark: class a library component renders has a rule in the built stylesheet", async () => {
  const { dark } = renderedClasses();
  assert(dark.size > 0, "the library button rendered no dark: class");
  const css = await builtCss();
  const ruled = [...dark].filter((c) => hasRule(css, c));
  assertEquals(ruled, [], "a dark: class reached the built CSS");
});

// The library's `md` size and its `outline` variant's Paper fill are what
// the site's buttons replace; the call site sizes every button itself.
Deno.test("a site button carries no library size or fill and the site's radius", () => {
  const forbidden = [
    "gap-2",
    "px-3",
    "py-2",
    "text-sm",
    "bg-surface",
    "border-control",
  ];
  const html = renderedLibraryMarkup();
  const buttons = [...html.matchAll(/<(?:a|button)\b[^>]*class="([^"]*)"/g)]
    .map(([, list]) => list.split(" "))
    .filter((list) => list.includes("transition-colors"));
  assertEquals(buttons.length, 6, html);
  for (const list of buttons) {
    assertEquals(list.filter((c) => forbidden.includes(c)), [], list.join(" "));
    assert(list.includes("rounded-lg!"), list.join(" "));
  }
});

Deno.test("a primary Button or BookCallLink carries data-primary-book and a secondary one does not", () => {
  assert(
    render(<Button variant="primary">x</Button>).includes("data-primary-book"),
  );
  assert(
    render(<BookCallLink href="/book">x</BookCallLink>).includes(
      "data-primary-book",
    ),
  );
  assert(!render(<Button href="/a">x</Button>).includes("data-primary-book"));
  assert(
    !render(<BookCallLink href="/book" variant="secondary">x</BookCallLink>)
      .includes("data-primary-book"),
  );
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
