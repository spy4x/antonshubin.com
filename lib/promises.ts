/**
 * The five promises: the single source, like `lib/catalog.ts` is for prices.
 * `/how-i-work` is where this wording was written and reviewed, so it wins
 * whenever another copy disagreed — `routes/how-i-work.tsx`, both llms
 * files, the home page's "How it works" steps and the FAQ's first answer all
 * read from here. `test/proof-promises-notes.test.ts`'s promise guard fails
 * when a title, a full `desc` or a key term shows up hand-written outside
 * this file.
 *
 * This module has no imports on purpose, so tests and scripts can load it
 * without environment access — same reason `lib/catalog.ts` has none.
 */

export type PromiseIcon = "shield" | "target" | "key" | "calendar" | "wrench";

export interface PromiseItem {
  id: string;
  icon: PromiseIcon;
  title: string;
  /** The promise as a noun phrase for use mid-sentence ("a five-day refund"). */
  phrase: string;
  desc: string;
  /** "Why this matters", shown under the promise on /how-i-work. */
  why: string;
}

export const promises: PromiseItem[] = [
  {
    id: "refund",
    icon: "shield",
    title: "Five-day refund",
    phrase: "a five-day refund",
    desc:
      "If in the first five days you feel this is not working, tell me and I refund what you paid.",
    why:
      "In fifteen years the few engagements that needed a refund all showed it within two or three days, so five days is a promise I can keep.",
  },
  {
    id: "first-milestone",
    icon: "target",
    title: "A small first milestone",
    phrase: "a small first milestone",
    desc:
      "We start with one or two weeks of work. If either of us wants to stop at the end of it, we stop — you keep everything built so far.",
    why:
      "You don't have to commit to months of work before we know the collaboration is right.",
  },
  {
    id: "ownership",
    icon: "key",
    title: "You own everything from day one",
    phrase: "full ownership from day one",
    desc: "Code, accounts, servers and keys are in your name.",
    why:
      "Your product is your asset. Nothing about how I work should get in the way of you taking it wherever you need it.",
  },
  {
    id: "weekly-software",
    icon: "calendar",
    title: "Weekly working software",
    phrase: "weekly working software",
    desc:
      "You see working software every week, with a short written update. Calls when they help, not on a schedule for its own sake.",
    why:
      "You always know where the project stands, without sitting through meetings that do not move it forward.",
  },
  {
    id: "free-bugfixes",
    icon: "wrench",
    title: "Free bug fixes for 30 days",
    phrase: "free bug fixes for 30 days",
    desc: "Bugs in what I delivered are fixed free for 30 days.",
    why:
      "I stand behind what I build. If something I shipped breaks, I fix it on my time, not yours.",
  },
];

/** Looks a promise up by id and throws on a typo, so a bad id fails the build, not a visitor. */
export function promise(id: string): PromiseItem {
  const p = promises.find((x) => x.id === id);
  if (!p) throw new Error(`lib/promises.ts: no promise "${id}"`);
  return p;
}

/** Lowercases the first letter — for splicing a promise's `desc` after an em dash or a colon. */
export function decapitalize(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
