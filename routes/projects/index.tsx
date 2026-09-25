import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import {
  archiveProjects,
  formatPeriod,
  highlightProjects,
  type Project,
  projects,
} from "../../lib/data.ts";
import { firstSentence } from "../../lib/llms.ts";
import {
  projectTestimonials,
  repeatClientsLine,
} from "../../lib/testimonials.ts";
import { NewTabHint } from "../../components/NewTabHint.tsx";
import {
  ArchiveIcon,
  BriefcaseIcon,
  WrenchIcon,
} from "../../components/Icons.tsx";
import StatusMark from "../../components/StatusMark.tsx";
import GhStars from "../../islands/GhStars.tsx";

/**
 * Truncate a description to a meaningful, scannable preview on the listing page.
 * Strategy: take the first paragraph (semantic boundary) and hard-cap at 220
 * chars at a word boundary. Avoids "very long" cards while preserving the hook.
 */
function truncateDescription(text: string, maxLen = 220): string {
  const firstPara = text.split(/\n\n/)[0].trim().replace(/\s+/g, " ");
  if (firstPara.length <= maxLen) return firstPara;
  const cut = firstPara.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + "…";
}

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
  const opensInNewTab = !!(project.externalURL && !project.slug);
  const hasLogo = !!project.logoImageURL;
  const hasLogoText = !hasLogo && !!project.logoText;
  const preview = truncateDescription(project.description);

  return (
    <Wrapper
      href={href}
      data-highlight={client ? project.slug : undefined}
      target={opensInNewTab ? "_blank" : undefined}
      class={`block p-5 bg-paper rounded-xl border-2 border-rule transition-all group flex flex-col h-full ${
        project.archived
          ? "opacity-75 hover:opacity-100 hover:border-rule-strong"
          : "hover:border-accent"
      }`}
    >
      {/* Top: logo (or logoText fallback) — same column as title */}
      {(hasLogo || hasLogoText) && (
        <div class="h-14 mb-4 flex items-center">
          {hasLogo
            ? (
              <img
                src={project.logoImageURL}
                alt={`${project.title} logo`}
                style={project.logoImageStyle}
                class="max-h-full max-w-[160px] object-contain"
                loading="lazy"
              />
            )
            : (
              <span
                style={project.logoTextStyle}
                class="text-xl font-semibold text-parchment"
              >
                {project.logoText}
              </span>
            )}
        </div>
      )}

      {/* "Built for" line — client projects only */}
      {client && project.madeForName && (
        <p class="text-xs uppercase tracking-wide text-graphite mb-1.5">
          Built for{" "}
          <span class="text-accent font-semibold normal-case tracking-normal">
            {project.madeForName}
          </span>
          {project.period && (
            <span data-project-period class="normal-case tracking-normal">
              {` · ${formatPeriod(project.period)}`}
            </span>
          )}
        </p>
      )}

      {/* Title */}
      <h3 class="text-xl font-semibold text-parchment group-hover:text-accent transition-colors mb-2">
        {project.title}
      </h3>

      {/* Truncated description */}
      <p class="text-graphite text-sm leading-relaxed mb-4 line-clamp-4">
        {preview}
      </p>

      {/* Bottom row: outcome + stars */}
      <div class="mt-auto flex flex-wrap items-center gap-2 mb-3">
        {project.archived && (
          <div class="inline-flex items-center gap-1 px-2 py-1 bg-lamp rounded text-xs">
            <StatusMark status="archived" />
          </div>
        )}
        {project.outcome && (
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-lamp text-xs font-semibold rounded-full">
            <StatusMark status="outcome" label={project.outcome} />
          </div>
        )}
        {project.ghRepo && <GhStars repo={project.ghRepo} />}
      </div>

      <span class="inline-flex items-center gap-1 text-sm text-accent group-hover:text-accent transition-colors font-semibold">
        View details
        <svg
          aria-hidden="true"
          focusable="false"
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
      {opensInNewTab && <NewTabHint />}
    </Wrapper>
  );
}

/**
 * One ruled archive row: period · name · role, one line on what it was, the
 * first contract's review excerpt if the project has one, the company's own
 * later outcome if recorded, and a link to the project page.
 */
