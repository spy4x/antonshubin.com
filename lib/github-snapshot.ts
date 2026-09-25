/**
 * Reads `lib/github-snapshot.json`: the committed snapshot of each tool
 * repository's GitHub and Woodpecker CI facts (#189), written by
 * `deno run -A scripts/github-snapshot.ts`. Pages render
 * from this file, never from a live API call, so a page reads the same on
 * every request and the tests stay deterministic and offline.
 *
 * The snapshot sits in `lib/`, not in `data/` as #189 first suggested: the
 * deploy's rsync excludes `/data/` and `compose.yml` bind-mounts the host's
 * own `data/` over the app's, so a file committed there never reaches the
 * production build.
 */
import snapshot from "./github-snapshot.json" with { type: "json" };

/** Woodpecker's pipeline status, as its API reports it. */
export type CiRunStatus =
  | "success"
  | "failure"
  | "error"
  | "killed"
  | "running"
  | "pending"
  | "blocked"
  | "declined"
  | "skipped";

export interface CiSnapshot {
  status: CiRunStatus;
  /** The pipeline's number within its repository. */
  pipeline: number;
  /** ISO date-time the pipeline finished, or started when still running. */
  at: string;
  url: string;
}

export interface RepoSnapshot {
  stars: number;
  /** SPDX id GitHub detected, or null when it detected none. */
  licence: string | null;
  pushedAt: string;
  /** The latest push pipeline on the default branch, or null when there is none. */
  ci: CiSnapshot | null;
}

export interface GithubSnapshot {
  /** The day the snapshot was taken, YYYY-MM-DD. */
  checkedOn: string;
  repos: Record<string, RepoSnapshot>;
}

export const githubSnapshot: GithubSnapshot = snapshot as GithubSnapshot;

/** The snapshot of `repo` (`owner/name`); throws when the script has not recorded it. */
export function repoSnapshot(
  repo: string,
  data: GithubSnapshot = githubSnapshot,
): RepoSnapshot {
  const found = data.repos[repo];
  if (!found) {
    throw new Error(
      `lib/github-snapshot.json has no entry for "${repo}" — run \`deno run -A scripts/github-snapshot.ts\``,
    );
  }
  return found;
}

/** How a CI status reads on the page: the word and the StatusMark shape behind it. */
export interface CiReading {
  word: "Passing" | "Failing" | "Running" | "Unknown";
  mark: "ready" | "issue" | "wip";
}

/**
 * Maps Woodpecker's status to one of four words a reader knows. Only
 * `success` reads as passing; every kind of stop (failure, error, killed)
 * reads as failing; a pipeline still going reads as running; anything else,
 * or no pipeline at all, reads as unknown rather than guessing.
 */
export function ciReading(ci: CiSnapshot | null): CiReading {
  switch (ci?.status) {
    case "success":
      return { word: "Passing", mark: "ready" };
    case "failure":
    case "error":
    case "killed":
      return { word: "Failing", mark: "issue" };
    case "running":
    case "pending":
      return { word: "Running", mark: "wip" };
    default:
      return { word: "Unknown", mark: "wip" };
  }
}

/** Stars are shown only from 25 up, as `islands/GhStars.tsx` does. */
export const MIN_STARS_SHOWN = 25;
