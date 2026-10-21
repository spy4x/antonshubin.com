# preact-components demo clip

Re-records `static/video/tools/preact-components/` (the /tools/preact-components
clip) from the deployed live guide, with a drawn pointer, click marks and a key
overlay:

```bash
OUT=$(mktemp -d)
deno run -A scripts/clips/preact-components/record.ts "$OUT"
scripts/clips/preact-components/encode.sh "$OUT" static/video/tools/preact-components
```

`record.ts` takes an optional second argument, another guide URL (a local
`pages` build). Check the frames before committing, as the `demo-video` skill
describes; delete `$OUT` with `find "$OUT" -delete` afterwards.
