import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  clientKey,
  createSubmissionLimiter,
  isCloudflareAddress,
  limitSubmission,
  requestClientIp,
  SUBMISSION_WINDOW_MS,
} from "./rate-limit.ts";

const SOCKET: Deno.ServeHandlerInfo = {
  remoteAddr: { transport: "tcp", hostname: "10.0.0.5", port: 40000 },
  completed: Promise.resolve(),
};

function request(headers: Record<string, string>): Request {
  return new Request("http://127.0.0.1/api/subscribe", {
    method: "POST",
    headers,
  });
}

Deno.test("recognises Cloudflare's edge addresses and nothing else", () => {
  const edges = [
    "104.16.0.1",
    "104.24.0.0",
    "172.71.255.255",
    "173.245.63.255",
    "2606:4700::1",
    "2a06:98c7:ffff::1",
  ];
  for (const address of edges) {
    assertEquals(isCloudflareAddress(address), true, address);
  }
  const others = [
    "104.15.255.255",
    "172.72.0.0",
    "173.245.64.0",
    "192.0.2.1",
    "2606:4701::1",
    "2a06:98c8::1",
    // Its 32 bits equal the first 32 of 2606:4700::/32; the family differs.
    "38.6.71.0",
    "::ffff:104.16.0.1x",
    "999.16.0.1",
    "",
    "unknown",
  ];
  for (const address of others) {
    assertEquals(isCloudflareAddress(address), false, address);
  }
});

Deno.test("keys a direct request by X-Real-IP, ignoring CF-Connecting-IP and X-Forwarded-For", () => {
  const req = request({
    "x-real-ip": "192.0.2.1",
    "cf-connecting-ip": "198.51.100.7",
    "x-forwarded-for": "203.0.113.9",
  });
  assertEquals(requestClientIp(req, "10.0.0.5"), "192.0.2.1");
});

Deno.test("keys a request through Cloudflare by CF-Connecting-IP", () => {
  const req = request({
    "x-real-ip": "104.16.0.1",
    "cf-connecting-ip": "198.51.100.7",
    "x-forwarded-for": "203.0.113.9",
  });
  assertEquals(requestClientIp(req, "10.0.0.5"), "198.51.100.7");
  assertEquals(
    requestClientIp(request({ "x-real-ip": "104.16.0.1" }), "10.0.0.5"),
    "104.16.0.1",
  );
});

Deno.test("keys a request without X-Real-IP by the socket address", () => {
  const req = request({
    "cf-connecting-ip": "198.51.100.7",
    "x-forwarded-for": "203.0.113.9",
  });
  assertEquals(requestClientIp(req, "10.0.0.5"), "10.0.0.5");
});

Deno.test("answers 429 after three submissions even when the spoofed headers rotate", async () => {
  // What stays fixed per client, and which caller-written headers rotate.
  const cases: [
    Record<string, string>,
    (i: number) => Record<string, string>,
  ][] = [
    // Direct to Traefik: X-Real-IP is the caller; both other headers rotate.
    [{ "x-real-ip": "192.0.2.1" }, (i) => ({
      "x-forwarded-for": `203.0.113.${i}`,
      "cf-connecting-ip": `198.18.0.${i}`,
    })],
    // Through Cloudflare: CF-Connecting-IP is the caller; the first hop rotates.
    [
      { "x-real-ip": "104.16.0.1", "cf-connecting-ip": "198.51.100.7" },
      (i) => ({ "x-forwarded-for": `203.0.113.${i}` }),
    ],
    // No Traefik in front: the socket address is the caller.
    [{}, (i) => ({
      "x-forwarded-for": `203.0.113.${i}`,
      "cf-connecting-ip": `198.18.0.${i}`,
    })],
  ];
  for (const [fixed, spoofed] of cases) {
    const limiter = createSubmissionLimiter(() => 0);
    const statuses = [];
    for (let i = 1; i <= 4; i++) {
      const req = request({ ...spoofed(i), ...fixed });
      const res = limitSubmission(limiter, req, SOCKET);
      statuses.push(res?.status ?? 200);
      if (res) {
        assertEquals(res.headers.get("retry-after"), "3600");
        await res.body?.cancel();
      }
    }
    assertEquals(statuses, [200, 200, 200, 429], JSON.stringify(fixed));
  }
});

Deno.test("evicts clients that have been idle past their window", () => {
  let now = 0;
  const limiter = createSubmissionLimiter(() => now);
  for (let i = 0; i < 1000; i++) limiter.check(`198.18.${i >> 8}.${i & 255}`);
  assertEquals(limiter.size, 1000);
  now = SUBMISSION_WINDOW_MS * 2;
  limiter.check("192.0.2.1");
  assertEquals(limiter.size, 1);
});

Deno.test("keys an IPv6 address on its /64, and an IPv4 or IPv4-mapped address on itself", () => {
  assertEquals(clientKey("2001:db8:1:2:aaaa::1"), "2001:db8:1:2::/64");
  assertEquals(
    clientKey("2001:db8:1:2:ffff:ffff:ffff:ffff"),
    "2001:db8:1:2::/64",
  );
  assertEquals(clientKey("2001:db8:1:3::1"), "2001:db8:1:3::/64");
  assertEquals(clientKey("192.0.2.1"), "192.0.2.1");
  assertEquals(clientKey("::ffff:192.0.2.1"), "192.0.2.1");
  assertEquals(clientKey("unknown"), "unknown");
});

Deno.test("answers 429 to the fourth post from different addresses in one IPv6 /64, and another /64 still passes", async () => {
  const limiter = createSubmissionLimiter(() => 0);
  const statuses = [];
  for (let i = 1; i <= 4; i++) {
    const req = request({ "x-real-ip": `2001:db8:1:2::${i.toString(16)}` });
    const res = limitSubmission(limiter, req, SOCKET);
    statuses.push(res?.status ?? 200);
    await res?.body?.cancel();
  }
  assertEquals(statuses, [200, 200, 200, 429]);
  const other = limitSubmission(
    limiter,
    request({ "x-real-ip": "2001:db8:1:3::1" }),
    SOCKET,
  );
  assertEquals(other, null);
  // Through Cloudflare, the visitor's IPv6 address is keyed the same way.
  const viaEdge = createSubmissionLimiter(() => 0);
  for (let i = 1; i <= 3; i++) {
    limitSubmission(
      viaEdge,
      request({
        "x-real-ip": "2606:4700::1",
        "cf-connecting-ip": `2001:db8:9:9::${i}`,
      }),
      SOCKET,
    );
  }
  const fourth = limitSubmission(
    viaEdge,
    request({
      "x-real-ip": "2606:4700::1",
      "cf-connecting-ip": "2001:db8:9:9::99",
    }),
    SOCKET,
  );
  assertEquals(fourth?.status, 429);
  await fourth?.body?.cancel();
});
