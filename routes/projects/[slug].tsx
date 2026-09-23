import { page } from "fresh";
import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { type Project, projects, projectScreenshots } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import ImageGallery from "../../islands/ImageGallery.tsx";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import GhStars from "../../islands/GhStars.tsx";
import { BookCallLink } from "../../components/BookCallLink.tsx";

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
          <h1 class="text-3xl font-bold text-white mb-4">Not Found</h1>
          <p class="text-gray-400 mb-6">
            The project you're looking for does not exist.
          </p>
          <a
            href="/projects"
            class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
          >
            ← Back to projects
          </a>
        </div>
      </Layout>
    );
  }

  const isClientProject = projects.freelance.some((p) => p.slug === slug);
  const paragraphs = splitParagraphs(project.description);

  head.value = {
    ...head.value,
    title: `${project.title} — Anton Shubin`,
    description: project.description,
    canonical: `https://antonshubin.com/projects/${slug}`,
    ogType: "article",
    ogImage: project.logoImageURL
      ? `https://antonshubin.com${project.logoImageURL}`
      : head.value.ogImage,
  };

  return (
    <Layout currentPath="/projects">
      <SEOHead />
      <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, head.value.title)}
        />

        <article class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* ── Hero ──────────────────────────────────────────────────── */}
          <header class="p-6 sm:p-8 border-b border-gray-700">
            {/* Logo plate */}
            <div class="h-32 sm:h-40 mb-6 flex items-center justify-center bg-gray-900/60 rounded-lg overflow-hidden">
              {project.logoImageURL
                ? (
                  <img
                    src={project.logoImageURL}
                    alt={`${project.title} logo`}
                    class="max-h-full max-w-[260px] object-contain p-4"
                    style={project.logoImageStyle}
                    loading="lazy"
                  />
                )
                : project.logoText
                ? (
                  <span
                    style={project.logoTextStyle}
                    class="text-3xl sm:text-4xl font-semibold text-white"
                  >
                    {project.logoText}
                  </span>
                )
                : (
                  <span class="text-white text-2xl sm:text-3xl font-bold">
                    {project.title}
                  </span>
                )}
            </div>

            {/* Eyebrow (built for / role) */}
            {(project.madeForName || project.role) && (
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-wide text-gray-500 mb-2">
                {project.madeForName && (
                  <span>
                    Built for {project.madeForURL
                      ? (
                        <a
                          href={project.madeForURL}
                          target="_blank"
                          class="text-orange-400 hover:text-orange-300 normal-case tracking-normal font-medium"
                        >
                          {project.madeForName}
                        </a>
                      )
                      : (
                        <span class="text-orange-400 normal-case tracking-normal font-medium">
                          {project.madeForName}
                        </span>
                      )}
                  </span>
                )}
                {project.role && (
                  <span>
                    Role{" "}
                    <span class="text-gray-300 normal-case tracking-normal font-medium">
                      {project.role}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Title + external indicator */}
            <div class="flex items-start gap-2 mb-5">
              {project.externalURL && !project.externalURLDead
                ? (
                  <a
                    href={project.externalURL}
                    target="_blank"
                    class="inline-flex items-baseline gap-2 text-3xl sm:text-4xl font-bold text-white hover:text-orange-400 transition-colors text-balance"
                  >
                    {project.title}
                    <svg
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
                  <h1 class="text-3xl sm:text-4xl font-bold text-white text-balance">
                    {project.title}
                  </h1>
                )}
            </div>

            {/* Status badges */}
            <div class="flex flex-wrap items-center gap-2 mb-6">
              {project.outcome && (
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-600/15 text-green-400 text-xs font-medium rounded-full">
                  <svg
                    class="w-3.5 h-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {project.outcome}
                </span>
              )}
              {isClientProject && (
                <span class="inline-flex items-center px-2.5 py-1 bg-blue-600/15 text-blue-400 text-xs font-medium rounded-full">
                  Client project
                </span>
              )}
              {project.archived && (
                <span class="inline-flex items-center px-2.5 py-1 bg-gray-600 text-gray-300 text-xs font-medium rounded-full">
                  Archived
                </span>
              )}
            </div>

            {/* Primary actions */}
            <div class="flex flex-wrap items-center gap-3">
              {project.externalURL && (
                project.externalURLDead
                  ? (
                    <span class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-gray-400 rounded-lg text-sm">
                      <svg
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
                      {project.externalURL.replace(/^https?:\/\//, "")}{" "}
                      [site offline]
                    </span>
                  )
                  : (
                    <a
                      href={project.externalURL}
                      target="_blank"
                      data-umami-event={`project-cta-${project.slug}-external`}
                      class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Visit project site
                      <svg
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
                    </a>
                  )
              )}
              {project.ghRepo && (
                <a
                  href={`https://github.com/${project.ghRepo}`}
                  target="_blank"
                  data-umami-event={`project-cta-${project.slug}-github`}
                  class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                  <GhStars repo={project.ghRepo} />
                </a>
              )}
            </div>
          </header>

          {/* ── About ────────────────────────────────────────────────── */}
          <section class="p-6 sm:p-8 border-b border-gray-700">
            <h2 class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
              About
            </h2>
            <div class="space-y-4 text-gray-300 leading-relaxed text-base">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {/* ── Tech tags ─────────────────────────────────────────────── */}
          {project.tags && project.tags.length > 0 && (
            <section class="p-6 sm:p-8 border-b border-gray-700">
              <h2 class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
                Built with
              </h2>
              <div class="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    class="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Video ─────────────────────────────────────────────────── */}
          {project.videoURL && (
            <section class="p-6 sm:p-8 border-b border-gray-700">
              <h2 class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
                Video overview
              </h2>
              <div class="aspect-video rounded-lg overflow-hidden bg-gray-900">
                <iframe
                  src={project.videoURL}
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
            <section class="p-6 sm:p-8 border-b border-gray-700">
              <h2 class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
                Screenshots ({project.screenshotURLs.length})
              </h2>
              <ImageGallery images={projectScreenshots(project)} />
            </section>
          )}

          {/* ── Footer CTA ────────────────────────────────────────────── */}
          <footer class="px-6 sm:px-8 py-6 bg-gray-900/50">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-stretch gap-3">
                <a
                  href="/contact-me"
                  data-umami-event={`project-cta-${project.slug}-contact`}
                  class="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  Start a similar project
                </a>
                <BookCallLink
                  url={SCHEDULE_URL}
                  target="_blank"
                  data-umami-event={`project-cta-${project.slug}-schedule`}
                  class="inline-flex items-center justify-center gap-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow transition-colors"
                >
                  Book a free intro call
                </BookCallLink>
              </div>
              <a
                href="/how-i-work"
                data-umami-event={`project-cta-${project.slug}-how-i-work`}
                class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm"
              >
                How I work
                <svg
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
            class="inline-flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors text-sm font-medium"
          >
            ← All projects
          </a>
        </div>
      </div>
    </Layout>
  );
});
