import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { type Project, projects } from "../../lib/data.ts";
import { ArchiveIcon } from "../../components/Icons.tsx";

function ProjectCard({
  project,
  client,
}: {
  project: Project;
  client?: boolean;
}) {
  const Wrapper = project.slug || project.externalURL ? "a" : "div";
  const href = project.slug
    ? `/projects/${project.slug}`
    : project.externalURL || undefined;
  const hasLogo = !!project.logoImageURL;

  return (
    <Wrapper
      href={href}
      target={project.externalURL && !project.slug ? "_blank" : undefined}
      class={`block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 transition-all group flex flex-col h-full ${
        project.archived
          ? "opacity-75 hover:opacity-100 hover:border-gray-500"
          : "hover:border-orange-500"
      }`}
    >
      {project.archived && (
        <div class="flex items-center gap-1 px-2 py-1 bg-gray-600 rounded text-xs text-gray-300 w-fit mb-3">
          <ArchiveIcon class="w-3 h-3" />
          Archived
        </div>
      )}

      <div class="flex gap-6">
        {/* Text column */}
        <div class={hasLogo ? "w-[60%]" : "w-full"}>
          {client && project.madeForName && (
            <p class="text-xs text-gray-500 mb-2">
              Built for{" "}
              <span class="text-orange-400">{project.madeForName}</span>
            </p>
          )}

          <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
            {project.title}
          </h3>

          <p class="text-gray-400 text-sm leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Logo column — only when logo image exists */}
        {hasLogo && (
          <div class="w-[40%] flex-shrink-0 flex items-center justify-center">
            <img
              src={project.logoImageURL}
              alt={`${project.title} preview`}
              style={project.logoImageStyle}
              class="w-full max-h-[100px] object-contain"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Bottom section: outcome + stars + view details */}
      <div class="mt-4 mb-4 flex flex-wrap items-center gap-2">
        {project.outcome && (
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-600/15 text-green-400 text-xs font-medium rounded-full">
            <svg
              class="w-3.5 h-3.5 shrink-0"
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
          </div>
        )}
        {project.ghRepo && (
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </span>
        )}
      </div>

      <span class="mt-auto inline-flex items-center gap-1 text-sm text-orange-400 group-hover:text-orange-300 transition-colors font-medium">
        View details
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
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </span>
    </Wrapper>
  );
}

export default define.page(function Projects(ctx) {
  const activeProjects = projects.my.filter((p) => !p.archived);
  head.value = {
    ...head.value,
    title: "Projects — Anton Shubin",
    description:
      "Open-source projects, client work, and infrastructure portfolio by Anton Shubin.",
    canonical: "https://antonshubin.com/projects/",
    ogType: "website",
  };
  const archivedProjects = projects.my.filter((p) => p.archived);
  const clientProjects = projects.freelance;
  const hasAny = activeProjects.length > 0 || archivedProjects.length > 0 ||
    clientProjects.length > 0;

  if (!hasAny) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <SEOHead />
          <Breadcrumb
            items={getBreadcrumb(head.value.canonical, head.value.title)}
          />
          <h1 class="text-3xl font-bold text-white mb-4">Projects</h1>
          <p class="text-gray-400">No projects to display yet.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">
          Projects
        </h1>
        <p class="text-gray-400 mb-10 sm:mb-12 text-base sm:text-lg">
          Client work and open-source projects I have built.
        </p>

        {clientProjects.length > 0 && (
          <>
            <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span class="text-orange-400">💼</span> Client Work
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-16">
              {clientProjects.map((project) => (
                <ProjectCard
                  key={project.title}
                  project={project}
                  client
                />
              ))}
            </div>
          </>
        )}

        {activeProjects.length > 0 && (
          <>
            <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span class="text-orange-400">🔧</span> Personal Projects
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-16">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.title}
                  project={project}
                />
              ))}
            </div>
          </>
        )}

        {archivedProjects.length > 0 && (
          <>
            <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ArchiveIcon class="w-5 h-5 text-gray-400" />
              <span>Archived Projects</span>
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-10">
              {archivedProjects.map((project) => (
                <ProjectCard
                  key={project.title}
                  project={project}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
});
