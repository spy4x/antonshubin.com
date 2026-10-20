# mig demo clip

Re-record `static/video/tools/mig/` (the `/tools/mig` clip and its posters) from
a clone of spy4x/mig that has been built with
`deno install --frozen && deno task build`:

```bash
deno run -A scripts/clips/mig/record.ts --mig <path to the built mig clone>
```

It needs Docker (a throwaway Mailpit container), ffmpeg and the pinned
Playwright Chromium, and takes about a minute. `pointer.js` and `human-mouse.ts`
are this clip's copies of the `demo-video` skill's helpers.