function ArchiveRow({ project }: { project: Project }) {
  const review = projectTestimonials(project.slug ?? "")[0];
  return (
    <li
      data-archive-row={project.slug}
      class="py-5 border-t border-rule first:border-t-0"
    >
      <p class="text-xs uppercase tracking-wide text-graphite mb-1">
        {project.period && (
          <span data-project-period class="price">
            {formatPeriod(project.period)}
          </span>
        )}
        {project.role && (
          <span class="normal-case tracking-normal">
            {` · ${project.role}`}
          </span>
        )}
      </p>
      <h3 class="text-lg font-semibold text-parchment">{project.title}</h3>
      <p class="text-graphite text-sm leading-relaxed mt-1">
        {firstSentence(project.description)}
      </p>
      {review && (
        <blockquote class="mt-3 pl-3 border-l-2 border-rule-strong text-sm text-parchment italic">
          “{review.excerpt}”
        </blockquote>
      )}
      {project.companyOutcome && (
        <p data-company-outcome class="mt-3 text-sm text-graphite">
          The company:{" "}
          <a
            href={project.companyOutcome.href}
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent hover:text-accent underline underline-offset-4"
          >
            {project.companyOutcome.text}
            <NewTabHint />
          </a>
          .
        </p>
      )}
      <a
        href={`/projects/${project.slug}`}
        class="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:text-accent font-semibold"
      >
        View details<span class="sr-only">: {project.title}</span>
      </a>
    </li>
  );
}

export default define.page(function Projects(ctx) {
  const activeProjects = projects.my.filter((p) => !p.archived);
  head.value = {
    ...head.value,
    title: "Projects — Anton Shubin",
    description:
      "Client work, open-source products, and production infrastructure proof by Anton Shubin.",
    canonical: "https://antonshubin.com/projects",
    ogType: "website",
  };
  // highlightProjects() throws on a typo, so a bad slug fails loudly.
  const clientProjects = highlightProjects();
  const archive = archiveProjects();
  // Retired tools of my own: never client work, so never in the archive.
  const archivedTools = projects.my.filter((p) => p.archived);
  const hasAny = activeProjects.length > 0 || archive.length > 0 ||
    clientProjects.length > 0;

  if (!hasAny) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <SEOHead />
          <Breadcrumb
            items={getBreadcrumb(head.value.canonical, head.value.title)}
          />
          <h1 class="text-3xl font-bold text-parchment mb-4">Projects</h1>
          <p class="text-graphite">No projects to display yet.</p>
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
        <h1 class="text-3xl sm:text-4xl font-bold text-parchment mb-2">
          Projects
        </h1>
        <p class="text-graphite mb-10 sm:mb-12 text-base sm:text-lg">
          Client work first, then my open-source tools. How I run things in
          production is on the{" "}
          <a
            href="/infrastructure"
            class="text-accent hover:text-accent underline underline-offset-4"
          >
            infrastructure page
          </a>
          .
        </p>

        <p data-repeat-clients class="text-parchment mb-10">
          {repeatClientsLine()}
        </p>

        {clientProjects.length > 0 && (
          <section data-projects-section="highlights">
            <h2 class="text-xl font-semibold text-parchment mb-6 flex items-center gap-2">
              <BriefcaseIcon class="w-5 h-5 text-accent" /> Highlights
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
          </section>
        )}

        {archive.length > 0 && (
          <section data-projects-section="archive" class="mb-16">
            <h2 class="text-xl font-semibold text-parchment mb-2 flex items-center gap-2">
              <ArchiveIcon class="w-5 h-5 text-graphite" /> Archive
            </h2>
            <ul class="border-y border-rule">
              {archive.map((project) => (
                <ArchiveRow key={project.slug} project={project} />
              ))}
            </ul>
          </section>
        )}

        {activeProjects.length > 0 && (
          <>
            <h2 class="text-xl font-semibold text-parchment mb-6 flex items-center gap-2">
              <WrenchIcon class="w-5 h-5 text-accent" /> Open-source tools
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

        {archivedTools.length > 0 && (
          <p data-archived-tools class="text-graphite leading-relaxed mb-10">
            Archived tools: {archivedTools.map((project, i) => {
              const href = project.slug
                ? `/projects/${project.slug}`
                : project.externalURL;
              return (
                <span key={project.title}>
                  {i > 0 && " · "}
                  <a
                    href={href}
                    target={project.slug ? undefined : "_blank"}
                    rel={project.slug ? undefined : "noopener noreferrer"}
                    class="text-accent hover:text-accent underline underline-offset-4"
                  >
                    {project.title}
                    {!project.slug && <NewTabHint />}
                  </a>
                </span>
              );
            })}
          </p>
        )}
      </div>
    </Layout>
  );
});
