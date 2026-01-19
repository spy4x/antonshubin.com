import { define } from "../../utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { type Project, projects } from "../../lib/data.ts";
import ImageGallery from "../../islands/ImageGallery.tsx";
import { CTASection } from "../../components/CTASection.tsx";

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
        <div class="max-w-4xl mx-auto">
          <h1 class="h1 mb-4">Project not found</h1>
          <p class="text-gray-300 mb-8">
            The project you're looking for doesn't exist.
          </p>
          <a href="/projects" class="btn">
            Back to projects
          </a>
        </div>
      </Layout>
    );
  }

  const isFreelance = projects.freelance.some((p) => p.slug === slug);

  return (
    <Layout currentPath="/projects">
      <div class="max-w-4xl mx-auto">
        {/* Header */}
        <div class="mb-8">
          <a
            href="/projects"
            class="text-gray-400 hover:text-white mb-4 inline-flex items-center gap-2"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to projects
          </a>
        </div>

        {/* Logo/Title Section */}
        <div class="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div class="w-full md:w-48 h-32 flex items-center justify-center bg-gray-700 rounded-lg overflow-hidden shrink-0">
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
              ? <span style={project.logoTextStyle}>{project.logoText}</span>
              : (
                <span class="text-white text-xl font-bold">
                  {project.title}
                </span>
              )}
          </div>
          <div class="flex-1">
            <h1 class="h1 mb-2">{project.title}</h1>
            {project.role && (
              <p class="text-orange-500 font-medium mb-2">
                Role: {project.role}
              </p>
            )}
            <p class="text-gray-300 text-lg">{project.description}</p>
            {project.madeForName && (
              <p class="mt-4 text-gray-400">
                Made for {project.madeForURL
                  ? (
                    <a
                      href={project.madeForURL}
                      target="_blank"
                      class="text-orange-500 hover:underline"
                    >
                      {project.madeForName}
                    </a>
                  )
                  : <span class="text-orange-500">{project.madeForName}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div class="mb-8">
            <h2 class="text-lg font-medium text-white mb-3">Technologies</h2>
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

        {/* External Link */}
        {project.externalURL && (
          <div class="mb-8">
            {project.externalURLDead
              ? (
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-md text-sm">
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
                  [link is dead]
                </span>
              )
              : (
                <a
                  href={project.externalURL}
                  target="_blank"
                  class="btn inline-flex items-center gap-2"
                >
                  Visit {project.externalURL.replace(/^https?:\/\//, "")}
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

        {/* Video */}
        {project.videoURL && (
          <div class="mb-8">
            <h2 class="text-lg font-medium text-white mb-3">Video</h2>
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
          <div class="mb-8">
            <h2 class="text-lg font-medium text-white mb-3">Screenshots</h2>
            <ImageGallery
              images={project.screenshotURLs.map((screenshot, index) => ({
                src: `/img/projects/${project.slug}/${screenshot}`,
                alt: `${project.title} screenshot ${index + 1}`,
              }))}
            />
          </div>
        )}

        {/* CTA Section */}
        <CTASection />
      </div>
    </Layout>
  );
});
