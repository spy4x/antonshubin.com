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
import { snapshotRepos } from "../lib/tools.ts";
import type { GithubSnapshot, RepoSnapshot } from "../lib/github-snapshot.ts";
import {
  latestBranchPipeline,
  snapshotRepo,
  type WoodpeckerPipeline,
} from "../lib/snapshot-fetch.ts";

const OUT = new URL("../lib/github-snapshot.json", import.meta.url);

export { latestBranchPipeline, type WoodpeckerPipeline };

async function main() {
  const repos: Record<string, RepoSnapshot> = {};
  for (const { repo, ciRepoId } of snapshotRepos()) {
    repos[repo] = await snapshotRepo(
      fetch,
      repo,
      ciRepoId,
      Deno.env.get("GITHUB_TOKEN"),
    );
    const ci = repos[repo].ci;
    console.log(`${repo}: CI ${ci ? `${ci.status} #${ci.pipeline}` : "none"}`);
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
