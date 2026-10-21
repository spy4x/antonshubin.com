# caldav-mcp demo clip

The hero clip of `/tools/caldav-mcp` (#463): an assistant answers "What's on my
list for today?" and then moves the overdue task, through caldav-mcp 1.6.0 and a
demo Radicale calendar.

```bash
scripts/clips/caldav-mcp/record.sh            # new real exchange, then record (Docker, claude, ffmpeg)
scripts/clips/caldav-mcp/record.sh --replay   # record the committed exchange.json again
```

The exchange is real: `record.sh` starts a throwaway Radicale, `seed.ts` adds
made-up tasks dated around today, and `exchange.ts` asks the questions through
`claude -p` with caldav-mcp as its only MCP server. `exchange.json` keeps what
that run returned (every tool input, tool result and answer), and `record.ts`
replays it in `replay.html` with Playwright, typing the questions with a visible
pointer (`pointer.js`, `human-mouse.ts`, from the `demo-video` skill). The
output goes to `static/video/tools/caldav-mcp/`.
