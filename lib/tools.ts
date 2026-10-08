/**
 * The tools registry (#189): the single source for every open-source tool the
 * site shows on `/tools` and `/tools/<slug>`, in the sitemap and in both llms
 * files. Nothing else in the repository lists a tool by hand.
 *
 * Every project of mine that is not client work lives here (#273): libraries,
 * services, a device, products still being built and archived apps. One page
 * type serves them all and shows only the blocks an entry has data for, so a
 * tool with no registry or no CI simply has no install line and no CI pill.
 * The Seed and oko have no page yet: they are `toolRows`, a hub line with
 * links, until their job line and summary exist in the data.
 *
 * Numbers that change on their own (stars, CI status, last push) do not live
 * here: `scripts/github-snapshot.ts` writes them to `lib/github-snapshot.json`,
 * read through `lib/github-snapshot.ts`, so pages render the same on every
 * request and tests stay deterministic.
 *
 * This module reads no environment variable and imports only `proof.ts` and
 * the committed snapshot (`github-snapshot.ts`, for `toolLicence()`), so tests
 * and scripts can load it without any permission.
 */
import { githubSnapshot } from "./github-snapshot.ts";
import { proof } from "./proof.ts";
import type { RegistryPackage } from "./snapshot-fetch.ts";

/**
 * Where a tool stands, shown as a shape plus a word by
 * `@spy4x/preact-ui/status-mark`'s `StatusMark`. A subset of its statuses:
 * the others (`known-issue`, `outcome`, `live`, `offline`) describe a client
 * project, a problem or a running instance, not a tool.
 */
export type ToolStatus =
  | "in-use"
  | "ready"
  | "beta"
  | "wip"
  | "paused"
  | "archived";

/** What kind of thing a tool is: decides nothing on the page yet but its label. */
export type ToolKind =
  | "library"
  | "component-library"
  | "service"
  | "cli"
  | "app"
  | "device"
  | "template";

/** The `/tools` group a tool is listed under, in `toolGroups` order. */
export type ToolGroupId = "tools" | "products" | "archive";

export interface ToolGroup {
  id: ToolGroupId;
  /** How the hub draws the group: cards in two columns, wide cards, or one line each. */
  layout: "grid" | "wide" | "compact";
  title: string;
  /** One sentence under the group heading. */
  intro: string;
}

/**
 * The three groups the merged spec of #273 sets, in page order: what I run
 * and use first, then the products still being built, then what is paused or
 * archived. A group with no entry is not rendered.
 */
export const toolGroups: ToolGroup[] = [
  {
    id: "tools",
    layout: "grid",
    title: "Tools",
    intro: "Tools I run and use in my own work.",
  },
  {
    id: "products",
    layout: "wide",
    title: "Products",
    intro: "Products I am building. All are work in progress.",
  },
  {
    id: "archive",
    layout: "compact",
    title: "Paused or archived",
    intro: "Projects I am not working on right now.",
  },
];

/** What each status word means, for the status key on `/tools`. */
export const statusMeanings: Record<ToolStatus, string> = {
  "in-use": "Running in my own work today.",
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
  /**
   * Where the server asks for the latest version once an hour
   * (`lib/tools-live.ts`). `version` and `install` are the committed
   * fallback when that call fails or the refresh is off.
   */
  latestFrom?: RegistryPackage;
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
  /** What it is, in the words the project already used. */
  summary: string;
  kind: ToolKind;
  status: ToolStatus;
  group: ToolGroupId;
  /** `owner/name` on GitHub. Absent when the code is not public. */
  repo?: string;
  /**
   * Absent for a tool that is not on a registry: the page then has no install
   * line, no version row and no registry row.
   */
  registry?: ToolRegistry;
  /** Absent: the fact card shows the licence GitHub detected (the snapshot). */
  licence?: string;
  /** Where the code runs, as true for this tool. Absent: no "Runs on" row. */
  runtime?: string;
  /** schema.org `programmingLanguage`; absent when the language is not written down. */
  programmingLanguage?: string;
  /** What I use it for myself: the live-proof sentence. */
  usedFor?: string;
  /** Where the tool stands today, when its status word is not enough. */
  standing?: string;
  /** Links that prove `usedFor`, shown under it. */
  proofLinks?: ToolLink[];
  /**
   * A running instance anyone can open (a demo, a live guide, a public
   * service), shown as a hero button and on the hub. Absent for a tool with
   * nothing to open.
   */
  live?: ToolLink;
  /** Absent for a repository with no Woodpecker pipeline: no CI pill. */
  ci?: ToolCi;
  /** The packages a multi-package tool publishes, in the order its README lists them. */
  packages?: string[];
  useIf?: string[];
  dontUseIf?: string[];
  fits?: ToolRelation[];
  screenshots?: ToolScreenshot[];
  /** Credit a tool must show visibly, such as the design a port is based on. */
  credit?: { text: string; links: ToolLink[] };
  /**
   * The `lib/catalog.ts` item closest to this tool today, linked from the
   * page's "hire me" door. Absent: the door links `/catalog`.
   */
  catalogSlug?: string;
  /** Blog post slugs about this tool; each post links back to the page. */
  posts?: string[];
  /**
   * True for a tool someone can deploy and run (a service, a self-hosted app):
   * the page then also carries `SoftwareApplication` JSON-LD.
   */
  deployable?: true;
  /** schema.org `applicationCategory` for a deployable tool. */
  appCategory?: string;
}

