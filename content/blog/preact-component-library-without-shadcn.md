---
title: "preact-components: a Preact component library without shadcn or Radix"
description: "Why I own my UI components instead of using shadcn, Radix or MUI: a Preact component library in ten JSR packages, rendered on the server, keyboard handling written by hand, with a live guide. What is in it, how to try it, and what is not done yet."
tldr:
  - "preact-components is my open-source Preact component library: ten JSR packages, rendered on the server, with roles, keyboard handling and focus written by hand."
  - "I own my components instead of using shadcn, Radix or MUI, because working around their styling, upgrades and limits cost me more than owning them."
  - "Owning components means owning accessibility, so headless Chromium checks the keyboard handling on every pull request."
  - "It is beta: no screen reader has been run against it, only Deno is tested, and it is Preact and Tailwind only. Try any component in the live guide first."
publishedAt: "2026-09-30"
readTime: 8
topic: "founders"
relatedTool: "preact-components"
catalogSlug: "zero-to-production-saas-mvp"
seoTitle: "A Preact component library without shadcn or Radix"
coverImage: "/img/blog/preact-component-library-without-shadcn/cover.png"
---

![A dashboard in the live guide built only from the library: a frame titled Orbit with Run checks and New project buttons, a filter column, four KPI tiles, a line chart of passed and failed builds this week, and a sortable table of five projects with status badges](/img/blog/preact-component-library-without-shadcn/dashboard-hero.webp "Every part of this demo dashboard is a component from the packages.")

Every new app I start needs the same things: a button, a table, a dialog, a form
field, a chart, a signed-in layout. I kept rebuilding them, or pulling in a
component library and then working around it.

preact-components is where that stopped. It is an open-source Preact component
library: ten packages on JSR, every component rendered on the server and
hydrated in the browser, with roles, labels, keyboard handling and focus written
by hand. No shadcn, Radix, Headless UI or Material underneath.

This post is for developers who build with Preact and Tailwind and wonder
whether owning the UI layer is worth it. I'll show why I decided it is, what is
in the ten packages, how to try it in a minute, and what is not done yet.

The dashboard above is on the guide's first page. Every part of it is a
component from these packages, running on local state: you can filter and sort
the projects, run the checks for a toast, and add a project in the dialog.

## Why not shadcn, Radix or MUI?

Two of my earlier apps used shadcn, Radix and bits-ui. Over time those libraries
cost me more to work around than it would have cost to own the components, in
three ways:

1. **Styling opinions.** A library ships a look. I already had design tokens.
   Either I fight its defaults on every component, or I slowly give up my
   tokens. The second one wins, quietly.
2. **Upgrade breakage.** A component library changes its API and its rendered
   markup. Every upgrade reopens components that already worked, for no product
   reason.
3. **Extension limits.** The component I need is never quite the one it ships.
   The workaround is often more code than the component, and it inherits the
   library's constraints on top.

So the repository has a written rule: every component is written there. No
third-party component library is a dependency, and a copy of one pasted into the
tree counts as one too. The old apps are still useful, but only as a reference
for design intent: I read how they compose a dialog and write my own.

> Port the markup and the behaviour. Never the dependency.

That doesn't mean I write everything. My rule is "own the small, keep the huge".
Preact, signals, Tailwind, arktype, wouter and Leaflet stay: they are large,
well-solved problems, and none of them is a component library. A button, a
dialog or a combobox is small enough to own, and opinionated enough that I'd
fight someone else's defaults.

## The real price: accessibility

Owning components means owning everything a library used to hide. The repository
names it plainly, so nobody pretends it is free:

- focus traps: moving focus into a dialog, keeping it there, returning it on
  close;
- dismissal: an outside click, `Escape`, and the difference between dismissing
  and closing on purpose;
- ARIA wiring: which `role`, `aria-expanded` or `aria-labelledby` goes on which
  element;
- keyboard navigation: arrow keys, `Home` and `End`, typeahead;
- positioning: anchoring a popup to its trigger and flipping it when it would
  overflow.

