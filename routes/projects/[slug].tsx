import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import {
  formatPeriod,
  type Project,
  projects,
  projectScreenshots,
} from "../../lib/data.ts";
import { projectTestimonials } from "../../lib/testimonials.ts";
import { WithNote } from "../../components/WithNote.tsx";
import { SCHEDULE_URL } from "../../lib/config.ts";
import ImageGallery from "../../islands/ImageGallery.tsx";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import GhStars from "../../islands/GhStars.tsx";
import { BookCallLink } from "../../components/BookCallLink.tsx";
import { NewTabHint } from "../../components/NewTabHint.tsx";
import { Rating } from "../../components/Rating.tsx";
import { ReviewSource } from "../../components/ReviewSource.tsx";
import { toJsonLd } from "../../lib/json-ld.ts";
import StatusMark from "../../components/StatusMark.tsx";

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

/**
 * Build the project's JSON-LD node from fields the `Project` interface
 * already holds — no invented dates, ratings or facts. `SoftwareSourceCode`
 * when the project links a repo (`ghRepo`), otherwise `CreativeWork`. The
 * `author` points at the site-wide Person node from `components/SEOHead.tsx`
 * (issue #167), same `@id` the BlogPosting JSON-LD in
 * `routes/blog/[slug].tsx` uses.
 *
 * No `sourceOrganization`: `madeForName` is mostly a person (a LinkedIn
 * profile), not an organization — typing all of them as `Organization` would
 * invent a fact the Content rule in AGENTS.md forbids, and schema.org has no
 * generic "made for" property that covers both a person and a company.
 */
