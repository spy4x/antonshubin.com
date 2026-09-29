/**
 * The calls that fill `lib/github-snapshot.json` (#189, #273): GitHub's
 * repository API, Woodpecker's pipeline list, and a registry's latest
 * version. Used by `scripts/github-snapshot.ts` on a dev machine and by
 * `lib/tools-live.ts` on the server, which passes its own `fetch` so a test
 * never opens a connection.
 */
import type {
  CiRunStatus,
  CiSnapshot,
  RepoSnapshot,
} from "./github-snapshot.ts";

export const WOODPECKER = "https://ci.antonshubin.com";

/** The fields read from Woodpecker's pipeline list. */
export interface WoodpeckerPipeline {
  number: number;
  status: string;
  event: string;
  branch: string;
  started: number;
  finished: number;
}

/** A `fetch`, injectable so tests and the server can supply their own. */
export type Fetcher = typeof fetch;

/**
 * The latest push pipeline on `branch`, as a snapshot entry, or null when the
 * list has none. Pull-request, tag and cron pipelines are skipped: a failing
 * pull request says nothing about the code that is on the default branch.
 * Woodpecker lists newest first, so the first match is the latest.
 */
export function latestBranchPipeline(
  pipelines: WoodpeckerPipeline[],
  branch: string,
  repoId: number,
): CiSnapshot | null {
  const run = pipelines.find((p) => p.event === "push" && p.branch === branch);
  if (!run) return null;
  const seconds = run.finished || run.started;
  return {
    status: run.status as CiRunStatus,
    pipeline: run.number,
    at: new Date(seconds * 1000).toISOString(),
    url: `${WOODPECKER}/repos/${repoId}/pipeline/${run.number}`,
  };
}

async function getJson<T>(
  fetcher: Fetcher,
  url: string,
  headers: HeadersInit = {},
): Promise<T> {
  const res = await fetcher(url, { headers });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`${url} answered ${res.status}`);
  }
  return await res.json() as T;
}

interface GithubRepo {
  stargazers_count: number;
  license: { spdx_id: string } | null;
  pushed_at: string;
  default_branch: string;
}

/** One repository's stars, licence, last push and CI status (null without a pipeline id). */
export async function snapshotRepo(
  fetcher: Fetcher,
  repo: string,
  repoId: number | undefined,
  githubToken?: string,
): Promise<RepoSnapshot> {
  const gh = await getJson<GithubRepo>(
    fetcher,
    `https://api.github.com/repos/${repo}`,
    githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
  );
  const pipelines = repoId === undefined ? [] : await getJson<
    WoodpeckerPipeline[]
  >(fetcher, `${WOODPECKER}/api/repos/${repoId}/pipelines?perPage=50`);
  return {
    stars: gh.stargazers_count,
    licence: gh.license?.spdx_id ?? null,
    pushedAt: gh.pushed_at,
    ci: repoId === undefined
      ? null
      : latestBranchPipeline(pipelines, gh.default_branch, repoId),
  };
}

/** Which registry a package is published on, and under what name. */
export interface RegistryPackage {
  registry: "jsr" | "npm";
  /** `@scope/name` on JSR, the package name on npm. */
  name: string;
}

/** The latest published version of a package on JSR or npm. */
export async function latestVersion(
  fetcher: Fetcher,
  pkg: RegistryPackage,
): Promise<string> {
  if (pkg.registry === "jsr") {
    const meta = await getJson<{ latest?: string }>(
      fetcher,
      `https://jsr.io/${pkg.name}/meta.json`,
    );
    if (!meta.latest) throw new Error(`${pkg.name}: JSR lists no latest`);
    return meta.latest;
  }
  const meta = await getJson<{ version?: string }>(
    fetcher,
    `https://registry.npmjs.org/${pkg.name}/latest`,
  );
  if (!meta.version) throw new Error(`${pkg.name}: npm lists no version`);
  return meta.version;
}
