import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import { addSubscriber, type AddSubscriberDeps } from "./subscribe.ts";
import type { Subscriber } from "./subscribers.ts";
import { fakeRelay, fakeSender, recordingLog } from "../test/fake-mail.ts";

const BASE = "https://example.com";
const EXISTING: Subscriber = {
  email: "old@example.com",
  subscribedAt: "2026-01-01T00:00:00.000Z",
};

function setup(link: (email: string) => Promise<string>) {
  const relay = fakeRelay();
  const saved: Subscriber[][] = [];
  const log = recordingLog();
  const deps: AddSubscriberDeps = {
    load: () => [{ ...EXISTING }],
    save: (list) => saved.push(structuredClone(list)),
    unsubscribeLink: link,
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

const linkFor = (email: string) =>
  Promise.resolve(`${BASE}/unsubscribe?token=for-${email}`);

Deno.test("saves a new subscriber, then welcomes them with their own unsubscribe link", async () => {
  const { relay, saved, deps } = setup(linkFor);
  const outcome = await addSubscriber("new@example.com", deps);
  await outcome.mails;
  assertEquals([outcome.status, outcome.body], [200, { ok: true }]);
  assertEquals(saved, [[EXISTING, {
    email: "new@example.com",
    subscribedAt: "2026-09-26T00:00:00.000Z",
  }]]);
  const link = `${BASE}/unsubscribe?token=for-new@example.com`;
  const [welcome, notice] = relay.mails;
  assertEquals(welcome.to, ["new@example.com"]);
  assertStringIncludes(String(welcome.text), `Unsubscribe anytime:\n${link}\n`);
  assertEquals(notice.to, ["owner@example.com"]);
  assertStringIncludes(String(notice.text), "Total subscribers: 2");
  assertStringIncludes(String(notice.text), `Unsubscribe: ${link}`);
});

Deno.test("answers 'Already subscribed' for a stored address, and neither saves nor mails", async () => {
  const { relay, saved, deps } = setup(linkFor);
  const outcome = await addSubscriber("old@example.com", deps);
  await outcome.mails;
  assertEquals(outcome.body, { ok: true, message: "Already subscribed" });
  assertEquals([saved.length, relay.mails.length], [0, 0]);
});

Deno.test("answers 500 and saves nothing when the unsubscribe link cannot be built", async () => {
  const { relay, saved, log, deps } = setup(() =>
    Promise.reject(new Error("UNSUBSCRIBE_SECRET is not set"))
  );
  const outcome = await addSubscriber("new@example.com", deps);
  await outcome.mails;
  assertEquals([outcome.status, outcome.body], [500, {
    error: "Server misconfigured",
  }]);
  assertEquals([saved.length, relay.mails.length], [0, 0]);
  assertStringIncludes(
    log.errors[0],
    "[SUBSCRIBE] cannot build unsubscribe link:",
  );
});
