// Guard for #195: the `@spy4x/preact-ui` components the site renders get
// their CSS. Tailwind never scans the library (it lives in Deno's cache), so
// assets/styles.css lists their classes in `@source inline(...)` by hand. A
// class missing from that list still renders in the HTML and the build still
// passes; only the built stylesheet shows it has no rule.
import { assert, assertEquals } from "jsr:@std/assert@^1.0.0"
import { render } from "npm:preact-render-to-string@^6.6.3"
import { StatusMark, type StatusMarkStatus } from "@spy4x/preact-ui/status-mark"
import { honeypotField } from "@spy4x/preact-ui/honeypot"
import {
  ImageGallery,
  stripNavigationClasses,
} from "@spy4x/preact-ui/image-gallery"
import { IconChevronLeft } from "@spy4x/preact-icons"
import { Lightbox } from "@spy4x/preact-ui/lightbox"
import { Card } from "@spy4x/preact-ui/card"
import { FeatureCard } from "@spy4x/preact-ui/feature-card"
import { DemoVideo } from "@spy4x/preact-ui/demo-video"
import { ComparisonTable } from "@spy4x/preact-ui/comparison-table"
import { RadioChips } from "@spy4x/preact-ui/radio-chips"
import Button, { buttonClass } from "../components/Button.tsx"
import { BookCallLink } from "../components/BookCallLink.tsx"
import { CiPill } from "../components/CiPill.tsx"
import { Nav } from "../components/Nav.tsx"
import { PaletteSlice } from "../components/tools/preact-components/PaletteSlice.tsx"
import { CommandPalette } from "@spy4x/preact-ui/command-palette"
import { CopyButton } from "@spy4x/preact-ui/copy-button"
import { Toastr } from "@spy4x/preact-ui/toastr"
import { findTool } from "../lib/tools.ts"
import type { CiSnapshot } from "../lib/github-snapshot.ts"
import CachedShareSlider from "../islands/CachedShareSlider.tsx"
import FrameworkChecklist from "../islands/FrameworkChecklist.tsx"
import RunsCalculator from "../islands/RunsCalculator.tsx"
import { TaskCostChart } from "../components/TaskCostChart.tsx"
import { startSite } from "./harness.ts"

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
]

const CI_STATES: (CiSnapshot | null)[] = [
  null,
  { status: "success" } as CiSnapshot,
  { status: "failure" } as CiSnapshot,
  { status: "running" } as CiSnapshot,
]

/** The strip's `navigationVariant` in islands/ImageGallery.tsx. */
const SITE_NAV_VARIANT = "ghost"

const GALLERY_IMAGES = [
  { src: "/a.png", alt: "One", width: 600, height: 1200, webpSrc: "/a.webp" },
  { src: "/b.png", alt: "Two", width: 600, height: 1200 },
]

/**
 * The project gallery: a portrait strip (the narrow slide) and a landscape
 * one, plus the lightbox it opens, which renders its markup only while open.
 * Apart from `renderedLibraryMarkup()`: the lightbox's round buttons are not
 * the site's `Button`.
 */
function renderedGalleryMarkup(): string {
  return [
    render(
      <ImageGallery
        layout="strip"
        hero
        captions
        navigation
        snap="center"
        slideWidth="orientation"
        images={GALLERY_IMAGES}
      />,
    ),
    render(
      <ImageGallery
        layout="strip"
        captions
        navigation
        slideWidth="orientation"
        images={GALLERY_IMAGES.map((i) => ({ ...i, width: 1200, height: 600 }))}
      />,
    ),
    // Previous/Next exist only after hydration (the strip measures its row
    // first), so the server render has none: render them with the class list
    // the library exports for the variant islands/ImageGallery.tsx passes.
    render(
      <button
        type="button"
        class={stripNavigationClasses(SITE_NAV_VARIANT)}
        aria-label="Previous screenshot"
        aria-disabled="true"
      >
        <IconChevronLeft class="size-5" />
      </button>,
    ),
    ...(["below", "overlay"] as const).map((controls) =>
      render(
        <Lightbox
          images={GALLERY_IMAGES}
          index={0}
          open
          onClose={() => {}}
          onIndexChange={() => {}}
          controls={controls}
        />,
      )
    ),
  ].join("\n")
}

