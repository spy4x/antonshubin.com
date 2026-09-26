import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "jsr:@std/assert@^1.0.0";
import { denoFileSystem } from "@spy4x/platform/server/deno-fs";
import { FileLock } from "@spy4x/platform/server/file-lock";
import type { FileSystemPort } from "@spy4x/platform/server/ports";
import {
  createSubscriberStore,
  type Subscriber,
  SubscriberFileError,
} from "./subscribers.ts";
import { recordingLog } from "../test/fake-mail.ts";

const AT = "2026-09-26T00:00:00.000Z";
const row = (email: string): Subscriber => ({ email, subscribedAt: AT });

/** Runs `fn` with a fresh temp dir and the subscriber file path in it. */
async function withFile(
  fn: (path: string, dir: string) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir();
  try {
    await fn(`${dir}/subscribers.json`, dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function names(dir: string): Promise<string[]> {
  const out = [];
  for await (const entry of Deno.readDir(dir)) out.push(entry.name);
  return out.sort();
}

Deno.test("reads a missing file as an empty list, and the first write creates it", async () => {
  await withFile(async (path) => {
    const store = createSubscriberStore({ path });
    assertEquals(await store.load(), []);
    await store.update((list) => ({
      list: [...list, row("a@example.com")],
      result: null,
    }));
    assertEquals(await store.load(), [row("a@example.com")]);
  });
});

Deno.test("a raced subscribe and unsubscribe: the removed address stays removed", async () => {
  await withFile(async (path) => {
    for (let round = 0; round < 20; round++) {
      await Deno.writeTextFile(
        path,
        JSON.stringify([row("keep@example.com"), row("leave@example.com")]),
      );
      // Two stores, as two requests would build them.
      const subscribe = createSubscriberStore({ path }).update((list) => ({
        list: [...list, row(`new${round}@example.com`)],
        result: null,
      }));
      const unsubscribe = createSubscriberStore({ path }).update((list) => ({
        list: list.filter((s) => s.email !== "leave@example.com"),
        result: null,
      }));
      await Promise.all([subscribe, unsubscribe]);
      const stored = (await createSubscriberStore({ path }).load())
        .map((s) => s.email);
      assertEquals(stored, ["keep@example.com", `new${round}@example.com`]);
    }
  });
});

Deno.test("refuses to write over a file that is not a subscriber list, keeps it aside and logs it", async () => {
  const cases = [
    `[{"email":"a@example.com","subscribedAt":"${AT}"},{"email":"b@exa`,
    `{"email":"a@example.com"}`,
    `[{"email":"a@example.com"}]`,
  ];
  for (const raw of cases) {
    await withFile(async (path) => {
      await Deno.writeTextFile(path, raw);
      const log = recordingLog();
      const store = createSubscriberStore({ path, log });
      await assertRejects(
        () =>
          store.update((list) => ({
            list: [...list, row("new@example.com")],
            result: null,
          })),
        SubscriberFileError,
      );
      await assertRejects(() => store.load(), SubscriberFileError);
      assertEquals(await Deno.readTextFile(path), raw);
      assertStringIncludes(log.errors[0], "[SUBSCRIBERS]");
      assertEquals(await Deno.readTextFile(`${path}.invalid`), raw);
    });
  }
});

Deno.test("a write that fails on a full disk leaves the old list whole and no temp file", async () => {
  await withFile(async (path, dir) => {
    // Just under a 4 KiB boundary, as in the reproduction on #254.
    const list = [row("keep@example.com")];
    while (JSON.stringify(list, null, 2).length < 4000) {
      list.push(row(`r${list.length}@example.com`));
    }
    const before = JSON.stringify(list, null, 2);
    await Deno.writeTextFile(path, before);
    const full: FileSystemPort = {
      ...denoFileSystem,
      async writeText(file, content) {
        // A full disk takes the first block and refuses the rest.
        await denoFileSystem.writeText(file, content.slice(0, 4096 - 11));
        throw new Error("No space left on device (os error 28)");
      },
    };
    const store = createSubscriberStore({ path, fs: full });
    for (const email of ["keep@example.com", "new@example.com"]) {
      await assertRejects(
        () =>
          store.update((subs) => ({
            list: subs.some((s) => s.email === email)
              ? subs
              : [...subs, row(email)],
            result: null,
          })),
        Error,
        "No space left on device",
      );
    }
    assertEquals(await Deno.readTextFile(path), before);
    assertEquals(await names(dir), [
      "subscribers.json",
      "subscribers.json.lock",
    ]);
    // Once there is room again, the next write works from the whole list.
    const healthy = createSubscriberStore({ path });
    await healthy.update((subs) => ({
      list: [...subs, row("new@example.com")],
      result: null,
    }));
    assertEquals((await healthy.load()).length, list.length + 1);
  });
});

Deno.test("waits for a lock another process holds, and gives up without writing", async () => {
  await withFile(async (path) => {
    await Deno.writeTextFile(path, JSON.stringify([row("a@example.com")]));
    const other = new FileLock({ fs: denoFileSystem, path: `${path}.lock` });
    await other.acquire();
    try {
      const store = createSubscriberStore({
        path,
        lockAttempts: 3,
        lockRetryMs: 1,
      });
      await assertRejects(
        () => store.update(() => ({ list: [], result: null })),
        Error,
        "held by another process",
      );
      assertEquals(await store.load(), [row("a@example.com")]);
    } finally {
      await other.release();
    }
  });
});
