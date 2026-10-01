import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import { highestVersionTag, latestVersion } from "./snapshot-fetch.ts";

function dockerFetch(names: string[], status = 200) {
  const calls: string[] = [];
  const fetcher = ((input: string | URL | Request) => {
    calls.push(String(input));
    return Promise.resolve(
      status === 200
        ? Response.json({ results: names.map((name) => ({ name })) })
        : new Response("no", { status }),
    );
  }) as typeof fetch;
  return { fetcher, calls };
}

Deno.test("the highest versioned tag wins by number, never by text or by `latest`", () => {
  assertEquals(
    highestVersionTag(["latest", "v0.9.0", "v0.12.0", "ee63ebd", "v0.10.1"]),
    "v0.12.0",
  );
  assertEquals(highestVersionTag(["latest", "ee63ebd"]), undefined);
  assertEquals(highestVersionTag(["v0.12.0", "v0.12.1"]), "v0.12.1");
  assertEquals(highestVersionTag(["v0.12.1", "v0.12.0"]), "v0.12.1");
});

Deno.test("Docker Hub's latest version is its highest versioned tag", async () => {
  const { fetcher, calls } = dockerFetch(["latest", "v0.11.0", "v0.12.0"]);
  const v = await latestVersion(fetcher, {
    registry: "docker",
    name: "antonshubin/mig",
  });
  assertEquals(v, "v0.12.0");
  assertEquals(calls, [
    "https://hub.docker.com/v2/repositories/antonshubin/mig/tags?page_size=100",
  ]);
});

Deno.test("Docker Hub with no versioned tag or an error status is an error", async () => {
  const pkg = { registry: "docker" as const, name: "antonshubin/mig" };
  await assertRejects(() =>
    latestVersion(dockerFetch(["latest"]).fetcher, pkg)
  );
  await assertRejects(() => latestVersion(dockerFetch([], 500).fetcher, pkg));
});
