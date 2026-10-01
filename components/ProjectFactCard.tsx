import { formatPeriod, type Project } from "../lib/data.ts";
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { projectStatus } from "../lib/work.ts";
import GhStars from "../islands/GhStars.tsx";
import { BookCallLink } from "./BookCallLink.tsx";
import { ArrowRightIcon, ExternalLinkIcon } from "./Icons.tsx";
import { Fact, FACT_LINK, FactCard } from "./FactCard.tsx";
import { NewTabHint } from "./NewTabHint.tsx";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { WithNote } from "./WithNote.tsx";
import { eventAttrs } from "../lib/analytics.ts";
import { BOOK_LABEL } from "../lib/nav.ts";

const LINK = FACT_LINK;

/**
 * "Similar work today" link to the project's `catalogSlug` item, with its
 * title and price from `lib/catalog.ts`. Used in the fact card and again in
 * the closing band; `place` becomes the Umami event's `place` (`card` or `band`).
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
      {...eventAttrs("cta", {
        place: place === "bottom" ? "band" : "card",
        target: catalogPath(item.slug),
      })}
      class={`inline-block text-sm ${LINK} ${className}`}
    >
      Similar work today: {item.shortTitle} ·{" "}
      <span class="price">{priceLabel(item)}</span>
      <ArrowRightIcon class="inline w-3.5 h-3.5 ml-1" />
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
      {...eventAttrs("outbound", { to: "live", item: project.slug })}
      class={`${LINK} break-words`}
    >
      {project.externalURLLabel ?? live.replace(/^https?:\/\//, "")}
      <ExternalLinkIcon class="inline w-3.5 h-3.5 ml-1" />
      <NewTabHint />
    </a>
  );

  return (
    <FactCard label="Project facts" data-project-facts>
      <dl class="space-y-2 text-sm">
        {project.madeForName && (
          <Fact term="Client">
            {project.madeForURL
              ? (
                <a href={project.madeForURL} target="_blank" class={LINK}>
                  {project.madeForName}
                  <ExternalLinkIcon class="inline w-3.5 h-3.5 ml-1" />
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
              {...eventAttrs("outbound", { to: "github", item: project.slug })}
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
          event={eventAttrs("book", { place: "card", item: project.slug })}
          class="w-full justify-center px-5 py-3"
        >
          {BOOK_LABEL}
        </BookCallLink>
        <SimilarWorkLink project={project} place="card" />
      </div>
    </FactCard>
  );
}
