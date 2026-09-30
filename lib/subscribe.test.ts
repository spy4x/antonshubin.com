import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0";
import {
  confirmSubscription,
  type ConfirmSubscriptionDeps,
  requestSubscription,
  type RequestSubscriptionDeps,
} from "./subscribe.ts";
import { createSubscriberStore, type Subscriber } from "./subscribers.ts";
import { createConfirmToken, verifyConfirmToken } from "./subscribe-token.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const BASE = "https://example.com";
const SECRET = "s".repeat(32);
const EXISTING: Subscriber = {
  email: "old@example.com",
  subscribedAt: "2026-01-01T00:00:00.000Z",
};

function requestSetup(link: (email: string) => Promise<string>) {
  const relay = fakeRelay();
  const log = recordingLog();
  const deps: RequestSubscriptionDeps = {
    confirmLink: link,
    mail: {
      sender: fakeSender(relay),
      contactEmail: "owner@example.com",
      baseUrl: BASE,
      log,
    },
    log,
  };
  return { relay, log, deps };
}

const linkFor = (email: string) =>
  Promise.resolve(`${BASE}/subscribe/confirm?token=for-${email}`);

Deno.test("mails only a confirmation link to a new address, with replies going to the owner", async () => {
  const { relay, deps } = requestSetup(linkFor);
  const outcome = await requestSubscription("new@example.com", deps);
  await outcome.mails;
  assertEquals([outcome.status, outcome.body], [200, { ok: true }]);
  assertEquals(relay.mails.length, 1);
  const [confirmation] = relay.mails;
  assertEquals(confirmation.to, ["new@example.com"]);
  assertStringIncludes(
    String(confirmation.text),
    `${BASE}/subscribe/confirm?token=for-new@example.com`,
  );
  assertEquals(
    JSON.stringify(confirmation.replyTo).includes("owner@example.com"),
    true,
  );
});

Deno.test("answers a stored address exactly as a new one, with the same mail", async () => {
  const known = requestSetup(linkFor);
  const fresh = requestSetup(linkFor);
  const a = await requestSubscription("old@example.com", known.deps);
  const b = await requestSubscription("new@example.com", fresh.deps);
  await Promise.all([a.mails, b.mails]);
  assertEquals([a.status, a.body], [b.status, b.body]);
  assertEquals(known.relay.mails.length, 1);
  assertEquals(fresh.relay.mails.length, 1);
  // requestSubscription has no way to reach the list: its deps hold no store.
  assertEquals(Object.keys(known.deps).sort(), ["confirmLink", "log", "mail"]);
});

Deno.test("answers 400 to an email field that is not a bare address, and mails nothing", async () => {
  const refused = [
    `"Your-account-is-locked,verify-at-https://evil.example/x"<victim@example.com>`,
    "a<victim@example.com>",
    `"Verify at https://evil.example"<victim@example.com>`,
    "Jane <jane@example.com>",
    ["jane@example.com"],
    `${"a".repeat(65)}@example.com`,
    undefined,
  ];
  for (const field of refused) {
    const { relay, deps } = requestSetup(linkFor);
    const outcome = await requestSubscription(field, deps);
    await outcome.mails;
    assertEquals([outcome.status, outcome.body], [400, {
      error: "Valid email is required",
    }], JSON.stringify(field) ?? "undefined");
    assertEquals(relay.mails.length, 0, JSON.stringify(field) ?? "undefined");
  }
});

Deno.test("asks for a link to the trimmed, lowercased address", async () => {
  const asked: string[] = [];
  const { deps } = requestSetup((email) => {
    asked.push(email);
    return linkFor(email);
  });
  await (await requestSubscription("  New@Example.COM ", deps)).mails;
  assertEquals(asked, ["new@example.com"]);
});

Deno.test("answers 500 and mails nothing when the confirmation link cannot be built", async () => {
  for (const email of ["new@example.com", "old@example.com"]) {
    const { relay, log, deps } = requestSetup(() =>
      Promise.reject(new Error("UNSUBSCRIBE_SECRET is not set"))
    );
    const outcome = await requestSubscription(email, deps);
    await outcome.mails;
    assertEquals([outcome.status, outcome.body], [500, {
      error: "Server misconfigured",
    }], email);
    assertEquals(relay.mails.length, 0);
    assertStringIncludes(
      log.errors[0],
      "[SUBSCRIBE] cannot build confirmation link:",
    );
  }
});

function confirmSetup(
  start: Subscriber[] = [EXISTING],
  now = () => Date.now(),
) {
  const relay = fakeRelay();
  const saved: Subscriber[][] = [];
  const log = recordingLog();
  const deps: ConfirmSubscriptionDeps = {
    update: async (change) => {
      const outcome = await change(structuredClone(start));
      if (outcome.list) {
        saved.push(structuredClone(outcome.list));
        start = outcome.list;
      }
      return outcome.result;
    },
    verify: (token) => verifyConfirmToken(token, SECRET, now),
    unsubscribeLink: (email) =>
      Promise.resolve(`${BASE}/unsubscribe?token=for-${email}`),
    mail: {
      sender: fakeSender(relay),
      contactEmail: "owner@example.com",
      baseUrl: BASE,
      log,
    },
    now: () => new Date("2026-09-26T00:00:00.000Z"),
    log,
  };
  return { relay, saved, log, deps };
}

