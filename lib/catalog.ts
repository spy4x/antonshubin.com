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

export interface CatalogItem {
  icon: CatalogIconName;
  slug: string;
  /** Full title: page heading, `<title>`, JSON-LD name. */
  title: string;
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
  alsoCovers?: CatalogExample[];
}

/** The free intro call is a call to action, not a catalog item. */
export const INTRO_CALL = "free 30-minute intro call";

export const catalogItems: CatalogItem[] = [
  {
    icon: "target",
    slug: "strategy-call",
    title: "Strategy Session — 60 Minutes",
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
        title: "Backend API",
        desc:
          "A production REST or GraphQL API with PostgreSQL schema design, authentication and authorization, monitoring, automated backups and a CI/CD pipeline.",
      },
      {
        title: "AI integration",
        desc:
          "LLM pipelines and retrieval-augmented generation wired into your existing backend, with secure API key management, rate limiting, caching, monitoring and logging.",
      },
      {
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
  "technical-discovery-sprint": "/catalog/zero-to-production-saas-mvp",
  "bulletproof-backend-api": "/catalog/zero-to-production-saas-mvp",
  "surgical-ai-integration": "/catalog/zero-to-production-saas-mvp",
  "mcp-server-development": "/catalog/zero-to-production-saas-mvp",
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
