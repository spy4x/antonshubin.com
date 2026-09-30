import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  recordUnsubscribe,
  unsubscribedSince,
  unsubscribeMark,
} from "./unsubscribed.ts";
import {
  CONFIRM_TTL_MS,
  createConfirmToken,
  verifyConfirmToken,
} from "./subscribe-token.ts";

const SECRET = "s".repeat(32);
const NOW = new Date("2026-09-30T12:00:00.000Z");

Deno.test("the record holds a keyed hash, never the address, and ignores case and padding", async () => {
  const marks = await recordUnsubscribe(
    [],
    " Reader@Example.com ",
    SECRET,
    NOW,
  );
  assertEquals(marks.length, 1);
  assert(!JSON.stringify(marks).toLowerCase().includes("reader"));
  assertEquals(
    marks[0].mark,
    await unsubscribeMark("reader@example.com", SECRET),
  );
  assert(
    marks[0].mark !==
      await unsubscribeMark("reader@example.com", "t".repeat(32)),
  );
});

Deno.test("a token issued before the unsubscribe is a replay, one issued after it is not", async () => {
  const marks = await recordUnsubscribe([], "reader@example.com", SECRET, NOW);
  const t = NOW.getTime();
  assertEquals(
    await unsubscribedSince(marks, "reader@example.com", SECRET, t - 1000),
    true,
  );
  assertEquals(
    await unsubscribedSince(marks, "reader@example.com", SECRET, t),
    true,
  );
  assertEquals(
    await unsubscribedSince(marks, "reader@example.com", SECRET, t + 1),
    false,
  );
  assertEquals(
    await unsubscribedSince(marks, "other@example.com", SECRET, t - 1000),
    false,
  );
});

Deno.test("recording drops marks no token can match any more and replaces the same address's mark", async () => {
  const old = new Date(NOW.getTime() - CONFIRM_TTL_MS - 1);
  const recent = new Date(NOW.getTime() - CONFIRM_TTL_MS + 60_000);
  let marks = await recordUnsubscribe([], "old@example.com", SECRET, old);
  marks = await recordUnsubscribe(marks, "recent@example.com", SECRET, recent);
  marks = await recordUnsubscribe(marks, "recent@example.com", SECRET, NOW);
  marks = await recordUnsubscribe(marks, "new@example.com", SECRET, NOW);
  assertEquals(marks.length, 2);
  assertEquals(
    await unsubscribedSince(marks, "old@example.com", SECRET, 0),
    false,
  );
  assertEquals(
    await unsubscribedSince(marks, "recent@example.com", SECRET, NOW.getTime()),
    true,
  );
});

Deno.test("a confirmation token reports when it was issued", async () => {
  const issued = Date.UTC(2026, 8, 30, 9);
  const token = await createConfirmToken(
    "reader@example.com",
    SECRET,
    () => issued,
  );
  const checked = await verifyConfirmToken(token, SECRET, () => issued + 1000);
  assertEquals(checked, {
    ok: true,
    email: "reader@example.com",
    issuedAt: issued,
  });
});
