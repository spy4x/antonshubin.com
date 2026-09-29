import { formatPeriod, type Project } from "../lib/data.ts";
import { projectLead } from "../lib/llms.ts";
import { workHref } from "../lib/work.ts";

/** A "More work" card: title, lead line and period, linking the project's page. */
export function MoreWorkCard({ project }: { project: Project }) {
  return (
    <li>
      <a
        href={workHref(project.slug ?? "")}
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
