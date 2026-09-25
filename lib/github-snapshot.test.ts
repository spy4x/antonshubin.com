import { assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";
import {
  ciReading,
  type CiRunStatus,
  type GithubSnapshot,
  repoSnapshot,
} from "./github-snapshot.ts";

function ci(status: CiRunStatus) {
  return { status, pipeline: 1, at: "2026-09-25T00:00:00.000Z", url: "u" };
}

Deno.test("ciReading reads only success as passing", () => {
  assertEquals(ciReading(ci("success")).word, "Passing");
  for (const s of ["failure", "error", "killed"] as const) {
    assertEquals(ciReading(ci(s)).word, "Failing", s);
  }
  assertEquals(ciReading(ci("running")).word, "Running");
  assertEquals(ciReading(ci("skipped")).word, "Unknown");
  assertEquals(ciReading(null).word, "Unknown");
});

Deno.test("repoSnapshot throws for a repository the snapshot does not hold", () => {
  const data: GithubSnapshot = { checkedOn: "2026-09-25", repos: {} };
  assertThrows(
    () => repoSnapshot("spy4x/nothing", data),
    Error,
    "spy4x/nothing",
  );
});
