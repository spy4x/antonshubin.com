/**
 * The catalog: the single source for what I sell and what it costs.
 *
 * Every page, the sitemap, both llms files, the head metadata and the JSON-LD
 * read titles and prices from here. Nothing else in the repository may restate
 * a price by hand. `lib/catalog.test.ts` pins the four prices and the six
 * redirects; `test/structure.test.ts` fails when a dollar amount that is not in
 * this file shows up on a page listed in its `PRICE_PAGES`, or in an llms file.
 * The same list is used on Upwork and neatsoft.dev, so changing a number here
 * is the first of three edits, not the only one.
 *
 * This module reads no environment variable, so tests and scripts can load
 * it without environment access; its one import, `lib/promises.ts`, is the
 * same (#186 — the MVP item's bug-fix-window bullet reads that promise's
 * title instead of restating it).
 */

import { promise } from "./promises.ts";

/** Billing period of a price. Absent means a one-time price. */
export type PricePeriod = "hour" | "month";

/**
 * Icon name for a catalog item, rendered through `components/Icons.tsx`
 * (#184) — the catalog used to carry a raw emoji here.
 */
export type CatalogIconName = "target" | "search" | "rocket" | "briefcase";

export interface CatalogPrice {
  /** Whole US dollars. Every price on the list is a whole number. */
  usd: number;
  /** True when the number is a starting price and larger scopes are quoted. */
  from: boolean;
  period?: PricePeriod;
}

export interface CatalogExample {
  title: string;
  desc: string;
}

/** A kind of work sold under an item; its `id` is the page's `#fragment`. */
export interface CatalogCover extends CatalogExample {
  id: string;
}

export interface CatalogItem {
  icon: CatalogIconName;
  slug: string;
  /** Full title: page heading and JSON-LD name. */
  title: string;
  /** What the page's `<title>` says, before " — Anton Shubin" (#271). */
  seoTitle: string;
  /** schema.org `serviceType` (#271). */
  category: string;
  /** Short title for cards and lists. */
  shortTitle: string;
  /** One or two prices. Two means the client picks, as with the Ongoing item. */
  prices: CatalogPrice[];
  delivery: string;
  /** One sentence for cards, the llms files and the guide page. */
  summary: string;
  desc: string;
  outcome: string;
  includes: string[];
  exclusions?: string[];
  tech: string[];
  audience: string;
  examples: string[];
  /** How the engagement starts, when that is worth spelling out. */
  firstStep?: CatalogExample;
  /** Kinds of work that are sold under this item rather than as their own. */
  alsoCovers?: CatalogCover[];
  /** A line under the price, when the price alone would mislead. */
  priceNote?: string;
  /** The item a buyer usually looks at after this one (a `slug`). */
  next?: string;
}

/** Under a single "from" price: nothing is charged before the buyer has a number. */
export const QUOTE_NOTE =
  "You get a quote for your scope before any work starts.";

/** The free intro call is a call to action, not a catalog item. */
export const INTRO_CALL = "free 30-minute intro call";

