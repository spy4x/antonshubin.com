/**
 * The one list behind `/infrastructure` (#295): the boxes of the "how I run
 * production" map, the labelled arrows between them, and the live links. The
 * page, `routes/llms-full.txt.ts`, the page's `TechArticle` `mentions` and
 * `lib/infrastructure.test.ts` all read it, so a box or an arrow is added in
 * one place and a test fails when an arrow points at a box that is not there.
 *
 * Only arrows that are true today are listed, each taken from the issue or
 * from a repository's own description. Public service names and URLs are
 * shown; IP addresses, internal hostnames, ports and which server runs what
 * stay out. There is no probe-home: it answers 503 whenever a home-lab
 * service is down.
 *
 * This module reads no environment variable, so tests can load it.
 */
import { ciUrl, findTool, tool, toolRows } from "./tools.ts";

const BASE = "https://antonshubin.com";

export type InfraGroupId = "open" | "runs" | "deployed" | "know";

export interface InfraGroup {
  id: InfraGroupId;
  /** The column heading. */
  title: string;
}

/** The four columns, left to right at 1024px and above, top to bottom below. */
export const infraGroups: InfraGroup[] = [
  { id: "open", title: "What you can open" },
  { id: "runs", title: "What runs it" },
  { id: "deployed", title: "How it's deployed" },
  { id: "know", title: "How I know" },
];

export interface InfraNode {
  id: string;
  /** What the box says: a hostname or a tool name. */
  label: string;
  group: InfraGroupId;
  /** One short line: what the box does. */
  job: string;
  /** Where the box links. A public URL, or a `/tools/<slug>` page, or the tool's repository. */
  href: string;
  /** True for a link that leaves this site. */
  external: boolean;
  /** The `lib/tools.ts` entry the box stands for, when there is one. */
  toolSlug?: string;
}

export interface InfraEdge {
  from: string;
  to: string;
  /** The word on the arrow: "embeds", "runs", "draws". */
  verb: string;
}

/**
 * Where a tool's box links: its page under `/tools` when it has one, else the
 * repository its `toolRows` entry names (oko has no page yet). Throws on a
 * slug that is in neither, so a typo fails the build.
 */
export function toolLink(slug: string): { href: string; external: boolean } {
  if (findTool(slug)) return { href: `/tools/${slug}`, external: false };
  const row = toolRows.find((r) => r.slug === slug);
  if (!row) throw new Error(`lib/infrastructure.ts: no tool "${slug}"`);
  return { href: `https://github.com/${row.repo}`, external: true };
}

export interface LiveLink {
  id: string;
  label: string;
  href: string;
  /** What a visitor sees there, in the words the page shows under the link. */
  shows: string;
}

/**
 * The three services a visitor can open, all answering 200 on
 * 2026-09-30 (the date in the `infra-live-checked` note). The CI link is the pipeline list of mig, a public
 * repository: the root of ci.antonshubin.com asks for a GitHub sign-in.
 */
export const liveLinks: LiveLink[] = [
  {
    id: "dash",
    label: "dash.antonshubin.com",
    href: "https://dash.antonshubin.com",
    shows: "the status page of my servers",
  },
  {
    id: "ci",
    label: "ci.antonshubin.com",
    href: ciUrl(tool("mig"))!,
    shows: "the pipelines of a public repository",
  },
  {
    id: "meet",
    label: "meet.antonshubin.com",
    href: "https://meet.antonshubin.com",
    shows: "the booking page",
  },
];

