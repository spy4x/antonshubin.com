#!/usr/bin/env -S deno run -A
/**
 * Writes `lib/github-snapshot.json` (#189): for every tool in `lib/tools.ts`,
 * its GitHub stars, detected licence and last push, and the status of the
 * latest push pipeline on its default branch in Woodpecker — the same run the
 * Woodpecker status badge in each README reports.
 *
 * Run with:
 *   deno run -A scripts/github-snapshot.ts
 *
 * then commit the changed JSON. Pages render from the committed file, never
 * from a live call, so this is a dev-machine step like `deno task og`. Both
 * APIs answer without a token for public repositories; set `GITHUB_TOKEN` to
 * lift GitHub's anonymous rate limit. The token is only sent to
 * api.github.com and never written anywhere.
 */
import { tools } from "../lib/tools.ts";
import type {
  CiRunStatus,
  CiSnapshot,
  GithubSnapshot,
  RepoSnapshot,
} from "../lib/github-snapshot.ts";

const WOODPECKER = "https://ci.antonshubin.com";
const OUT = new URL("../lib/github-snapshot.json", import.meta.url);

/** The fields this script reads from Woodpecker's pipeline list. */
export interface WoodpeckerPipeline {
  number: number;
  status: string;
  event: string;
  branch: string;
  started: number;
  finished: number;
}

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

async function getJson<T>(url: string, headers: HeadersInit = {}): Promise<T> {
  const res = await fetch(url, { headers });
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

async function snapshotRepo(
  repo: string,
  repoId: number,
): Promise<RepoSnapshot> {
  const token = Deno.env.get("GITHUB_TOKEN");
  const gh = await getJson<GithubRepo>(
    `https://api.github.com/repos/${repo}`,
    token ? { Authorization: `Bearer ${token}` } : {},
  );
  const pipelines = await getJson<WoodpeckerPipeline[]>(
    `${WOODPECKER}/api/repos/${repoId}/pipelines?perPage=50`,
  );
  return {
    stars: gh.stargazers_count,
    licence: gh.license?.spdx_id ?? null,
    pushedAt: gh.pushed_at,
    ci: latestBranchPipeline(pipelines, gh.default_branch, repoId),
  };
}

async function main() {
  const repos: Record<string, RepoSnapshot> = {};
  for (const t of tools) {
    repos[t.repo] = await snapshotRepo(t.repo, t.ci.repoId);
    const ci = repos[t.repo].ci;
    console.log(
      `${t.repo}: CI ${ci ? `${ci.status} #${ci.pipeline}` : "none"}`,
    );
  }
  const snapshot: GithubSnapshot = {
    checkedOn: new Date().toISOString().slice(0, 10),
    repos,
  };
  await Deno.writeTextFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote lib/github-snapshot.json`);
}

if (import.meta.main) {
  await main();
}
