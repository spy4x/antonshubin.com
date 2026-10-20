# rostok demo clip

Re-record `static/video/tools/rostok/` (about 3 minutes, a few cents of Hetzner
time) from the repository root, with the Hetzner token loaded for this one
command:

```bash
W=$(mktemp -d) && T="$(sed -n 's/^HETZNER_CLOUD_API_TOKEN=//p' <accounts env file>)" \
  && HETZNER_CLOUD_API_TOKEN="$T" scripts/clips/rostok/record.sh "$W" \
  && scripts/clips/rostok/compose.sh "$W"
```

`record.sh` rents the cheapest x86 Cloud server (`vm.ts`), runs the terminal in
a clean container (`Containerfile`, `terminal-a.tape`, `terminal-b.tape`),
deploys LibreSpeed and Traefik to `speedtest.<ip>.sslip.io`, records the browser
(`browser.ts`) and deletes the server and its SSH key on every exit.
`compose.sh` cuts and encodes the parts. Needs podman, tmux, vhs, ffmpeg and
Deno.
