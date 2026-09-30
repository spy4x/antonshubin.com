/**
 * Tagged-link builder for antonshubin.com, per the convention in `docs/utm.md`.
 *
 * `CHANNELS` is the only list of places a link back to the site is posted:
 * `scripts/launch-kit.ts`, `scripts/video-kit.ts`, `scripts/devto.ts` and
 * `scripts/links.ts` read their source and medium from it, and
 * `scripts/utm.test.ts` fails when the table in `docs/utm.md` disagrees.
 *
 * Every link carries `utm_source`, `utm_medium` and `utm_campaign`, then
 * `utm_content` only when one is given, in that order. `utm_term` is never
 * written. The path never ends in a trailing slash: `lib/redirects.ts` would
 * 301 it to the slash-free form anyway, so stripping it saves the extra hop.
 */

/** One place a tagged link is posted: the platform and the kind of placement. */
export interface Channel {
  /** `utm_source`: the platform, lowercase kebab-case. */
  source: string;
  /** `utm_medium`: where on that platform the link sits, not the platform. */
  medium: string;
  /** What a person posts there, for the doc and the `links` output. */
  label: string;
  /** When to post there, for the `links` output and the doc. Omitted when timing is irrelevant. */
  window?: PostingWindow;
}

/**
 * A recurring good time to post: whole UTC weekdays and one UTC hour range
 * that stays inside a single day. Practitioner consensus, not measurements.
 */
export interface PostingWindow {
  /** Weekdays, `0` Sunday to `6` Saturday, in ascending order. */
  days: readonly number[];
  /** First UTC hour, inclusive. */
  from: number;
  /** Last UTC hour, exclusive, greater than `from`. */
  to: number;
  /** One line on why. */
  why: string;
}

const TUE_THU = [2, 3, 4] as const;
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6] as const;

