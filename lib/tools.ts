/**
 * The tools registry (#189): the single source for every open-source tool the
 * site shows on `/tools` and `/tools/<slug>`, in the sitemap and in both llms
 * files. Nothing else in the repository lists a tool by hand.
 *
 * Only two entries exist today (ts-libs and preact-components, the first
 * slice of #189); the shape already takes the rest — services with a live
 * instance, CLIs, an agent setup, archived tools — so adding one is adding an
 * entry, not changing a page.
 *
 * Numbers that change on their own (stars, CI status, last push) do not live
 * here: `scripts/github-snapshot.ts` writes them to `lib/github-snapshot.json`,
 * read through `lib/github-snapshot.ts`, so pages render the same on every
 * request and tests stay deterministic.
 *
 * This module reads no environment variable and imports nothing, so tests and
 * scripts can load it without any permission.
 */

/**
 * Where a tool stands, shown as a shape plus a word by
 * `components/StatusMark.tsx`. A subset of that component's statuses: the
 * other two (`outcome`, `issue`) describe a client project or a problem, not a
 * tool.
 */
export type ToolStatus = "ready" | "beta" | "wip" | "paused" | "archived";

/** What kind of thing a tool is: decides nothing on the page yet but its label. */
export type ToolKind =
  | "library"
  | "component-library"
  | "service"
  | "cli"
  | "app";

/** The `/tools` group a tool is listed under, in `toolGroups` order. */
export type ToolGroupId =
  | "running"
  | "building-blocks"
  | "agent-setup"
  | "archive";

export interface ToolGroup {
  id: ToolGroupId;
  title: string;
  /** One sentence under the group heading. */
  intro: string;
}

/**
 * The four groups #189 names, in page order. A group with no tool yet is not
 * rendered, so listing all four here does not put an empty heading on the
 * page.
 */
export const toolGroups: ToolGroup[] = [
  {
    id: "running",
    title: "Running on my servers",
    intro: "Services I deploy and use every day.",
  },
  {
    id: "building-blocks",
    title: "Building blocks",
    intro: "Libraries I build my own apps and client projects from.",
  },
  {
    id: "agent-setup",
    title: "My AI-agent setup",
    intro: "The rules and tools my coding agents run with.",
  },
  {
    id: "archive",
    title: "Archive",
    intro: "Earlier tools I no longer maintain.",
  },
];

/** What each status word means, for the status key on `/tools`. */
export const statusMeanings: Record<ToolStatus, string> = {
  ready: "Published on its registry and used in my own projects.",
  beta: "Works and is in use, but the API may still change before 1.0.",
  wip: "Being built. Not ready for someone else to depend on.",
  paused: "Works as it is, but I am not working on it right now.",
  archived: "No longer maintained. Kept for reference.",
};

export interface ToolRegistry {
  /** The registry's own name, as a reader knows it: "JSR", "GHCR", "Docker Hub". */
  name: string;
  /** The tool's page on that registry. */
  url: string;
  /** The version the install command pins. */
  version: string;
  /**
   * False until the version above is really on the registry. While false, the
   * install line is shown marked as not yet available, with no copy button,
   * and `status` in the fact card says it is being published. Flipping this
   * to true is the whole change after a first publish.
   */
  published: boolean;
  /** One command, pinned to `version`. */
  install: string;
}

export interface ToolCi {
  provider: "woodpecker";
  /** Woodpecker's numeric repository id (`ci.antonshubin.com/repos/<id>`). */
  repoId: number;
}

export interface ToolLink {
  label: string;
  href: string;
}

export interface ToolScreenshot {
  /** Path under `static/`, starting with `/img/tools/<slug>/`. */
  src: string;
  /** Alt text, kept from the tool's own README. */
  alt: string;
  width: number;
  height: number;
}

/**
 * One line of "How it fits": what this tool does with another repository.
 * `planned` marks a link that is not true yet; the page draws it dashed and
 * says so, so a plan never reads as a fact.
 */
export interface ToolRelation {
  text: string;
  /** A tool page or repository the sentence names. */
  href?: string;
  planned: boolean;
}

