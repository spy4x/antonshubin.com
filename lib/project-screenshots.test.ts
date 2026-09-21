// Colocated test for `projectScreenshots` in `./data.ts`. Named for the
// function under test, not `data.test.ts` — that file is owned by another
// unit of work in this wave.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Project, projectScreenshots } from "./data.ts";

Deno.test("carries width and height when the project has a screenshotSize", () => {
  const project: Project = {
    title: "SmartLite",
    slug: "smartlite",
    description: "…",
    screenshotURLs: ["01-dashboard.png", "02-lampboxes.png"],
    screenshotSize: { width: 1440, height: 1000 },
  };

  assertEquals(projectScreenshots(project), [
    {
      src: "/img/projects/smartlite/01-dashboard.png",
      alt: "SmartLite screenshot 1",
      width: 1440,
      height: 1000,
    },
    {
      src: "/img/projects/smartlite/02-lampboxes.png",
      alt: "SmartLite screenshot 2",
      width: 1440,
      height: 1000,
    },
  ]);
});

Deno.test("leaves width and height undefined without a screenshotSize", () => {
  const project: Project = {
    title: "Toread.Today",
    slug: "toread-today",
    description: "…",
    screenshotURLs: ["1.webp"],
  };

  const [image] = projectScreenshots(project);
  assertEquals(image.width, undefined);
  assertEquals(image.height, undefined);
});

Deno.test("returns an empty list for a project with no screenshots", () => {
  const project: Project = {
    title: "No Screens",
    slug: "no-screens",
    description: "…",
  };

  assertEquals(projectScreenshots(project), []);
});
