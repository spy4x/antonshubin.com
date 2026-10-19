import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { join } from "@std/path";
import { serveVideo } from "./video-files.ts";

const NEXT = "passed on";

/**
 * Runs `serveVideo` for `path` against a fixture build root whose
 * `client/video/t/clip.mp4` holds the ten bytes "0123456789", next to a
 * `secret.txt` at the root that no request may reach.
 */
async function request(
  path: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, "client", "video", "t"), { recursive: true });
    await Deno.writeTextFile(
      join(root, "client", "video", "t", "clip.mp4"),
      "0123456789",
    );
    await Deno.writeTextFile(join(root, "secret.txt"), "secret");
    const url = new URL(path, "http://site.test");
    const res = await serveVideo({
      req: new Request(url, { headers }),
      url,
      config: { root },
      next: () => Promise.resolve(new Response(NEXT)),
    });
    // Read the body before the fixture goes, so the file handle closes first.
    const body = await res.arrayBuffer();
    return new Response(res.status === 416 ? null : body, res);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test("a clip answers bytes=0-1 with 206 and its first two bytes", async () => {
  const res = await request("/video/t/clip.mp4", { range: "bytes=0-1" });
  assertEquals(res.status, 206);
  assertEquals(res.headers.get("content-range"), "bytes 0-1/10");
  assertEquals(await res.text(), "01");
});

Deno.test("a range past a clip's end answers 416 naming its size", async () => {
  const res = await request("/video/t/clip.mp4", { range: "bytes=20-" });
  assertEquals(res.status, 416);
  assertEquals(res.headers.get("content-range"), "bytes */10");
});

Deno.test("a plain request for a clip answers 200 with Accept-Ranges and the whole file", async () => {
  const res = await request("/video/t/clip.mp4");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("accept-ranges"), "bytes");
  assertEquals(res.headers.get("content-type"), "video/mp4");
  assertEquals(await res.text(), "0123456789");
});

Deno.test("a missing clip, a path outside /video/ and a climb out of it pass on to the app", async () => {
  for (
    const path of [
      "/video/t/none.mp4",
      "/img/t/clip.mp4",
      "/video/..%2f..%2fsecret.txt",
    ]
  ) {
    assertEquals(await (await request(path)).text(), NEXT, path);
  }
});
