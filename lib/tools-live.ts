/**
 * The hourly refresh behind `/tools` (#273, option A): the server asks JSR or
 * npm for each tool's latest version and GitHub and Woodpecker for its stars
 * and CI status, keeps the answer in memory for an hour, and falls back to the
 * committed `lib/github-snapshot.json` and the registry versions in
 * `lib/tools.ts` when a call fails or the refresh is off.
 *
 * The refresh is off unless `TOOLS_LIVE_REFRESH=1` (set in `compose.yml`), so
 * `deno task test` and a dev server never call out, and it only ever runs on
 * the server: no browser code imports this file. A test builds its own
 * refresher with a stub `fetch` through {@link createToolsLive}.
 */
import {
  type GithubSnapshot,
  githubSnapshot,
  type RepoSnapshot,
} from "./github-snapshot.ts";
import { type Fetcher, latestVersion, snapshotRepo } from "./snapshot-fetch.ts";
import { type Tool, tools } from "./tools.ts";

/** How long an answer is kept. */
export const REFRESH_TTL_MS = 60 * 60 * 1000;

/** What the tool pages render from. */
export interface ToolsLive {
  snapshot: GithubSnapshot;
  /** Latest version per tool slug, only for tools whose registry names a source. */
  versions: Record<string, string>;
  /** ISO time of the refresh, or null for the committed file. */
  checkedAt: string | null;
  source: "live" | "committed";
}

/** The committed snapshot, used when the refresh is off or every call failed. */
export function committedToolsLive(): ToolsLive {
  return {
    snapshot: githubSnapshot,
    versions: {},
    checkedAt: null,
    source: "committed",
  };
}

export interface ToolsLiveOptions {
  enabled: boolean;
  fetch?: Fetcher;
  now?: () => number;
  githubToken?: string;
  /** Called with a message when a call fails; the default logs to the console. */
  warn?: (message: string) => void;
}

/**
 * A refresher that answers from memory for {@link REFRESH_TTL_MS}, fetches
 * once when the answer is older (concurrent requests share the one call),
 * and fails open per repository and per package: a failed call keeps the
 * committed value for that item and never throws.
 */
export function createToolsLive(
  options: ToolsLiveOptions,
): { get: () => Promise<ToolsLive> } {
  const fetcher = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const warn = options.warn ??
    ((m: string) => console.warn(`tools-live: ${m}`));
  let cached: { at: number; value: ToolsLive } | undefined;
  let inflight: Promise<ToolsLive> | undefined;

  async function refresh(): Promise<ToolsLive> {
    const repos: Record<string, RepoSnapshot> = {
      ...githubSnapshot.repos,
    };
    let anyLive = false;
    const versions: Record<string, string> = {};
    const jobs: Promise<void>[] = [];
    for (const t of tools) {
      if (t.repo) {
        const repo = t.repo;
        jobs.push(
          snapshotRepo(fetcher, repo, t.ci?.repoId, options.githubToken).then(
            (snap) => {
              // A failed CI lookup must not erase the committed CI status.
              repos[repo] = t.ci && snap.ci === null
                ? { ...snap, ci: githubSnapshot.repos[repo]?.ci ?? null }
                : snap;
              anyLive = true;
            },
            (e) => warn(`${repo}: ${e instanceof Error ? e.message : e}`),
          ),
        );
      }
      if (t.registry?.latestFrom) {
        const from = t.registry.latestFrom;
        jobs.push(
          latestVersion(fetcher, from).then(
            (v) => {
              versions[t.slug] = v;
              anyLive = true;
            },
            (e) => warn(`${from.name}: ${e instanceof Error ? e.message : e}`),
          ),
        );
      }
    }
    await Promise.all(jobs);
    if (!anyLive) return committedToolsLive();
    return {
      snapshot: { checkedOn: githubSnapshot.checkedOn, repos },
      versions,
      checkedAt: new Date(now()).toISOString(),
      source: "live",
    };
  }

  return {
    async get() {
      if (!options.enabled) return committedToolsLive();
      if (cached && now() - cached.at < REFRESH_TTL_MS) return cached.value;
      inflight ??= refresh().then((value) => {
        cached = { at: now(), value };
        return value;
      }).finally(() => {
        inflight = undefined;
      });
      return await inflight;
    },
  };
}

let shared: { get: () => Promise<ToolsLive> } | undefined;

/** The server's one refresher, gated by `TOOLS_LIVE_REFRESH=1`. */
export function toolsLive(): Promise<ToolsLive> {
  shared ??= createToolsLive({
    enabled: Deno.env.get("TOOLS_LIVE_REFRESH") === "1",
    githubToken: Deno.env.get("GITHUB_TOKEN"),
  });
  return shared.get();
}

/**
 * The tool with its live version substituted into `registry.version` and the
 * pinned install command. A tool with no live version comes back unchanged.
 */
export function withLiveVersion(t: Tool, live: ToolsLive): Tool {
  const version = live.versions[t.slug];
  if (!t.registry || !version || version === t.registry.version) return t;
  const install = t.registry.install.endsWith(`@${t.registry.version}`)
    ? `${t.registry.install.slice(0, -t.registry.version.length)}${version}`
    : t.registry.install;
  return { ...t, registry: { ...t.registry, version, install } };
}

/** The repository's snapshot in `live`, or null for a tool without a repository. */
export function liveRepo(t: Tool, live: ToolsLive): RepoSnapshot | null {
  return t.repo ? live.snapshot.repos[t.repo] ?? null : null;
}

/** "Checked 25 Sep 2026 (committed snapshot)" or "Checked 14:05 UTC (live, refreshed hourly)". */
export function checkedLabel(live: ToolsLive): string {
  if (live.checkedAt) {
    return `Checked ${live.checkedAt.slice(11, 16)} UTC on ${
      live.checkedAt.slice(0, 10)
    } (live, refreshed hourly)`;
  }
  return `Checked ${live.snapshot.checkedOn} (committed snapshot, not a live check)`;
}