export const catalogItems: CatalogItem[] = [
  {
    icon: "target",
    slug: "strategy-call",
    title: "Strategy Session — 60 Minutes",
    seoTitle: "Technical strategy session, 60 minutes",
    category: "Technical consulting",
    next: "codebase-health-audit",
    shortTitle: "Strategy session",
    prices: [{ usd: 150, from: false }],
    delivery: "60 minutes",
    summary:
      "A 60-minute working call about your project or idea, with notes afterwards.",
    desc:
      "A focused 60-minute video call about your project or idea. I give you honest technical feedback, answer your questions, and help you plan the path forward. It is a paid hour of advice, not a sales call, and you can act on it with or without me.",
    outcome:
      "You leave with a clear technical direction and a plan you can act on.",
    includes: [
      "60-minute structured video call",
      "Honest technical assessment of your project or idea",
      "Tech stack recommendations for your situation",
      "Infrastructure approach and cost estimates",
      "Architecture diagram and notes after the call",
    ],
    tech: ["Any stack", "Architecture", "Strategy"],
    audience:
      "Founders with an idea who need guidance, teams weighing a technical choice, or anyone who wants a second opinion from a senior engineer.",
    examples: [
      "I have a business idea but I do not know where to start with the technology — what should I build first?",
      "I need someone to look at my current setup and tell me if I am on the right track before I invest more money",
      "I want to build a web app for my business but I do not understand the technical terms — can you explain what I actually need?",
    ],
  },
  {
    icon: "search",
    slug: "codebase-health-audit",
    title: "Code Audit & Refactoring Roadmap",
    seoTitle: "Code audit and refactoring roadmap",
    category: "Code audit",
    next: "zero-to-production-saas-mvp",
    shortTitle: "Code audit",
    prices: [{ usd: 1500, from: true }],
    delivery: "3 days",
    summary:
      "I review your codebase and tell you what to fix, what to rewrite and what to leave alone.",
    desc:
      "I review your existing codebase over three days. You get a written report covering architecture, security gaps and performance bottlenecks, with a prioritized refactoring roadmap, and we walk through it together on a call.",
    outcome:
      "A prioritized roadmap that tells you what to fix, what to rewrite, and what to leave alone.",
    includes: [
      "Full codebase review",
      "Security vulnerability scan",
      "Performance analysis",
      "Architecture assessment",
      "Prioritized fix roadmap",
      "30-minute walkthrough call",
    ],
    tech: ["Any stack", "Security audit", "Performance profiling"],
    audience:
      "Founders who inherited a messy codebase, and teams planning a major rewrite who want a clear roadmap first.",
    examples: [
      "Technical due diligence before an acquisition, to assess code quality and security",
      "A codebase review after the MVP, before scaling it up",
      "A performance audit for a SaaS platform with slow response times and frequent outages",
    ],
  },
  {
    icon: "rocket",
    slug: "zero-to-production-saas-mvp",
    title: "Build: SaaS MVP, From Idea to Production",
    seoTitle: "Build a SaaS MVP from idea to production",
    category: "Software development",
    next: "cto-advisory-retainer",
    priceNote: QUOTE_NOTE,
    shortTitle: "Build: MVP",
    prices: [{ usd: 8000, from: true }],
    delivery: "From 3 weeks",
    summary:
      "I build your product from idea to live deployment. Backend APIs, AI integration and MCP servers are built the same way.",
    desc:
      'I build your product from idea to live deployment: authentication, payments, an API and an admin panel, deployed on servers you own. The price and the timeline say "from" because they depend on the scope, and you get a quote for your scope before any work starts.',
    outcome:
      "A live product that real users can sign up for and pay for, without building an in-house team first.",
    firstStep: {
      title: "It starts with a discovery sprint",
      desc:
        "The build opens with a short discovery sprint: a system architecture diagram, a tech stack recommendation with the reasons, an infrastructure cost estimate, the main risks, and a phased build roadmap with timeline estimates. It is part of the small first milestone, so you keep all of it and either of us can stop after that milestone.",
    },
    alsoCovers: [
      {
        id: "backend-api",
        title: "Backend API",
        desc:
          "A production REST or GraphQL API with PostgreSQL schema design, authentication and authorization, monitoring, automated backups and a CI/CD pipeline.",
      },
      {
        id: "ai-integration",
        title: "AI integration",
        desc:
          "LLM pipelines and retrieval-augmented generation wired into your existing backend, with secure API key management, rate limiting, caching, monitoring and logging.",
      },
      {
        id: "mcp-servers",
        title: "MCP servers",
        desc:
          "Custom MCP servers that let your AI assistant read, write and act inside your own tools — CRM, database, email, calendar, internal APIs — shipped as a self-hosted Docker image you own.",
      },
    ],
    includes: [
      "User authentication (email + social login, password reset, sessions)",
      "Stripe payments (Checkout + customer portal, subscriptions, webhooks)",
      "REST API with auth-protected endpoints + OpenAPI docs",
      "Admin dashboard (user management, content moderation, basic analytics)",
      "Docker deployment on your server (staging + production)",
      "CI/CD pipeline + automated backups",
      `${promise("free-bugfixes").title} + handoff walkthrough`,
    ],
    exclusions: [
      "Native mobile apps (iOS/Android) — web-responsive only",
      "Third-party integrations beyond Stripe (CRM, email tools and so on are quoted separately)",
      "Features added after launch — quoted once we scope them",
      "Design and branding beyond system defaults — UI tokens and components are included, custom illustrations are not",
      "Ongoing maintenance — that is the Ongoing item in this catalog",
    ],
    tech: ["Deno", "Preact", "PostgreSQL", "Docker", "Stripe"],
    audience:
      "Founders with a validated idea who need a production-ready product without hiring a team first, and teams that need a backend, an AI feature or an MCP server built properly.",
    examples: [
      "A fitness social network with user profiles, workout tracking, and social feed",
      "A marketplace platform connecting freelancers with clients, including payments and escrow",
      "A booking and scheduling SaaS with calendar sync, invoicing, and admin dashboard",
    ],
  },
  {
    icon: "briefcase",
    slug: "cto-advisory-retainer",
    title: "Ongoing: Fractional CTO, Hourly or on Retainer",
    seoTitle: "Fractional CTO, hourly or on a monthly retainer",
    category: "Fractional CTO",
    priceNote: "The retainer works out cheaper from about 20 hours a month.",
    shortTitle: "Ongoing",
    prices: [
      { usd: 150, from: false, period: "hour" },
      { usd: 3000, from: true, period: "month" },
    ],
    delivery: "Ongoing",
    summary:
      "Ongoing technical leadership and post-launch support, hourly or on a monthly retainer.",
    desc:
      "Ongoing work after the first build, or alongside your own team. This is where I work as a fractional CTO: architecture decisions, code review, technical direction for your developers, and looking after what is already in production. Pay by the hour when the need comes and goes, or take a monthly retainer when it is steady — the retainer works out cheaper from about 20 hours a month.",
    outcome:
      "Senior technical leadership every week, and a production system that someone is actually watching.",
    includes: [
      "Weekly 60-minute strategy call",
      "Architecture review and technical decisions",
      "Code review and quality standards",
      "Team structure and hiring guidance",
      "Infrastructure cost optimization",
      "Post-launch support: server health and performance monitoring, backup verification, security patches",
      "Triage for production incidents",
      "Monthly status report and technical roadmap update",
    ],
    tech: [
      "Any stack",
      "Architecture",
      "Team leadership",
      "Monitoring",
      "Cost optimization",
    ],
    audience:
      "Teams that need senior technical leadership but not a full-time CTO, and founders who have launched and want someone looking after production.",
    examples: [
      "You have a dev team of 3–8 engineers and need someone to set technical direction, review architecture, and maintain code quality without becoming a blocker",
      "Your tech debt is slowing down feature delivery — you need an experienced engineer to triage what to fix now versus what can wait",
      "You just launched and want server monitoring, verified backups and security patches handled while you focus on the business",
    ],
  },
];

