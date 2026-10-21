# oko demo clip

Re-record `static/video/tools/oko/` (demo.webm, demo.mp4, poster.webp) with:

```bash
deno run -A scripts/clips/oko/record.ts   # about 12 minutes, most of it gatus warm-up
```

It needs Docker, `vhs`, `ffmpeg`, `openssl`, `nano` and the pinned Playwright
Chromium. Everything on screen is staged: the example.com catalog in
`config.json`, gatus checking nginx containers (`gatus.yaml`), and the editor
shot in `edit.tape`. `record.ts`'s header says what each part does.
