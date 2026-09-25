import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { getBreadcrumb, head } from "../lib/head.ts";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { blogArticles, projects } from "../lib/data.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts";
import { proof } from "../lib/proof.ts";
import { BookCallLink } from "../components/BookCallLink.tsx";

const audit = catalogItem("codebase-health-audit");
const build = catalogItem("zero-to-production-saas-mvp");

export default define.page(function SaasArchGuide() {
  head.value = {
    ...head.value,
    title: "SaaS Architecture Guide — Anton Shubin",
    pageName: "SaaS Architecture Guide",
    description:
      `From idea to production: architecture patterns, infrastructure decisions, CI/CD, AI integration, and lessons learned building ${
        proof("jobs")
      }+ projects.`,
    canonical: "https://antonshubin.com/saas-architecture-guide",
    ogType: "article",
  };

  // Organize content by topic
  const startupPosts = blogArticles.filter((a) => a.category === "startups");
  // "Real case studies" (#193): client work (projects.freelance), not the
  // tools Anton builds and runs for himself (projects.my) — a founder
  // reading this guide wants proof he has shipped for other people's
  // businesses, not a list of his own side projects. Archived engagements
  // are dropped the same way the rest of the site drops them.
  const allProj = projects.freelance.filter((p) => p.slug && !p.archived);

  return (
    <Layout currentPath="/saas-architecture-guide">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, "SaaS Architecture Guide")}
      />
      <div class="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-parchment mb-4">
          SaaS Architecture Guide
        </h1>
        <p class="text-graphite text-lg mb-8 leading-relaxed">
          From idea to production — architecture patterns, infrastructure
          decisions, and lessons learned from {proof("jobs")}+ projects.
        </p>

        {/* 1. Architecture Design */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-parchment mb-4 flex items-center gap-2">
            <span class="text-accent">1.</span> Architecture Design
          </h2>
          <p class="text-graphite mb-4">
            How to think about system architecture, choose the right stack, and
            design for scale from day one.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/how-chatgpt-can-help-you-design-system-architecture"
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → How ChatGPT Can Help You Design System Architecture
              </a>
              <p class="text-graphite text-sm mt-0.5">
                Generate system diagrams, compare databases, spot security gaps
                with AI assistance.
              </p>
            </li>
            <li>
              <a
                href="/blog/self-hosted-caldav-web-ui-tasks-org"
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → The missing piece in a self-hosted CalDAV stack: a web UI for
                Tasks.org
              </a>
              <p class="text-graphite text-sm mt-0.5">
                Tasks.org syncs Android tasks to CalDAV cleanly. There is no web
                UI for that data. The fix is a stateless PWA on top of the
                CalDAV server you already run.
              </p>
            </li>
            <li>
              <a
                href={catalogPath(audit.slug)}
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → {audit.title} ({priceLabel(audit)})
              </a>
              <p class="text-graphite text-sm mt-0.5">{audit.summary}</p>
            </li>
          </ul>
        </section>

        {/* 2. Building the MVP */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-parchment mb-4 flex items-center gap-2">
            <span class="text-accent">2.</span> Building the MVP
          </h2>
          <p class="text-graphite mb-4">
            Going from napkin sketch to production. Real projects I've built.
          </p>
          <ul class="space-y-3">
            {allProj.map((p) => (
              <li>
                <a
                  href={`/projects/${p.slug}`}
                  class="text-accent hover:text-accent hover:underline transition-colors font-medium"
                >
                  → {p.title}
                </a>
                <p class="text-graphite text-sm mt-0.5">{p.description}</p>
              </li>
            ))}
            <li>
              <a
                href={catalogPath(build.slug)}
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → {build.title} ({priceLabel(build)})
              </a>
              <p class="text-graphite text-sm mt-0.5">{build.summary}</p>
            </li>
          </ul>
        </section>

        {/* 3. CI/CD & DevOps */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-parchment mb-4 flex items-center gap-2">
            <span class="text-accent">3.</span> CI/CD &amp; DevOps
          </h2>
          <p class="text-graphite mb-4">
            Automate your deployment pipeline and keep your infrastructure
            healthy.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/setting-up-your-own-ci-cd-server-with-drone-ci"
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → Setting Up Your Own CI/CD Server with Drone CI
              </a>
              <p class="text-graphite text-sm mt-0.5">
                Run your own CI/CD on a $10 VPS. Docker Compose setup, GitHub
                integration.
              </p>
            </li>
            <li>
              <a
                href="/infrastructure"
                data-e2e="architecture-guide-production-operations"
                class="inline-flex min-h-11 items-center text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → Production Operations Practice
              </a>
              <p class="text-graphite text-sm mt-0.5">
                Repeatable deployment, observability, recovery, security, and
                cost control after launch.
              </p>
            </li>
          </ul>
        </section>

        {/* 4. Infrastructure & Cost Optimization */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-parchment mb-4 flex items-center gap-2">
            <span class="text-accent">4.</span>{" "}
            Infrastructure &amp; Cost Optimization
          </h2>
          <p class="text-graphite mb-4">
            Choose infrastructure from measured load, recovery needs,
            compliance, team capacity, and budget.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/infrastructure"
                data-e2e="architecture-guide-infrastructure-rubric"
                class="inline-flex min-h-11 items-center text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → Managed Cloud, Dedicated, or Hybrid
              </a>
              <p class="text-graphite text-sm mt-0.5">
                Decision rubric for compliance, elasticity, geography, team
                capacity, uptime, recovery, and cost.
              </p>
            </li>
            <li>
              <a
                href="/projects/rostok"
                data-e2e="architecture-guide-rostok-proof"
                class="inline-flex min-h-11 items-center text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → rostok
              </a>
              <p class="text-graphite text-sm mt-0.5">
                The open-source scaffolder I deploy my own servers with: four
                instances in different regions, each running a different set of
                services.
              </p>
            </li>
          </ul>
        </section>

        {/* 5. AI Integration */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-parchment mb-4 flex items-center gap-2">
            <span class="text-accent">5.</span> AI Integration
          </h2>
          <p class="text-graphite mb-4">
            Add LLM capabilities to your SaaS with production-grade
            architecture.
          </p>
          <ul class="space-y-3">
            <li>
              <a
                href="/blog/building-mcp-servers-with-deno"
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → Building MCP Servers with Deno: A Practical Guide
              </a>
              <p class="text-graphite text-sm mt-0.5">
                Architecture for MCP servers, working CalDAV example, lessons
                from 4 production servers.
              </p>
            </li>
            <li>
              <a
                href={catalogPath(build.slug)}
                class="text-accent hover:text-accent hover:underline transition-colors font-medium"
              >
                → AI integration and MCP servers, built under {build.shortTitle}
                {" "}
                ({priceLabel(build)})
              </a>
              <p class="text-graphite text-sm mt-0.5">
                {build.alsoCovers?.find((c) => c.title === "MCP servers")?.desc}
              </p>
            </li>
          </ul>
        </section>

        {/* 6. Production Patterns */}
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-parchment mb-4 flex items-center gap-2">
            <span class="text-accent">6.</span>{" "}
            Production Patterns &amp; Lessons
          </h2>
          <p class="text-graphite mb-4">
            Real-world lessons from shipping {proof("jobs")}+ projects.
          </p>
          <ul class="space-y-3">
            {startupPosts.map((p) => (
              <li>
                <a
                  href={`/blog/${p.slug}`}
                  class="text-accent hover:text-accent hover:underline transition-colors font-medium"
                >
                  → {p.title}
                </a>
                <p class="text-graphite text-sm mt-0.5">{p.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {
          /* CTA — rendered only when SCHEDULE_URL is set; otherwise there is
        no booking button for the card to introduce. */
        }
        {SCHEDULE_URL && (
          <div class="mt-12 p-6 bg-paper rounded-xl border border-rule text-center">
            <h2 class="text-xl font-bold text-parchment mb-3">
              Need help with your architecture?
            </h2>
            <p class="text-graphite mb-5">
              Book a free 30-minute intro call. No pitch, just advice.
            </p>
            <BookCallLink
              url={SCHEDULE_URL}
              target="_blank"
              class="gap-2 px-6 py-3"
            >
              Book a free intro call
            </BookCallLink>
          </div>
        )}
      </div>
    </Layout>
  );
});
