// The ts-libs page's own content (#459): every package with its README table
// line and one example from its own README, and the README's "Why ts-libs"
// points. Every string is copied from the ts-libs repository at
// `TS_LIBS_TAG`; `test/tools/ts-libs.test.ts` fails when one no longer
// appears in the READMEs at that tag. A later upstream change is caught only
// when the tag is bumped.

/** The ts-libs release whose READMEs these strings are copied from. */
export const TS_LIBS_TAG = "v1.83.0";

/** One package of ts-libs, as the "Pick a package" list shows it. */
export interface TsLibsPackage {
  /** The JSR name without the `@spy4x/` scope; also the repository folder. */
  name: string;
  /** The root README table's "What it holds" cell. */
  holds: string;
  /** The root README table's "Runs on" cell. */
  runsOn: string;
  /**
   * An example from `<name>/README.md`: its lines are, in order, lines of one
   * `ts` block there (a block may be trimmed, never added to), at most 15.
   */
  example: string;
}

/** Every package, in the root README's table order. */
export const tsLibsPackages: TsLibsPackage[] = [
  {
    name: "validation",
    holds:
      "arktype `validate` with one result shape, and form-validation state",
    runsOn: "shared",
    example: `import { type } from "arktype"
import { isValid, validate, validateSchema } from "@spy4x/validation"

const userSchema = type({ name: "1 <= string <= 10", joinedAt: "string.date.iso.parse" })

const { error, data } = validate(userSchema, input)
if (error) return error.description
await save(data) // \`data\` is parsed, so \`joinedAt\` is a \`Date\``,
  },
  {
    name: "platform",
    holds:
      "helpers, command and event bus, cache, API result, tokens, rate limiting",
    runsOn: "shared, split by entry",
    example: `import { type } from "arktype"
import { UUID_V7_PATTERN, uuidV7 } from "@spy4x/platform/universal/uuid"

const noteSchema = type({ id: UUID_V7_PATTERN, text: "string" })
const note = noteSchema.assert({ id: uuidV7(), text: "milk" })`,
  },
  {
    name: "server",
    holds:
      "sign-in, accounts, Postgres, Redis, outbox, file storage, env encryption",
    runsOn: "server",
    example: `import { createStorage } from "@spy4x/server/storage"

const storage = await createStorage() // reads Deno.env, returns undefined if unconfigured
await storage?.upload("media/photo.png", bytes)`,
  },
  {
    name: "net",
    holds:
      "SSRF guard, redirect-safe `fetch`, size-capped body readers, CIDR checks",
    runsOn: "server",
    example: `import { validatePublicUrl } from "@spy4x/net/url-policy"

async function fetchUserSuppliedUrl(userInput: string) {
  const safeUrl = await validatePublicUrl(userInput) // throws on a private/loopback/link-local target
  return fetch(safeUrl)
}`,
  },
  {
    name: "integrations",
    holds:
      "ntfy and healthchecks.io clients, webhook signature check, retry backoff",
    runsOn: "server",
    example:
      `const { publicKey, keys } = await generateVapidKeyPair() // once; store \`keys\`, serve \`publicKey\`
const sender = await createWebPushSender({
  vapidKeys: keys,
  subject: "mailto:ops@example.com",
  store,
})
const result = await sender.send(user.id, { title: "Backup done", body: null, url: null })`,
  },
  {
    name: "time",
    holds:
      "IANA time-zone arithmetic on `Intl`, plain-date math, `.ics` writer",
    runsOn: "shared",
    example: `import { formatDateTimeLong, zonedDateTime } from "@spy4x/time/tz"

// A stored booking: a wall clock, the zone it was made in, the guest's zone.
const instant = zonedDateTime("2026-08-28", "10:00", "Europe/Berlin")
formatDateTimeLong("2026-08-28", "10:00", "Europe/Berlin") // "Friday, 28 August 2026 at 10:00"`,
  },
  {
    name: "email",
    holds: "SMTP sender, address parsing, HTML mail wrapper, DKIM checker",
    runsOn: "server",
    example: `import { createSmtpSender } from "@spy4x/email/smtp"
const sender = createSmtpSender({
  host: "smtp.example.com",
  port: 587,
  user: "user@example.com",
  pass: "test-password-not-real",
  from: "Booking <booking@example.com>",
})

const result = await sender.send({
  to: ["guest@example.com", "host@example.com"],
  subject: "Booking confirmed",
  text: "Your meeting is booked.",
})
if (!result.ok) console.error(result.error, result.rejected)`,
  },
  {
    name: "realtime",
    holds:
      "hint-only WebSocket transport: registry, heartbeat, reconnect, cursor sync",
    runsOn: "both halves",
    example:
      `import { AggregateNotifier, ConnectionRegistry, createSystemClock } from "@spy4x/realtime"

const clock = createSystemClock()
const registry = new ConnectionRegistry({
  clock,
  maxConnectionsPerUser: 20,
})

// From the upgrade handler: authenticate once at the upgrade, then attach. \`attach\` returns \`null\`
// — and has already closed the socket — once the user is at \`maxConnectionsPerUser\`.
const handle = registry.attach(userId, adaptSocket(await upgrade(request)))
if (!handle) logger.warn("refused a socket: user already at the connection cap", { userId })`,
  },
  {
    name: "billing",
    holds:
      "checkout, customer portal and verified webhook events; Stripe adapter",
    runsOn: "server",
    example:
      `import { BillingEventType, createStripeBilling } from "@spy4x/billing"

const billing = createStripeBilling({
  secretKey, // read from your own config; the library never reads the environment
  webhookSecret,
  plans: [{ planId: "pro", priceId: "price_…" }],
})

// Checkout: redirect the customer to \`result.value.url\`.
const result = await billing.createCheckout({
  planId: "pro",
  successUrl: "https://app.example.com/billing/done",
  cancelUrl: "https://app.example.com/billing",
  reference: account.id, // comes back as \`subscription.reference\` on every event
})`,
  },
  {
    name: "caldav",
    holds:
      "CalDAV client, sync engine and write transport, WebDAV multistatus reader, URL rules",
    runsOn: "shared",
    example:
      `import { CalDavErrorCode, createCalDavClient } from "@spy4x/caldav"

const client = createCalDavClient({
  serverUrl: "https://dav.example.com/", // the bare host or \`…/dav/cal/\` both work
  auth: { username: "user@example.com", password: "…" },
})

const found = await client.discover() // .well-known → current-user-principal → calendar-home-set
if (!found.success) throw new Error(found.error.message)
const calendars = await client.listCalendars(found.output.homeUrls[0])
// Each: url, displayName, components, color?, ctag?, syncToken?`,
  },
  {
    name: "tasks",
    holds:
      "the to-do model of the CalDAV task apps: task, list views, quick-add, reminder runner",
    runsOn: "shared",
    example: `import { parseTask } from "@spy4x/tasks/model"
import { SortMode, sortTasks, todayView } from "@spy4x/tasks/view"
import { parseQuickAdd } from "@spy4x/tasks/quick-add"

const zone = "Europe/Berlin"
const tasks = resources.map(parseTask).flatMap((result) => result.success ? [result.output] : [])

const byDue = sortTasks(tasks, SortMode.Due, zone)
const { overdue, today } = todayView(tasks, new Date(), zone)

const typed = parseQuickAdd("Call Anna @phone #work tomorrow 3pm !high", {
  now: new Date(),
  timeZone: zone,
})
typed.title // "Call Anna"`,
  },
];

