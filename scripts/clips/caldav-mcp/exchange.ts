/**
 * Runs the clip's real exchange: Claude Code in print mode (`claude -p`) with
 * caldav-mcp 1.6.0 as its only MCP server, pointed at the demo Radicale that
 * `record.sh` started. Two user turns over stream-json; the second is sent
 * only after the first answer's `result` line, so each gets its own answer.
 * The whole stream (tool calls, tool results, answers) is written to
 * `<out>/transcript.jsonl`, and the parts the clip shows (the client's tool
 * list, each question, each tool call with its input and result, each answer)
 * to `<out>/exchange.json`, which `record.ts` replays.
 *
 *   deno run -A scripts/clips/caldav-mcp/exchange.ts <caldav collection URL> <out dir>
 *
 * Isolation: --strict-mcp-config (no other MCP server, so never a real
 * calendar), --setting-sources "" (no user hooks or settings), --tools "" (no
 * built-in tools, only caldav's), --no-session-persistence.
 */
export const QUESTIONS = [
  "What's on my list for today?",
  "Move the overdue one to tomorrow.",
]

const [url, out] = Deno.args
if (!url || !out) {
  throw new Error("usage: exchange.ts <caldav collection URL> <out dir>")
}
await Deno.mkdir(out, { recursive: true })

const envs = [
  "CALDAV_URL",
  "CALDAV_SERVER_URL",
  "CALDAV_USERNAME",
  "CALDAV_PASSWORD",
  "CALDAV_MCP_TOOLS",
  "CALDAV_MCP_TIME_ZONE",
  "HOST",
  "PORT",
  "LOG_LEVEL",
  "MCP_BEARER_TOKEN",
  "ALLOW_BEARER_TOKEN_WITH_OAUTH",
  "TRUSTED_PROXIES",
  "PUBLIC_URL",
  "OWNER_PASSWORD_HASH",
  "AUTH_PEPPER",
  "OAUTH_KV_PATH",
].join(",")
// The config block of caldav-mcp's README quick start, pointed at the demo server.
// --minimum-dependency-age=0: our own release may be younger than Deno's 24-hour default.
const mcpConfig = {
  mcpServers: {
    caldav: {
      command: "deno",
      args: [
        "run",
        "--minimum-dependency-age=0",
        "--allow-net=127.0.0.1",
        `--allow-env=${envs}`,
        "jsr:@spy4x/caldav-mcp@1.6.0",
      ],
      env: {
        CALDAV_URL: url,
        CALDAV_USERNAME: "demo",
        CALDAV_PASSWORD: "demo",
        CALDAV_MCP_TIME_ZONE: "UTC",
      },
    },
  },
}
const configPath = `${out}/mcp.json`
await Deno.writeTextFile(configPath, JSON.stringify(mcpConfig, null, 2))

const today = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date())
const system =
  `You are a helpful assistant with access to the user's calendars and tasks ` +
  `through the caldav tools. Today is ${today}; the user's time zone is UTC. ` +
  `Answer in a few short lines, no headings, no tables.`

const child = new Deno.Command("claude", {
  args: [
    "-p",
    "--input-format=stream-json",
    "--output-format=stream-json",
    "--verbose",
    `--mcp-config=${configPath}`,
    "--strict-mcp-config",
    "--setting-sources=",
    "--tools=",
    "--allowedTools=mcp__caldav",
    "--no-session-persistence",
    "--model=sonnet",
    `--system-prompt=${system}`,
  ],
  cwd: out,
  stdin: "piped",
  stdout: "piped",
  stderr: "inherit",
}).spawn()

const deadline = setTimeout(() => child.kill("SIGTERM"), 300_000)
const writer = child.stdin.getWriter()
const encoder = new TextEncoder()
const send = (text: string) =>
  writer.write(
    encoder.encode(
      JSON.stringify({
        type: "user",
        message: { role: "user", content: text },
      }) + "\n",
    ),
  )

/** Splits a byte stream into lines. */
async function* readLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder()
  let rest = ""
  for await (const chunk of stream) {
    const parts = (rest + decoder.decode(chunk, { stream: true })).split("\n")
    rest = parts.pop() ?? ""
    yield* parts
  }
  if (rest) yield rest
}

const lines: string[] = []
let asked = 0
let connected = false
await send(QUESTIONS[asked++]!)
try {
  for await (const line of readLines(child.stdout)) {
    if (!line.trim()) continue
    lines.push(line)
    const msg = JSON.parse(line)
    if (msg.type === "system" && msg.subtype === "init") {
      connected = msg.mcp_servers?.some((s: { name: string; status: string }) =>
        s.name === "caldav" && s.status === "connected"
      )
    }
    if (msg.type === "result") {
      if (asked < QUESTIONS.length) await send(QUESTIONS[asked++]!)
      else await writer.close()
    }
  }
} finally {
  clearTimeout(deadline)
  await child.status
}
await Deno.writeTextFile(`${out}/transcript.jsonl`, lines.join("\n") + "\n")
if (!connected) {
  throw new Error(
    "caldav-mcp did not connect; see the init line in transcript.jsonl",
  )
}

/** One tool call as the clip shows it: the input the model sent and the parsed result. */
interface Call {
  name: string
  input: Record<string, unknown>
  result: unknown
}

/** The parts of the stream the clip replays, in order. */
interface Exchange {
  model: string
  tools: string[]
  turns: { question: string; calls: Call[]; answer: string }[]
}

const exchange: Exchange = { model: "", tools: [], turns: [] }
const calls = new Map<string, Call>()
let turn: Exchange["turns"][number] = {
  question: QUESTIONS[0]!,
  calls: [],
  answer: "",
}
for (const line of lines) {
  const msg = JSON.parse(line)
  if (msg.type === "system" && msg.subtype === "init") {
    exchange.model = msg.model
    exchange.tools = msg.tools.map((t: string) =>
      t.replace(/^mcp__caldav__/, "")
    )
  } else if (msg.type === "assistant") {
    for (const block of msg.message.content) {
      if (block.type === "tool_use") {
        const name = block.name.replace(/^mcp__caldav__/, "")
        const call = { name, input: block.input, result: null }
        calls.set(block.id, call)
        turn.calls.push(call)
        // Only text after the last tool call is the answer; earlier text is a preamble.
        turn.answer = ""
      } else if (block.type === "text") {
        turn.answer = turn.answer
          ? `${turn.answer}\n\n${block.text}`
          : block.text
      }
    }
  } else if (msg.type === "user") {
    for (const block of msg.message.content ?? []) {
      const call = block.type === "tool_result"
        ? calls.get(block.tool_use_id)
        : undefined
      if (!call) continue
      const text = block.content?.[0]?.text ?? ""
      try {
        call.result = JSON.parse(text)
      } catch {
        call.result = text
      }
    }
  } else if (msg.type === "result") {
    exchange.turns.push(turn)
    turn = {
      question: QUESTIONS[exchange.turns.length] ?? "",
      calls: [],
      answer: "",
    }
  }
}
if (
  exchange.turns.length !== QUESTIONS.length ||
  exchange.turns.some((t) => !t.answer)
) {
  throw new Error("the exchange is incomplete; see transcript.jsonl")
}
await Deno.writeTextFile(
  `${out}/exchange.json`,
  JSON.stringify(exchange, null, 2) + "\n",
)
console.log(
  `transcript: ${out}/transcript.jsonl, exchange: ${out}/exchange.json`,
)
