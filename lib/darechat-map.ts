/**
 * The architecture map on `/work/truth-or-dare` (#523): DareChat's parts and
 * the flows that use them. Every label, note and flow sentence is a phrase of
 * the project's description in `lib/data.ts` (`lib/darechat-map.test.ts`
 * fails otherwise), so the map shows nothing the description does not say.
 */

/**
 * A flow a visitor can pick; the boxes and arrows it uses light up. Only
 * flows whose path the description states: it says which part sends image
 * uploads to Vision or push notifications to FCM nowhere, so neither is a
 * flow.
 */
export type DareFlow = "requests" | "chat"

/** One box of the map. */
export interface DareNode {
  id: string
  /** The box's name, a phrase of the description. */
  label: string
  /** A second line, a phrase of the description too. */
  note?: string
  /** The flows that use this box. */
  flows: DareFlow[]
  /** Built in someone else's repository: drawn with a dashed border. */
  elsewhere?: boolean
}

/** One row of the map: a group of boxes under a heading. */
export interface DareTier {
  id: string
  title: string
  /** A line under the heading, a phrase of the description. */
  note?: string
  nodes: DareNode[]
}

/** The map's three rows, from the apps down to the services behind them. */
export const dareTiers: DareTier[] = [
  {
    id: "apps",
    title: "Apps",
    nodes: [
      {
        id: "site",
        label: "Marketing site",
        note: "SvelteKit",
        flows: ["requests"],
      },
      { id: "web", label: "Angular web app", flows: ["requests"] },
      {
        id: "mobile",
        label: "iOS and Android apps",
        note: "in the founder's separate repos",
        flows: ["requests"],
        elsewhere: true,
      },
    ],
  },
  {
    id: "backend",
    title: "Backend in one Nx monorepo",
    note:
      "Two NestJS APIs on Express (public REST + admin) using CQRS handlers",
    nodes: [
      {
        id: "rest",
        label: "Public REST API",
        note: "Swagger-documented at darechat.me/api",
        flows: ["requests"],
      },
      {
        id: "admin",
        label: "Admin",
        note: "JWT-bearer auth across both APIs",
        flows: [],
      },
      { id: "socket", label: "Socket.IO chat", flows: ["chat"] },
    ],
  },
  {
    id: "services",
    title: "Data and services",
    nodes: [
      {
        id: "redis",
        label: "Redis pub/sub adapter",
        note: "scaled across nodes",
        flows: ["chat"],
      },
      { id: "postgres", label: "Prisma on PostgreSQL", flows: [] },
      {
        id: "firebase",
        label: "Firebase",
        note: "auth + storage + FCM push notifications",
        flows: [],
      },
      {
        id: "vision",
        label: "Google Cloud Vision",
        note: "user-uploaded image moderation",
        flows: [],
      },
      { id: "media", label: "MinIO-compatible media storage", flows: [] },
    ],
  },
]

/**
 * An arrow between two rows of the map, drawn under the row `after`: `from`
 * (that row's title or one of its boxes) then the verb, a phrase of the
 * description that links the two boxes.
 */
export interface DareEdge {
  id: string
  after: string
  from: string
  verb: string
  flow: DareFlow
}

/** The arrows the description states, each lit with its flow. */
export const dareEdges: DareEdge[] = [
  {
    id: "apps-rest",
    after: "apps",
    from: "Apps",
    verb: "consume the same public REST API",
    flow: "requests",
  },
  {
    id: "socket-redis",
    after: "backend",
    from: "Socket.IO chat",
    verb: "scaled across nodes via the Redis pub/sub adapter",
    flow: "chat",
  },
]

/** A flow's chip label and the description's own sentence about it. */
export interface DareFlowInfo {
  id: DareFlow
  label: string
  sentence: string
}

/**
 * The flows, the first selected when the page opens. Each sentence is
 * quoted from the description.
 */
export const dareFlows: DareFlowInfo[] = [
  {
    id: "requests",
    label: "App requests",
    sentence:
      "The marketing site (SvelteKit) and an Angular web app consume the same public REST API that mobile clients do",
  },
  {
    id: "chat",
    label: "Chat message",
    sentence:
      "Socket.IO chat scaled across nodes via the Redis pub/sub adapter",
  },
]

/** The boxes a flow uses, in map order. */
export function flowNodes(flow: DareFlow): DareNode[] {
  return dareTiers.flatMap((t) => t.nodes).filter((n) => n.flows.includes(flow))
}

/** The public API reference the description names ("Swagger-documented at darechat.me/api"). */
export const DARECHAT_API_DOCS = "https://darechat.me/api"
