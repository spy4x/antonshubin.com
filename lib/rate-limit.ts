// Per-client rate limit for the public POST routes (#252).
//
// How a request reaches the app in production (evidence in PR #252's body):
//
//   visitor → Cloudflare (antonshubin.com is proxied) → Traefik → this app
//
// Traefik runs with an empty `forwardedHeaders.trustedIPs`, so it deletes any
// X-Real-IP the caller sent and writes the address that opened its own
// connection. The app has no host port, so every request passes Traefik, and
// X-Real-IP is the one header nobody outside can forge. Through Cloudflare
// that address is a Cloudflare edge, shared by many visitors; Cloudflare then
// names the visitor in CF-Connecting-IP, which it always overwrites. Traefik's
// port 443 is also reachable directly, bypassing Cloudflare, and there a
// caller can write CF-Connecting-IP freely. So CF-Connecting-IP is trusted only
// when X-Real-IP shows the connection came from Cloudflare.
import { clientIp, clientIpBucket } from "@spy4x/platform/rate-limit/client-ip";
import {
  type Clock,
  createMemoryRateLimiter,
  type MemoryRateLimiter,
} from "@spy4x/platform/rate-limit/memory";
import { ipInRanges } from "@spy4x/net/ip";

/** Cloudflare's published edge ranges, from https://www.cloudflare.com/ips-v4
 * and https://www.cloudflare.com/ips-v6 as of 2026-09-26. They change rarely;
 * a range missing here makes those visitors share their edge's bucket, and
 * never lets anyone skip the limit. */
export const CLOUDFLARE_RANGES: readonly string[] = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

/** True when `address` is one of Cloudflare's edge addresses. */
export function isCloudflareAddress(address: string): boolean {
  return ipInRanges(address, CLOUDFLARE_RANGES);
}

/**
 * The key for one client's address (`@spy4x/platform`'s `clientIpBucket`): an
 * IPv6 address is keyed on its /64, because one household or server usually
 * holds a whole /64 and can pick any address in it. An IPv4 or IPv4-mapped
 * address is keyed as the IPv4 address; any other value is kept as it is.
 */
export const clientKey: (address: string) => string = clientIpBucket;

/**
 * The key to rate-limit a request by ({@link clientKey}): X-Real-IP (written
 * by Traefik), or, when that is a Cloudflare edge, the visitor Cloudflare
 * names in CF-Connecting-IP. X-Forwarded-For is never read. A header that is
 * not exactly one IP address counts as absent. Without X-Real-IP (only when
 * the app runs without Traefik, as in a test) it falls back to the socket
 * address.
 */
export function requestClientIp(req: Request, socketAddress?: string): string {
  const peer = clientIp(req, socketAddress, "x-real-ip");
  return clientKey(
    clientIp(req, peer, "cf-connecting-ip", {
      trustedProxies: CLOUDFLARE_RANGES,
    }),
  );
}

/** The socket address from Deno's serve info, when the transport has one. */
export function socketAddress(info: Deno.ServeHandlerInfo): string | undefined {
  const addr = info.remoteAddr;
  return addr.transport === "tcp" || addr.transport === "udp"
    ? addr.hostname
    : undefined;
}

/** The public forms' budget: three submissions per client per hour. */
export const SUBMISSION_LIMIT = 3;
export const SUBMISSION_WINDOW_MS = 3600_000;

/**
 * A limiter for one form. It keeps a sliding one-hour window per client and
 * sweeps idle clients (ten minutes past their window), so rotating addresses
 * cannot grow memory without bound.
 */
export function createSubmissionLimiter(clock?: Clock): MemoryRateLimiter {
  return createMemoryRateLimiter({
    limit: SUBMISSION_LIMIT,
    windowMs: SUBMISSION_WINDOW_MS,
    clock,
  });
}

/**
 * Checks `req` against `limiter`: `null` when it may go on, or the 429 to
 * answer, with Retry-After in seconds.
 */
export function limitSubmission(
  limiter: MemoryRateLimiter,
  req: Request,
  info: Deno.ServeHandlerInfo,
): Response | null {
  const decision = limiter.check(requestClientIp(req, socketAddress(info)));
  if (decision.allowed) return null;
  return Response.json({ error: "Too many requests. Try again later." }, {
    status: 429,
    headers: {
      "Retry-After": String(Math.ceil(decision.retryAfterMs / 1000)),
    },
  });
}