/**
 * Retired catalog slugs and where each one now lives. Answered with a 301 by
 * `routes/catalog/[slug].tsx`. Nothing on the site may link to a key of this map.
 */
export const catalogRedirects: Record<string, string> = {
  "technical-discovery-sprint":
    "/catalog/zero-to-production-saas-mvp#how-it-starts",
  "bulletproof-backend-api": "/catalog/zero-to-production-saas-mvp#backend-api",
  "surgical-ai-integration":
    "/catalog/zero-to-production-saas-mvp#ai-integration",
  "mcp-server-development": "/catalog/zero-to-production-saas-mvp#mcp-servers",
  "post-launch-support-maintenance": "/catalog/cto-advisory-retainer",
  "free-architecture-audit": "/#audit-form",
};

const usdFormat = new Intl.NumberFormat("en-US");

/** One price as people read it: "$150", "From $1,500", "$150/hour", "From $3,000/month". */
export function formatPrice(price: CatalogPrice): string {
  const amount = `$${usdFormat.format(price.usd)}`;
  const period = price.period ? `/${price.period}` : "";
  return `${price.from ? "From " : ""}${amount}${period}`;
}

/** Every price of an item in one label, for example "$150/hour or from $3,000/month". */
export function priceLabel(item: CatalogItem): string {
  return item.prices
    .map((p, i) => {
      const label = formatPrice(p);
      return i === 0 ? label : label.charAt(0).toLowerCase() + label.slice(1);
    })
    .join(" or ");
}

/** Looks an item up by slug and throws on a typo, so a bad link fails the build, not a visitor. */
export function catalogItem(slug: string): CatalogItem {
  const item = catalogItems.find((i) => i.slug === slug);
  if (!item) throw new Error(`lib/catalog.ts: no catalog item "${slug}"`);
  return item;
}

export function catalogPath(slug: string): string {
  return `/catalog/${catalogItem(slug).slug}`;
}

/**
 * The `lib/promises.ts` ids a service shows beside its price (#271). Build
 * and Ongoing are the engagements the project pages' closing band already
 * shows the refund and the first milestone for, so those and ownership apply
 * to both, and Build adds the bug-fix window its `includes` already names.
 * The strategy session and the code audit show the refund only (Anton,
 * #301): a one-off job has no milestone, weekly delivery or code to fix.
 */
