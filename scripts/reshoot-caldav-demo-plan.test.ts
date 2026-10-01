import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  DEFAULT_OUT_DIR,
  DEFAULT_RADICALE_PORT,
  DEMO_SERVER,
  DEMO_TASKS,
  parseArgs,
  selectShots,
  SHOTS,
  UsageError,
} from "./reshoot-caldav-demo-plan.ts";

Deno.test("takes every screenshot of the table when no argument names one", () => {
  const options = parseArgs([]);
  assertEquals(options.out, DEFAULT_OUT_DIR);
  assertEquals(options.radicalePort, DEFAULT_RADICALE_PORT);
  assertEquals(
    selectShots(options).map((s) => s.name),
    SHOTS.map((s) => s.name),
  );
});

Deno.test("--shots keeps table order and drops the rest", () => {
  const options = parseArgs(["--shots", "mobile-dashboard,desktop-kanban"]);
  assertEquals(options.shots, ["desktop-kanban", "mobile-dashboard"]);
  assertEquals(selectShots(options).map((s) => s.name), [
    "desktop-kanban",
    "mobile-dashboard",
  ]);
});

Deno.test("--viewport and --scale override every selected screenshot", () => {
  const options = parseArgs([
    "--shots",
    "desktop-dashboard",
    "--viewport",
    "1280x800",
    "--scale",
    "2",
  ]);
  const [shot] = selectShots(options);
  assertEquals(shot.viewport, { width: 1280, height: 800 });
  assertEquals(shot.scale, 2);
});

Deno.test("a screenshot keeps its table viewport when no override is given", () => {
  const mobile = selectShots(parseArgs(["--shots", "mobile-dashboard"]))[0];
  assertEquals(mobile.viewport, { width: 390, height: 844 });
  assertEquals(mobile.scale, 2);
});

Deno.test("rejects an unknown screenshot name and says which are known", () => {
  const error = assertThrows(
    () => parseArgs(["--shots", "desktop-nope"]),
    UsageError,
  );
  assert(error.message.includes("desktop-nope"));
  assert(error.message.includes("desktop-kanban"));
});

Deno.test("rejects a malformed viewport, scale, port or unknown flag", () => {
  assertThrows(() => parseArgs(["--viewport", "1280"]), UsageError);
  assertThrows(() => parseArgs(["--viewport", "0x800"]), UsageError);
  assertThrows(() => parseArgs(["--scale", "1.5"]), UsageError);
  assertThrows(() => parseArgs(["--radicale-port", "abc"]), UsageError);
  assertThrows(() => parseArgs(["--nope"]), UsageError);
  assertThrows(() => parseArgs(["--app"]), UsageError);
});

Deno.test("the table names each file once and every collection it selects is seeded", () => {
  const names = SHOTS.map((s) => s.name);
  assertEquals(new Set(names).size, names.length);
  for (const shot of SHOTS) {
    if (shot.collection) {
      assert(DEMO_SERVER.collections.includes(shot.collection));
    }
  }
  assert(DEMO_SERVER.collections.includes(DEMO_SERVER.taskCollection));
});

Deno.test("demo tasks carry no price, address or company name", () => {
  const text = JSON.stringify([DEMO_TASKS, DEMO_SERVER]);
  assert(
    !/[$€£@]|\d+\s?(usd|eur)|invoice|neatsoft|\.com|\.dev/i.test(text),
    text,
  );
});