function projectJsonLd(project: Project, canonical: string) {
  const images = [
    ...(project.logoImageURL
      ? [`https://antonshubin.com${project.logoImageURL}`]
      : []),
    ...projectScreenshots(project).map((s) =>
      `https://antonshubin.com${s.src}`
    ),
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

  return {
    "@context": "https://schema.org",
    "@type": project.ghRepo ? "SoftwareSourceCode" : "CreativeWork",
    "@id": `${canonical}#project`,
    "name": project.title,
    "description": project.description,
    "url": canonical,
    ...(images.length > 0 ? { "image": images } : {}),
    "author": { "@id": "https://antonshubin.com/#person" },
    ...(project.tags && project.tags.length > 0
      ? { "keywords": project.tags.join(", ") }
      : {}),
    ...(codeRepository ? { "codeRepository": codeRepository } : {}),
    ...(sameAs ? { "sameAs": sameAs } : {}),
    ...(project.archived ? { "creativeWorkStatus": "Archived" } : {}),
    ...(project.period ? { "dateCreated": String(project.period.from) } : {}),
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

export default define.page(function ProjectDetail(ctx) {
  const { slug } = ctx.params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl font-bold text-parchment mb-4">Not Found</h1>
          <p class="text-graphite mb-6">
            The project you're looking for does not exist.
          </p>
          <a
            href="/projects"
            class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors font-medium"
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

  head.value = {
    ...head.value,
    title: `${project.title} — Anton Shubin`,
    pageName: project.title,
    description: project.description,
    canonical: `https://antonshubin.com/projects/${slug}`,
    ogType: "article",
    // 1200x630 PNG (#193), generated by `deno task og` — the JSON-LD "image"
    // above keeps the real logo/screenshots; LinkedIn, X, Facebook and Slack
    // don't render SVG link previews, and most project logos are SVG.
    ogImage: `https://antonshubin.com/img/og/projects/${slug}.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };

  const statusBadges = (
    <div class="flex flex-wrap items-center gap-2 mb-6">
      {project.outcome && (
        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-lamp text-xs font-medium rounded-full">
          <StatusMark status="outcome" label={project.outcome} />
        </span>
      )}
      {isClientProject && (
        <span class="inline-flex items-center px-2.5 py-1 bg-lamp text-mist text-xs font-medium rounded-full">
          Client project
        </span>
      )}
      {project.archived && (
        <span class="inline-flex items-center px-2.5 py-1 bg-lamp text-xs font-medium rounded-full">
          <StatusMark status="archived" />
        </span>
      )}
    </div>
  );

  const actions = (
    <div class="flex flex-wrap items-center gap-3">
      {project.externalURL && (
        project.externalURLDead
          ? (
            <span class="inline-flex items-center gap-2 px-4 py-2.5 bg-lamp text-graphite rounded-lg text-sm">
              <svg
                aria-hidden="true"
                focusable="false"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              {project.externalURL.replace(/^https?:\/\//, "")} [site offline]
            </span>
          )
          : (
            <a
              href={project.externalURL}
              target="_blank"
              data-umami-event={`project-cta-${project.slug}-external`}
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-rule-strong hover:bg-lamp text-parchment rounded-lg text-sm font-medium transition-colors"
            >
              Visit project site
              <svg
                aria-hidden="true"
                focusable="false"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <NewTabHint />
            </a>
          )
      )}
      {project.ghRepo && (
        <a
          href={`https://github.com/${project.ghRepo}`}
          target="_blank"
          data-umami-event={`project-cta-${project.slug}-github`}
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-rule-strong hover:bg-lamp text-parchment rounded-lg text-sm font-medium transition-colors"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
          <GhStars repo={project.ghRepo} />
          <NewTabHint />
        </a>
      )}
    </div>
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
      <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, project.title)}
        />

        <article class="bg-paper rounded-xl border border-rule overflow-hidden">
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <header class="p-6 sm:p-8 border-b border-rule">
            {/* Logo plate */}
            <div class="h-32 sm:h-40 mb-6 flex items-center justify-center bg-ink/60 rounded-lg overflow-hidden">
              {project.logoImageURL
                ? (
                  <img
                    src={project.logoImageURL}
                    alt={`${project.title} logo`}
                    class={`max-h-full max-w-[260px] object-contain p-4${
                      project.logoPlate ? " bg-parchment rounded-lg" : ""
                    }`}
                    loading="lazy"
                  />
                )
                : project.logoText
                ? (
                  <span
                    style={project.logoTextStyle}
                    class="text-3xl sm:text-4xl font-semibold text-parchment"
                  >
                    {project.logoText}
                  </span>
                )
                : (
                  <span class="text-parchment text-2xl sm:text-3xl font-bold">
                    {project.title}
                  </span>
                )}
            </div>

            {/* Eyebrow (built for / role / period) */}
            {(project.madeForName || project.role || project.period) && (
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-wide text-graphite mb-2">
                {project.madeForName && (
                  <span>
                    Built for {project.madeForURL
                      ? (
                        <a
                          href={project.madeForURL}
                          target="_blank"
                          class="text-accent hover:text-accent hover:underline normal-case tracking-normal font-medium"
                        >
                          {project.madeForName}
                          <NewTabHint />
                        </a>
                      )
                      : (
                        <span class="text-accent normal-case tracking-normal font-medium">
                          {project.madeForName}
                        </span>
                      )}
                  </span>
                )}
                {project.role && (
                  <span>
                    Role{" "}
                    <span class="text-graphite normal-case tracking-normal font-medium">
                      {project.role}
                    </span>
                  </span>
                )}
                {project.period && (
                  <span data-project-period>
                    Period{" "}
                    <span class="text-graphite normal-case tracking-normal">
                      {formatPeriod(project.period)}
                    </span>
                  </span>
                )}
              </div>
            )}

            {
              /* Title + external indicator. When the title itself is a link
                (site is live) there is no <h1> anywhere on the page, so the
                wrapping div stands in for it via role="heading" — the link
                stays a real link, and no tag changes or elements move. */
            }
            <div
              class="flex items-start gap-2 mb-5"
              role={project.externalURL && !project.externalURLDead
                ? "heading"
                : undefined}
              aria-level={project.externalURL && !project.externalURLDead
                ? 1
                : undefined}
            >
              {project.externalURL && !project.externalURLDead
                ? (
                  <a
                    href={project.externalURL}
                    target="_blank"
                    class="inline-flex items-baseline gap-2 text-3xl sm:text-4xl font-bold text-parchment hover:text-accent transition-colors text-balance"
                  >
                    {project.title}
                    <NewTabHint />
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      class="w-5 h-5 sm:w-6 sm:h-6 shrink-0 self-center"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                )
                : (
                  <h1 class="text-3xl sm:text-4xl font-bold text-parchment text-balance">
                    {project.title}
                  </h1>
                )}
            </div>

            {/* Status badges; the outcome's source note sits beside them */}
            {project.outcomeNote
              ? <WithNote id={project.outcomeNote}>{statusBadges}</WithNote>
              : statusBadges}

            {/* Primary actions; a live link's checked date sits beside them */}
            {project.externalURLNote
              ? <WithNote id={project.externalURLNote}>{actions}</WithNote>
              : actions}
          </header>

          {/* ── About ────────────────────────────────────────────────── */}
          <section class="p-6 sm:p-8 border-b border-rule">
            <h2 class="text-xs uppercase tracking-wider text-graphite font-semibold mb-4">
              About
            </h2>
            <div class="space-y-4 text-graphite leading-relaxed text-base">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {/* ── Client reviews (#231) ────────────────────────────────── */}
          {reviews.length > 0 && (
            <section
              data-project-reviews
              class="p-6 sm:p-8 border-b border-rule"
            >
              <h2 class="text-xs uppercase tracking-wider text-graphite font-semibold mb-4">
                What the client said
              </h2>
              <div class="space-y-6">
                {reviews.map((t) => (
                  <figure key={t.id}>
                    <p class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 pl-4 text-sm text-graphite">
                      <Rating value={t.rating} />
                      <ReviewSource project={project} href={t.sourceHref} />
                    </p>
                    <blockquote class="space-y-3 text-graphite italic leading-relaxed border-l-2 border-rule-strong pl-4">
                      {t.quote.split(/\n+/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </blockquote>
                    {project.period && (
                      <p class="mt-2 pl-4 text-sm text-graphite">
                        {formatPeriod(project.period)}
                      </p>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* ── Tech tags ─────────────────────────────────────────────── */}
          {project.tags && project.tags.length > 0 && (
            <section class="p-6 sm:p-8 border-b border-rule">
              <h2 class="text-xs uppercase tracking-wider text-graphite font-semibold mb-4">
                Built with
              </h2>
              <div class="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    class="px-3 py-1 bg-lamp text-graphite rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Video ─────────────────────────────────────────────────── */}
          {project.videoURL && (
            <section class="p-6 sm:p-8 border-b border-rule">
              <h2 class="text-xs uppercase tracking-wider text-graphite font-semibold mb-4">
                Video overview
              </h2>
              <div class="aspect-video rounded-lg overflow-hidden bg-ink">
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

          {/* ── Screenshots ───────────────────────────────────────────── */}
          {project.screenshotURLs && project.screenshotURLs.length > 0 && (
            <section class="p-6 sm:p-8 border-b border-rule">
              <h2 class="text-xs uppercase tracking-wider text-graphite font-semibold mb-4">
                Screenshots ({project.screenshotURLs.length})
              </h2>
              <ImageGallery images={projectScreenshots(project)} />
            </section>
          )}

          {/* ── Footer CTA ────────────────────────────────────────────── */}
          <footer class="px-6 sm:px-8 py-6 bg-ink/50">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-stretch gap-3">
                <a
                  href="/contact-me"
                  data-umami-event={`project-cta-${project.slug}-contact`}
                  class="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors"
                >
                  Start a similar project
                </a>
                <BookCallLink
                  url={SCHEDULE_URL}
                  target="_blank"
                  data-umami-event={`project-cta-${project.slug}-schedule`}
                  class="justify-center gap-1 px-6 py-3"
                >
                  Book a free intro call
                </BookCallLink>
              </div>
              <a
                href="/how-i-work"
                data-umami-event={`project-cta-${project.slug}-how-i-work`}
                class="inline-flex items-center gap-2 text-accent hover:text-accent hover:underline transition-colors font-medium text-sm"
              >
                How I work
                <svg
                  aria-hidden="true"
                  focusable="false"
                  class="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </a>
            </div>
          </footer>
        </article>

        {/* Back link */}
        <div class="mt-6 text-center">
          <a
            href="/projects"
            class="inline-flex items-center gap-2 text-graphite hover:text-accent transition-colors text-sm font-medium"
          >
            ← All projects
          </a>
        </div>
      </div>
    </Layout>
  );
});
