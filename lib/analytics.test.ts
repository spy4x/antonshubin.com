import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  analyticsAllowed,
  eventAttrs,
  linkEvent,
  outboundTo,
  track,
} from "./analytics.ts";

Deno.test("eventAttrs puts each set property in its own data-umami-event-<key> attribute", () => {
  assertEquals(eventAttrs("book", { place: "hero", item: undefined }), {
    "data-umami-event": "book",
    "data-umami-event-place": "hero",
  });
  assertEquals(eventAttrs("not-found"), { "data-umami-event": "not-found" });
});

Deno.test("outboundTo names the site a link leaves for, and null for this site", () => {
  assertEquals(outboundTo("https://github.com/spy4x/mig"), "github");
  assertEquals(outboundTo("https://www.upwork.com/freelancers/x"), "upwork");
  assertEquals(outboundTo("mailto:someone@example.com"), "email");
  assertEquals(
    outboundTo("https://dash.antonshubin.com/"),
    "dash",
  );
  assertEquals(outboundTo("https://www.example.org/x"), "example.org");
  assertEquals(outboundTo("https://antonshubin.com/work"), null);
  assertEquals(outboundTo("/work"), null);
  assertEquals(outboundTo("#brief"), null);
});

Deno.test("linkEvent tells a brief, a Book, another page and another site apart", () => {
  assertEquals(linkEvent("/contact-me#brief", { place: "band" }), {
    "data-umami-event": "brief",
    "data-umami-event-place": "band",
  });
  assertEquals(linkEvent("/#audit-form")["data-umami-event"], "brief");
  assertEquals(linkEvent("/contact-me?service=x")["data-umami-event"], "book");
  assertEquals(linkEvent("/how-i-work", { place: "band" }), {
    "data-umami-event": "cta",
    "data-umami-event-place": "band",
    "data-umami-event-target": "/how-i-work",
  });
  assertEquals(linkEvent("https://t.me/x", { item: "rostok" }), {
    "data-umami-event": "outbound",
    "data-umami-event-to": "telegram",
    "data-umami-event-item": "rostok",
  });
});

Deno.test("the unsubscribe and payment pages are never tracked, other pages are", () => {
  for (
    const path of [
      "/unsubscribe",
      "/unsubscribe/",
      "/subscribe/confirm",
      "/subscribe/confirm/",
      "/pay",
      "/pay/",
    ]
  ) {
    assertEquals(analyticsAllowed(path), false, path);
  }
  for (const path of ["/", "/payments", "/blog/pay", "/contact-me"]) {
    assertEquals(analyticsAllowed(path), true, path);
  }
});

Deno.test("track sends properties to Umami and never throws when Umami does", () => {
  const g = globalThis as { umami?: unknown };
  const calls: unknown[][] = [];
  try {
    g.umami = { track: (...args: unknown[]) => calls.push(args) };
    track("brief-sent", { service: "codebase-health-audit" });
    track("call-booked");
    track("brief-sent", { service: undefined });
    assertEquals(calls, [
      ["brief-sent", { service: "codebase-health-audit" }],
      ["call-booked"],
      ["brief-sent"],
    ]);
    g.umami = {
      track: () => {
        throw new Error("blocked");
      },
    };
    track("call-booked");
    delete g.umami;
    track("call-booked");
  } finally {
    delete g.umami;
  }
});
