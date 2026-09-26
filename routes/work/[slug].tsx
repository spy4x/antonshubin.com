import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import {
  formatPeriod,
  type Period,
  type Project,
  projects,
  projectScreenshots,
  relatedProjects,
} from "../../lib/data.ts";
import { projectTestimonials } from "../../lib/testimonials.ts";
import { clientSummary, metaDescription, projectLead } from "../../lib/llms.ts";
import { promise } from "../../lib/promises.ts";
import { WithNote } from "../../components/WithNote.tsx";
import { SCHEDULE_URL } from "../../lib/config.ts";
import ImageGallery from "../../islands/ImageGallery.tsx";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { BookCallLink } from "../../components/BookCallLink.tsx";
import {
  ProjectFactCard,
  SimilarWorkLink,
} from "../../components/ProjectFactCard.tsx";
import { ProjectReviews, PullQuote } from "../../components/ProjectReviews.tsx";
import { ArrowRightIcon } from "../../components/Icons.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";

function getAllProjects(): Project[] {
  return [...projects.my, ...projects.freelance];
}

function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

/**
 * Split a description on blank lines into semantic paragraphs. Returns an
 * array of single-paragraph strings so each block can render as its own `<p>`
 * — much easier to scan than a single wall of text.
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

/** A period as schema.org `temporalCoverage`: "2021", "2018/2019" or "2024/.." while ongoing. */
function temporalCoverage(period: Period): string {
  if (period.ongoing) return `${period.from}/..`;
  if (period.to && period.to !== period.from) {
    return `${period.from}/${period.to}`;
  }
  return `${period.from}`;
}

/**
 * Build the project's JSON-LD node from fields the `Project` interface
 * already holds — no invented dates, ratings or facts. `SoftwareSourceCode`
 * when the project links a repo (`ghRepo`), otherwise `CreativeWork`. The
 * `author` and `creator` point at the site-wide Person node and `isPartOf` at
 * the WebSite node, both from `components/SEOHead.tsx` (issue #167). `image`
 * lists the hero screenshot first, then the rest, then the logo; `abstract`
 * is the lead line under the page's `<h1>` (#246).
 *
 * No `Review` or `AggregateRating`: the reviews are the client's words on
 * Upwork, and self-served review markup is not eligible for rich results.
 * No `sourceOrganization`: `madeForName` is mostly a person (a LinkedIn
 * profile), not an organization — typing all of them as `Organization` would
 * invent a fact the Content rule in AGENTS.md forbids, and schema.org has no
 * generic "made for" property that covers both a person and a company.
 */
function projectJsonLd(project: Project, canonical: string) {
  const images = [
    ...projectScreenshots(project).map((s) =>
      `https://antonshubin.com${s.src}`
    ),
    ...(project.logoImageURL
      ? [`https://antonshubin.com${project.logoImageURL}`]
      : []),
  ];

  const codeRepository = project.ghRepo
    ? `https://github.com/${project.ghRepo}`
    : undefined;
  // Financy's externalURL is its GitHub repo itself, so sameAs would just
  // repeat codeRepository — only add it when it points somewhere else.
  const sameAs = project.externalURL && !project.externalURLDead &&
      project.externalURL !== codeRepository
    ? [project.externalURL]
    : undefined;
  const person = { "@id": "https://antonshubin.com/#person" };

  return {
    "@context": "https://schema.org",
    "@type": project.ghRepo ? "SoftwareSourceCode" : "CreativeWork",
    "@id": `${canonical}#project`,
    "name": project.title,
    "description": project.description,
    "abstract": projectLead(project),
    "url": canonical,
    ...(images.length > 0 ? { "image": images } : {}),
    "author": person,
    "creator": person,
    "isPartOf": { "@id": "https://antonshubin.com/#website" },
    ...(project.tags && project.tags.length > 0
      ? { "keywords": project.tags.join(", ") }
      : {}),
    ...(codeRepository ? { "codeRepository": codeRepository } : {}),
    ...(sameAs ? { "sameAs": sameAs } : {}),
    ...(project.archived ? { "creativeWorkStatus": "Archived" } : {}),
    ...(project.period
      ? {
        "dateCreated": String(project.period.from),
        "temporalCoverage": temporalCoverage(project.period),
      }
      : {}),
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
  };
}

