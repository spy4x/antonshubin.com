import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { ONE_HOUR_IN_MILLISECONDS } from "@spy4x/platform/universal/time-constants";
import { IconGitHub as GitHubIcon } from "@spy4x/preact-icons";
import { StarIcon } from "../components/Icons.tsx";

interface GhStarsProps {
  repo: string;
  class?: string;
}

const CACHE_KEY = "gh-stars";
const CACHE_TTL = ONE_HOUR_IN_MILLISECONDS;
// Below this, the star count reads as "not maintained" rather than as proof.
const MIN_VISIBLE_STARS = 25;

interface CacheEntry {
  stars: number;
  ts: number;
}

function readCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCache(repo: string, stars: number) {
  try {
    const cache = readCache();
    cache[repo] = { stars, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export default function GhStars({ repo, class: className }: GhStarsProps) {
  const stars = useSignal<number | null>(null);
  const loading = useSignal(true);
  const error = useSignal(false);

  useEffect(() => {
    // Check cache first
    const cache = readCache();
    const cached = cache[repo];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      stars.value = cached.stars;
      loading.value = false;
      return;
    }

    // Fetch from GitHub API
    const controller = new AbortController();
    fetch(`https://api.github.com/repos/${repo}`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const count = data.stargazers_count ?? 0;
        stars.value = count;
        writeCache(repo, count);
      })
      .catch(() => {
        error.value = true;
      })
      .finally(() => {
        loading.value = false;
      });

    return () => controller.abort();
  }, [repo]);

  const display = useComputed(() => {
    if (loading.value) return null;
    if (error.value || stars.value === null) return null;
    if (stars.value < MIN_VISIBLE_STARS) return null;
    return formatStars(stars.value);
  });

  const base = className || "";

  if (loading.value) {
    return (
      <span
        class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-lamp text-graphite ${base}`}
      >
        ⋯
      </span>
    );
  }

  if (!display.value) {
    return (
      <span
        class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-lamp text-graphite ${base}`}
      >
        <GitHubIcon class="w-3.5 h-3.5" />
        GitHub
      </span>
    );
  }

  return (
    <span
      class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-lamp text-graphite ${base}`}
    >
      <GitHubIcon class="w-3.5 h-3.5" />
      <StarIcon class="w-3.5 h-3.5 text-mist" filled />
      {display.value}
    </span>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