/** The paths the nav is rendered at: each current state it can draw. */
const NAV_PATHS = ["/", "/blog", "/work/smartlite", "/book", "/about"]

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
    // A showcase tool page (#448): the feature cards with and without a
    // picture, the "Where it stands" cards.
    render(
      <FeatureCard
        id="f1"
        title="One"
        wide
        media={<img src="/a.webp" alt="" />}
      >
        Text
      </FeatureCard>,
    ),
    render(<FeatureCard id="f2" title="Two">Text</FeatureCard>),
    // A tool page's hero clip (#454): DemoVideo's poster. Its playing and
    // failed states render only after a press; their classes are listed by
    // hand in assets/styles.css's @source inline line.
    render(
      <DemoVideo
        poster={{ src: "/p.webp", width: 1280, height: 800 }}
        sources={[{ src: "/v.webm", type: "video/webm" }]}
        title="A clip"
        eager
      />,
    ),
    render(<Card class="p-6">Card</Card>),
    // /why-not-just-ai (#486): every value, a row with and one without a
    // note, and the fit paragraph.
    render(
      <ComparisonTable
        caption="Compared"
        products={["Ours", "Theirs"]}
        rows={[
          { capability: "One", values: ["yes", "partial"], note: "A note." },
          { capability: "Two", values: ["no", "yes"] },
        ]}
        checkedOn={new Date("2026-10-20")}
        method="How."
        fit="Who."
      />,
    ),
    // /tools/caldav-tasks-web (#465), /tools/zond, /tools/caldav-mcp: RadioChips as the site renders it (its
    // own legend classes: the library's default `pc-label` is a preset class
    // the site does not load), a checked chip and a disabled one, and a
    // hidden legend.
    render(
      <RadioChips
        legend="Pick"
        legendClass="text-parchment font-semibold"
        name="pick"
        defaultValue="a"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B", disabled: true },
        ]}
      />,
    ),
    render(
      <RadioChips
        legend="Pick"
        hideLegend
        name="pick2"
        options={[{ value: "a", label: "A" }]}
      />,
    ),
    // The posts' interactive components (#537): Explorable, Slider with and
    // without marks, stacked and plain Bars with a reference line, DotPlot
    // with a muted row, a band and a summary.
    render(<CachedShareSlider post="p" />),
    render(<FrameworkChecklist post="p" />),
    render(
      <RunsCalculator
        post="p"
        noise={13}
        saving={10}
        experimentTasks={10}
        marks={[{ value: 10, label: "Ten" }, { value: 32, label: "Claim" }]}
      />,
    ),
    render(<TaskCostChart round="pull" />),
    // The library `Rail` (#433): idle, a page, a section, Book as the page,
    // and a page only the More sheet lists; with Book and with Write, and
    // with the footer slot, which wraps the page and the footer in a column.
    ...NAV_PATHS.flatMap((path) =>
      ["https://meet.example.com/book", ""].map((scheduleUrl) =>
        render(
          <Nav
            currentPath={path}
            scheduleUrl={scheduleUrl}
            footer={<footer>Footer</footer>}
          >
            <p>Page</p>
          </Nav>,
        )
      )
    ),
  ].join("\n")
}

/**
 * The palette demo on /tools/preact-components (#522): the section as the
 * server renders it (the ThemePreview frame, the closed palette, the keys
 * line in `Kbd`), plus what only shows after a press: result rows under a
 * heading, the stage's copy button and a toast of each kind the demo shows,
 * with its Undo. Apart from `renderedLibraryMarkup()`: inside the preview
 * frame the library's buttons keep the library's own look.
 */
function renderedPaletteMarkup(): string {
  return [
    render(<PaletteSlice tool={findTool("preact-components")!} />),
    render(
      <CommandPalette
        trigger="field"
        options={[{
          id: "a",
          label: "A",
          detail: "One.",
          hint: "ui",
          group: "G",
        }]}
        onSelect={() => {}}
      />,
    ),
    render(<CopyButton textToCopy="x" title="Copy" copyLabel="Copy it" />),
    render(
      <Toastr
        toasts={[
          {
            id: 1,
            title: "",
            body: "One",
            type: "success",
            action: { label: "Undo", onAction: () => {} },
          },
          { id: 2, title: "", body: "Two", type: "error" },
        ]}
        onDismiss={() => {}}
        corner="bottom-right"
      />,
    ),
    render(<Toastr toasts={[]} onDismiss={() => {}} corner="top-right" />),
  ].join("\n")
}

