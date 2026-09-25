import { assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  latestBranchPipeline,
  type WoodpeckerPipeline,
} from "./github-snapshot.ts";

function run(
  number: number,
  event: string,
  branch: string,
  status = "success",
): WoodpeckerPipeline {
  return { number, status, event, branch, started: 100, finished: 200 };
}

Deno.test("latestBranchPipeline skips pull-request runs and other branches", () => {
  const got = latestBranchPipeline(
    [
      run(9, "pull_request", "main", "failure"),
      run(8, "push", "feat/x", "failure"),
      run(7, "push", "main"),
      run(6, "push", "main", "failure"),
    ],
    "main",
    10,
  );
  assertEquals(got, {
    status: "success",
    pipeline: 7,
    at: new Date(200_000).toISOString(),
    url: "https://ci.antonshubin.com/repos/10/pipeline/7",
  });
});

Deno.test("latestBranchPipeline returns null when the branch has no push run", () => {
  assertEquals(
    latestBranchPipeline([run(1, "pull_request", "main")], "main", 9),
    null,
  );
});
