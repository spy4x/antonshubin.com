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

export interface InfraNode {
  id: string;
  /** What the box says: a hostname or a tool name. */
  label: string;
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

/** A live link's URL by id, so the layers and the first screen never disagree. */
export function liveHref(id: string): string {
  const l = liveLinks.find((x) => x.id === id);
  if (!l) throw new Error(`lib/infrastructure.ts: no live link "${id}"`);
  return l.href;
}

export const infraNodes: InfraNode[] = [
  {
    id: "site",
    label: "antonshubin.com",
    job: "This site",
    href: "/",
    external: false,
  },
  {
    id: "meet",
    label: "meet.antonshubin.com",
    job: "The booking page",
    href: "https://meet.antonshubin.com",
    external: true,
  },
  {
    id: "dash",
    label: "dash.antonshubin.com",
    job: "The status page",
    href: "https://dash.antonshubin.com",
    external: true,
  },
  {
    id: "ci",
    label: "ci.antonshubin.com",
    job: "The pipelines",
    href: ciUrl(tool("mig"))!,
    external: true,
  },
  {
    id: "mig",
    label: "mig",
    job: tool("mig").job,
    toolSlug: "mig",
    ...toolLink("mig"),
  },
  {
    id: "oko",
    label: "oko",
    job: "Homelab service dashboard",
    toolSlug: "oko",
    ...toolLink("oko"),
  },
  {
    id: "woodpecker",
    label: "Woodpecker",
    job: "CI server and Docker agent, with GitHub sign-in",
    href: "https://woodpecker-ci.org",
    external: true,
  },
  {
    id: "rostok",
    label: "rostok",
    job: tool("rostok").job,
    toolSlug: "rostok",
    ...toolLink("rostok"),
  },
  {
    id: "stacks",
    label: "Docker Compose stacks",
    job: "Docker Compose, with Traefik for TLS and routing",
    href: "https://docs.docker.com/compose/",
    external: true,
  },
  {
    id: "repos",
    label: "GitHub repositories",
    job: "The code, on GitHub",
    href: "https://github.com/spy4x",
    external: true,
  },
  {
    id: "zond",
    label: "Zond",
    job: tool("zond").job,
    toolSlug: "zond",
    ...toolLink("zond"),
  },
  {
    id: "gatus",
    label: "Gatus",
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
  { from: "ci", to: "woodpecker", verb: "runs" },
  { from: "woodpecker", to: "repos", verb: "builds" },
];

export interface InfraLane {
  id: string;
  /** The lane's heading. */
  title: string;
  /** Box ids in drawing order. Neighbours must share an arrow, in either direction. */
  nodes: string[];
  /** A post that covers the lane, linked under it. */
  post?: { href: string; label: string };
}

/**
 * The map's lanes (#344), each a chain of two to four boxes. Builds and
 * Deploys are separate lanes because no arrow joins them: one lane would
 * imply one.
 */
export const infraLanes: InfraLane[] = [
  {
    id: "booking",
    title: "Booking",
    nodes: ["site", "meet", "mig"],
    post: {
      href: "/blog/mig-tiny-self-hosted-scheduler",
      label: "mig: the tiny scheduler behind the booking page",
    },
  },
  {
    id: "monitoring",
    title: "Monitoring",
    nodes: ["zond", "gatus", "oko", "dash"],
  },
  { id: "builds", title: "Builds", nodes: ["ci", "woodpecker", "repos"] },
  { id: "deploys", title: "Deploys", nodes: ["rostok", "stacks"] },
];

/** The arrow between two boxes, whichever way it runs; undefined when none is listed. */
export function edgeBetween(a: string, b: string): InfraEdge | undefined {
  return infraEdges.find((e) =>
    (e.from === a && e.to === b) || (e.from === b && e.to === a)
  );
}

/**
 * The connector between each pair of neighbouring boxes of a lane.
 * `forward` is true when the arrow runs from the earlier box to the later
 * one. Throws when two neighbours share no arrow, so a lane can never draw a
 * connection that is not true.
 */
export function laneConnections(
  lane: InfraLane,
): { edge: InfraEdge; forward: boolean }[] {
  return lane.nodes.slice(1).map((to, i) => {
    const from = lane.nodes[i];
    const edge = edgeBetween(from, to);
    if (!edge) {
      throw new Error(
        `lib/infrastructure.ts: lane ${lane.id} has no arrow ${from} - ${to}`,
      );
    }
    return { edge, forward: edge.from === from };
  });
}

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

/** A place a visitor can check a layer: a link, or a sentence saying why there is none. */
export type LayerCheck = string | {
  label: string;
  href: string;
  external?: boolean;
};

export interface InfraLayer {
  id: string;
  /** The job a founder cares about. The tools go on their own line. */
  title: string;
  /** The tools behind it, so a search for a tool name still matches. */
  tools: string;
  text: string;
  checks: LayerCheck[];
  /** A post that covers the layer. */
  post?: { href: string; label: string };
}

/** The four blocks of "How risk is controlled", in the order a founder fears them. */
export const infraLayers: InfraLayer[] = [
  {
    id: "handover",
    title: "Handing it over",
    tools: "Docker Compose, Traefik, Authelia, versioned config in git",
    text:
      "Configuration and deployment logic stay versioned rather than living as undocumented server steps, so another team can take over without asking one operator. There are four machines: a Hetzner Cloud server in Germany for the public services, a home lab in Singapore, a mini PC that travels with me, and a Raspberry Pi in another country that keeps the offsite backups. Authelia provides centralized SSO and 2FA, and Traefik handles TLS and routing. Access stays explicit, with boundaries another team can read.",
    checks: [
      { label: "rostok, the scaffolder I deploy with", href: "/tools/rostok" },
      "Not public: the configuration names internal services.",
    ],
    post: {
      href: "/blog/rostok-self-hosted-scaffolder",
      label: "rostok: scaffold a self-hosted homelab",
    },
  },
  {
    id: "backups",
    title: "Backups I can restore",
    tools: "restic",
    text:
      "Restic backups run with integrity checks, retention policies, and a written restore procedure. Recovery is part of the system's design, not a command to research for the first time during an incident.",
    checks: [
      "Not public: backups hold client and personal data. Restore last tested on 30 September 2026.",
    ],
  },
  {
    id: "monitoring",
    title: "Knowing when it breaks",
    tools: "Gatus, zond, VictoriaMetrics",
    text:
      "Gatus checks service health and VictoriaMetrics records operational signals. Zond lets Gatus check services that sit behind an SSO proxy. Customer-facing availability stays separate from the deeper measurements, so a failure arrives with diagnostic context.",
    checks: [
      { label: "The status page", href: liveHref("dash"), external: true },
    ],
    post: {
      href: "/blog/zond-sso-probe-bridge",
      label: "zond: a probe bridge so Gatus can see through your SSO proxy",
    },
  },
  {
    id: "deploys",
    title: "Deploys and builds",
    tools: "Woodpecker, Docker Compose",
    text:
      "A release follows a documented, repeatable path instead of one person's memory. Woodpecker builds the repositories, and the deploy is a versioned script.",
    checks: [
      { label: "The pipelines", href: liveHref("ci"), external: true },
    ],
  },
];

/** The sentence above the map: "my own servers", said before the boxes. */
export const MAP_CAPTION =
  "My own servers run on reusable infrastructure as code, Deno deployment automation, Docker Compose, and Traefik for TLS and routing.";

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
  const layers = infraLayers.map((l) =>
    `  - ${l.title} (${l.tools}): ${l.text} ${
      l.checks.map((c) =>
        typeof c === "string"
          ? c
          : `${c.label}: ${c.href.startsWith("/") ? baseUrl : ""}${c.href}`
      ).join(" ")
    }${l.post ? ` Post: ${baseUrl}${l.post.href}` : ""}`
  );
  return [
    "  Layers:",
    ...layers,
    "  Boxes:",
    ...boxes,
    "  Connections:",
    ...arrows,
  ].join("\n");
}
