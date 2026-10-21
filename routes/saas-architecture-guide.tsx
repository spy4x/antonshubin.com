import { BOOK_LABEL } from "../lib/nav.ts"
import { define } from "../lib/utils.ts"
import { SEOHead } from "../components/SEOHead.tsx"
import { Layout } from "../components/Layout.tsx"
import { getBreadcrumb, head } from "../lib/head.ts"
import { Breadcrumb } from "../components/Breadcrumb.tsx"
import { highlightProjects } from "../lib/data.ts"
import { SCHEDULE_URL } from "../lib/config.ts"
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts"
import { proof } from "../lib/proof.ts"
import { postHref, topicPosts } from "../lib/blog.ts"
import type { BlogArticle } from "../lib/blog-posts.ts"
import { firstSentence, projectLead } from "../lib/llms.ts"
import { findTool } from "../lib/tools.ts"
import { workHref } from "../lib/work.ts"
import { BookCallLink } from "../components/BookCallLink.tsx"
import { eventAttrs, linkEvent } from "../lib/analytics.ts"

const audit = catalogItem("codebase-health-audit")
const build = catalogItem("zero-to-production-saas-mvp")

/** One thing to read: where it is and one line on why. */
interface GuideLink {
  href: string
  label: string
  /** Read from the linked post, project, tool or catalog item, never written here. */
  why?: string
}

/** One step of the reading order. */
interface GuideStep {
  id: string
  title: string
  intro: string
  links: GuideLink[]
}

/** A current post and the first sentence of its own description. */
function postLink(a: BlogArticle): GuideLink {
  return {
    href: postHref(a.slug),
    label: a.title,
    why: firstSentence(a.description),
  }
}

/**
 * The reading order (#390). Posts come from their topic through
 * `topicPosts()`, which leaves archived ones out and lists the newest first;
 * a client project shows its one-line lead (`projectLead()`), never its
 * whole description.
 */
function guideSteps(): GuideStep[] {
  const rostok = findTool("rostok")
  if (!rostok) {
    throw new Error("the guide links rostok, which lib/tools.ts lacks")
  }
  return [
    {
      id: "decisions",
      title: "Architecture decisions",
      intro:
        "How to think about system architecture, choose the right stack, and design for scale from day one.",
      links: [
        ...topicPosts("founders").map(postLink),
        {
          href: catalogPath(audit.slug),
          label: `${audit.title} (${priceLabel(audit)})`,
          why: audit.summary,
        },
      ],
    },
    {
      id: "projects",
      title: "Building the MVP",
      intro:
        "Going from napkin sketch to production. Real projects I've built.",
      links: [
        ...highlightProjects().map((p) => ({
          href: workHref(p.slug!),
          label: p.title,
          why: projectLead(p),
        })),
        { href: "/work", label: "All client work" },
        {
          href: catalogPath(build.slug),
          label: `${build.title} (${priceLabel(build)})`,
          why: build.summary,
        },
      ],
    },
    {
      id: "infrastructure",
      title: "Infrastructure and cost",
      intro:
        "Choose infrastructure from measured load, recovery needs, compliance, team capacity, and budget.",
      links: [
        {
          href: "/infrastructure",
          label: "How I run production",
          why:
            "Repeatable deployment, observability, recovery, security, and cost control after launch.",
        },
        {
          href: `/tools/${rostok.slug}`,
          label: rostok.name,
          why: `${rostok.job.charAt(0).toUpperCase()}${rostok.job.slice(1)}.`,
        },
      ],
    },
    {
      id: "ai",
      title: "AI integration",
      intro:
        "Add LLM capabilities to your SaaS with production-grade architecture.",
      links: [
        ...topicPosts("ai-mcp").map(postLink),
        {
          href: catalogPath(build.slug),
          label:
            `AI integration and MCP servers, built under ${build.shortTitle} (${
              priceLabel(build)
            })`,
          why: build.alsoCovers?.find((c) => c.title === "MCP servers")?.desc,
        },
      ],
    },
  ]
}

export default define.page(function SaasArchGuide() {
  head.value = {
    ...head.value,
    title: "SaaS Architecture Guide — Anton Shubin",
    pageName: "SaaS Architecture Guide",
    description:
      `A short reading order from idea to production: architecture decisions, client projects and how they turned out, infrastructure and AI integration, with lessons from ${
        proof("projects")
      } projects.`,
    canonical: "https://antonshubin.com/saas-architecture-guide",
    ogType: "article",
  }

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
          From idea to production, in reading order: what to read at each step
          and why, with lessons from {proof("projects")} projects.
        </p>

        <ol class="list-none p-0">
          {guideSteps().map((step, i) => (
            <li key={step.id} data-guide-step={step.id} class="mb-10">
              <h2 class="text-2xl text-parchment mb-4">
                <span class="text-graphite">{i + 1}.</span> {step.title}
              </h2>
              <p class="text-graphite mb-4">{step.intro}</p>
              <ul class="space-y-3">
                {step.links.map((link) => (
                  <li key={link.href + link.label}>
                    <a
                      href={link.href}
                      {...linkEvent(link.href, { place: "body" })}
                      class="text-parchment underline underline-offset-4 hover:text-graphite font-semibold"
                    >
                      {link.label}
                    </a>
                    {link.why && (
                      <p class="text-graphite text-sm mt-0.5">{link.why}</p>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

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
              event={eventAttrs("book", { place: "end" })}
              class="gap-2 px-6 py-3"
            >
              {BOOK_LABEL}
            </BookCallLink>
          </div>
        )}
      </div>
    </Layout>
  )
})
