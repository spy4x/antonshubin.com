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
import { clientIp } from "@spy4x/platform/rate-limit/client-ip";
import {
  type Clock,
  createMemoryRateLimiter,
  type MemoryRateLimiter,
} from "@spy4x/platform/rate-limit/memory";
import { parseIpv6Groups } from "@spy4x/net/url-policy";

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

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** An address as its bits, most significant first: 32 for IPv4, 128 for
 * IPv6, or `null` when it is neither. */
function addressBits(address: string): boolean[] | null {
  const v4 = IPV4.exec(address);
  if (v4) {
    const octets = v4.slice(1).map(Number);
    if (octets.some((o) => o > 255)) return null;
    return octets.flatMap((o) => bitsOf(o, 8));
  }
  if (!address.includes(":")) return null;
  const groups = parseIpv6Groups(address);
  return groups ? groups.flatMap((g) => bitsOf(g, 16)) : null;
}

function bitsOf(value: number, width: number): boolean[] {
  return Array.from(
    { length: width },
    (_, i) => ((value >> (width - 1 - i)) & 1) === 1,
  );
}

/** True when `address` lies in `cidr`, for example `104.16.0.0/13`. */
function inRange(address: boolean[], cidr: string): boolean {
  const [base, prefix] = cidr.split("/");
  const baseBits = addressBits(base);
  if (!baseBits || baseBits.length !== address.length) return false;
  const length = Number(prefix);
  for (let i = 0; i < length; i++) {
    if (address[i] !== baseBits[i]) return false;
  }
  return true;
}

/** True when `address` is one of Cloudflare's edge addresses. */
export function isCloudflareAddress(address: string): boolean {
  const bits = addressBits(address);
  return bits !== null && CLOUDFLARE_RANGES.some((cidr) => inRange(bits, cidr));
}

/**
 * The key for one client's address. An IPv4 address is its own key. An IPv6
 * address is keyed on its /64 (the first four groups): one household or
 * server usually holds a whole /64 and can pick any address in it, so a
 * per-address key would give it an unlimited budget. An IPv4-mapped IPv6
 * address (`::ffff:192.0.2.1`) is keyed as the IPv4 address it carries. A
 * value that is neither is kept as it is, so equal values still share a key.
 */
export function clientKey(address: string): string {
  if (!address.includes(":")) return address;
  const groups = parseIpv6Groups(address);
  if (!groups) return address;
  const mapped = groups.slice(0, 5).every((g) => g === 0) &&
    groups[5] === 0xffff;
  if (mapped) {
    return [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255]
      .join(".");
  }
  return `${groups.slice(0, 4).map((g) => g.toString(16)).join(":")}::/64`;
}

/**
 * The key to rate-limit a request by ({@link clientKey}): X-Real-IP (written
 * by Traefik), or, when that is a Cloudflare edge, the visitor Cloudflare
 * names in CF-Connecting-IP. X-Forwarded-For is never read. Without X-Real-IP
 * (only when the app runs without Traefik, as in a test) it falls back to the
 * socket address.
 */
export function requestClientIp(req: Request, socketAddress?: string): string {
  const peer = clientIp(req, socketAddress, "x-real-ip");
  return clientKey(
    isCloudflareAddress(peer) ? clientIp(req, peer, "cf-connecting-ip") : peer,
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