export function catalogPromises(slug: string): string[] {
  switch (catalogItem(slug).slug) {
    case "zero-to-production-saas-mvp":
      return ["refund", "first-milestone", "ownership", "free-bugfixes"];
    case "cto-advisory-retainer":
      return ["refund", "first-milestone", "ownership"];
    case "strategy-call":
    case "codebase-health-audit":
      return ["refund"];
    default:
      return [];
  }
}

/** One row of a price card: "Price", or "Hourly" and "Retainer" for two prices. */
export interface PriceRow {
  label: string;
  price: CatalogPrice;
  /** `priceNote`, on the item's last row only. */
  note?: string;
}

const ROW_LABELS: Record<PricePeriod, string> = {
  hour: "Hourly",
  month: "Retainer",
};

/** An item's prices as card rows, each labelled by its period. */
export function priceRows(item: CatalogItem): PriceRow[] {
  return item.prices.map((price, i) => ({
    label: price.period ? ROW_LABELS[price.period] : "Price",
    price,
    ...(i === item.prices.length - 1 && item.priceNote
      ? { note: item.priceNote }
      : {}),
  }));
}

/** One step of "How it starts". */
export interface StartStep {
  title: string;
  desc: string;
}

/**
 * How an engagement starts, for the two items whose page spells it out: the
 * free intro call, a quote, the first milestone (Build); a brief, an invoice,
 * the session and its notes (Strategy). Build's sentences come from the item,
 * `INTRO_CALL` or `lib/promises.ts`; Strategy's first two are Anton's answer
 * on #301, since mig takes no payment. The other two items have no steps.
 */
export function startSteps(slug: string): StartStep[] | undefined {
  const item = catalogItem(slug);
  if (item.slug === "zero-to-production-saas-mvp" && item.firstStep) {
    return [
      { title: "We talk", desc: `A ${INTRO_CALL} about your project.` },
      { title: "You get a quote", desc: QUOTE_NOTE },
      { title: promise("first-milestone").title, desc: item.firstStep.desc },
    ];
  }
  if (item.slug === "strategy-call") {
    return [
      {
        title: "Tell me the topic",
        desc: "Use the written brief to say what you want the hour to cover.",
      },
      {
        title: "You get an invoice and a time",
        desc: "I reply with a Stripe invoice and times for the 60-minute call.",
      },
      { title: "We talk", desc: item.includes[0] },
      { title: "You get notes", desc: item.includes[4] },
    ];
  }
  return undefined;
}

/**
 * The free call next to the paid session, for the index and the Strategy
 * page (#271): the free call is a first conversation, the session is "a paid
 * hour of advice, not a sales call", shown by its `summary` here so the page's
 * own `desc` above is not repeated).
 */
export function callVersusSession(): {
  free: StartStep;
  paid: StartStep;
} {
  const session = catalogItem("strategy-call");
  return {
    free: {
      title: "Free 30-minute intro call",
      desc:
        "A first conversation about your project, before you decide anything.",
    },
    paid: {
      title: session.shortTitle,
      desc: session.summary,
    },
  };
}

/** The written-brief form with this service chosen (`?service=` is read by the booking page, #272). */
export function briefPath(slug: string): string {
  return `/book?service=${catalogItem(slug).slug}#brief`;
}

const UNIT_CODES: Record<PricePeriod, string> = { hour: "HUR", month: "MON" };

/**
 * schema.org `Offer` objects for an item, one per price. A "from" price is
 * published as `minPrice`, never as a fixed `price`, so a crawler cannot quote
 * a starting price as the price. An hourly or monthly price lives only in its
 * `UnitPriceSpecification`, where the unit is.
 */
export function catalogOffers(item: CatalogItem, baseUrl: string): unknown[] {
  return item.prices.map((p) => ({
    "@type": "Offer",
    "name": `${item.shortTitle} — ${formatPrice(p)}`,
    "url": `${baseUrl}/catalog/${item.slug}`,
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://antonshubin.com/#person" },
    "priceCurrency": "USD",
    // A bare Offer.price carries no unit, so only a one-time exact price gets one.
    ...(p.from || p.period ? {} : { "price": String(p.usd) }),
    "priceSpecification": {
      "@type": p.period ? "UnitPriceSpecification" : "PriceSpecification",
      "priceCurrency": "USD",
      ...(p.from ? { "minPrice": p.usd } : { "price": p.usd }),
      ...(p.period
        ? { "unitCode": UNIT_CODES[p.period], "unitText": p.period }
        : {}),
    },
  }));
}
