/**
 * Stages the made-up data the Seed demo clip shows, on a local Seed dev stack
 * (`deno task dev` in a Seed checkout, at http://app.localhost).
 *
 * Expects Seed's own `deno task db:seed` to have run first: it creates
 * demo@example.com and its group "Demo team". This script signs the demo user
 * in, names them, signs up two made-up teammates through the same sign-up
 * the product uses (the code comes from Seed's dev-only last-mail route),
 * adds them to "Demo team" with roles, creates three tags and four notes, and
 * dismisses the first-steps card. It writes the demo user's signed-in
 * browser state for the app and the admin host to the paths given, so the
 * recording starts signed in and shows no sign-in.
 *
 * Usage: SEED_PASSWORD=… deno run -A scripts/clips/seed/stage.ts <app-state.json> <admin-state.json>
 */
import { type APIRequestContext, chromium, type Page } from "playwright";

/**
 * Seed's API takes client-made version 7 ids. This site pins a @spy4x/platform without the uuid
 * module, so the import resolves at run time through the cloned Seed's import map (record.sh runs
 * this file with `--config <seed>/apps/mpa/deno.json`); a non-literal specifier keeps this repo's
 * type check and lockfile out of it.
 */
const UUID_MODULE = ["@spy4x/platform", "universal", "uuid"].join("/");
const { uuidV7 } = await import(UUID_MODULE) as { uuidV7: () => string };

const APP = "http://app.localhost";
const ADMIN = "http://admin.localhost";
const DEMO = "demo@example.com";
const sameOrigin = { origin: APP, "sec-fetch-site": "same-origin" };

interface Person {
  email: string;
  firstName: string;
  lastName: string;
  role: 1 | 2 | 3;
}

/** Made-up teammates on example.com addresses. */
const TEAM: Person[] = [
  {
    email: "maya.chen@example.com",
    firstName: "Maya",
    lastName: "Chen",
    role: 3,
  },
  {
    email: "tom.becker@example.com",
    firstName: "Tom",
    lastName: "Becker",
    role: 2,
  },
];

const TAGS = [
  { name: "Roadmap", color: "purple" },
  { name: "Customers", color: "blue" },
  { name: "Bug", color: "red" },
] as const;

/** Oldest first; `by` is the author's index in TEAM, or -1 for the demo user. */
const NOTES = [
  {
    title: "Interview notes: three design agencies",
    body: "All three bill per seat. Two of them work offline on trains.",
    tags: ["Customers"],
    by: 1,
  },
  {
    title: "Checkout rejects VAT numbers with spaces",
    body: "Strip the spaces before we send the tax id.",
    tags: ["Bug"],
    by: 0,
  },
  {
    title: "Pricing page: copy review",
    body: "Lead with the price, then what the plan covers.",
    tags: ["Customers"],
    by: -1,
  },
  {
    title: "Q4 roadmap: onboarding and billing",
    body: "Self-serve onboarding first, then annual plans.",
    tags: ["Roadmap"],
    by: 0,
  },
];

async function ok(
  what: string,
  response: { status(): number; text(): Promise<string> },
) {
  if (![200, 201, 204].includes(response.status())) {
    throw new Error(`${what}: ${response.status()} ${await response.text()}`);
  }
}

/** The newest dev mail to `email`, from Seed's dev-only route. */
async function lastMail(
  api: APIRequestContext,
  email: string,
): Promise<string | null> {
  const response = await api.post(`${APP}/api/test/last-mail`, {
    data: { email },
  });
  return response.ok()
    ? ((await response.json()) as { text: string }).text
    : null;
}

/** Signs `person` up as a new person does: address and password, then the mailed code. */
async function signUp(
  api: APIRequestContext,
  person: Person,
  password: string,
) {
  await api.post(`${APP}/api/test/cleanup-user`, {
    data: { login: person.email },
  });
  const before = await lastMail(api, person.email);
  await ok(
    `sign-up of ${person.email}`,
    await api.post(`${APP}/api/auth/password/sign-up`, {
      headers: sameOrigin,
      data: { email: person.email, password },
    }),
  );
  let code = "";
  for (let attempt = 0; attempt < 40 && !code; attempt++) {
    const text = await lastMail(api, person.email);
    if (text && text !== before) code = text.split("\n\n")[1].trim();
    else await new Promise((r) => setTimeout(r, 500));
  }
  if (!code) {
    throw new Error(`no sign-up code mailed to ${person.email} within 20 s`);
  }
  await ok(
    `code of ${person.email}`,
    await api.post(`${APP}/api/auth/password/sign-up/verify`, {
      headers: sameOrigin,
      data: { code },
    }),
  );
  await ok(
    `name of ${person.email}`,
    await api.patch(`${APP}/api/users/me`, {
      headers: sameOrigin,
      data: { firstName: person.firstName, lastName: person.lastName },
    }),
  );
}

/** Signs the demo user in through the form. A fresh dev stack compiles on first load and its
 * Vite servers may restart meanwhile, so a page that shows no form within 2 minutes is loaded
 * again. */
