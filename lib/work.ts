// The work section (#188): `/work` lists client work, `/work/<slug>` is one
// project's page. Everything here is derived from `lib/data.ts` and
// `lib/testimonials.ts`; this file writes no copy of its own, so an empty
// field stays empty and the page renders nothing for it.
import {
  archiveProjects,
  highlightProjects,
  type Project,
  projects,
} from "./data.ts";
import { projectTestimonials, type Testimonial } from "./testimonials.ts";

/** The section's index path; every work URL starts with it. */
export const WORK_PATH = "/work";

/** A project page's path: `/work/<slug>`. */
export function workHref(slug: string): string {
  return `${WORK_PATH}/${slug}`;
}

/**
 * Every project that has a page under `/work`: client projects and my own
 * tools alike, in `lib/data.ts` order. Only client work is listed on the
 * index (`clientWork()`); a tool's page stays in the sitemap.
 */
export function workProjects(): Project[] {
  return [...projects.my, ...projects.freelance].filter((p) => p.slug);
}

/** The project whose page is `/work/<slug>`, or undefined for an unknown slug. */
export function findWorkProject(slug: string): Project | undefined {
  return workProjects().find((p) => p.slug === slug);
}

/** True when `slug` is a client project, not one of my own tools. */
export function isClientWork(slug: string): boolean {
  return projects.freelance.some((p) => p.slug === slug);
}

/** One archive row: the project and the first of its visible reviews, if any. */
export interface ArchiveEntry {
  project: Project;
  review?: Testimonial;
}

/** The two sections of `/work` (#232): highlights first, then the archive. */
export interface ClientWork {
  highlights: Project[];
  archive: ArchiveEntry[];
}

/**
 * The client work `/work` lists, and nothing else: no tool, no channel.
 * Highlights keep `highlightSlugs` order (a typo there throws); the archive
 * is every other client project, newest first, with its first review.
 */
export function clientWork(): ClientWork {
  return {
    highlights: highlightProjects(),
    archive: archiveProjects().map((project) => ({
      project,
      review: projectTestimonials(project.slug ?? "")[0],
    })),
  };
}
