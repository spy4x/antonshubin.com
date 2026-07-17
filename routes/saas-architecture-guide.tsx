import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { getBreadcrumb, head } from "../lib/head.ts";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { blogArticles, projects } from "../lib/data.ts";
import { SCHEDULE_URL } from "../lib/config.ts";

export default define.page(function SaasArchGuide() {
  head.value = {
    ...head.value,
    title: "SaaS Architecture Guide — Anton Shubin",
    description:
      "From idea to production: architecture patterns, infrastructure decisions, CI/CD, AI integration, and lessons learned building 80+ projects.",
    canonical: "https://antonshubin.com/saas-architecture-guide/",
    ogType: "article",
  };

  // Organize content by topic
  const startupPosts = blogArticles.filter((a) => a.category === "startups");
  const allProj = [...projects.my, ...projects.freelance].filter((p) =>
    p.slug && !p.archived
  );

  return (
    <Layout currentPath="/saas-architecture-guide">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          SaaS Architecture Guide
        </h1>
        <p class="text-gray-400 text-lg mb-8 leading-relaxed">
          From idea to production — architecture patterns, infrastructure
          decisions, and lessons learned from 80+ projects.
        </p>

        {/* 1. Architecture Design */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-orange-400">1.</span> Architecture Design
          </h2>
          <p class="text-gray-400 mb-4">
            How to think about system architecture, choose the right stack, and
            design for scale from day one.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/how-chatgpt-can-help-you-design-system-architecture"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → How ChatGPT Can Help You Design System Architecture
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Generate system diagrams, compare databases, spot security gaps
                with AI assistance.
              </p>
            </li>
            <li>
              <a
                href="/blog/self-hosted-caldav-web-ui-tasks-org"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → The missing piece in a self-hosted CalDAV stack: a web UI for
                Tasks.org
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Tasks.org syncs Android tasks to CalDAV cleanly. There is no web
                UI for that data. The fix is a stateless PWA on top of the
                CalDAV server you already run.
              </p>
            </li>
            <li>
              <a
                href="/catalog/technical-discovery-sprint"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Technical Discovery Sprint (catalog)
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Get a complete architecture blueprint and phased build roadmap.
              </p>
            </li>
          </ul>
        </section>

        {/* 2. Building the MVP */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-orange-400">2.</span> Building the MVP
          </h2>
          <p class="text-gray-400 mb-4">
            Going from napkin sketch to production. Real projects I've built.
          </p>
          <ul class="space-y-3">
            {allProj.slice(0, 6).map((p) => (
              <li>
                <a
                  href={`/projects/${p.slug}`}
                  class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  → {p.title}
                </a>
                <p class="text-gray-500 text-sm mt-0.5">{p.description}</p>
              </li>
            ))}
            <li>
              <a
                href="/catalog/zero-to-production-saas-mvp"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Zero-to-Production SaaS MVP (catalog)
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Full SaaS MVP from idea to live deployment in 21 days.
              </p>
            </li>
          </ul>
        </section>

        {/* 3. CI/CD & DevOps */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-orange-400">3.</span> CI/CD &amp; DevOps
          </h2>
          <p class="text-gray-400 mb-4">
            Automate your deployment pipeline and keep your infrastructure
            healthy.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/setting-up-your-own-ci-cd-server-with-drone-ci"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Setting Up Your Own CI/CD Server with Drone CI
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Run your own CI/CD on a $10 VPS. Docker Compose setup, GitHub
                integration.
              </p>
            </li>
            <li>
              <a
                href="/infrastructure"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Infrastructure Overview
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Full stack architecture: Traefik, monitoring, backup strategy.
              </p>
            </li>
          </ul>
        </section>

        {/* 4. Infrastructure & Cost Optimization */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-orange-400">4.</span>{" "}
            Infrastructure &amp; Cost Optimization
          </h2>
          <p class="text-gray-400 mb-4">
            Run production services on a budget without sacrificing reliability.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/cost-optimization-laboratory"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → How I Run 20+ Production Services on a Single $50/Month Server
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Exact architecture, cost breakdown, and patterns to slash infra
                costs by 90%.
              </p>
            </li>
            <li>
              <a
                href="/projects/homelab"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Homelab
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Infrastructure-as-code for 20+ Docker services with Traefik and
                monitoring.
              </p>
            </li>
          </ul>
        </section>

        {/* 5. AI Integration */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-orange-400">5.</span> AI Integration
          </h2>
          <p class="text-gray-400 mb-4">
            Add LLM capabilities to your SaaS with production-grade
            architecture.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/building-mcp-servers-with-deno"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Building MCP Servers with Deno: A Practical Guide
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Architecture for MCP servers, working CalDAV example, lessons
                from 4 production servers.
              </p>
            </li>
            <li>
              <a
                href="/catalog/surgical-ai-integration"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Surgical AI Integration &amp; LLM Pipelines (catalog)
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Production-grade LLM pipelines, RAG systems, and autonomous
                subagents.
              </p>
            </li>
            <li>
              <a
                href="/catalog/mcp-server-development"
                class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                → Custom MCP Server Development (catalog)
              </a>
              <p class="text-gray-500 text-sm mt-0.5">
                Connect your AI to your CRM, database, email, and internal APIs.
              </p>
            </li>
          </ul>
        </section>

        {/* 6. Production Patterns */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span class="text-orange-400">6.</span>{" "}
            Production Patterns &amp; Lessons
          </h2>
          <p class="text-gray-400 mb-4">
            Real-world lessons from shipping 80+ projects.
          </p>
          <ul class="space-y-3">
            {startupPosts.map((p) => (
              <li>
                <a
                  href={`/blog/${p.slug}`}
                  class="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  → {p.title}
                </a>
                <p class="text-gray-500 text-sm mt-0.5">{p.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div class="mt-12 p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
          <h2 class="text-xl font-bold text-white mb-3">
            Need help with your architecture?
          </h2>
          <p class="text-gray-400 mb-5">
            Book a free 30-minute intro call. No pitch, just advice.
          </p>
          <a
            href={SCHEDULE_URL}
            target="_blank"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 transition-all duration-200"
          >
            Book a free intro call
          </a>
        </div>
      </div>
    </Layout>
  );
});