async function signInForm(page: Page, base: string, password: string) {
  const login = page.getByLabel(/^E-mail or username/);
  for (let attempt = 1;; attempt++) {
    try {
      await page.goto(`${base}/sign-in`, {
        waitUntil: "commit",
        timeout: 120_000,
      });
      await login.waitFor({ timeout: 120_000 });
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      console.log(
        `${base}: no sign-in form yet (try ${attempt}), loading again`,
      );
    }
  }
  await login.fill(DEMO);
  await page.locator("input[type=password]").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${base}/`);
}

async function main() {
  const [appStatePath, adminStatePath] = Deno.args;
  const password = Deno.env.get("SEED_PASSWORD");
  if (!appStatePath || !adminStatePath) {
    throw new Error("usage: stage.ts <app-state> <admin-state>");
  }
  if (!password) {
    throw new Error("SEED_PASSWORD is required: the demo user's password");
  }
  const teamPassword = `Tm-${
    crypto.getRandomValues(new Uint32Array(3)).join("")
  }`;

  const browser = await chromium.launch();
  try {
    const demoContext = await browser.newContext();
    const demo = await demoContext.newPage();
    await signInForm(demo, APP, password);
    const me = await demo.request.get(`${APP}/api/users/me`);
    await ok("profile", me);
    const profile = await me.json() as { id?: number; user?: { id: number } };
    const demoId = profile.id ?? profile.user?.id;
    if (typeof demoId !== "number") {
      throw new Error(`no user id in /api/users/me`);
    }
    await ok(
      "demo name",
      await demo.request.patch(`${APP}/api/users/me`, {
        headers: sameOrigin,
        data: { firstName: "Dana", lastName: "Reyes" },
      }),
    );
    const groups = await demo.request.get(`${APP}/api/groups`);
    await ok("groups", groups);
    const body = await groups.json() as {
      groups?: { id: string; name: string }[];
    };
    const list = body.groups ??
      (body as unknown as { id: string; name: string }[]);
    const team = list.find((g) => g.name === "Demo team");
    if (!team) {
      throw new Error(`no "Demo team" group: run Seed's db:seed first`);
    }
    await ok(
      "selected group",
      await demo.request.put(`${APP}/api/groups/selected`, {
        headers: sameOrigin,
        data: { groupId: team.id },
      }),
    );

    const people: APIRequestContext[] = [];
    for (const person of TEAM) {
      const context = await browser.newContext();
      await signUp(context.request, person, teamPassword);
      await ok(
        `member ${person.email}`,
        await context.request.post(`${APP}/api/test/add-member`, {
          data: { login: person.email, groupId: team.id, role: person.role },
        }),
      );
      people.push(context.request);
    }

    const call = (op: string, data: unknown) =>
      demo.request.post(`${APP}/api/call/${op}`, {
        headers: {
          ...sameOrigin,
          "content-type": "application/json",
          "x-realtime-user": String(demoId),
          "idempotency-key": uuidV7(),
        },
        data: data === null ? "null" : data,
      });
    // A rerun reuses the tags and notes an earlier run made.
    const tagList = await demo.request.get(`${APP}/api/groups/${team.id}/tags`);
    await ok("tags", tagList);
    const { tags } = await tagList.json() as {
      tags: { id: string; name: string }[];
    };
    const tagIds = new Map(tags.map((t) => [t.name, t.id]));
    for (const tag of TAGS.filter((t) => !tagIds.has(t.name))) {
      const id = uuidV7();
      await ok(
        `tag ${tag.name}`,
        await call("tag.create", { groupId: team.id, id, ...tag }),
      );
      tagIds.set(tag.name, id);
    }
    const before = await demo.request.get(`${APP}/api/groups/${team.id}/notes`);
    await ok("notes", before);
    const titles = new Set(
      ((await before.json()) as { notes: { title: string }[] }).notes.map((n) =>
        n.title
      ),
    );
    for (const note of NOTES.filter((n) => !titles.has(n.title))) {
      const api = note.by === -1 ? demo.request : people[note.by];
      await ok(
        `note ${note.title}`,
        await api.post(`${APP}/api/groups/${team.id}/notes`, {
          headers: { ...sameOrigin, "idempotency-key": uuidV7() },
          data: {
            id: uuidV7(),
            title: note.title,
            body: note.body,
            tagIds: note.tags.map((t) => tagIds.get(t)!),
          },
        }),
      );
    }
    // Seed's worker writes a starter "Welcome" note into new groups, a moment after they are
    // made; the clip shows the four made-up notes instead. Delete it until none comes for 4 s.
    let quietSince = Date.now();
    for (
      const deadline = Date.now() + 30_000;
      Date.now() - quietSince < 4_000;
    ) {
      if (Date.now() > deadline) {
        throw new Error("starter notes kept coming for 30 s");
      }
      const listed = await demo.request.get(
        `${APP}/api/groups/${team.id}/notes`,
      );
      await ok("notes", listed);
      const { notes } = await listed.json() as {
        notes: { id: string; title: string; version: number }[];
      };
      for (const note of notes.filter((n) => n.title === "Welcome")) {
        await ok(
          "starter note",
          await demo.request.delete(
            `${APP}/api/groups/${team.id}/notes/${note.id}`,
            {
              headers: sameOrigin,
              data: { version: note.version },
            },
          ),
        );
        quietSince = Date.now();
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    await ok("first-steps card", await call("onboarding.dismiss", null));
    await demoContext.storageState({ path: appStatePath });

    const adminContext = await browser.newContext();
    await signInForm(await adminContext.newPage(), ADMIN, password);
    await adminContext.storageState({ path: adminStatePath });
    console.log(
      `Staged "Demo team": ${TEAM.length + 1} members, ${NOTES.length} notes.`,
    );
  } finally {
    await browser.close();
  }
}

if (import.meta.main) await main();