/** One point of the root README's "Why ts-libs", as a card on the page. */
export interface TsLibsReason {
  /** The point's bold lead, without its full stop. */
  title: string;
  /** The rest of the point, unwrapped. */
  text: string;
}

/** Four of the README's five points; "Runs where the code allows" is "Where it stands". */
export const tsLibsReasons: TsLibsReason[] = [
  {
    title: "Web standards first",
    text:
      "`fetch`, Web Crypto, `ReadableStream`, `Intl` and ES modules, with Deno as the runtime.",
  },
  {
    title: "Expected failures are data",
    text:
      "`validate` returns `{ error, data }`, `send` resolves with `ok: false` instead of throwing, and `@spy4x/platform` has `Result`, `ok` and `err` for your code.",
  },
  {
    title: "Few dependencies",
    text:
      "`@spy4x/net` and `@spy4x/time` have none. Shared ones (arktype, Hono, Postgres) are pinned to exact versions.",
  },
  {
    title: "Tested against the real thing",
    text:
      "Unit tests use fakes; an integration tier runs against a real Postgres, S3-compatible store, mail server and Redis, and fails instead of skipping. CI runs it on Postgres 18 and 17; the local containers run 18.",
  },
];

/**
 * The root README's quick start, as "Run the example" shows it. Two changes,
 * both so the commands work as written: the comment points at the README
 * instead of "the example above", and `--allow-sys` is added, because the
 * SMTP sender asks for `networkInterfaces` on the first good request.
 */
export const TS_LIBS_QUICK_START =
  `# arktype at the exact version @spy4x/validation pins, so both see one copy of its types
deno add jsr:@spy4x/validation jsr:@spy4x/time jsr:@spy4x/email npm:arktype@2.2.3
# save the README's example as main.ts, then:
SMTP_PASSWORD=not-real deno run --allow-net --allow-env --allow-sys main.ts
curl -d '{"email":"nope","date":"2026-08-28","time":"10:00"}' localhost:8000
# {"email":[{"code":"pattern","path":"email","message":"must be an email address (was \\"nope\\")"}]}`;