export interface Tool {
  slug: string;
  name: string;
  /** The one-line job, the second half of the H1 ("name: job"). */
  job: string;
  /** Two or three sentences under the H1: what it is, in web-standards terms. */
  summary: string;
  kind: ToolKind;
  status: ToolStatus;
  group: ToolGroupId;
  /** `owner/name` on GitHub. */
  repo: string;
  registry: ToolRegistry;
  licence: string;
  /** Where the code runs, as true for this tool. */
  runtime: string;
  /** What I use it for myself: the live-proof sentence. */
  usedFor: string;
  /** Links that prove `usedFor`, shown under it. */
  proofLinks: ToolLink[];
  /**
   * A running instance anyone can open (a demo, a live guide, a public
   * service), shown as a hero button and on the hub. Absent for a library
   * with nothing to open.
   */
  live?: ToolLink;
  ci: ToolCi;
  /** The packages a multi-package tool publishes, in the order its README lists them. */
  packages?: string[];
  useIf: string[];
  dontUseIf: string[];
  fits: ToolRelation[];
  screenshots?: ToolScreenshot[];
  /** Credit a tool must show visibly, such as the design a port is based on. */
  credit?: { text: string; links: ToolLink[] };
}

export const tools: Tool[] = [
  {
    slug: "ts-libs",
    name: "ts-libs",
    job: "tested TypeScript building blocks for web-standards back ends",
    summary:
      "Eight framework-agnostic packages built on web standards: ES modules, Fetch, Web Crypto and Streams. Sign-in, Postgres access, SMTP, safe outbound requests, time zones and validation, each with a one-line install. Every package is tested on Deno, the runtime I build with.",
    kind: "library",
    status: "ready",
    group: "building-blocks",
    repo: "spy4x/ts-libs",
    registry: {
      name: "JSR",
      url: "https://jsr.io/@spy4x",
      version: "1.3.0",
      published: true,
      install: "deno add jsr:@spy4x/server@1.3.0",
    },
    licence: "MIT",
    runtime:
      "Deno on the server; @spy4x/time, @spy4x/validation, @spy4x/platform's browser entry points and @spy4x/realtime's client run in a browser, untested there",
    usedFor:
      "My SaaS template imports @spy4x/validation, @spy4x/platform and @spy4x/server, and this site encrypts its environment files with @spy4x/server's age64 module. More of the site is moving over to these packages now.",
    proofLinks: [
      {
        label: "The template's imports in deno.jsonc",
        href: "https://github.com/spy4x/template/blob/master/deno.jsonc",
      },
      {
        label: "This site's env tasks in deno.json",
        href: "https://github.com/spy4x/antonshubin.com/blob/main/deno.json",
      },
    ],
    ci: { provider: "woodpecker", repoId: 10 },
    packages: [
      "@spy4x/email",
      "@spy4x/integrations",
      "@spy4x/net",
      "@spy4x/platform",
      "@spy4x/realtime",
      "@spy4x/server",
      "@spy4x/time",
      "@spy4x/validation",
    ],
    useIf: [
      "You build TypeScript services on web standards and want sign-in, Postgres access, SMTP or SSRF-safe outbound requests without writing them again.",
      "You validate data with arktype and want one result shape for it.",
      "You want small packages you install one at a time, not a framework.",
    ],
    dontUseIf: [
      "You validate with zod and want to keep it: these packages use arktype only.",
      "You need a package tested on Node or Bun: every package is tested on Deno only.",
      "You want an app framework: there are no app shells and no UI here.",
    ],
    fits: [
      {
        text:
          "preact-components imports @spy4x/platform, @spy4x/time and @spy4x/validation.",
        href: "/tools/preact-components",
        planned: false,
      },
      {
        text:
          "preact-components publishes under the same @spy4x scope on JSR, as @spy4x/preact-*.",
        href: "/tools/preact-components",
        planned: false,
      },
      {
        text: "This site runs its env-file encryption on @spy4x/server.",
        href: "https://github.com/spy4x/antonshubin.com",
        planned: false,
      },
      {
        text:
          "My SaaS template imports @spy4x/validation, @spy4x/platform and @spy4x/server.",
        href: "https://github.com/spy4x/template/blob/master/deno.jsonc",
        planned: false,
      },
    ],
  },
  {
    slug: "preact-components",
    name: "preact-components",
    job: "server-rendered Preact and Tailwind components",
    summary:
      "A Preact port of Eirene's design system: components, design tokens, icons, charts and signals helpers in ten packages. Every module is a standard ES module that renders to HTML on the server and hydrates in the browser, with keyboard handling and focus written by hand. The tests and the build run on Deno.",
    kind: "component-library",
    status: "beta",
    group: "building-blocks",
    repo: "spy4x/preact-components",
    registry: {
      name: "JSR",
      url: "https://jsr.io/@spy4x",
      version: "0.1.1",
      published: true,
      install: "deno add jsr:@spy4x/preact-ui@0.1.1",
    },
    licence: "MIT",
    runtime:
      "Standard ES modules that render on the server and hydrate in the browser; tested on Deno",
    usedFor:
      "Every component runs in the live UI guide, with its code beside it.",
    proofLinks: [
      {
        label: "Open the live UI guide",
        href: "https://spy4x.github.io/preact-components",
      },
    ],
    live: {
      label: "Open the live UI guide",
      href: "https://spy4x.github.io/preact-components",
    },
    ci: { provider: "woodpecker", repoId: 9 },
    packages: [
      "@spy4x/preact-cn",
      "@spy4x/preact-icons",
      "@spy4x/preact-signals",
      "@spy4x/preact-theme",
      "@spy4x/preact-charts",
      "@spy4x/preact-system",
      "@spy4x/preact-ui",
      "@spy4x/preact-crud",
      "@spy4x/preact-map",
      "@spy4x/preact-ui-guide",
    ],
    useIf: [
      "You build a Preact app with Tailwind and want components that render on the server and hydrate in the browser.",
      "You want charts rendered as SVG on the server.",
      "You want to see every component running, with its code, in a live guide before you pick it.",
    ],
    dontUseIf: [
      "Your app is React: these are Preact components.",
      "You need an API that will not change: it is before 1.0.",
      "You do not use Tailwind: every component renders Tailwind classes.",
    ],
    fits: [
      {
        text:
          "Imports @spy4x/platform, @spy4x/time and @spy4x/validation from ts-libs.",
        href: "/tools/ts-libs",
        planned: false,
      },
      {
        text:
          "Publishes under the same @spy4x scope on JSR as ts-libs, as @spy4x/preact-*.",
        href: "/tools/ts-libs",
        planned: false,
      },
      {
        text:
          "My SaaS template builds its signed-in layout on Shell from @spy4x/preact-system and its styles on @spy4x/preact-theme.",
        href: "https://github.com/spy4x/template/blob/master/deno.jsonc",
        planned: false,
      },
      {
        text: "This site will replace its own components with it.",
        href: "https://github.com/spy4x/antonshubin.com/issues/195",
        planned: true,
      },
    ],
    screenshots: [
      {
        src: "/img/tools/preact-components/guide-overview-dark.webp",
        alt:
          "The live UI guide's overview page: a side navigation listing every package, and one card per package — UI, System, CRUD, Charts, Map, Signals, Theme, Icons and cn — each with its import name, a one-line summary and a count of its live cards or icons, or the words Examples coming for a package that has none yet.",
        width: 2560,
        height: 1600,
      },
      {
        src: "/img/tools/preact-components/guide-ui-ink.webp",
        alt:
          "The UI package's page in the opt-in ink dark palette: the side navigation lists the UI components by group, the Badge and StatusMark cards show their live examples, and the CiStatusPill card's description starts below them.",
        width: 2560,
        height: 1600,
      },
    ],
    credit: {
      text:
        "The design system, the component styling and the original markup are by Eirene.",
      links: [
        { label: "Eirene on GitHub", href: "https://github.com/Eirene" },
        { label: "isorokina.com", href: "https://isorokina.com/" },
      ],
    },
  },
];

/** Looks a tool up by slug and throws on a typo, like `catalogItem()`. */
export function tool(slug: string): Tool {
  const found = tools.find((t) => t.slug === slug);
  if (!found) throw new Error(`lib/tools.ts: no tool "${slug}"`);
  return found;
}

/** The tool for `slug`, or undefined: for a route that answers 404 instead of throwing. */
export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

/** Every group that has at least one tool, in `toolGroups` order, with its tools. */
export function groupedTools(
  list: Tool[] = tools,
): { group: ToolGroup; tools: Tool[] }[] {
  return toolGroups
    .map((group) => ({
      group,
      tools: list.filter((t) => t.group === group.id),
    }))
    .filter((g) => g.tools.length > 0);
}

/** The tool's GitHub URL. */
export function repoUrl(t: Tool): string {
  return `https://github.com/${t.repo}`;
}

/** The tool's Woodpecker pipeline list. */
export function ciUrl(t: Tool): string {
  return `https://ci.antonshubin.com/repos/${t.ci.repoId}`;
}
