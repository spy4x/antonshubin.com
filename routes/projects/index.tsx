import { define } from "../../lib/utils.ts";
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

  return (
    <Wrapper
      href={href}
      target={project.externalURL && !project.slug ? "_blank" : undefined}
      class={`block p-6 bg-gray-800 rounded-xl border-2 border-gray-700 transition-all group ${
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

      {client && project.madeForName && (
        <p class="text-xs text-gray-500 mb-2">
          Built for <span class="text-orange-400">{project.madeForName}</span>
        </p>
      )}

      <div class="flex items-center gap-3 mb-3">
        {project.logoImageURL
          ? (
            <img
              src={project.logoImageURL}
              alt={`${project.title} preview`}
              class="w-10 h-10 rounded object-contain"
              loading="lazy"
            />
          )
          : project.logoText
          ? (
            <span style={project.logoTextStyle} class="text-2xl">
              {project.logoText}
            </span>
          )
          : <span class="text-2xl">{project.title.charAt(0)}</span>}
        <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
          {project.title}
        </h3>
      </div>

      <p class="text-gray-400 text-sm leading-relaxed mb-4">
        {project.description}
      </p>

      {project.tags && project.tags.length > 0 && (
        <div class="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              class="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <span class="inline-flex items-center gap-1 text-sm text-orange-400 group-hover:text-orange-300 transition-colors font-medium">
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
  const archivedProjects = projects.my.filter((p) => p.archived);
  const clientProjects = projects.freelance;
  const hasAny = activeProjects.length > 0 || archivedProjects.length > 0 ||
    clientProjects.length > 0;

  if (!hasAny) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 class="text-3xl font-bold text-white mb-4">Projects</h1>
          <p class="text-gray-400">No projects to display yet.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPath={ctx.url.pathname}>
      <div class="max-w-4xl mx-auto px-4 py-12">
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
