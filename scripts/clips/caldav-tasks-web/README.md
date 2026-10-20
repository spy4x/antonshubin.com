# caldav-tasks-web demo clip

`scripts/clips/caldav-tasks-web/run.sh`, from the repository root, re-records
`static/video/tools/caldav-tasks-web/` (`demo.webm`, `demo.mp4`, `poster.webp`,
`poster-640.webp`) against a throwaway Radicale seeded with made-up tasks
(`seed.ts`) and caldav-tasks-web at `TAG` (default `v1.10.0`). It needs Docker,
ffmpeg and the pinned Playwright Chromium. `record.ts` holds the shot list;
`pointer.js`, `human-mouse.ts` and `keys.js` draw the pointer, pace it and show
key presses.
