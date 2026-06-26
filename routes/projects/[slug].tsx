import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { type Project, projects } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import ImageGallery from "../../islands/ImageGallery.tsx";

function getAllProjects(): Project[] {
  return [...projects.my, ...projects.freelance];
}

function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

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

  return (
    <Layout currentPath="/projects">
      <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <a
          href="/projects"
          class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm mb-8"
        >
          ← Back to projects
        </a>

        <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Header with logo */}
          <div class="p-6 pb-4">
            <div class="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
              {/* Logo */}
              <div class="w-full sm:w-40 h-28 flex items-center justify-center bg-gray-700 rounded-lg overflow-hidden shrink-0">
                {project.logoImageURL
                  ? (
                    <img
                      src={project.logoImageURL}
                      alt={`${project.title} logo`}
                      class="max-h-full max-w-full object-contain p-4"
                      style={project.logoImageStyle}
                      loading="lazy"
                    />
                  )
                  : project.logoText
                  ? (
                    <span style={project.logoTextStyle} class="text-2xl">
                      {project.logoText}
                    </span>
                  )
                  : (
                    <span class="text-white text-xl font-bold">
                      {project.title}
                    </span>
                  )}
              </div>

              <div class="flex-1 min-w-0">
                {/* Badge */}
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  {project.outcome && (
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-600/15 text-green-400 text-xs font-medium rounded-full">
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

                {project.externalURL && !project.externalURLDead
                  ? (
                    <a
                      href={project.externalURL}
                      target="_blank"
                      class="inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold text-white hover:text-orange-400 transition-colors mb-2"
                    >
                      {project.title}
                      <svg
                        class="w-5 h-5 shrink-0"
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
                    <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {project.title}
                    </h1>
                  )}
                {project.role && (
                  <p class="text-orange-400 text-sm font-medium mb-2">
                    Role: {project.role}
                  </p>
                )}
                <p class="text-gray-300 leading-relaxed">
                  {project.description}
                </p>

                {project.madeForName && (
                  <p class="mt-4 text-gray-400 text-sm">
                    Built for {project.madeForURL
                      ? (
                        <a
                          href={project.madeForURL}
                          target="_blank"
                          class="text-orange-400 hover:text-orange-300 underline"
                        >
                          {project.madeForName}
                        </a>
                      )
                      : (
                        <span class="text-orange-400">
                          {project.madeForName}
                        </span>
                      )}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div class="h-px bg-gray-700 mb-6" />

            {/* Tech tags */}
            {project.tags && project.tags.length > 0 && (
              <div class="mb-6">
                <h2 class="text-sm font-medium text-white mb-3">
                  Technologies Used
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
              </div>
            )}

            {/* External link */}
            {project.externalURL && (
              <div class="mb-6">
                {project.externalURLDead
                  ? (
                    <span class="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm">
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
                      class="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
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
                  )}
              </div>
            )}
          </div>

          {/* Video */}
          {project.videoURL && (
            <div class="px-8 pb-6">
              <h2 class="text-sm font-medium text-white mb-3">
                Video Overview
              </h2>
              <div class="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={project.videoURL}
                  class="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Screenshots */}
          {project.screenshotURLs && project.screenshotURLs.length > 0 && (
            <div class="px-8 pb-6">
              <h2 class="text-sm font-medium text-white mb-3">
                Screenshots
              </h2>
              <ImageGallery
                images={project.screenshotURLs.map((screenshot, index) => ({
                  src: `/img/projects/${project.slug}/${screenshot}`,
                  alt: `${project.title} screenshot ${index + 1}`,
                }))}
              />
            </div>
          )}

          {/* CTA footer */}
          <div class="px-8 py-6 bg-gray-900/50 border-t border-gray-700">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-stretch gap-4">
                <a
                  href="/contact-me"
                  class="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  Start a similar project
                </a>
                <a
                  href={SCHEDULE_URL}
                  target="_blank"
                  class="inline-flex items-center justify-center gap-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow transition-colors"
                >
                  Book a free intro call
                </a>
              </div>
              <a
                href="/how-i-work"
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
          </div>
        </div>
      </div>
    </Layout>
  );
});
