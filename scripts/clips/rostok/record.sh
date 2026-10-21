#!/usr/bin/env bash
# Records the rostok demo clip end to end against a throwaway Hetzner Cloud server, then deletes
# the server and its SSH key, whether the run passed or failed. See README.md in this folder.
#
#   T="$(sed -n 's/^HETZNER_CLOUD_API_TOKEN=//p' <accounts env file>)" && \
#     HETZNER_CLOUD_API_TOKEN="$T" scripts/clips/rostok/record.sh <work dir>
#
# <work dir> must be an empty folder you own; the raw parts land there, and compose.sh turns them
# into static/video/tools/rostok/. Needs podman, tmux, vhs, ffmpeg, curl, ssh-keygen and Deno.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
WORK="${1:?usage: record.sh <empty work dir>}"
VERSION="${ROSTOK_VERSION:-1.18.1}"
# The token goes to vm.ts alone: kept in a plain variable, removed from the environment, so vhs,
# tmux, the container and the browser never inherit it.
TOKEN="${HETZNER_CLOUD_API_TOKEN:?HETZNER_CLOUD_API_TOKEN is not set}"
unset HETZNER_CLOUD_API_TOKEN
SOCK="rostokclip$$"
NAME="rostok-clip-$$"
IMAGE="localhost/rostok-clip:1"
mkdir -p "$WORK/vm"

vm() {
  HETZNER_CLOUD_API_TOKEN="$TOKEN" timeout 900 deno run --allow-net=api.hetzner.cloud --allow-env \
    --allow-run=ssh-keygen,ssh -R -W "$HERE/vm.ts" "$@"
}

cleanup() {
  set +e
  tmux -L "$SOCK" kill-server 2>/dev/null
  podman rm -f "$NAME" >/dev/null 2>&1
  echo "deleting the server and its SSH key"
  vm down
}
trap cleanup EXIT INT TERM HUP

fill() { # <template> <out tape> <video out>
  sed -e "s|@@OUT@@|$3|" -e "s|@@ATTACH@@|tmux -L $SOCK attach -t clip|" \
    -e "s|@@VERSION@@|$VERSION|" -e "s|@@SSH@@|root@$IP|" -e "s|@@DOMAIN@@|$DOMAIN|" \
    -e "s|@@EMAIL@@|jane@$DOMAIN|" "$1" > "$2"
}

capped() { systemd-run --user --scope --quiet -p TasksMax=4000 -p MemoryMax=8G "$@"; }

podman build -q -t "$IMAGE" -f "$HERE/Containerfile" "$HERE" > /dev/null
vm up "$WORK/vm"
IP="$(cat "$WORK/vm/ip")"
DOMAIN="${IP//./-}.sslip.io"
echo "server $IP, domain $DOMAIN"

# The terminal's shell: the container, inside a tmux session both tapes attach to.
tmux -L "$SOCK" -f /dev/null new-session -d -s clip -x 84 -y 18 \
  "podman run -it --rm --name $NAME --userns=keep-id --pids-limit=500 --memory=8g \
   -v $WORK/vm:/demo:ro,Z --entrypoint bash $IMAGE"
tmux -L "$SOCK" set -g status off
tmux -L "$SOCK" set -g escape-time 0
tmux -L "$SOCK" set -g default-terminal xterm-256color

cd "$WORK"
fill "$HERE/terminal-a.tape" a.tape term-a.mp4
capped timeout 900 vhs a.tape > vhs-a.log 2>&1
deploy_started="$(date +%s)"

# The deploy runs on with no client attached. Wait for the prompt to come back.
for _ in $(seq 1 180); do
  if tmux -L "$SOCK" capture-pane -p -t clip | grep -v '^\s*$' | tail -1 | grep -q 'rostok \$'; then
    break
  fi
  sleep 5
done
deploy_seconds=$(($(date +%s) - deploy_started + 4))
tmux -L "$SOCK" capture-pane -p -S -500 -t clip > deploy.txt
echo "$deploy_seconds" > deploy-seconds
echo "deploy took about $deploy_seconds s"
fill "$HERE/terminal-b.tape" b.tape term-b.mp4
capped timeout 300 vhs b.tape > vhs-b.log 2>&1
tmux -L "$SOCK" kill-server
podman rm -f "$NAME" > /dev/null 2>&1 || true

# Let's Encrypt issues the certificate on the first request; wait for a valid one.
URL="https://speedtest.$DOMAIN/"
for _ in $(seq 1 60); do
  curl -sf --max-time 10 -o /dev/null "$URL" && break
  sleep 5
done
curl -sf --max-time 10 -o /dev/null "$URL"
(cd "$REPO" && capped timeout 300 deno run -A "$HERE/browser.ts" "$URL" "$WORK")
echo "recorded: $WORK/term-a.mp4 $WORK/term-b.mp4 $WORK/browser.webm"
echo "$URL" > url
