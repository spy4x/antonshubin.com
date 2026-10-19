# dotfiles demo clip

`scripts/clips/dotfiles/record.sh` re-records `static/video/tools/dotfiles/`
(`demo.webm`, `demo.mp4`, `poster.webp`): `deno task ai --check` in sync, one
word of `ai-harnesses/AGENTS.md` edited, the check fails and exits 1,
`deno task ai` applies, the check passes again. It runs against a fresh clone
and a scratch `/home/demo` inside `bwrap`, so the real harness homes are never
read or written. Needs `bwrap`, `vhs`, `nvim` and `ffmpeg`.