/** A class name as Tailwind writes it in a selector: `hover:x` → `hover\:x`. */
function selectorFor(className: string): string {
  return "." + className.replace(/[:.!\[\]\/(),+=&>*%#]/g, (c) => `\\${c}`)
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * The built site's stylesheets: `site`, the one every page links (read off
 * the home page), and `palette`, the palette demo's own, which the demo's
 * island loads with its chunk on /tools/preact-components only.
 */
async function builtCss(): Promise<{ site: string; palette: string }> {
  const server = await startSite()
  try {
    const html = await server.html("/")
    const cssHref = html.match(/href="(\/assets\/client-entry-[^"?]+\.css)/)
      ?.[1]
    assert(cssHref, "could not find the client CSS href in / 's HTML")
    const page = await server.html("/tools/preact-components")
    const island = page.match(
      /"(\/assets\/fresh-island__PaletteDemo-[^"]+\.js)"/,
    )?.[1]
    assert(island, "no PaletteDemo island on /tools/preact-components")
    const paletteHref = (await server.html(island)).match(
      /assets\/palette-demo-[\w-]+\.css/,
    )?.[0]
    assert(paletteHref, "the PaletteDemo island loads no palette-demo CSS")
    return {
      site: await server.html(cssHref),
      palette: await server.html(`/${paletteHref}`),
    }
  } finally {
    await server.stop()
  }
}

/**
 * The stylesheet a class must find its rule in: the site's, plus the palette
 * demo's for a class only the demo renders.
 */
function cssFor(
  className: string,
  css: { site: string; palette: string },
): string {
  return paletteOnly().has(className) ? css.site + css.palette : css.site
}

/** The classes the palette demo renders and no other library markup does. */
function paletteOnly(): Set<string> {
  const others = classesIn(
    [renderedLibraryMarkup(), renderedGalleryMarkup()].join("\n"),
  )
  return new Set(
    [...classesIn(renderedPaletteMarkup())].filter((c) => !others.has(c)),
  )
}

function classesIn(html: string): Set<string> {
  return new Set(
    [...html.matchAll(/class="([^"]*)"/g)].flatMap(([, list]) =>
      list.split(/\s+/).map((c) =>
        c.replaceAll("&amp;", "&").replaceAll("&gt;", ">")
      )
    ),
  )
}

/** Every class in the rendered library markup, `dark:` ones apart. */
function renderedClasses(): { light: Set<string>; dark: Set<string> } {
  const light = new Set<string>()
  const dark = new Set<string>()
  for (
    const [, list] of [
      renderedLibraryMarkup(),
      renderedGalleryMarkup(),
      renderedPaletteMarkup(),
    ].join("\n")
      .matchAll(/class="([^"]*)"/g)
  ) {
    for (const raw of list.split(/\s+/)) {
      // The HTML escapes `&` (the rail's `[:root:has(&)]` variants) and `>`
      // (the comparison table's `[&_tbody>tr...]` variant), and a
      // named group (`group/rail`) only marks an element, with no rule.
      const c = raw.replaceAll("&amp;", "&").replaceAll("&gt;", ">")
      if (!c || /^group(\/|$)/.test(c)) continue
      ;(c.startsWith("dark:") ? dark : light).add(c)
    }
  }
  return { light, dark }
}

function hasRule(css: string, className: string): boolean {
  return new RegExp(`${escapeRegExp(selectorFor(className))}(?![\\w\\\\-])`)
    .test(css)
}

Deno.test("every class a library component renders on the site has a rule in the built stylesheet", async () => {
  const { light: classes } = renderedClasses()
  assert(classes.size > 20, `only ${classes.size} classes rendered`)
  const css = await builtCss()
  const missing = [...classes].filter((c) => !hasRule(cssFor(c, css), c))
  assert(
    missing.length === 0,
    `no rule in the built CSS for: ${missing.join(", ")} — add them to ` +
      `the @source inline(...) lines of assets/styles.css, or of ` +
      `assets/palette-demo.css for a class only the palette demo renders`,
  )
})

// The palette demo's stylesheet loads with its island on one page; its rules
// in the site stylesheet would cost every page's first paint.
Deno.test("the palette demo's rules are in its own stylesheet, not the site's", async () => {
  const css = await builtCss()
  const only = [...paletteOnly()].filter((c) => hasRule(css.palette, c))
  assert(only.length > 20, `only ${only.length} palette-only classes ruled`)
  assertEquals(only.filter((c) => hasRule(css.site, c)), [])
  assert(!css.site.includes("--toastr-gap"), "Toastr's rules reached the site")
})

