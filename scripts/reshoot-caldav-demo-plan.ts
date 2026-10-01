/**
 * The pure half of `reshoot-caldav-demo.ts`: which screenshots to take, how the
 * command line changes that, and the demo data the app is seeded with. Nothing
 * here starts a process, so `reshoot-caldav-demo-plan.test.ts` can run it in
 * `deno task check`.
 */

/** One screenshot of caldav-tasks-web. `name` is the file's name without `.webp`. */
export interface Shot {
  name: string;
  /** The app route to open. */
  path: string;
  viewport: { width: number; height: number };
  /** Device pixel ratio: the phone shot is 2x, so its file is 780px wide. */
  scale: number;
  /** Whether the sidebar drawer is open; the app opens it by default. */
  sidebarOpen: boolean;
  /** Seeded collection to select first, or null for the app's default. */
  collection: string | null;
  /** The dashboard's view, ignored on other routes. */
  view: "list" | "kanban";
  /** Text that must be on screen before the picture is taken. */
  waitFor: string;
  /** Text that must appear once the view has been switched to kanban. */
  waitForKanban?: string;
}

/** The four screenshots `static/img/tools/caldav-tasks-web/` holds. Edit this table to change them. */
export const SHOTS: readonly Shot[] = [
  {
    name: "desktop-dashboard",
    path: "/",
    viewport: { width: 1440, height: 900 },
    scale: 1,
    sidebarOpen: true,
    collection: "Personal",
    view: "list",
    waitFor: "Renew library card",
  },
  {
    name: "desktop-kanban",
    path: "/",
    viewport: { width: 1440, height: 900 },
    scale: 1,
    sidebarOpen: true,
    collection: "Personal",
    view: "kanban",
    waitFor: "Renew library card",
    waitForKanban: "Sort the bookshelf",
  },
  {
    name: "desktop-settings",
    path: "/settings",
    viewport: { width: 1440, height: 900 },
    scale: 1,
    sidebarOpen: true,
    collection: null,
    view: "list",
    waitFor: "Home Radicale",
  },
  {
    name: "mobile-dashboard",
    path: "/",
    viewport: { width: 390, height: 844 },
    scale: 2,
    sidebarOpen: false,
    collection: "Personal",
    view: "list",
    waitFor: "Renew library card",
  },
];

/** Where the screenshots go, relative to the repository root. */
export const DEFAULT_OUT_DIR = "static/img/tools/caldav-tasks-web";

/** Where the app is cloned from: a git URL or a local directory. */
export const DEFAULT_APP_SOURCE =
  "https://github.com/spy4x/caldav-tasks-web.git";

/**
 * The host port of the CalDAV container. The settings screenshot prints the
 * server's address, so a fixed port keeps that text the same on every run.
 */
export const DEFAULT_RADICALE_PORT = 15233;

export interface Options {
  app: string;
  out: string;
  radicalePort: number;
  /** Shot names to take, in table order. */
  shots: string[];
  /** Replaces every selected shot's viewport. */
  viewport: { width: number; height: number } | null;
  /** Replaces every selected shot's device pixel ratio. */
  scale: number | null;
}

/** Thrown for a bad argument; the script prints its message and exits 2. */
export class UsageError extends Error {}

export const USAGE = `Usage: deno task reshoot:caldav [options]

  --app <dir|url>        where to clone the app from (default ${DEFAULT_APP_SOURCE})
  --out <dir>            where the screenshots go (default ${DEFAULT_OUT_DIR})
  --shots <a,b>          only these screenshots (default: all of ${
  SHOTS.map((s) => s.name).join(", ")
})
  --viewport <WxH>       override the viewport of every selected screenshot
  --scale <n>            override the device pixel ratio of every selected screenshot
  --radicale-port <n>    host port of the CalDAV container (default ${DEFAULT_RADICALE_PORT})
  --help`;

function positiveInt(flag: string, value: string | undefined): number {
  const n = Number(value);
  if (!value || !Number.isInteger(n) || n <= 0) {
    throw new UsageError(
      `${flag} needs a positive whole number, got "${value ?? ""}"`,
    );
  }
  return n;
}

