import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { SCHEDULE_URL, UPWORK_URL } from "../../lib/config.ts";

export interface CatalogItem {
  icon: string;
  slug: string;
  title: string;
  price: string;
  delivery: string;
  desc: string;
  includes: string[];
  tech: string[];
  upworkUrl?: string;
  audience: string;
  examples: string[];
}

export const items: CatalogItem[] = [
  {
    icon: "🎯",
    slug: "strategy-call",
    title: "Strategy Call — 30 Minutes",
    price: "$100",
    delivery: "30 min",
    desc:
      "A focused 30-minute video call where I give you honest architectural feedback on your project or idea. No pitch, no commitment — just actionable advice from an experienced Fractional CTO.",
    includes: [
      "30-minute structured video call",
      "Honest technical assessment of your project",
      "Tech stack recommendations tailored to your needs",
      "Infrastructure approach and cost estimates",
      "No commitment required — actionable advice either way",
    ],
    tech: ["Any stack", "Architecture", "Strategy"],
    upworkUrl: UPWORK_URL,
    audience:
      "Non-technical founders with an idea who need guidance, startup teams evaluating tech choices, or anyone wanting a second opinion from an experienced CTO.",
    examples: [
      "A first-time founder needing help choosing the right tech stack for their MVP",
      "An existing startup evaluating whether to migrate from AWS to self-hosted infrastructure",
      "A product owner wondering why their server bill is too high and how to fix it",
    ],
  },
  {
    icon: "🚀",
    slug: "zero-to-production-saas-mvp",
    title: "Zero-to-Production SaaS MVP",
    price: "From $8,000",
    delivery: "21 days",
    desc:
      "Full SaaS MVP from idea to live deployment. Includes authentication, payment processing, REST API, and an admin panel. Built on Deno + Preact + PostgreSQL — lean, fast, and ready for users.",
    includes: [
      "User authentication (email/social login)",
      "Payment integration (Stripe)",
      "REST API with 10+ endpoints",
      "Admin dashboard",
      "Docker deployment on your server",
      "30-day code warranty",
    ],
    tech: ["Deno", "Preact", "PostgreSQL", "Docker", "Stripe"],
    upworkUrl: UPWORK_URL,
    audience:
      "Non-technical founders with a validated idea who need a production-ready MVP without building an in-house team.",
    examples: [
      "A fitness social network with user profiles, workout tracking, and social feed",
      "A marketplace platform connecting freelancers with clients, including payments and escrow",
      "A booking and scheduling SaaS with calendar sync, invoicing, and admin dashboard",
    ],
  },
  {
    icon: "⚡",
    slug: "bulletproof-backend-api",
    title: "Bulletproof Backend API & Infrastructure",
    price: "From $4,000",
    delivery: "14 days",
    desc:
      "Production-grade REST or GraphQL API with self-hosted or cloud infrastructure. Designed to scale to 10K+ users from day one. Includes monitoring, backups, and CI/CD.",
    includes: [
      "REST or GraphQL API (your choice)",
      "PostgreSQL schema design",
      "Authentication & authorization",
      "Docker Compose deployment",
      "Automated backups & monitoring",
      "CI/CD pipeline",
    ],
    tech: ["Deno", "Hono", "PostgreSQL", "Docker", "Traefik"],
    upworkUrl: UPWORK_URL,
    audience:
      "Mobile app founders who need a scalable backend, or teams looking to replace Firebase with a self-hosted solution.",
    examples: [
      "Backend API for a cross-platform mobile app with real-time sync",
      "SaaS platform API handling authentication, billing, and multi-tenant data",
      "Real-time data service with WebSocket connections for live dashboards",
    ],
  },
  {
    icon: "🤖",
    slug: "surgical-ai-integration",
    title: "Surgical AI Integration & LLM Pipelines",
    price: "From $4,000",
    delivery: "14 days",
    desc:
      "Production-grade LLM pipelines, RAG systems, and autonomous subagents. Built to eliminate hallucination risks and integrate cleanly with your existing backend.",
    includes: [
      "LLM pipeline architecture",
      "RAG (Retrieval-Augmented Generation) system",
      "Secure API key management",
      "Rate limiting & caching",
      "Monitoring & logging",
      "Integration with your existing backend",
    ],
    tech: ["Deno", "OpenAI/Claude/DeepSeek", "Vector DB", "Docker"],
    upworkUrl: UPWORK_URL,
    audience:
      "Founders who want to add AI features without the research overhead, or teams needing production-grade LLM pipelines.",
    examples: [
      "A customer support chatbot integrated with your knowledge base and ticket system",
      "An automated document processing pipeline for invoices, contracts, or reports",
      "A personalized recommendation engine for an e-commerce or content platform",
    ],
  },
  {
    icon: "🔍",
    slug: "codebase-health-audit",
    title: "Codebase Health Audit & Refactoring Roadmap",
    price: "From $1,500",
    delivery: "3 days",
    desc:
      "48-hour deep audit of your existing codebase. You get a detailed report with architectural recommendations, security gaps, performance bottlenecks, and a prioritized refactoring roadmap.",
    includes: [
      "Full codebase review",
      "Security vulnerability scan",
      "Performance analysis",
      "Architecture assessment",
      "Prioritized fix roadmap",
      "30-min walkthrough call",
    ],
    tech: ["Any stack", "Security audit", "Performance profiling"],
    upworkUrl: UPWORK_URL,
    audience:
      "Founders who inherited a messy codebase, or teams planning a major rewrite who need a clear roadmap first.",
    examples: [
      "Pre-acquisition technical due diligence to assess code quality and security",
      "Post-MVP codebase review before scaling to production-grade infrastructure",
      "Performance audit for a SaaS platform experiencing slow response times and frequent outages",
    ],
  },
  {
    icon: "🛟",
    slug: "post-launch-support-maintenance",
    title: "Post-Launch Support & Maintenance",
    price: "$400/month",
    delivery: "Ongoing",
    desc:
      "Ongoing infrastructure oversight after your project ships. Server monitoring, backup verification, disk space tracking, security patches, and monthly reports — so you can focus on growing your business. This is a separate service from the initial build, designed for clients who want ongoing peace of mind.",
    includes: [
      "Server health & performance monitoring",
      "Automated backup verification",
      "Disk space & resource tracking",
      "Security patch updates",
      "Monthly status report",
      "8-hour response for critical issues",
      "Priority email support",
    ],
    tech: ["Deno/Node.js", "PostgreSQL", "Docker", "Linux", "Monitoring"],
    audience:
      "Founders who just launched and want infrastructure peace of mind without hiring a full-time DevOps person.",
    examples: [
      "Ongoing server monitoring for a growing SaaS handling sensitive user data",
      "Monthly health reports and security patching for a compliance-critical platform",
      "Infrastructure oversight while you focus on fundraising and business development",
    ],
  },
];

