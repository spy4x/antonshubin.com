/**
 * UTM link builder for antonshubin.com, per the convention in `docs/utm.md`.
 *
 * Every generated link back to the site carries exactly `utm_source`,
 * `utm_medium` and `utm_campaign`, in that order, and never ends in a
 * trailing slash. A `[slug]` route 404s on a trailing slash (see the comment
 * at `lib/head.ts:43`), so a tagged link built with a trailing path would
 * point straight at a 404.
 */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
}

/** Drops a trailing slash from `path`, except the root `"/"` itself. */
export function stripTrailingSlash(path: string): string {
  if (path === "/") return path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Builds an absolute, UTM-tagged URL for `path` under `baseUrl`.
 *
 * `path` is normalized with {@linkcode stripTrailingSlash} before the query
 * string is appended.
 */
export function buildTaggedUrl(
  baseUrl: string,
  path: string,
  { source, medium, campaign }: UtmParams,
): string {
  const url = new URL(stripTrailingSlash(path), baseUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
