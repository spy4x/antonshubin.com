# Images

## OG link-preview images

`scripts/og-images.ts` generates the 1200×630 PNGs committed under
`static/img/og/`: one per blog post (`blog/<slug>.png`), one per project page
(`projects/<slug>.png`), one per tool page (`tools/<slug>.png`) plus the hub
(`tools.png`), one for `/about` (`about.png`), and one landscape default for the
site (`default.png`, `lib/head.ts`'s `DEFAULTS.ogImage`) — replacing the SVG
covers and the old 1200×1800 portrait photo, none of which LinkedIn, X, Facebook
or Slack render as a link preview. It renders each PNG from the post/project
title and description already in `lib/data.ts`, never from the committed cover
SVGs, through the Chromium already pinned for the browser-driven tests
(`test/browser.ts`'s `launchChromium()`) instead of adding a new image-rendering
dependency.

Regeneration is one command: `deno task og` (no build needed). Run it whenever a
post or project title or description changes, then commit the changed PNGs — for
example after #201 renames the mig post from "200-line" to "lightweight". This
script is dev-machine only: the production Docker build (`denoland/deno:2.9.0`,
no Chromium) never runs it, it only serves the PNGs already committed.
`test/og-images.test.ts` guards that every post and project has its PNG at
exactly 1200×630, reading each file's PNG header directly — deterministic and
offline, no browser needed to run the check itself.

The repository's GitHub social preview, `docs/social-preview.png` (1280×640,
#291), is a separate task because its screenshot comes from the built home page:
`deno task social-preview` builds first, boots the site with `startSite()`,
writes the PNG and strips its metadata. `deno task og` never touches it, so a
stale build cannot rewrite it. GitHub has no API for it: after the file changes,
Anton uploads it in Settings → General → Social preview.

## Project screenshots

No project screenshot WebP is wider than `MAX_SCREENSHOT_WIDTH` (1600px,
`lib/image-path.ts`, #336): the lightbox decodes every pixel before it paints,
so a 2500px shot lagged. `deno task optimize:screenshots` scales PNG sources and
oversized WebP-only files down to it, and `test/screenshot-width.test.ts` fails
on a wider one.

The caldav-tasks-web screenshots in `static/img/tools/caldav-tasks-web/` come
from one command, `deno task reshoot:caldav` (#223): it clones the app, starts a
throwaway Radicale container, seeds generic demo tasks, takes the pictures with
the pinned Chromium, runs the optimizer and the metadata strip, and removes the
container, the app process and its temp directory even when it fails. The
screenshot list, viewports and demo data are the table at the top of
`scripts/reshoot-caldav-demo-plan.ts`; `--shots`, `--viewport` and `--scale`
change a run; `--app <dir>` clones that directory's committed HEAD, not its
working tree. It needs Docker, so it is not part of `deno task check`. A brief
that asks for new screenshots of a project names every screenshot in that
project's folder, not only the ones the issue mentions, so the environment is
built once.

## Image metadata

Every image committed under `static/` or `assets/` ships without metadata: no
EXIF or XMP in a WebP, no text, time or EXIF chunk in a PNG, no editor stamp in
an SVG (a generator comment, `<desc>Created with …</desc>` or a `<metadata>`
block). The tools that made them left camera and software names, dates, a local
file path and app build ids, which every visitor downloaded (20 KB on the hero
photo alone). Run `deno task strip-metadata` after adding or replacing any
image, or `deno task strip-metadata <file>...` for just those files, and commit
the result. It removes whole metadata chunks only; pixel data and colour
information (ICC profiles, gamma, sRGB) are copied byte for byte, so the image
looks the same. `test/asset-metadata.test.ts` fails on any image that still
carries metadata. `deno task og` and `deno task optimize:screenshots` re-encode
from pixels and add none, so only hand-added files need the step. Fonts keep
their name table: it holds the OFL licence.
