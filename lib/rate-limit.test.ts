import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
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