/**
 * A hub line for a project with no page yet: a name, a status and links.
 * It is not in the sitemap, the llms files or the redirect table.
 */
export interface ToolRow {
  slug: string;
  name: string;
  status: ToolStatus;
  group: ToolGroupId;
  repo: string;
  /** One sentence the project already used about itself. */
  note?: string;
  links: ToolLink[];
}

export const tools: Tool[] = [
  {
    slug: "mig",
    name: "mig",
    job: "tiny self-hosted meeting scheduler",
    summary:
      "миг (moment) — tiny self-hosted meeting scheduler, built on web standards. One owner, one URL, one feature: book a time slot. Runs as a single Deno binary, with JSON-file storage, SMTP for confirmations with ICS attachment, SHA-256 HMAC for cancellable links, timezone-aware. Built because Calendly alternatives are heavyweight — I needed a static meeting link without a Next.js + Postgres deployment.",
    kind: "service",
    status: "in-use",
    group: "tools",
    posts: ["mig-tiny-self-hosted-scheduler"],
    deployable: true,
    appCategory: "BusinessApplication",
    useIf: [
      "You want a static meeting link without a Next.js + Postgres deployment.",
    ],
    dontUseIf: [
      "You need more than one owner or more than one feature: it books a time slot for one owner.",
      "You need a database: storage is a JSON file.",
    ],
    repo: "spy4x/mig",
    registry: {
      name: "Docker Hub",
      url: "https://hub.docker.com/r/antonshubin/mig",
      version: "v0.12.0",
      published: true,
      install: "docker pull antonshubin/mig:v0.12.0",
      latestFrom: { registry: "docker", name: "antonshubin/mig" },
    },
    runtime: "Deno, as a single binary",
    programmingLanguage: "TypeScript",
    usedFor: "Powers my own booking link at meet.antonshubin.com.",
    proofLinks: [
      { label: "The booking page on this site", href: "/book" },
    ],
    live: { label: "Open the booking page", href: "/book" },
    ci: { provider: "woodpecker", repoId: 12 },
  },
  {
    slug: "zond",
    name: "Zond",
    job: "internal health probe bridge for services behind SSO proxies",
    summary:
      "Internal health probe bridge for services behind SSO proxies. Originally Deno+TS, rewritten to Go as a single 10 MB distroless binary. Sits beside the containers on the same Docker network and probes them directly, so Gatus and other monitoring tools that lack SSO support can still check services behind Authelia.",
    kind: "service",
    status: "in-use",
    group: "tools",
    posts: ["zond-sso-probe-bridge"],
    deployable: true,
    appCategory: "DeveloperApplication",
    useIf: [
      "Your monitoring tool has no SSO support and the services it checks sit behind Authelia.",
    ],
    repo: "spy4x/zond",
    runtime: "Go, as a single distroless binary",
    programmingLanguage: "Go",
    ci: { provider: "woodpecker", repoId: 5 },
  },
  {
    slug: "caldav-mcp",
    name: "caldav-mcp",
    job:
      "MCP server that lets AI assistants read and write CalDAV events and tasks",
    summary:
      "MCP server that lets AI assistants read and write CalDAV events and tasks — Claude Desktop, OpenCode, Cursor, and Open WebUI all work with it. Built on web standards with zero npm dependencies, and runs as a single Deno binary.",
    kind: "service",
    status: "in-use",
    group: "tools",
    posts: ["building-mcp-servers-with-deno"],
    deployable: true,
    appCategory: "DeveloperApplication",
    useIf: [
      "You want an AI assistant such as Claude Desktop, OpenCode, Cursor or Open WebUI to read and write CalDAV events and tasks.",
    ],
    repo: "spy4x/caldav-mcp",
    runtime: "Deno, as a single binary",
    programmingLanguage: "TypeScript",
    ci: { provider: "woodpecker", repoId: 6 },
  },
  {
    slug: "rostok",
    name: "rostok",
    job: "one-command scaffolder for a self-hosted homelab",
    summary:
      "росток (sprout) — one-command scaffolder for a self-hosted homelab from a curated service catalog. The CLI writes your servers/, config.json, and .env files; every secret mutation is auto-encrypted to .env.age via age64 so secrets stay safe to commit. Bridges my homelab IaC knowledge into a reusable tool others can run.",
    kind: "cli",
    status: "in-use",
    group: "tools",
    posts: ["rostok-self-hosted-scaffolder"],
    repo: "spy4x/rostok",
    registry: {
      name: "JSR",
      url: "https://jsr.io/@rostok/cli",
      version: "1.7.0",
      published: true,
      install: "deno install -g -A -n rostok jsr:@rostok/cli@1.7.0",
      latestFrom: { registry: "jsr", name: "@rostok/cli" },
    },
    programmingLanguage: "TypeScript",
    usedFor:
      "Deploys my own servers: four instances in different regions, each running a different set of services.",
    ci: { provider: "woodpecker", repoId: 2 },
  },
  {
    slug: "ts-libs",
    name: "ts-libs",
    job: "tested TypeScript building blocks for web-standards back ends",
    summary:
      "Eight framework-agnostic packages built on web standards: ES modules, Fetch, Web Crypto and Streams. Sign-in, Postgres access, SMTP, safe outbound requests, time zones and validation, each with a one-line install. Every package is tested on Deno, the runtime I build with.",
    kind: "library",
    status: "ready",
    group: "tools",
    catalogSlug: "zero-to-production-saas-mvp",
    repo: "spy4x/ts-libs",
    registry: {
      name: "JSR",
      url: "https://jsr.io/@spy4x",
      version: "1.31.0",
      published: true,
      install: "deno add jsr:@spy4x/server@1.31.0",
      latestFrom: { registry: "jsr", name: "@spy4x/server" },
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
    group: "tools",
    catalogSlug: "zero-to-production-saas-mvp",
    posts: ["preact-component-library-without-shadcn"],
    repo: "spy4x/preact-components",
    registry: {
      name: "JSR",
      url: "https://jsr.io/@spy4x",
      version: "3.1.0",
      published: true,
      install: "deno add jsr:@spy4x/preact-ui@3.1.0",
      latestFrom: { registry: "jsr", name: "@spy4x/preact-ui" },
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
      "You need components checked with a screen reader: none has been run against them yet.",
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
  {
    slug: "air-quality-sensor",
    name: "Air Quality Sensor",
    job: "DIY ESP32-based air quality monitoring system",
    summary:
      "DIY ESP32-based air quality monitoring system measuring PM1.0, PM2.5, PM10 particles, CO2, temperature, and humidity. Integrates with Home Assistant for smart home automation and real-time alerts.",
    kind: "device",
    status: "archived",
    group: "archive",
    repo: "spy4x/air-quality-sensor",
    runtime: "An ESP32 microcontroller",
    programmingLanguage: "C++",
  },
  {
    slug: "financy",
    name: "Financy",
    job: "self-hosted finance tracker for a person or a family",
    summary:
      "Self-hosted finance tracker for a person or a family — open source, work in progress, not ready for everyday use. Targets multi-currency accounts and group or family collaboration with role-based access; transfers between accounts follow double-entry principles.",
    kind: "app",
    status: "wip",
    group: "products",
    catalogSlug: "zero-to-production-saas-mvp",
    deployable: true,
    appCategory: "FinanceApplication",
    dontUseIf: [
      "You need something ready for everyday use: it is a work in progress.",
    ],
    repo: "spy4x/financy",
    programmingLanguage: "TypeScript",
    standing: "Being revived — work in progress, not ready for everyday use.",
    ci: { provider: "woodpecker", repoId: 1 },
  },
  {
    slug: "template",
    name: "Deno Platform Template",
    job: "reusable repository baseline for SaaS products",
    summary:
      `Reusable repository baseline for SaaS products, built on web standards — API, SPA, MPA, worker, persistence and offline sync foundations, with zero product-specific business logic. Distilled from ${
        proof("projects")
      } client projects: libs/platform and libs/domain splits, group-core DDL with idempotent backfill, and a real outbox processor. Spec-driven, agent-assisted scaffolding compatible. Runs on Deno.`,
    kind: "template",
    status: "wip",
    group: "products",
    catalogSlug: "zero-to-production-saas-mvp",
    posts: ["deno-platform-template"],
    useIf: [
      "You start a SaaS product and want API, SPA, MPA, worker, persistence and offline sync foundations.",
    ],
    dontUseIf: [
      "You want product-specific business logic: it has none.",
    ],
    repo: "spy4x/template",
    runtime: "Deno",
    programmingLanguage: "TypeScript",
    usedFor:
      "Foundation for new SaaS MVPs I ship on fixed-price milestones — saves weeks of platform decisions per project.",
    ci: { provider: "woodpecker", repoId: 11 },
  },
  {
    slug: "caldav-tasks-web",
    name: "caldav-tasks-web",
    job: "web UI for CalDAV VTODO tasks, being rewritten",
    summary:
      "Touch-first web app for editing CalDAV VTODO tasks, the web UI Tasks.org does not have. My Android tasks live in Tasks.org, which syncs them to CalDAV; I wanted a web UI over the same task files. The current version is being rewritten from scratch, with a new design on spy4x/preact-components and the shared CalDAV libraries @spy4x/caldav and @spy4x/time/ical. Do not install the current version: it does not work with Stalwart, it can lose data when you save a task, and it has no service worker. The screenshots show the current version. There is no public demo.",
    kind: "app",
    status: "wip",
    group: "products",
    posts: ["self-hosted-caldav-web-ui-tasks-org"],
    deployable: true,
    appCategory: "ProductivityApplication",
    useIf: [
      "You want to follow the rewrite of a web UI for Tasks.org tasks on CalDAV.",
    ],
    dontUseIf: [
      "You want to use it today: the current version does not work with Stalwart and can lose data when saving a task.",
    ],
    repo: "spy4x/caldav-tasks-web",
    runtime: "Deno, with Hono and Preact",
    programmingLanguage: "TypeScript",
    standing:
      "Being rewritten. The current version was used against Radicale, does not work with Stalwart, can lose data when saving a task, and has no service worker.",
    screenshots: [
      {
        src: "/img/tools/caldav-tasks-web/desktop-dashboard.webp",
        alt: "Desktop dashboard",
        width: 1440,
        height: 900,
      },
      {
        src: "/img/tools/caldav-tasks-web/desktop-kanban.webp",
        alt: "Desktop kanban",
        width: 1440,
        height: 900,
      },
      {
        src: "/img/tools/caldav-tasks-web/desktop-settings.webp",
        alt: "Desktop settings",
        width: 1440,
        height: 900,
      },
      {
        src: "/img/tools/caldav-tasks-web/mobile-dashboard.webp",
        alt: "Mobile dashboard",
        width: 780,
        height: 1688,
      },
    ],
  },
  {
    slug: "toread-today",
    name: "Toread.Today",
    job: "a cloud tool to organise things to read or watch later",
    summary:
      "A cloud tool to organise things to read/watch later. Priorities, tags, statuses and other fancy stuff. Web, Desktop & Mobile app, Google Chrome extension.",
    kind: "app",
    status: "archived",
    group: "archive",
    deployable: true,
    appCategory: "ProductivityApplication",
    live: {
      label: "Open it (still online, not maintained)",
      href: "https://toread-today.web.app",
    },
    screenshots: [
      {
        src: "/img/tools/toread-today/1.webp",
        alt: "Screenshot 1 of 3",
        width: 2206,
        height: 1800,
      },
      {
        src: "/img/tools/toread-today/2.webp",
        alt: "Screenshot 2 of 3",
        width: 2204,
        height: 1800,
      },
      {
        src: "/img/tools/toread-today/3.webp",
        alt: "Screenshot 3 of 3",
        width: 2206,
        height: 1800,
      },
    ],
  },
];

/**
 * Projects with a hub line and no page. oko has no job line or summary in
 * the data yet; the Seed's only home was a GitHub link, which #287 took off
 * the site.
 */
export const toolRows: ToolRow[] = [
  {
    slug: "oko",
    name: "oko",
    status: "in-use",
    group: "tools",
    repo: "spy4x/oko",
    links: [
      { label: "Open the dashboard", href: "https://dash.antonshubin.com" },
      { label: "Repository", href: "https://github.com/spy4x/oko" },
    ],
  },
  {
    slug: "seed",
    name: "The Seed",
    status: "archived",
    group: "archive",
    repo: "spy4x/seed",
    note:
      "A one-person SaaS application codebase template. Ship your project idea in days instead of months. It is addictive.",
    links: [{ label: "Repository", href: "https://github.com/spy4x/seed" }],
  },
];

/**
 * Every slug an own project answered under `/work` and `/projects` before #273
 * moved it to `/tools`, mapped to the tool page it lives at now. Written out
 * rather than derived, so dropping a tool cannot silently drop its 301
 * (`lib/redirects.test.ts` checks every target is a page).
 */
export const movedSlugs: Readonly<Record<string, string>> = {
  "mig": "mig",
  "zond": "zond",
  "caldav-mcp": "caldav-mcp",
  "rostok": "rostok",
  "air-quality-sensor": "air-quality-sensor",
  "financy": "financy",
  "template": "template",
  "todoapp-caldav": "caldav-tasks-web",
  "toread-today": "toread-today",
};

/** Looks a tool up by slug and throws on a typo, like `catalogItem()`. */
export function tool(slug: string): Tool {
  const found = tools.find((t) => t.slug === slug);
  if (!found) throw new Error(`lib/tools.ts: no tool "${slug}"`);
  return found;
}

/** The tools that name the blog post `slug` in their `posts`, in registry order. */
export function toolsForPost(slug: string): Tool[] {
  return tools.filter((t) => t.posts?.includes(slug));
}

/** The tool for `slug`, or undefined: for a route that answers 404 instead of throwing. */
export function findTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

/** One `/tools` group: its page tools first, then its rows with no page. */
export interface HubGroup {
  group: ToolGroup;
  tools: Tool[];
  rows: ToolRow[];
}

/** Every group that has at least one entry, in `toolGroups` order. */
export function groupedTools(
  list: Tool[] = tools,
  rows: ToolRow[] = toolRows,
): HubGroup[] {
  return toolGroups
    .map((group) => ({
      group,
      tools: list.filter((t) => t.group === group.id),
      rows: rows.filter((r) => r.group === group.id),
    }))
    .filter((g) => g.tools.length + g.rows.length > 0);
}

/**
 * The licence a page shows: the one the entry names, else the one GitHub
 * detected in the committed snapshot. Null when neither is known or GitHub
 * found no recognisable licence. The hub, the tool page and its JSON-LD all
 * read it, so they never disagree.
 */
export function toolLicence(t: Tool): string | null {
  const found = t.licence ??
    (t.repo ? githubSnapshot.repos[t.repo]?.licence : null) ?? null;
  return found && found !== "NOASSERTION" ? found : null;
}

/** The tool's GitHub URL, or undefined when its code is not public. */
export function repoUrl(t: Tool): string | undefined {
  return t.repo ? `https://github.com/${t.repo}` : undefined;
}

/** The tool's Woodpecker pipeline list, or undefined when it has no pipeline. */
export function ciUrl(t: Tool): string | undefined {
  return t.ci ? `https://ci.antonshubin.com/repos/${t.ci.repoId}` : undefined;
}

/** Every tool page's repository, with its Woodpecker id when it has one, for the snapshot script. */
export function snapshotRepos(): { repo: string; ciRepoId?: number }[] {
  return tools.filter((t) => t.repo).map((t) => ({
    repo: t.repo!,
    ciRepoId: t.ci?.repoId,
  }));
}
