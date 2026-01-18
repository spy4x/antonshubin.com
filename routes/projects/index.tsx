import { define } from "../../utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { projects, type Project } from "../../lib/data.ts";
import { ArchiveIcon } from "../../components/Icons.tsx";

function ProjectCard({ project }: { project: Project }) {
  const Wrapper = project.slug || project.externalURL ? "a" : "div";
  const href = project.slug
    ? `/projects/${project.slug}`
    : project.externalURL || undefined;

  return (
    <Wrapper
      href={href}
      target={project.externalURL && !project.slug ? "_blank" : undefined}
      class={`block relative current-work transition-colors ${
        project.archived
          ? "opacity-75 hover:opacity-100 hover:border-gray-500"
          : "hover:border-orange-500"
      }`}
    >
      {project.archived && (
        <div class="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
          <ArchiveIcon class="w-3 h-3" />
          Archived
        </div>
      )}
      <div class="h-32 flex items-center justify-center mb-4 bg-gray-700 rounded-lg overflow-hidden">
        {project.logoImageURL ? (
          <img
            src={project.logoImageURL}
            alt={`${project.title} preview`}
            class="max-h-full max-w-full object-contain p-4"
            style={project.logoImageStyle}
            loading="lazy"
          />
        ) : project.logoText ? (
          <span style={project.logoTextStyle}>{project.logoText}</span>
        ) : (
          <span class="text-white text-xl font-bold">{project.title}</span>
        )}
      </div>
      <h3 class="h2 mb-2">{project.title}</h3>
      <p class="text-gray-300 text-sm">{project.description}</p>
      {project.tags && project.tags.length > 0 && (
        <div class="flex flex-wrap gap-1 mt-3">
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
      {project.madeForName && (
        <p class="mt-3 text-sm text-gray-400">
          made for <span class="text-orange-500">{project.madeForName}</span>
        </p>
      )}
    </Wrapper>
  );
}

export default define.page(function Projects(ctx) {
  // Separate active and archived projects
  const activeProjects = projects.my.filter((p) => !p.archived);
  const archivedProjects = projects.my.filter((p) => p.archived);

  return (
    <Layout currentPath={ctx.url.pathname}>
      <div class="max-w-4xl mx-auto">
        <h1 class="h1 mb-8">Personal Projects</h1>
        <div class="grid gap-6 md:grid-cols-2 mb-12">
          {activeProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>

        {archivedProjects.length > 0 && (
          <>
            <h2 class="text-xl text-gray-400 mb-6 flex items-center gap-2">
              <ArchiveIcon class="w-5 h-5" />
              Archived Projects
            </h2>
            <div class="grid gap-6 md:grid-cols-2 mb-16">
              {archivedProjects.map((project) => (
                <ProjectCard key={project.title} project={project} />
              ))}
            </div>
          </>
        )}

        <h2 class="h1 mb-8" id="freelance">
          Client Projects
        </h2>
        <div class="grid gap-6 md:grid-cols-2">
          {projects.freelance.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>
    </Layout>
  );
});
