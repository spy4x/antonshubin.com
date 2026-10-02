// The work section (#188): `/work` lists client work, `/work/<slug>` is one
// project's page. Everything here is derived from `lib/data.ts` and
// `lib/testimonials.ts`; this file writes no copy of its own, so an empty
// field stays empty and the page renders nothing for it.
import { catalogItem } from "./catalog.ts";
import {
  archiveProjects,
  highlightProjects,
  type Project,
  projects,
} from "./data.ts";
import {
  projectTestimonials,
  type RepeatClients,
  repeatClients,
  repeatClientsLine,
  type Testimonial,
} from "./testimonials.ts";

/** The section's index path; every work URL starts with it. */
export const WORK_PATH = "/work";

/** A project page's path: `/work/<slug>`. */
export function workHref(slug: string): string {
  return `${WORK_PATH}/${slug}`;
}

/**
 * Every project that has a page under `/work`: client projects, in
 * `lib/data.ts` order. My own projects have their pages under `/tools`
 * (`lib/tools.ts`).
 */
export function workProjects(): Project[] {
  return projects.freelance.filter((p) => p.slug);
}

/** The project whose page is `/work/<slug>`, or undefined for an unknown slug. */
export function findWorkProject(slug: string): Project | undefined {
  return workProjects().find((p) => p.slug === slug);
}

/** True when `slug` is a client project. */
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

/** The status a project shows: live, offline or archived — never colour alone. */
export type ProjectStatus = "live" | "offline" | "archived";

/**
 * A project's status from its data: archived, offline when its site is gone
 * (`externalURLDead`), live when it links its own product. Shared by the
 * project page's fact card and the `/work` cards and rows (#270).
 */
export function projectStatus(project: Project): ProjectStatus | null {
  if (project.archived) return "archived";
  if (project.externalURL && project.externalURLDead) return "offline";
  // A link with its own label is not a running product: the code review's
  // published report, or Roley's "Client's site" (a coming-soon page).
  if (project.externalURL && !project.externalURLLabel) return "live";
  return null;
}

/** A project's name without its tagline: "Roley — Make a Movie!" → "Roley". */
export function projectShortName(project: Project): string {
  return project.title.split(" — ")[0];
}

/** A span of years, from the first to the last, or "now" while one runs. */
export interface YearSpan {
  from: number;
  to: number | "now";
}

/** The years `list` covers, read from each project's `period`. */
export function yearSpan(list: Project[]): YearSpan {
  const periods = list.flatMap((p) => p.period ? [p.period] : []);
  if (periods.length === 0) {
    throw new Error("yearSpan: no project has a period");
  }
  const from = Math.min(...periods.map((p) => p.from));
  if (periods.some((p) => p.ongoing)) return { from, to: "now" };
  return { from, to: Math.max(...periods.map((p) => p.to ?? p.from)) };
}

/** "2014–2023", or "2024" when the span is one year. */
export function formatYearSpan(span: YearSpan): string {
  return span.to === span.from ? `${span.from}` : `${span.from}–${span.to}`;
}

/** Every client project `/work` lists, in page order: highlights, then the archive. */
export function clientWorkInOrder(work: ClientWork = clientWork()): Project[] {
  return [...work.highlights, ...work.archive.map((e) => e.project)];
}

/**
 * The line under the `/work` lead: "<ROLE> · 12 client projects, 2014–now",
 * counted from `clientWork()`. `role` is `lib/head.ts`'s `ROLE`, passed in so
 * this module stays free of the page-head state.
 */
export function workScopeLine(role: string, work = clientWork()): string {
  const list = clientWorkInOrder(work);
  return `${role} · ${list.length} client projects, ${
    formatYearSpan(yearSpan(list))
  }`;
}

/**
 * The `/work` meta description and OG subtitle (SEO 2 on #270): the role, the
 * count and span, and up to the first four highlights by name, from the data
 * only. Names drop from the end until the sentence fits in `max` characters,
 * so a search result never cuts it mid-word.
 */
export function workDescription(
  role: string,
  work = clientWork(),
  max = 160,
): string {
  const list = clientWorkInOrder(work);
  const scope = `${role}. ${list.length} client projects, ${
    formatYearSpan(yearSpan(list))
  }`;
  const tail = ": what I built, for whom, and what happened.";
  const names = work.highlights.slice(0, 4).map(projectShortName);
  for (let n = names.length; n > 0; n--) {
    const shown = names.slice(0, n);
    const listed = n > 1
      ? `${shown.slice(0, -1).join(", ")} and ${shown[n - 1]}`
      : shown[0];
    const text = `${scope}, including ${listed}${tail}`;
    if (text.length <= max) return text;
  }
  return `${scope}${tail}`;
}

/**
 * The sentence under the Archive heading (Psych 3 on #270): what the list is,
 * and how many of its products are no longer online, counted from
 * `externalURLDead`, never written by hand.
 */
export function archiveFrame(archive: ArchiveEntry[]): string {
  const offline =
    archive.filter((e) => projectStatus(e.project) === "offline").length;
  const first = "Earlier client work, newest first.";
  if (offline === 0) return first;
  return `${first} ${offline} of these ${archive.length} projects ${
    offline === 1 ? "is" : "are"
  } no longer online.`;
}

/**
 * The projects whose client hired me again (Psych 6 on #270): a client who
 * signed more than one contract on the project, or the follow-on product a
 * reviewed founder hired me for. Read from `repeatClients()`.
 */
export function hiredAgainSlugs(r: RepeatClients = repeatClients()): string[] {
  return [
    ...r.rehiredOnSameProject.map((p) => p.slug ?? ""),
    ...r.followOn.map((x) => x.to.slug ?? ""),
  ].filter(Boolean);
}

/** A run of the repeat-clients line: plain text, or a project name to link. */
export interface LineSegment {
  text: string;
  slug?: string;
}

/**
 * `repeatClientsLine()` cut into runs, with every project name it mentions
 * marked by its slug, so `/work` can link each name to its page (Mkt 7 on
 * #270). Joining the runs' text gives the line back unchanged.
 */
export function repeatClientsSegments(
  r: RepeatClients = repeatClients(),
): LineSegment[] {
  const line = repeatClientsLine(r);
  const named = [
    ...r.rehiredOnSameProject,
    ...r.followOn.flatMap((x) => [x.from, x.to]),
  ];
  const bySlug = new Map(named.map((p) => [projectShortName(p), p.slug]));
  const names = [...bySlug.keys()].sort((a, b) => b.length - a.length);
  if (names.length === 0) return [{ text: line }];
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`);
  return line.split(pattern).filter(Boolean).map((text) =>
    bySlug.has(text) ? { text, slug: bySlug.get(text) } : { text }
  );
}

/**
 * The client projects sold under a catalog item (#271): the reverse of
 * `catalogSlug`, highlights first, then the archive, so a service page shows
 * its strongest work first. A slug with no project (the strategy session)
 * gives an empty list, and a typo throws through `catalogItem()`.
 */
export function projectsForCatalog(slug: string, count = 3): Project[] {
  catalogItem(slug);
  return [...highlightProjects(), ...archiveProjects()]
    .filter((p) => p.catalogSlug === slug)
    .slice(0, count);
}
