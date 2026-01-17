import { define } from "../../utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { projects, type Project } from "../../lib/data.ts";

function ProjectCard({ project }: { project: Project }) {
  const Wrapper = project.slug || project.externalURL ? "a" : "div";
  const href = project.slug
    ? `/projects/${project.slug}`
    : project.externalURL || undefined;

  return (
    <Wrapper
      href={href}
      target={project.externalURL ? "_blank" : undefined}
      class="block current-work hover:border-orange-500 transition-colors"
    >
      <div class="h-32 flex items-center justify-center mb-4 bg-gray-700 rounded-lg overflow-hidden">
        {project.logoImageURL ? (
          <img
            src={project.logoImageURL}
            alt={`${project.title} preview`}
            class="max-h-full max-w-full object-contain p-4"
            style={project.logoImageStyle}
          />
        ) : project.logoText ? (
          <span style={project.logoTextStyle}>{project.logoText}</span>
        ) : (
          <span class="text-white text-xl font-bold">{project.title}</span>
        )}
      </div>
      <h3 class="h2 mb-2">{project.title}</h3>
      <p class="text-gray-300 text-sm">{project.description}</p>
      {project.madeForName && (
        <p class="mt-2 text-sm text-gray-400">
          made for <span class="text-orange-500">{project.madeForName}</span>
        </p>
      )}
    </Wrapper>
  );
}

export default define.page(function Projects(ctx) {
  return (
    <Layout currentPath={ctx.url.pathname}>
      <h1 class="h1 mb-8">Personal projects</h1>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
        {projects.my.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>

      <h2 class="h1 mb-8" id="freelance">
        Projects I made for my clients
      </h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.freelance.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </Layout>
  );
});
