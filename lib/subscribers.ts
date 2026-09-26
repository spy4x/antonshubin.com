/**
 * File-backed newsletter subscriber storage. `routes/api/subscribe.ts`,
 * `routes/unsubscribe.tsx` and `scripts/send-newsletter.ts` all read and write
 * the list through this module, so they agree on the file path and on what a
 * failure means.
 *
 * Every change is one read-change-write under a lock (#254): an in-process
 * queue orders the server's own requests, and a lock file next to the list
 * (`@spy4x/platform/server/file-lock`) keeps another process out. The write
 * replaces the file atomically (`@spy4x/platform/server/atomic-json`: a temp
 * file, then `rename`), so a failed write, a full disk above all, leaves the
 * old list whole. A file that does not parse as a list is an error, never an
 * empty list: its raw text is kept aside in `<file>.invalid` and nothing
 * writes over it until a person repairs it.
 *
 * The path is read from `SUBSCRIBERS_FILE` at call time (not a module-level
 * constant), so tests can point it at a temp file per run instead of the
 * repo's `data/subscribers.json`.
 */
import { type } from "arktype";
import {
  atomicWriteJson,
  readJsonFile,
} from "@spy4x/platform/server/atomic-json";
import { denoFileSystem } from "@spy4x/platform/server/deno-fs";
import { FileLock } from "@spy4x/platform/server/file-lock";
import type { FileSystemPort } from "@spy4x/platform/server/ports";

export interface Subscriber {
  email: string;
  subscribedAt: string;
}

const SUBSCRIBER_LIST = type({ email: "string", subscribedAt: "string" })
  .array();

/** The subscriber file exists but does not hold a subscriber list. */
export class SubscriberFileError extends Error {
  override readonly name = "SubscriberFileError";
}

/** What a change to the list returns: the new list to write, if any, and a
 * result for the caller. Leaving out `list` writes nothing. */
export interface SubscriberChange<T> {
  list?: Subscriber[];
  result: T;
}

/** Reads and changes one subscriber file. */
export interface SubscriberStore {
  /** The list; `[]` when the file does not exist yet. Throws
   * {@link SubscriberFileError} when it cannot be parsed. */
  load(): Promise<Subscriber[]>;
  /** Runs `change` on the current list under the lock and writes the list it
   * returns. Throws when the file cannot be parsed or the write fails; the
   * file on disk is then unchanged. */
  update<T>(
    change: (
      list: Subscriber[],
    ) => SubscriberChange<T> | Promise<SubscriberChange<T>>,
  ): Promise<T>;
}

/** Options for {@link createSubscriberStore}. */
export interface SubscriberStoreOptions {
  path: string;
  /** Defaults to the real filesystem; a test passes a failing one. */
  fs?: FileSystemPort;
  log?: { error(...args: unknown[]): void };
  /** How often and how long to retry a lock another process holds. */
  lockAttempts?: number;
  lockRetryMs?: number;
}

/** One queue per file path, shared by every store in this process. */
const queues = new Map<string, Promise<unknown>>();

/** Runs `task` after every earlier task for `key` has settled. */
function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const settled = run.then(() => {}, () => {});
  queues.set(key, settled);
  settled.then(() => {
    if (queues.get(key) === settled) queues.delete(key);
  });
  return run;
}

let writeSequence = 0;

/** A store for the subscriber file at `options.path`. */
export function createSubscriberStore(
  options: SubscriberStoreOptions,
): SubscriberStore {
  const fs = options.fs ?? denoFileSystem;
  const log = options.log ?? console;
  const path = options.path;
  const attempts = options.lockAttempts ?? 100;
  const retryMs = options.lockRetryMs ?? 20;

  async function load(): Promise<Subscriber[]> {
    const read = await readJsonFile<unknown>(fs, path);
    if (read.kind === "missing") return [];
    const reason = read.kind === "invalid"
      ? read.reason
      : invalidReason(read.value);
    if (reason === null && read.kind === "ok") {
      return read.value as Subscriber[];
    }
    const raw = read.kind === "invalid" ? read.raw : JSON.stringify(read.value);
    const aside = await setAside(raw);
    const error = new SubscriberFileError(
      `${path} is not a subscriber list (${reason}); ${aside}; nothing is ` +
        `written until it is repaired`,
    );
    log.error("[SUBSCRIBERS]", error.message);
    throw error;
  }

  /**
   * Keeps the first unparseable copy in `<file>.invalid`; a later one is not
   * written over it. Returns what happened, for the error message.
   */
  async function setAside(raw: string): Promise<string> {
    const invalid = `${path}.invalid`;
    try {
      if (await fs.exists(invalid)) {
        return `an earlier copy is already kept in ${invalid}, so this text ` +
          `was not kept`;
      }
      await fs.writeText(invalid, raw);
      return `its text is kept in ${invalid}`;
    } catch (err) {
      log.error("[SUBSCRIBERS] could not keep the unparseable file:", err);
      return `its text could not be kept in ${invalid}`;
    }
  }

  async function withFileLock<T>(task: () => Promise<T>): Promise<T> {
    const lock = new FileLock({ fs, path: `${path}.lock` });
    for (let attempt = 1; !(await lock.tryAcquire()); attempt++) {
      if (attempt >= attempts) {
        throw new Error(`${path}.lock is held by another process`);
      }
      await new Promise((resolve) => setTimeout(resolve, retryMs));
    }
    try {
      return await task();
    } finally {
      await lock.release();
    }
  }

  function update<T>(
    change: (
      list: Subscriber[],
    ) => SubscriberChange<T> | Promise<SubscriberChange<T>>,
  ): Promise<T> {
    return enqueue(path, () =>
      withFileLock(async () => {
        const outcome = await change(await load());
        if (outcome.list) {
          await atomicWriteJson(fs, path, outcome.list, {
            pid: Deno.pid,
            sequence: ++writeSequence,
          });
        }
        return outcome.result;
      }));
  }

  return { load, update };
}

/** Why a parsed value is not a subscriber list, or `null` when it is one. */
function invalidReason(value: unknown): string | null {
  const checked = SUBSCRIBER_LIST(value);
  return checked instanceof type.errors ? checked.summary : null;
}

function dataFile(): string {
  return Deno.env.get("SUBSCRIBERS_FILE") || "data/subscribers.json";
}

/** The list in `SUBSCRIBERS_FILE`; see {@link SubscriberStore.load}. */
export function loadSubscribers(): Promise<Subscriber[]> {
  return createSubscriberStore({ path: dataFile() }).load();
}

/** Changes the list in `SUBSCRIBERS_FILE`; see {@link SubscriberStore.update}. */
export function updateSubscribers<T>(
  change: (
    list: Subscriber[],
  ) => SubscriberChange<T> | Promise<SubscriberChange<T>>,
): Promise<T> {
  return createSubscriberStore({ path: dataFile() }).update(change);
}
