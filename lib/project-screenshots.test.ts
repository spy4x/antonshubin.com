// Colocated test for `projectScreenshots` in `./data.ts`. Named for the
// function under test, not `data.test.ts` — that file is owned by another
// unit of work in this wave.
import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Project, projectScreenshots, screenshotCaption } from "./data.ts";

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
      alt: "Dashboard",
      width: 1440,
      height: 1000,
    },
    {
      src: "/img/projects/smartlite/02-lampboxes.png",
      alt: "Lampboxes",
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

Deno.test("a descriptive file name becomes the caption", () => {
  assertEquals(
    screenshotCaption("10-lamp-profiles.webp", 9, 12),
    "Lamp profiles",
  );
  assertEquals(
    screenshotCaption("05-editor-mobile.webp", 4, 9),
    "Editor (mobile)",
  );
  assertEquals(
    screenshotCaption("desktop-kanban.png", 1, 5),
    "Desktop kanban",
  );
});

Deno.test("a numbered file name falls back to its position", () => {
  assertEquals(screenshotCaption("3.webp", 2, 12), "Screenshot 3 of 12");
});