/** The `--color-*` names a rule for `className` reads through `var()`. */
function colourVars(css: string, className: string): string[] {
  const rule = new RegExp(
    `${escapeRegExp(selectorFor(className))}[^{}]*\\{([^}]*)\\}`,
    "g",
  )
  const names = new Set<string>()
  for (const [, body] of css.matchAll(rule)) {
    // A name whose fallback is another token (`--color-ring`, then the
    // accent) is optional by design; one with a literal fallback is not.
    for (
      const [, name] of body.matchAll(
        /var\((--color-[\w-]+)(?![\w-])(?!,\s*var\()/g,
      )
    ) {
      names.add(name)
    }
  }
  return [...names]
}

// A library class reads its colours through `var(--color-*)` with a light
// default as the fallback. A token the site never sets renders that default:
// a near-white border on every screenshot, a black backdrop. `:root` in
// assets/styles.css must map every colour the rendered classes read.
Deno.test("every colour a library class reads is a token the site's stylesheet sets", async () => {
  const { light: classes } = renderedClasses()
  const css = await builtCss()
  const unset = new Map<string, string[]>()
  for (const className of classes) {
    const sheet = cssFor(className, css)
    for (const name of colourVars(sheet, className)) {
      if (!new RegExp(`${escapeRegExp(name)}\\s*:`).test(sheet)) {
        unset.set(name, [...(unset.get(name) ?? []), className])
      }
    }
  }
  assert(
    [...classes].some((c) => colourVars(cssFor(c, css), c).length > 0),
    "no rendered class reads a colour token: the guard finds nothing",
  )
  assertEquals(
    [...unset].map(([name, by]) => `${name} (${by[0]})`),
    [],
    "set these in the :root block of assets/styles.css (or of " +
      "assets/palette-demo.css for the palette demo)",
  )
})

// The library button carries `dark:` fills for an app with a dark theme.
// Tailwind's `dark:` follows the visitor's system theme and the site maps no
// accent step 600 or 700, so a rule for one would turn Book see-through for
// every visitor whose system is dark.
Deno.test("no dark: class a library component renders has a rule in the built stylesheet", async () => {
  const { dark } = renderedClasses()
  assert(dark.size > 0, "the library button rendered no dark: class")
  const css = await builtCss()
  const ruled = [...dark].filter((c) => hasRule(css.site + css.palette, c))
  assertEquals(ruled, [], "a dark: class reached the built CSS")
})

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
  ]
  const html = renderedLibraryMarkup()
  const buttons = [...html.matchAll(/<(?:a|button)\b[^>]*class="([^"]*)"/g)]
    .map(([, list]) => list.split(" "))
    .filter((list) => list.includes("transition-colors"))
  assertEquals(buttons.length, 7, html)
  for (const list of buttons) {
    assertEquals(list.filter((c) => forbidden.includes(c)), [], list.join(" "))
    assert(list.includes("rounded-lg!"), list.join(" "))
  }
})

Deno.test("a primary Button or BookCallLink carries data-primary-book and a secondary one does not", () => {
  assert(
    render(<Button variant="primary">x</Button>).includes("data-primary-book"),
  )
  assert(
    render(<BookCallLink href="/book">x</BookCallLink>).includes(
      "data-primary-book",
    ),
  )
  assert(!render(<Button href="/a">x</Button>).includes("data-primary-book"))
  assert(
    !render(<BookCallLink href="/book" variant="secondary">x</BookCallLink>)
      .includes("data-primary-book"),
  )
})

Deno.test("a Button without href is a type=button with the secondary button's classes", () => {
  const html = render(<Button>x</Button>)
  assert(html.includes(`type="button"`), html)
  assert(html.includes(`class="${buttonClass("secondary")}"`), html)
})

// tailwind-merge (behind the library's `cn()`) is about 28 KB minified. An
// island that imports a helper calling `cn()` ships all of it, as the project
// gallery did through `buttonClass`. "fvn-normal" is one of its class-group
// names, a string minification keeps.
Deno.test("no client JS chunk carries tailwind-merge", async () => {
  const dir = new URL("../_fresh/client/assets/", import.meta.url)
  const chunks: string[] = []
  for await (const entry of Deno.readDir(dir)) {
    if (entry.name.endsWith(".js")) chunks.push(entry.name)
  }
  assert(
    chunks.some((name) => name.startsWith("fresh-island__")),
    "no island chunk in _fresh/client/assets — run `deno task build` first",
  )
  const withMerge: string[] = []
  for (const name of chunks) {
    const code = await Deno.readTextFile(new URL(name, dir))
    if (code.includes("fvn-normal")) withMerge.push(name)
  }
  assertEquals(withMerge, [], "tailwind-merge reached the browser")
})
