#!/usr/bin/env bash
# The Lighthouse check of the site (`deno task lighthouse`): every page in lighthouserc.json must
# score, in Lighthouse mobile, at least 95 for performance and 100 for accessibility, best
# practices and SEO, the median of three runs ("Design gate" in the global agent rules). Starts the
# built site (`deno task build` first) on port 48420, nginx with gzip in front of it on 48421
# (nginx.conf), and Lighthouse CI. The Umami script is blocked during the runs: its `/umami` proxy
# exists only in production, and its 404 would cost best practices. Reports land in .lighthouseci/.
# CI runs this script (.woodpecker.yml); run it the same way on a machine, from the repository root.
# Needs nginx, and a Chromium: `CHROME_PATH`, or the newest one Playwright installed.
set -euo pipefail

HERE=scripts/lighthouse
[ -f _fresh/server.js ] || { echo "no build: run deno task build first"; exit 1; }

if [ -z "${CHROME_PATH:-}" ]; then
  CHROME_PATH=$(find "${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}" \
    -path '*/chromium-*/chrome-linux*/chrome' -type f 2>/dev/null | sort -V | tail -n 1)
  [ -n "$CHROME_PATH" ] || { echo "no Chromium found: set CHROME_PATH"; exit 1; }
fi
export CHROME_PATH

SCRATCH=$(mktemp -d)
PIDS=()
cleanup() {
  set +e
  for pid in "${PIDS[@]}"; do
    # `deno serve` does not exit on SIGTERM when it has open connections: stop it for good.
    kill -TERM "$pid" 2>/dev/null
    for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$pid" 2>/dev/null || break; sleep 0.2; done
    kill -KILL "$pid" 2>/dev/null
  done
  find "$SCRATCH" -delete
}
trap cleanup EXIT INT TERM

wait_for() { # <name> <pid> <url>
  for _ in $(seq 1 120); do
    curl -fsS --max-time 2 -o /dev/null "$3" 2>/dev/null && return 0
    kill -0 "$2" 2>/dev/null || { echo "$1 stopped"; tail -n 40 "$SCRATCH/$1.log"; return 1; }
    sleep 0.5
  done
  echo "$1 did not answer at $3 within 60 s"
  tail -n 40 "$SCRATCH/$1.log"
  return 1
}

timeout 900 deno serve -A --port 48420 --host 127.0.0.1 _fresh/server.js >"$SCRATCH/site.log" 2>&1 &
PIDS+=($!)
wait_for site "${PIDS[-1]}" http://127.0.0.1:48420/

timeout 900 nginx -p "$SCRATCH" -e stderr -c "$PWD/$HERE/nginx.conf" -g 'daemon off;' \
  >"$SCRATCH/nginx.log" 2>&1 &
PIDS+=($!)
wait_for nginx "${PIDS[-1]}" http://127.0.0.1:48421/

# Run from the scratch folder, outside deno.json, deno.lock and node_modules: a tool for this check
# only, pinned here, with the repository's minimum dependency age. Lighthouse runs as a Node
# subprocess, which needs a node_modules folder: it goes in the scratch folder too.
ROOT=$PWD
(cd "$SCRATCH" && deno run -A --no-config --no-lock --node-modules-dir=auto \
  --minimum-dependency-age=1440 npm:@lhci/cli@0.15.1 autorun \
  --config="$ROOT/$HERE/lighthouserc.json" \
  --upload.outputDir="$ROOT/.lighthouseci/reports")