/** Turns the command line into options, or throws a `UsageError` naming the bad argument. */
export function parseArgs(
  args: readonly string[],
  table: readonly Shot[] = SHOTS,
): Options {
  const options: Options = {
    app: DEFAULT_APP_SOURCE,
    out: DEFAULT_OUT_DIR,
    radicalePort: DEFAULT_RADICALE_PORT,
    shots: table.map((s) => s.name),
    viewport: null,
    scale: null,
  };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];
    switch (flag) {
      case "--app":
      case "--out":
        if (!value) throw new UsageError(`${flag} needs a value`);
        options[flag === "--app" ? "app" : "out"] = value;
        i++;
        break;
      case "--shots": {
        const names = (value ?? "").split(",").filter(Boolean);
        if (names.length === 0) {
          throw new UsageError(`--shots needs at least one name`);
        }
        const unknown = names.filter((n) => !table.some((s) => s.name === n));
        if (unknown.length > 0) {
          throw new UsageError(
            `unknown screenshot ${unknown.join(", ")}; known: ${
              table.map((s) => s.name).join(", ")
            }`,
          );
        }
        // Table order, each once, so a rerun always writes files in the same order.
        options.shots = table.map((s) => s.name).filter((n) =>
          names.includes(n)
        );
        i++;
        break;
      }
      case "--viewport": {
        const match = /^(\d+)x(\d+)$/.exec(value ?? "");
        if (!match || Number(match[1]) === 0 || Number(match[2]) === 0) {
          throw new UsageError(
            `--viewport needs WIDTHxHEIGHT such as 1280x800, got "${
              value ?? ""
            }"`,
          );
        }
        options.viewport = {
          width: Number(match[1]),
          height: Number(match[2]),
        };
        i++;
        break;
      }
      case "--scale":
        options.scale = positiveInt(flag, value);
        i++;
        break;
      case "--radicale-port":
        options.radicalePort = positiveInt(flag, value);
        i++;
        break;
      default:
        throw new UsageError(`unknown argument "${flag}"`);
    }
  }
  return options;
}

/** The shots to take: the selected table rows, with any viewport or scale override applied. */
export function selectShots(
  options: Options,
  table: readonly Shot[] = SHOTS,
): Shot[] {
  return table
    .filter((s) => options.shots.includes(s.name))
    .map((s) => ({
      ...s,
      viewport: options.viewport ?? s.viewport,
      scale: options.scale ?? s.scale,
    }));
}

/** CalDAV status values the app's API takes (`TodoStatus` in caldav-tasks-web). */
export const STATUS = { needsAction: 1, inProgress: 2, completed: 3 } as const;

export interface DemoTask {
  summary: string;
  /** 1 is the most urgent, 0 none. */
  priority: number;
  status: number;
  categories: string[];
  /** Noon UTC, so no time zone shows another day. */
  due?: string;
}

/** The server the app is connected to: generic names, nothing real. */
export const DEMO_SERVER = {
  name: "Home Radicale",
  username: "demo-owner",
  collections: ["Errands", "Home", "Personal"],
  /** The collection that holds the tasks below. */
  taskCollection: "Personal",
};

/** What the committed screenshots show: seven everyday tasks, one done. */
export const DEMO_TASKS: readonly DemoTask[] = [
  {
    summary: "Renew library card",
    priority: 1,
    status: STATUS.needsAction,
    categories: ["errand"],
  },
  {
    summary: "Water the ferns",
    priority: 2,
    status: STATUS.needsAction,
    categories: ["home"],
  },
  {
    summary: "Sign up for pottery class",
    priority: 2,
    status: STATUS.inProgress,
    categories: ["hobby"],
  },
  {
    summary: "Read Klara and the Sun",
    priority: 3,
    status: STATUS.inProgress,
    categories: ["reading"],
  },
  {
    summary: "Call the plumber about the leak",
    priority: 4,
    status: STATUS.needsAction,
    categories: ["home"],
    due: "2026-09-29T12:00:00Z",
  },
  {
    summary: "Plan garden beds",
    priority: 5,
    status: STATUS.needsAction,
    categories: ["home"],
    due: "2026-10-02T12:00:00Z",
  },
  {
    summary: "Sort the bookshelf",
    priority: 1,
    status: STATUS.completed,
    categories: ["home"],
  },
];