export const infraNodes: InfraNode[] = [
  {
    id: "site",
    label: "antonshubin.com",
    group: "open",
    job: "This site",
    href: "/",
    external: false,
  },
  {
    id: "meet",
    label: "meet.antonshubin.com",
    group: "open",
    job: "The booking page",
    href: "https://meet.antonshubin.com",
    external: true,
  },
  {
    id: "dash",
    label: "dash.antonshubin.com",
    group: "open",
    job: "The status page",
    href: "https://dash.antonshubin.com",
    external: true,
  },
  {
    id: "ci",
    label: "ci.antonshubin.com",
    group: "open",
    job: "The pipelines",
    href: ciUrl(tool("mig"))!,
    external: true,
  },
  {
    id: "mig",
    label: "mig",
    group: "runs",
    job: tool("mig").job,
    toolSlug: "mig",
    ...toolLink("mig"),
  },
  {
    id: "oko",
    label: "oko",
    group: "runs",
    job: "Homelab service dashboard",
    toolSlug: "oko",
    ...toolLink("oko"),
  },
  {
    id: "woodpecker",
    label: "Woodpecker",
    group: "runs",
    job: "CI server and Docker agent, with GitHub sign-in",
    href: "https://woodpecker-ci.org",
    external: true,
  },
  {
    id: "rostok",
    label: "rostok",
    group: "deployed",
    job: tool("rostok").job,
    toolSlug: "rostok",
    ...toolLink("rostok"),
  },
  {
    id: "stacks",
    label: "Docker Compose stacks",
    group: "deployed",
    job: "Docker Compose, with Traefik for TLS and routing",
    href: "https://docs.docker.com/compose/",
    external: true,
  },
  {
    id: "repos",
    label: "GitHub repositories",
    group: "deployed",
    job: "The code, on GitHub",
    href: "https://github.com/spy4x",
    external: true,
  },
  {
    id: "zond",
    label: "Zond",
    group: "know",
    job: tool("zond").job,
    toolSlug: "zond",
    ...toolLink("zond"),
  },
  {
    id: "gatus",
    label: "Gatus",
    group: "know",
    job: "Gatus checks service health",
    href: "https://github.com/TwiN/gatus",
    external: true,
  },
];

export const infraEdges: InfraEdge[] = [
  { from: "site", to: "meet", verb: "embeds" },
  { from: "meet", to: "mig", verb: "runs" },
  { from: "oko", to: "dash", verb: "draws" },
  { from: "oko", to: "gatus", verb: "reads" },
  { from: "zond", to: "gatus", verb: "feeds" },
  { from: "rostok", to: "stacks", verb: "holds" },
  { from: "woodpecker", to: "repos", verb: "builds" },
];

/** A node by id; throws on a typo. */
export function infraNode(id: string): InfraNode {
  const n = infraNodes.find((x) => x.id === id);
  if (!n) throw new Error(`lib/infrastructure.ts: no node "${id}"`);
  return n;
}

/** The arrows that leave a node. */
export function edgesFrom(id: string): InfraEdge[] {
  return infraEdges.filter((e) => e.from === id);
}

/** The `@id` of a tool page's `SoftwareSourceCode` node, for the `TechArticle`'s `mentions`. */
export function toolNodeId(slug: string): string {
  return `${BASE}/tools/${slug}#tool`;
}

/** The `@id`s of every node that has a tool page, without repeats. */
export function mentionedToolIds(): string[] {
  return [
    ...new Set(
      infraNodes
        .filter((n) => n.toolSlug && findTool(n.toolSlug))
        .map((n) => toolNodeId(n.toolSlug!)),
    ),
  ];
}

/**
 * The map as plain lines for `llms-full.txt`: one line per box with its link
 * and job, then one per arrow, all read from the lists above so the crawler
 * file cannot drift from the page. A relative link is made absolute.
 */
export function infrastructureLines(baseUrl: string): string {
  const url = (n: InfraNode) =>
    n.href.startsWith("/") ? `${baseUrl}${n.href}` : n.href;
  const boxes = infraNodes.map((n) => `  - ${n.label} (${url(n)}): ${n.job}`);
  const arrows = infraEdges.map((e) =>
    `  - ${infraNode(e.from).label} ${e.verb} ${infraNode(e.to).label}`
  );
  return [
    "  Boxes:",
    ...boxes,
    "  Connections:",
    ...arrows,
  ].join("\n");
}