Deno.test("confirming adds the address, then welcomes it and tells the owner", async () => {
  const { relay, saved, deps } = confirmSetup();
  const token = await createConfirmToken("new@example.com", SECRET);
  const outcome = await confirmSubscription(token, deps);
  assert(outcome.state === "confirmed");
  await outcome.mails;
  assertEquals(outcome.email, "new@example.com");
  assertEquals(saved, [[EXISTING, {
    email: "new@example.com",
    subscribedAt: "2026-09-26T00:00:00.000Z",
  }]]);
  const [welcome, notice] = relay.mails;
  assertEquals(welcome.to, ["new@example.com"]);
  assertStringIncludes(
    String(welcome.text),
    `Unsubscribe anytime:\n${BASE}/unsubscribe?token=for-new@example.com\n`,
  );
  assertEquals(
    JSON.stringify(welcome.replyTo).includes("owner@example.com"),
    true,
  );
  assertEquals(notice.to, ["owner@example.com"]);
  assertStringIncludes(String(notice.text), "Total subscribers: 2");
});

Deno.test("confirming twice adds one row and sends one welcome", async () => {
  const { relay, saved, deps } = confirmSetup();
  const token = await createConfirmToken("new@example.com", SECRET);
  for (let i = 0; i < 2; i++) {
    const outcome = await confirmSubscription(token, deps);
    assertEquals(outcome.state, "confirmed");
    if (outcome.state === "confirmed") await outcome.mails;
  }
  assertEquals(saved.length, 1);
  assertEquals(relay.mails.length, 2, "one welcome and one owner notice");
});

Deno.test("refuses a forged, foreign or altered token and stores nothing", async () => {
  const { relay, saved, deps } = confirmSetup();
  const good = await createConfirmToken("new@example.com", SECRET);
  const [payload, signature] = good.split(".");
  const other = await createConfirmToken("victim@example.com", SECRET);
  const foreignSecret = await createConfirmToken(
    "new@example.com",
    "f".repeat(32),
  );
  const tokens = [
    "forged",
    "",
    foreignSecret,
    `${other.split(".")[0]}.${signature}`,
    `${payload}.${other.split(".")[1]}`,
  ];
  for (const token of tokens) {
    const outcome = await confirmSubscription(token, deps);
    assertEquals(outcome.state, "invalid", token);
  }
  assertEquals([saved.length, relay.mails.length], [0, 0]);
});

Deno.test("refuses an unsubscribe token as a confirmation", async () => {
  const { createUnsubscribeToken } = await import("./unsubscribe.ts");
  const { deps, saved } = confirmSetup();
  const token = await createUnsubscribeToken("new@example.com", SECRET);
  assertEquals((await confirmSubscription(token, deps)).state, "invalid");
  assertEquals(saved.length, 0);
});

Deno.test("refuses a token after three days as expired, and stores nothing", async () => {
  let clock = Date.parse("2026-09-26T00:00:00.000Z");
  const { relay, saved, deps } = confirmSetup([EXISTING], () => clock);
  const token = await createConfirmToken(
    "new@example.com",
    SECRET,
    () => clock,
  );
  clock += 3 * 24 * 60 * 60 * 1000 - 1;
  assertEquals((await confirmSubscription(token, deps)).state, "confirmed");
  const later = confirmSetup([EXISTING], () => clock + 2);
  assertEquals((await confirmSubscription(token, later.deps)).state, "expired");
  assertEquals([saved.length, later.saved.length, relay.mails.length > 0], [
    1,
    0,
    true,
  ]);
});

Deno.test("answers error and stores nothing when the unsubscribe link cannot be built", async () => {
  const { relay, saved, log, deps } = confirmSetup();
  deps.unsubscribeLink = () => Promise.reject(new Error("no secret"));
  const token = await createConfirmToken("new@example.com", SECRET);
  assertEquals((await confirmSubscription(token, deps)).state, "error");
  assertEquals([saved.length, relay.mails.length], [0, 0]);
  assertStringIncludes(
    log.errors[0],
    "[SUBSCRIBE] cannot build unsubscribe link:",
  );
});

Deno.test("answers error when the list cannot be saved, and mails nothing", async () => {
  const { relay, deps } = confirmSetup();
  deps.update = () => Promise.reject(new Error("read-only file system"));
  const token = await createConfirmToken("new@example.com", SECRET);
  assertEquals((await confirmSubscription(token, deps)).state, "error");
  assertEquals(relay.mails.length, 0);
});

Deno.test("stores every one of ten concurrent confirmations", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const store = createSubscriberStore({ path: `${dir}/subscribers.json` });
    const { deps } = confirmSetup();
    deps.update = store.update;
    const emails = Array.from({ length: 10 }, (_, i) => `n${i}@example.com`);
    const outcomes = await Promise.all(
      emails.map(async (email) =>
        confirmSubscription(await createConfirmToken(email, SECRET), deps)
      ),
    );
    for (const o of outcomes) if (o.state === "confirmed") await o.mails;
    assertEquals(outcomes.map((o) => o.state), emails.map(() => "confirmed"));
    assertEquals((await store.load()).map((s) => s.email).sort(), emails);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