export default define.page(function Catalog() {
  return (
    <Layout currentPath="/catalog">
      <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Project Catalog
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Fixed-price deliverables. Predictable timelines. No surprises.
        </p>

        <div class="space-y-6">
          {items.map((item, i) => (
            <div
              key={i}
              class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div class="p-6 sm:p-8">
                <a
                  href={`/catalog/${item.slug}`}
                  class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 group"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">{item.icon}</span>
                    <h2 class="text-xl font-semibold text-white group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </h2>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="inline-block px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded-full">
                      {item.price}
                    </span>
                    <span class="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-sm font-medium rounded-full">
                      {item.delivery}
                    </span>
                  </div>
                </a>

                <p class="text-gray-300 text-sm mb-4 leading-relaxed">
                  {item.desc}
                </p>

                <details class="mb-4">
                  <summary class="text-orange-400 text-sm cursor-pointer hover:text-orange-300 transition-colors">
                    What's included
                  </summary>
                  <ul class="mt-3 space-y-1.5">
                    {item.includes.map((inc, j) => (
                      <li
                        key={j}
                        class="text-gray-400 text-sm flex items-start gap-2"
                      >
                        <span class="text-green-400 shrink-0">✓</span>
                        {inc}
                      </li>
                    ))}
                  </ul>
                </details>

                <div class="flex flex-wrap gap-2 mb-5">
                  {item.tech.map((t, j) => (
                    <span
                      key={j}
                      class="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <a
                    href="/contact-me"
                    class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
                  >
                    Start this project
                  </a>
                  <a
                    href={`/catalog/${item.slug}`}
                    class="inline-flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Details
                  </a>
                  {item.upworkUrl && (
                    <a
                      href={item.upworkUrl}
                      target="_blank"
                      class="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                    >
                      Also available on Upwork
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div class="text-center mt-12">
          <p class="text-gray-400 text-sm mb-4">
            Not sure which fits your project?
          </p>
          <a
            href={SCHEDULE_URL}
            target="_blank"
            class="inline-block px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
          >
            Book a free strategy call
          </a>
        </div>
      </div>
    </Layout>
  );
});
