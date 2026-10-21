# zond demo clip

`scripts/clips/zond/record.sh` re-records `static/video/tools/zond/` (needs
Docker, `vhs`, `ffmpeg`, `bc` and Playwright's Chromium; port 8080 free). It
stages zond with two `traefik/whoami` stand-ins for metube and ollama and leaves
grafana stopped, records the terminal with `terminal.tape` and the browser with
`browser.ts`, and removes the `zond-demo` stack on exit. The browser's address
bar is drawn by `browser.ts`; the page under it, the status code and the timer
are zond's real answer. The two waits for zond's 3 s grafana timeout play 4x
fast.
