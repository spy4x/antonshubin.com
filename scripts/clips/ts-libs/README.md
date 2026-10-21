# ts-libs demo clip

Re-record from the repository root with `deno install` once, then
`scripts/clips/ts-libs/record.sh`. It starts a throwaway Mailpit container, runs
the ts-libs README example (`main.ts.example`, pointed at that inbox) in `vhs`
(`demo.tape`), opens the inbox in Playwright (`inbox.ts`), and writes
`static/video/tools/ts-libs/` through `encode.sh`. Needs docker, vhs, tmux, bat,
jq, ffmpeg and cwebp. Every result on screen is the real run's output.
