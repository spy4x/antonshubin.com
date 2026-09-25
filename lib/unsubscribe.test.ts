import { assert, assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import {
  createUnsubscribeToken,
  findSubscriberByToken,
  unsubscribeLink,
  verifyUnsubscribeToken,
} from "./unsubscribe.ts";
import { getUnsubscribeSecret } from "./config.ts";
import { oldCodeToken } from "../test/old-unsubscribe-token.ts";

const SECRET_A = "a".repeat(32);
const SECRET_B = "b".repeat(32);

Deno.test("a token verifies for the email and secret it was signed with", async () => {
  const token = await createUnsubscribeToken("user@example.com", SECRET_A);
  assert(await verifyUnsubscribeToken("user@example.com", token, SECRET_A));
});

Deno.test("normalizes email the same way subscribe.ts stores it before comparing", async () => {
  const token = await createUnsubscribeToken("  User@Example.com  ", SECRET_A);
  assert(await verifyUnsubscribeToken("user@example.com", token, SECRET_A));
});

Deno.test("rejects a token checked against a different email", async () => {
  const token = await createUnsubscribeToken("user@example.com", SECRET_A);
  assert(!(await verifyUnsubscribeToken("other@example.com", token, SECRET_A)));
});

Deno.test("rejects a token checked under a different secret", async () => {
  const token = await createUnsubscribeToken("user@example.com", SECRET_A);
  assert(!(await verifyUnsubscribeToken("user@example.com", token, SECRET_B)));
});

Deno.test("rejects a malformed token instead of throwing", async () => {
  assert(
    !(await verifyUnsubscribeToken(
      "user@example.com",
      "not-base64url!!",
      SECRET_A,
    )),
  );
  assert(!(await verifyUnsubscribeToken("user@example.com", "", SECRET_A)));
});

Deno.test("findSubscriberByToken returns the one subscriber a token was issued for", async () => {
  const subscribers = [
    { email: "a@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
    { email: "b@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
  ];
  const token = await createUnsubscribeToken("b@example.com", SECRET_A);
  const match = await findSubscriberByToken(subscribers, token, SECRET_A);
  assertEquals(match?.email, "b@example.com");
});

Deno.test("findSubscriberByToken can't tell a forged token from an already-removed address", async () => {
  const subscribers = [
    { email: "a@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
  ];
  // A token forged under the wrong secret ...
  const forged = await createUnsubscribeToken("a@example.com", SECRET_B);
  assertEquals(
    await findSubscriberByToken(subscribers, forged, SECRET_A),
    undefined,
  );
  // ... and a real token for an address no longer in the list both answer
  // the same way: no match. Neither the caller nor whoever holds the link
  // can distinguish the two cases from the result alone.
  const staleToken = await createUnsubscribeToken(
    "removed@example.com",
    SECRET_A,
  );
  assertEquals(
    await findSubscriberByToken(subscribers, staleToken, SECRET_A),
    undefined,
  );
});

Deno.test("getUnsubscribeSecret throws when UNSUBSCRIBE_SECRET is unset", () => {
  const prior = Deno.env.get("UNSUBSCRIBE_SECRET");
  Deno.env.delete("UNSUBSCRIBE_SECRET");
  try {
    let threw = false;
    try {
      getUnsubscribeSecret();
    } catch {
      threw = true;
    }
    assert(threw, "must throw when UNSUBSCRIBE_SECRET is unset");
  } finally {
    if (prior !== undefined) Deno.env.set("UNSUBSCRIBE_SECRET", prior);
  }
});

Deno.test("getUnsubscribeSecret throws when UNSUBSCRIBE_SECRET is shorter than 32 characters", () => {
  const prior = Deno.env.get("UNSUBSCRIBE_SECRET");
  Deno.env.set("UNSUBSCRIBE_SECRET", "too-short");
  try {
    let threw = false;
    try {
      getUnsubscribeSecret();
    } catch {
      threw = true;
    }
    assert(threw, "must throw when UNSUBSCRIBE_SECRET is under 32 characters");
  } finally {
    if (prior === undefined) Deno.env.delete("UNSUBSCRIBE_SECRET");
    else Deno.env.set("UNSUBSCRIBE_SECRET", prior);
  }
});

Deno.test("unsubscribeLink builds a BASE_URL link carrying an encoded, verifiable token", async () => {
  const prior = Deno.env.get("UNSUBSCRIBE_SECRET");
  Deno.env.set("UNSUBSCRIBE_SECRET", SECRET_A);
  try {
    const link = await unsubscribeLink("user@example.com");
    const url = new URL(link);
    assertEquals(url.pathname, "/unsubscribe");
    const token = url.searchParams.get("token");
    assert(token, "link must carry a token query param");
    assert(await verifyUnsubscribeToken("user@example.com", token!, SECRET_A));
  } finally {
    if (prior === undefined) Deno.env.delete("UNSUBSCRIBE_SECRET");
    else Deno.env.set("UNSUBSCRIBE_SECRET", prior);
  }
});

Deno.test("unsubscribeLink rejects when UNSUBSCRIBE_SECRET is missing, before touching storage", async () => {
  const prior = Deno.env.get("UNSUBSCRIBE_SECRET");
  Deno.env.delete("UNSUBSCRIBE_SECRET");
  try {
    await assertRejects(() => unsubscribeLink("user@example.com"));
  } finally {
    if (prior !== undefined) Deno.env.set("UNSUBSCRIBE_SECRET", prior);
  }
});

// ── #233: the ts-libs codec format, and links sent before it ─────────────

/** Produced by the pre-#233 `createUnsubscribeToken("user@example.com",
 * SECRET_A)` on origin/main at 042df38. */
const OLD_TOKEN_LITERAL = "oVzVbqNqkv9tmkTtVtYFuhqkv5Z_zcrst9MqqqcBQk4"; // gitleaks:allow

/** What `createUnsubscribeToken("user@example.com", SECRET_A)` returns in the
 * codec format. Pinned so a change to the purpose, version, payload or bound
 * context — which would break every link already sent — fails here. */
const NEW_TOKEN_LITERAL = // gitleaks:allow
  "eyJwdXJwb3NlIjoidW5zdWJzY3JpYmUiLCJ2ZXJzaW9uIjoxLCJwYXlsb2FkIjp7fX0." +
  "DEwtNhLMmOB45aqDyVYaop6_lt6rH5WBLSDVeoyLDYA";

const SUBSCRIBERS = [
  { email: "a@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
  { email: "user@example.com", subscribedAt: "2026-01-02T00:00:00.000Z" },
];

Deno.test("signs new links in the codec format, with no address in the token", async () => {
  const token = await createUnsubscribeToken(" User@Example.com ", SECRET_A);
  assertEquals(token, NEW_TOKEN_LITERAL);
  const [envelope] = token.split(".");
  const json = atob(envelope.replaceAll("-", "+").replaceAll("_", "/"));
  assertEquals(JSON.parse(json), {
    purpose: "unsubscribe",
    version: 1,
    payload: {},
  });
  assert(!token.toLowerCase().includes("example"));
});

Deno.test("a pinned token from the old code still finds its subscriber", async () => {
  assertEquals(
    await oldCodeToken("user@example.com", SECRET_A),
    OLD_TOKEN_LITERAL,
  );
  const match = await findSubscriberByToken(
    SUBSCRIBERS,
    OLD_TOKEN_LITERAL,
    SECRET_A,
  );
  assertEquals(match?.email, "user@example.com");
  assert(
    await verifyUnsubscribeToken(
      "user@example.com",
      OLD_TOKEN_LITERAL,
      SECRET_A,
    ),
  );
});

Deno.test("an old-code token computed for any address still finds that subscriber", async () => {
  const token = await oldCodeToken("A@example.com ", SECRET_A);
  const match = await findSubscriberByToken(SUBSCRIBERS, token, SECRET_A);
  assertEquals(match?.email, "a@example.com");
});

Deno.test("an old-code token under another secret, or for a removed address, matches nobody", async () => {
  const foreign = await oldCodeToken("user@example.com", SECRET_B);
  assertEquals(
    await findSubscriberByToken(SUBSCRIBERS, foreign, SECRET_A),
    undefined,
  );
  assert(
    !(await verifyUnsubscribeToken("user@example.com", foreign, SECRET_A)),
  );
  const removed = await oldCodeToken("gone@example.com", SECRET_A);
  assertEquals(
    await findSubscriberByToken(SUBSCRIBERS, removed, SECRET_A),
    undefined,
  );
});

Deno.test("refuses, without throwing, a copy of an old token that is not in the old shape", async () => {
  // Only the exact old shape reaches the old verifier: 43 base64url
  // characters. The old code refused these three as well, so nothing changes
  // for them; the 44-character one guards the shape check itself, because a
  // longer token that got through would reach `atob` and throw.
  for (
    const token of [
      `${OLD_TOKEN_LITERAL}=`,
      `${OLD_TOKEN_LITERAL}A`,
      OLD_TOKEN_LITERAL.slice(0, 42),
    ]
  ) {
    assertEquals(
      await findSubscriberByToken(SUBSCRIBERS, token, SECRET_A),
      undefined,
      token,
    );
  }
});

Deno.test("getUnsubscribeSecret refuses a secret the codec would refuse", () => {
  const prior = Deno.env.get("UNSUBSCRIBE_SECRET");
  try {
    for (const secret of [` ${"x".repeat(30)} `, `${"x".repeat(31)}é`]) {
      Deno.env.set("UNSUBSCRIBE_SECRET", secret);
      let threw = false;
      try {
        getUnsubscribeSecret();
      } catch {
        threw = true;
      }
      assert(threw, `must throw for ${JSON.stringify(secret)}`);
    }
    Deno.env.set("UNSUBSCRIBE_SECRET", `  ${SECRET_A}  `);
    assertEquals(getUnsubscribeSecret(), `  ${SECRET_A}  `);
  } finally {
    if (prior === undefined) Deno.env.delete("UNSUBSCRIBE_SECRET");
    else Deno.env.set("UNSUBSCRIBE_SECRET", prior);
  }
});
