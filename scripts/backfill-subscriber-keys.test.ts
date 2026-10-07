import { assertEquals, assertStringIncludes } from "jsr:@std/assert@^1.0.0";
import { createSubscriptionCrypto } from "@spy4x/server/subscribers";
import { createFileSubscriberStore } from "@spy4x/server/subscribers/file";
import { backfillKeys } from "./backfill-subscriber-keys.ts";

const SECRET = "b".repeat(32);
const CRYPTO = createSubscriptionCrypto({ secret: SECRET });

/** A list in today's format: two rows from before #405 and one with a key. */
async function writeList(path: string) {
  await Deno.writeTextFile(
    path,
    JSON.stringify([
      { email: "one@example.com", subscribedAt: "2026-01-01T00:00:00.000Z" },
      { email: "two@example.com", subscribedAt: "2026-02-01T00:00:00.000Z" },
      {
        email: "three@example.com",
        subscribedAt: "2026-03-01T00:00:00.000Z",
        key: await CRYPTO.subscriberKey("three@example.com"),
      },
    ]),
  );
}

Deno.test("the backfill keys every row once, and a second run changes nothing", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = `${dir}/subscribers.json`;
    await writeList(path);
    const store = createFileSubscriberStore({ path });
    assertEquals(await backfillKeys(store, CRYPTO), { added: 2, total: 3 });
    const after = await Deno.readTextFile(path);
    assertEquals(await backfillKeys(store, CRYPTO), { added: 0, total: 3 });
    assertEquals(await Deno.readTextFile(path), after);
    const rows = JSON.parse(after) as { email: string; key?: string }[];
    for (const row of rows) {
      assertEquals(row.key, await CRYPTO.subscriberKey(row.email), row.email);
    }
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("after the backfill a newsletter's version 2 unsubscribe link finds a row stored before #405", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = `${dir}/subscribers.json`;
    await writeList(path);
    const store = createFileSubscriberStore({ path });
    const token = await CRYPTO.unsubscribeToken("one@example.com");
    assertEquals(await CRYPTO.verifyUnsubscribeToken(token, store), undefined);
    await backfillKeys(store, CRYPTO);
    assertEquals(
      (await CRYPTO.verifyUnsubscribeToken(token, store))?.email,
      "one@example.com",
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("the backfill script prints counts and no address", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = `${dir}/subscribers.json`;
    await writeList(path);
    const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        `--allow-write=${dir}`,
        "--allow-env",
        "scripts/backfill-subscriber-keys.ts",
      ],
      env: { SUBSCRIBERS_FILE: path, UNSUBSCRIBE_SECRET: SECRET },
    }).output();
    const out = new TextDecoder().decode(stdout) +
      new TextDecoder().decode(stderr);
    assertEquals(code, 0, out);
    assertStringIncludes(out, "2 of 3 rows got a key; 1 already had one.");
    assertEquals(out.includes("@example.com"), false, out);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
