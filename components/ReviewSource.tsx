import type { Project } from "../lib/data.ts";
import { NewTabHint } from "./NewTabHint.tsx";

const LINK = "text-accent hover:text-accent underline underline-offset-4";

/**
 * Who wrote a review and where: "<client> reviewed on Upwork", with the
 * client's name linked to their profile (`madeForName`/`madeForURL` on the
 * project) and "Upwork" linked to the review's `href`. Anton asked on 26 Sep
 * 2026 for the client's name on every review, replacing #186's no-name rule.
 * A project with no named client reads "Reviewed on Upwork".
 */
export function ReviewSource(
  { project, href }: { project: Project; href?: string },
) {
  const upwork = href
    ? (
      <a href={href} target="_blank" rel="noopener noreferrer" class={LINK}>
        Upwork
        <NewTabHint />
      </a>
    )
    : "Upwork";
  if (!project.madeForName) {
    return <span data-review-source>Reviewed on {upwork}</span>;
  }
  const name = project.madeForURL
    ? (
      <a
        href={project.madeForURL}
        target="_blank"
        rel="noopener noreferrer"
        class={LINK}
      >
        {project.madeForName}
        <NewTabHint />
      </a>
    )
    : project.madeForName;
  return <span data-review-source>{name} reviewed on {upwork}</span>;
}