![The New project dialog open over the guide's demo dashboard: a Project name field with a focus ring, the hint "It starts building as soon as it is created.", and Cancel and Create buttons](/img/blog/preact-component-library-without-shadcn/dialog-focus.webp "The demo's New project dialog, a native dialog element: focus moves into its field when it opens.")

Where the platform already has an answer, I use it: native `<dialog>`,
`<details>`, `<button>` and forms that post before any script has run. A native
element ships its semantics for free.

![The Combobox card in the live guide: the city field has focus and its list is open, and the arrow keys have highlighted São Paulo](/img/blog/preact-component-library-without-shadcn/combobox-keyboard.webp "The Combobox, driven from the keyboard in the live guide.")

The Combobox above is a good example. Every one renders a single `role="status"`
live region, already in the server HTML and empty until the field is used, so
the answers it announces have a stable place to go.

How do I know the keyboard handling works? The packages that need a hydrated
page have browser checks in `pages/checks/`. On every pull request, headless
Chromium presses the keys, moves focus, opens dialogs and toasts, and asserts
what happens, instead of trusting the markup. The repository also has 139 test
files (counted with `find . -name "*.test.ts*"`).

## Rendered on the server, then hydrated

A component touches `window` or `document` only inside an effect or an event
handler. So every one renders complete HTML on the server and hydrates in the
browser. The live guide itself is served that way, and it reads with JavaScript
off.

This matters more than it sounds. A page that shows its content before the
JavaScript arrives is faster for the visitor and easier for a search engine. And
a component that only works after hydration usually hides a bug that shows up on
a slow phone.

Colours, radii and fonts are CSS custom properties, so an app restyles
everything by setting variables instead of forking the CSS. Layout goes through
`Page`, `Section`, `Stack`, `Cluster` and `Grid`, and no component carries an
outer margin. The guide's header switches between light and dark and changes the
accent colour live, so you can see the tokens at work.

![The same five Kpi tiles from the live guide twice, each showing 42 in the accent, positive, warning, negative and neutral tones: on a dark background above and on a light one below](/img/blog/preact-component-library-without-shadcn/kpi-dark-light.webp "The same Kpi tiles in the guide's dark theme and its light theme.")

## What is in the ten packages

Every package is published on JSR under `@spy4x/preact-*`, all at the same
version, so a caret range always resolves to a set that was published together.

| Package                  | What it holds                                              |
| ------------------------ | ---------------------------------------------------------- |
| `@spy4x/preact-ui`       | the component set: layout, buttons, tables, dialogs, forms |
| `@spy4x/preact-theme`    | design tokens, the Tailwind preset and the classes         |
| `@spy4x/preact-icons`    | the merged icon set, one component per glyph               |
| `@spy4x/preact-charts`   | server-rendered charts with tooltips                       |
| `@spy4x/preact-system`   | app-level pieces: auth form, calendar, shells, SEO head    |
| `@spy4x/preact-crud`     | a list and editor scaffold for one collection              |
| `@spy4x/preact-map`      | a map on Leaflet                                           |
| `@spy4x/preact-signals`  | stores and state helpers; no components                    |
| `@spy4x/preact-cn`       | class-name join with Tailwind conflict resolution          |
| `@spy4x/preact-ui-guide` | the live component catalogue, mounted in one line          |

The guide's overview counts 81 components and 120 icons across them today.

![The LineChart card in the live guide: revenue today and a week earlier by hour, a dashed target line at 12, and a tooltip at 14:00 that shows no value for today and 10.9 for a week earlier](/img/blog/preact-component-library-without-shadcn/line-chart-tooltip.webp "A LineChart from @spy4x/preact-charts, with its tooltip open.")

## Where it came from

The components were extracted from real products, so I stop rebuilding the same
pieces for the next one. My [SaaS template](/blog/deno-platform-template)
already builds its signed-in layout on `Shell` from `@spy4x/preact-system` and
its styles on `@spy4x/preact-theme`. This site is next: it still has its own
components, and replacing them with the library is an open issue.

The design is not mine. The design system, the component styling and the
original markup are by [Eirene](https://github.com/Eirene)
([isorokina.com](https://isorokina.com/)). She designed it and built the
original pages the components were first extracted from. What I added is the
JavaScript: the Preact and signals implementation, the interactivity, server
rendering, tests, packaging and documentation.

Helpers with no UI, like dates and validation, come from my other library,
[ts-libs](/tools/ts-libs), under the same `@spy4x` scope on JSR.

## Try it in a minute

Open the [live guide](https://spy4x.github.io/preact-components). Every
component runs there with its code one click away, so you can try one before you
install anything.

When one looks right, add the package:

```bash
deno add jsr:@spy4x/preact-ui
```

And render it:

```tsx
import { Badge } from "@spy4x/preact-ui/badge";

<Badge text="Active" color="green" />;
```

One honest catch: the components render Tailwind classes against the compiled
stylesheet from `@spy4x/preact-theme`, and JSR cannot export a CSS file. So the
stylesheet takes a short build script instead of a plain `@import`. The theme
package's README has the recipe, one short TypeScript file.

The repository also has an `llms.txt`, so a coding agent can read the whole
component surface in one file.

## What is not done yet

I mark it beta on my site, and here is why. The version is 1.2.0 and it follows
semantic versioning since 1.0.0, so a breaking change bumps the major number.
But:

- **No screen reader has been run against it yet.** The browser checks prove the
  markup and the order in which the page changes, not what a screen reader
  actually speaks. That work is an open issue.
- **Only Deno is tested.** The packages are standard ES modules with no
  Deno-only API, and a Vite app can use them through `@deno/vite-plugin`.
  Running them under Node or Bun has not been tried.
- **It is Preact and Tailwind only.** If your app is React, or you don't use
  Tailwind, skip it.
- **Some components are deliberately not built.** Carousel, Accordion, Drawer, a
  rich-text editor and a tree view were considered and turned down: nothing I
  run needs them, and some would need a large third-party piece I don't want.
  The reasons are written down in the repository.
- **Nothing in CI enforces the no-library rule.** A pull request could add Radix
  and every check would pass. Review holds the rule, and the repository says so
  instead of pretending a check exists.

## What next?

Open the [live guide](https://spy4x.github.io/preact-components), press Tab
through a dialog, and see if it behaves the way you expect. If something is
missing or broken, open an issue on
[GitHub](https://github.com/spy4x/preact-components). And if the library looks
useful, a star helps other Preact developers find it.

Building a product and want its UI layer owned like this, instead of rented from
a library? That's my day job: see
[how I build a SaaS MVP](/catalog/zero-to-production-saas-mvp).
