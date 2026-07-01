import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface GhStarsProps {
  repo: string;
  class?: string;
}

const CACHE_KEY = "gh-stars";
const CACHE_TTL = 3600_000; // 1 hour

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
    return formatStars(stars.value);
  });

  const base = className || "";

  if (loading.value) {
    return (
      <span
        class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-700 text-gray-500 ${base}`}
      >
        ⋯
      </span>
    );
  }

  if (!display.value) {
    return (
      <span
        class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-700 text-gray-400 ${base}`}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        GitHub
      </span>
    );
  }

  return (
    <span
      class={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 ${base}`}
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
      <span class="text-yellow-400">★</span>
      {display.value}
    </span>
  );
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