// Unknown slugs keep the friendly "Not Found" view below, but must answer with
// a real 404 so search engines drop removed project pages instead of indexing
// an empty 200.
export const handler = define.handlers({
  GET(ctx) {
    return getProjectBySlug(ctx.params.slug) ? page() : page(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  },
});

/** The project's small logo mark beside the `<h1>`; decorative, since the heading names it. */
function LogoMark({ project }: { project: Project }) {
  if (!project.logoImageURL) return null;
  return (
    <img
      src={project.logoImageURL}
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      class={`w-12 h-12 shrink-0 object-contain${
        project.logoPlate ? " bg-parchment rounded-lg p-2" : ""
      }`}
    />
  );
}

/** A "More work" card: title, lead line and period, linking the project's page. */
function MoreWorkCard({ project }: { project: Project }) {
  return (
    <li>
      <a
        href={`/projects/${project.slug}`}
        data-more-work={project.slug}
        class="block h-full bg-paper border border-rule rounded-xl p-5 hover:border-rule-strong transition-colors"
      >
        <h3 class="text-lg text-parchment">{project.title}</h3>
        <p class="mt-2 text-sm text-graphite">{projectLead(project)}</p>
        {project.period && (
          <p class="mt-3 text-sm text-graphite" data-project-period>
            {formatPeriod(project.period)}
          </p>
        )}
      </a>
    </li>
  );
}

export default define.page(function ProjectDetail(ctx) {
  const { slug } = ctx.params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl font-semibold text-parchment mb-4">Not Found</h1>
          <p class="text-graphite mb-6">
            The project you're looking for does not exist.
          </p>
          <a
            href="/projects"
            class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors"
          >
            ← Back to projects
          </a>
        </div>
      </Layout>
    );
  }

  const isClientProject = projects.freelance.some((p) => p.slug === slug);
  const paragraphs = splitParagraphs(project.description);
  const reviews = projectTestimonials(slug);
  const screenshots = projectScreenshots(project);
  const lead = projectLead(project);
  const related = isClientProject ? relatedProjects(project) : [];
  const closingPromises = [promise("refund"), promise("first-milestone")];

  head.value = {
    ...head.value,
    title: `${project.title} — Anton Shubin`,
    pageName: project.title,
    description: metaDescription(clientSummary(project)),
    canonical: `https://antonshubin.com/projects/${slug}`,
    ogType: "article",
    // 1200x630 PNG (#193), generated by `deno task og` — the JSON-LD "image"
    // above keeps the real logo/screenshots; LinkedIn, X, Facebook and Slack
    // don't render SVG link previews, and most project logos are SVG.
    ogImage: `https://antonshubin.com/img/og/projects/${slug}.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  const leadLine = (
    <p
      data-project-lead
      class="font-heading text-xl text-parchment leading-snug text-balance"
    >
      {lead}
    </p>
  );

  return (
    <Layout currentPath="/projects">
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(projectJsonLd(project, head.value.canonical)),
        }}
      />
      <div class="max-w-6xl mx-auto">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, project.title)}
        />

        {/* ── Title and lead line ─────────────────────────────────────── */}
        <header class="mb-8">
          <div class="flex items-center gap-4">
            <LogoMark project={project} />
            <h1 class="text-3xl sm:text-4xl text-parchment text-balance">
              {project.title}
            </h1>
          </div>
          <div class="mt-4">
            {project.outcomeNote
              ? <WithNote id={project.outcomeNote}>{leadLine}</WithNote>
              : leadLine}
          </div>
        </header>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          {/* ── Fact card: first at 390px, the right column from 1024px ── */}
          <div class="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-8">
            <ProjectFactCard project={project} />
          </div>

          <div class="lg:col-start-1 lg:row-start-1 min-w-0 space-y-12">
            {/* ── Hero: the product first ─────────────────────────────── */}
            {screenshots.length > 0 && (
              <section aria-labelledby="project-screenshots">
                <h2 id="project-screenshots" class="sr-only">Screenshots</h2>
                <ImageGallery images={screenshots} hero />
              </section>
            )}

            <PullQuote project={project} review={reviews[0]} />

            {/* ── What I built ────────────────────────────────────────── */}
            <section aria-labelledby="project-built">
              <h2 id="project-built" class="text-2xl text-parchment mb-4">
                What I built
              </h2>
              <div class="space-y-4 max-w-2xl leading-relaxed">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    class={i === 0
                      ? "text-lg text-parchment"
                      : "text-base text-graphite"}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>

            <ProjectReviews project={project} reviews={reviews} />

            {/* ── Video ───────────────────────────────────────────────── */}
            {project.videoURL && (
              <section aria-labelledby="project-video">
                <h2 id="project-video" class="text-2xl text-parchment mb-4">
                  Video
                </h2>
                <div class="aspect-video rounded-lg overflow-hidden bg-paper">
                  <iframe
                    src={project.videoURL}
                    title={`Video overview: ${project.title}`}
                    class="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </section>
            )}

            {/* ── More work ───────────────────────────────────────────── */}
            {related.length > 0 && (
              <section aria-labelledby="project-more-work">
                <h2
                  id="project-more-work"
                  class="text-2xl text-parchment mb-4"
                >
                  More work
                </h2>
                <ul class="grid gap-4 sm:grid-cols-3">
                  {related.map((p) => (
                    <MoreWorkCard key={p.slug} project={p} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* ── Closing band: one decision ────────────────────────────── */}
        <section
          data-closing-band
          aria-label="Next step"
          class="mt-16 bg-desk border border-rule rounded-xl p-6 sm:p-8"
        >
          <ul class="grid gap-4 sm:grid-cols-2 mb-6">
            {closingPromises.map((p) => (
              <li key={p.id}>
                <p class="font-heading text-lg text-parchment">{p.title}</p>
                <p class="mt-1 text-sm text-graphite">{p.desc}</p>
              </li>
            ))}
          </ul>
          <div class="flex flex-wrap items-center gap-4">
            <BookCallLink
              url={SCHEDULE_URL}
              target="_blank"
              data-umami-event={`project-cta-${project.slug}-schedule-bottom`}
              class="justify-center px-6 py-3"
            >
              Book a free intro call
            </BookCallLink>
            <SimilarWorkLink project={project} place="bottom" />
            <a
              href="/how-i-work"
              data-umami-event={`project-cta-${project.slug}-how-i-work`}
              class="inline-flex items-center gap-1 text-sm text-parchment underline underline-offset-4 hover:text-accent"
            >
              How I work
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
});
