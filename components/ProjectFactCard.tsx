import type { ComponentChildren } from "preact";
import { formatPeriod, type Project } from "../lib/data.ts";
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import GhStars from "../islands/GhStars.tsx";
import { BookCallLink } from "./BookCallLink.tsx";
import { ArrowRightIcon, ExternalLinkIcon } from "./Icons.tsx";
import { NewTabHint } from "./NewTabHint.tsx";
import StatusMark from "./StatusMark.tsx";
import { WithNote } from "./WithNote.tsx";

const LINK =
  "text-parchment underline underline-offset-4 decoration-rule-strong hover:decoration-accent";

/** One `<dt>`/`<dd>` pair of the fact card, wrapped in a `<div>` as `<dl>` allows. */
function Fact(
  { term, children, ...rest }: {
    term: string;
    children: ComponentChildren;
    "data-project-period"?: boolean;
  },
) {
  return (
    <div class="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3" {...rest}>
      <dt class="text-graphite">{term}</dt>
      <dd class="text-parchment min-w-0">{children}</dd>
    </div>
  );
}

/** The status a project page shows: live, offline or archived — never colour alone. */
function projectStatus(
  project: Project,
): "live" | "offline" | "archived" | null {
  if (project.archived) return "archived";
  if (project.externalURL && project.externalURLDead) return "offline";
  if (project.externalURL) return "live";
  return null;
}

/**
 * "Similar work today" link to the project's `catalogSlug` item, with its
 * title and price from `lib/catalog.ts`. Used in the fact card and again in
 * the closing band; `place` names the Umami event.
 */
export function SimilarWorkLink(
  { project, place, class: className = "" }: {
    project: Project;
    place: "card" | "bottom";
    class?: string;
  },
) {
  if (!project.catalogSlug) return null;
  const item = catalogItem(project.catalogSlug);
  return (
    <a
      href={catalogPath(item.slug)}
      data-catalog-link={item.slug}
      data-umami-event={`project-cta-${project.slug}-catalog-${place}`}
      class={`inline-block text-sm ${LINK} ${className}`}
    >
      Similar work today: {item.shortTitle} ·{" "}
      <span class="price">{priceLabel(item)}</span>
      <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1 align-[-2px]" />
    </a>
  );
}

/**
 * The project page's fact card (#246): who it was for, the role, the period,
 * the status as shape plus word, the stack, the live link and GitHub, then
 * the Book action and the matching catalog item. It sits beside the story
 * from 1024px and stays in view while the page scrolls.
 */
export function ProjectFactCard({ project }: { project: Project }) {
  const status = projectStatus(project);
  const live = project.externalURL && !project.externalURLDead
    ? project.externalURL
    : undefined;
  const liveLink = live && (
    <a
      href={live}
      target="_blank"
      data-umami-event={`project-cta-${project.slug}-external`}
      class={`${LINK} break-words`}
    >
      {project.externalURLLabel ?? live.replace(/^https?:\/\//, "")}
      <ExternalLinkIcon class="inline w-3.5 h-3.5 ml-1 align-[-2px]" />
      <NewTabHint />
    </a>
  );

  return (
    <aside
      data-project-facts
      aria-label="Project facts"
      class="bg-paper border border-rule rounded-xl p-5"
    >
      <dl class="space-y-2 text-sm">
        {project.madeForName && (
          <Fact term="Client">
            {project.madeForURL
              ? (
                <a href={project.madeForURL} target="_blank" class={LINK}>
                  {project.madeForName}
                  <ExternalLinkIcon class="inline w-3.5 h-3.5 ml-1 align-[-2px]" />
                  <NewTabHint />
                </a>
              )
              : project.madeForName}
          </Fact>
        )}
        {project.role && <Fact term="Role">{project.role}</Fact>}
        {project.period && (
          <Fact term="Period" data-project-period>
            {formatPeriod(project.period)}
          </Fact>
        )}
        {status && (
          <Fact term="Status">
            <StatusMark status={status} />
          </Fact>
        )}
        {project.tags && project.tags.length > 0 && (
          <Fact term="Stack">
            <span class="text-graphite">{project.tags.join(" · ")}</span>
          </Fact>
        )}
        {liveLink && (
          <Fact term="Link">
            {project.externalURLNote
              ? (
                <WithNote id={project.externalURLNote} class="note-stack">
                  {liveLink}
                </WithNote>
              )
              : liveLink}
          </Fact>
        )}
        {project.ghRepo && (
          <Fact term="Code">
            <a
              href={`https://github.com/${project.ghRepo}`}
              target="_blank"
              data-umami-event={`project-cta-${project.slug}-github`}
              class={`${LINK} inline-flex items-center gap-2`}
            >
              GitHub
              <GhStars repo={project.ghRepo} />
              <NewTabHint />
            </a>
          </Fact>
        )}
      </dl>
      <div class="mt-5 space-y-3">
        <BookCallLink
          url={SCHEDULE_URL}
          target="_blank"
          data-umami-event={`project-cta-${project.slug}-schedule-card`}
          class="w-full justify-center px-5 py-3"
        >
          Book a free intro call
        </BookCallLink>
        <SimilarWorkLink project={project} place="card" />
      </div>
    </aside>
  );
}
