#!/bin/bash
# Opens a bash shell whose HOME is <dir>/home/demo, seen inside as /home/demo. The real /home is
# hidden behind a tmpfs, so `deno task ai` can only write to the scratch harness homes.
# Usage: enter.sh <dir> [bash args]   (<dir> holds home/demo/dotfiles and a deno cache in deno/)
set -euo pipefail
dir=$(realpath "$1")
shift
deno_bin=$(readlink -f "$(command -v deno)")
exec bwrap --dev-bind / / --tmpfs /home --bind "$dir/home/demo" /home/demo \
  --ro-bind "$deno_bin" /home/demo/.deno/bin/deno --chdir /home/demo/dotfiles \
  --clearenv --setenv HOME /home/demo --setenv USER demo --setenv TERM xterm-256color \
  --setenv PATH /home/demo/.deno/bin:/usr/bin:/bin --setenv DENO_DIR "$dir/deno" \
  --setenv PS1 '\[\e[38;2;249;115;22m\]~/dotfiles\[\e[0m\] $ ' \
  bash --norc --noprofile "$@"
