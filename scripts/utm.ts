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
}

/** The channel table. `docs/utm.md`'s "Channels" table must match it row for row. */
export const CHANNELS: readonly Channel[] = [
  { source: "x", medium: "social", label: "X post or reply" },
  { source: "linkedin", medium: "social", label: "LinkedIn post or comment" },
  { source: "reddit", medium: "social", label: "Reddit post or comment" },
  { source: "hn", medium: "social", label: "Hacker News post or comment" },
  { source: "devto", medium: "blog", label: "Dev.to cross-post" },
  { source: "youtube", medium: "video", label: "YouTube video description" },
  { source: "github", medium: "oss", label: "README or release notes" },
  { source: "upwork", medium: "dm", label: "Upwork proposal or chat" },
  { source: "email", medium: "email", label: "Email signature or message" },
  { source: "qr-card", medium: "profile", label: "Business card QR code" },
];

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