/** The channel table. `docs/utm.md`'s "Channels" table must match it row for row. */
export const CHANNELS: readonly Channel[] = [
  {
    source: "x",
    medium: "social",
    label: "X post or reply",
    window: {
      days: TUE_THU,
      from: 13,
      to: 16,
      why: "US morning meets the European afternoon",
    },
  },
  {
    source: "linkedin",
    medium: "social",
    label: "LinkedIn post or comment",
    window: {
      days: TUE_THU,
      from: 13,
      to: 15,
      why: "Working hours in Europe and the US East Coast",
    },
  },
  {
    source: "reddit",
    medium: "social",
    label: "Reddit post or comment",
    window: {
      days: TUE_THU,
      from: 13,
      to: 15,
      why: "US morning, before a post sinks down the new list",
    },
  },
  {
    source: "hn",
    medium: "social",
    label: "Hacker News post or comment",
    window: {
      days: TUE_THU,
      from: 13,
      to: 16,
      why: "US morning, when the front page turns over most",
    },
  },
  {
    source: "devto",
    medium: "blog",
    label: "Dev.to cross-post",
    window: {
      days: TUE_THU,
      from: 13,
      to: 16,
      why:
        "Readers arrive on weekday afternoons in Europe and mornings in the US",
    },
  },
  {
    source: "youtube",
    medium: "video",
    label: "YouTube video description",
    window: {
      days: [4, 5, 6],
      from: 15,
      to: 18,
      why: "Viewers settle in ahead of the weekend",
    },
  },
  {
    source: "telegram",
    medium: "social",
    label: "Telegram channel post",
    window: {
      days: EVERY_DAY,
      from: 16,
      to: 19,
      why: "Evening in Moscow, where most of the channel lives",
    },
  },
  { source: "github", medium: "oss", label: "README or release notes" },
  { source: "upwork", medium: "dm", label: "Upwork proposal or chat" },
  { source: "email", medium: "email", label: "Email signature or message" },
  { source: "qr-card", medium: "profile", label: "Business card QR code" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

/** The weekdays as `Any day`, one name, or `Tue–Thu` (a run of consecutive days). */
export function dayRange(days: readonly number[]): string {
  if (days.length === 7) return "Any day";
  const first = DAY_NAMES[days[0]];
  const last = DAY_NAMES[days[days.length - 1]];
  return first === last ? first : `${first}–${last}`;
}

/** A window as the doc's table cell: `Tue–Thu 13:00–16:00 UTC`. */
export function windowText(w: PostingWindow): string {
  return `${dayRange(w.days)} ${pad(w.from)}:00–${pad(w.to)}:00 UTC`;
}

/** A window that has started or will: its bounds, and whether `now` is inside it. */
export interface UpcomingWindow {
  start: Date;
  end: Date;
  inside: boolean;
}

/**
 * The window `now` is inside, else the next one to start. Looks at most a
 * week ahead, which always finds one because a window recurs weekly.
 */
export function nextWindow(w: PostingWindow, now: Date): UpcomingWindow {
  const midnight = Math.floor(now.getTime() / DAY_MS) * DAY_MS;
  for (let offset = 0; offset <= 7; offset++) {
    const day = midnight + offset * DAY_MS;
    if (!w.days.includes(new Date(day).getUTCDay())) continue;
    const start = new Date(day + w.from * 3_600_000);
    const end = new Date(day + w.to * 3_600_000);
    if (end.getTime() > now.getTime()) {
      return { start, end, inside: start.getTime() <= now.getTime() };
    }
  }
  throw new Error(`No posting window found for days ${w.days.join(",")}`);
}

/** `Tue 13:00` for `date` in `timeZone`. */
function dayTime(date: Date, timeZone: string, withDay = true): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const time = `${get("hour")}:${get("minute")}`;
  return withDay ? `${get("weekday")} ${time}` : time;
}

/** `Tue 13:00–15:00` in `timeZone`; the end names its day when it differs from the start's. */
function rangeIn(win: UpcomingWindow, timeZone: string): string {
  const start = dayTime(win.start, timeZone);
  const sameDay = start.slice(0, 3) === dayTime(win.end, timeZone).slice(0, 3);
  return `${start}–${dayTime(win.end, timeZone, !sameDay)}`;
}

/**
 * The next window as one readable fragment: `Tue 13:00–15:00 UTC (Tue
 * 20:00–22:00 Asia/Ho_Chi_Minh)`, or `now, until 15:00 UTC (22:00 …)` when
 * `now` is inside one. The local part is left out when `timeZone` is UTC.
 */
export function describeWindow(
  w: PostingWindow,
  now: Date,
  timeZone: string,
): string {
  const win = nextWindow(w, now);
  const utc = win.inside
    ? `now, until ${dayTime(win.end, "UTC", false)} UTC`
    : `${rangeIn(win, "UTC")} UTC`;
  if (timeZone === "UTC") return utc;
  const local = win.inside
    ? `until ${dayTime(win.end, timeZone, false)}`
    : rangeIn(win, timeZone);
  return `${utc} (${local} ${timeZone})`;
}

/** Returns the channel for `source`, or throws naming the known sources. */
export function channel(source: string): Channel {
  const found = CHANNELS.find((c) => c.source === source);
  if (!found) {
    throw new Error(
      `Unknown channel "${source}". Known: ${
        CHANNELS.map((c) => c.source).join(", ")
      }`,
    );
  }
  return found;
}

/** Lowercase kebab-case: letters and digits, single hyphens between them. */
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Throws unless `value` is lowercase kebab-case, naming the parameter. */
export function assertKebab(name: string, value: string): void {
  if (!KEBAB.test(value)) {
    throw new Error(
      `${name} "${value}" must be lowercase kebab-case, like "opus55-vs-sonnet5"`,
    );
  }
}

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  /** The specific placement (a subreddit, one of several posts). Omitted when unset. */
  content?: string;
}

/** Drops a trailing slash from `path`, except the root `"/"` itself. */
export function stripTrailingSlash(path: string): string {
  if (path === "/") return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Builds an absolute, tagged URL for `path` under `baseUrl`.
 *
 * `path` is normalized with {@linkcode stripTrailingSlash} first. The
 * campaign and the optional content must be lowercase kebab-case, or this
 * throws: a typo would otherwise split one campaign into two in Umami.
 */
export function buildTaggedUrl(
  baseUrl: string,
  path: string,
  { source, medium, campaign, content }: UtmParams,
): string {
  assertKebab("utm_campaign", campaign);
  if (content !== undefined) assertKebab("utm_content", content);
  const url = new URL(stripTrailingSlash(path), baseUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content !== undefined) url.searchParams.set("utm_content", content);
  return url.toString();
}

/**
 * Builds the tagged URL for one channel from the table: the medium always
 * comes from `CHANNELS`, never from the caller.
 */
export function channelUrl(
  baseUrl: string,
  path: string,
  source: string,
  campaign: string,
  content?: string,
): string {
  const { medium } = channel(source);
  return buildTaggedUrl(baseUrl, path, { source, medium, campaign, content });
}

/**
 * An article's campaign: its `utmCampaign` front-matter field when set,
 * else its blog slug.
 */
export function articleCampaign(
  slug: string,
  frontMatter: { utmCampaign?: unknown } = {},
): string {
  const override = frontMatter.utmCampaign;
  if (typeof override === "string" && override.length > 0) return override;
  return slug;
}
