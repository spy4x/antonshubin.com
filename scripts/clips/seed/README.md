# Seed demo clip

Records `static/video/tools/seed/demo.webm`, `demo.mp4` and `poster.webp`: Seed
going from `git clone` to its running app and admin panel, on this machine, with
made-up data.

```sh
scripts/clips/seed/record.sh "$(mktemp -d)"
```

It needs Docker, Deno, `vhs`, `ffmpeg` and free ports 80 and 443, and takes a
few minutes. Everything on screen is a real run:

1. `terminal-1.tape` (VHS): `git clone` of `spy4x/seed`, `cd`, `cp` of the
   example env file.
2. `terminal-2.tape`: off camera, `fill-env.sh` writes random secrets and
   `vapid-key:create` runs; on camera, `proxy:start` and `dev`. Waits longer
   than 1.5 s are sped up under a caption.
3. Seed's `db:seed` makes its demo user; `stage.ts` adds two made-up teammates,
   tags and notes, and signs the demo user in off camera.
4. `browser.ts` (Playwright, with `pointer.js` and `human-mouse.ts` from the
   `demo-video` skill) records the app, the admin panel and the result.
5. `compose.ts` sets the pages in the browser frame drawn by `overlays.ts`,
   joins the scenes and encodes. `CLIP_VP9_CRF` and `CLIP_H264_CRF` change the
   quality if a file outgrows 2.5 MB.

On exit, failed or not, `record.sh` removes the stack's containers, volumes,
locally built images and the `proxy` network. Delete the work folder yourself.
