import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import { aboutDescription, aboutSteps } from "./about.ts";
import { META_DESCRIPTION_MAX } from "./home.ts";

Deno.test("the about meta description fits a search result", () => {
  const text = aboutDescription("Da Nang, Vietnam");
  assert(
    text.length <= META_DESCRIPTION_MAX,
    `${text.length} characters, expected <= ${META_DESCRIPTION_MAX}: "${text}"`,
  );
});

Deno.test("the about meta description names the city it is given", () => {
  assert(aboutDescription("Example City").includes("Example City"));
});

Deno.test("the about story runs from 2010 to today in four steps", () => {
  assertEquals(aboutSteps.map((s) => s.when), [
    "2010",
    "2013",
    "Later",
    "Today",
  ]);
});

Deno.test("the about story carries no income figure or the post's exit goal", () => {
  const story = aboutSteps.map((s) => s.text).join(" ");
  assert(!/\$\d/.test(story), story);
  for (const phrase of ["loan", "80%", "leave freelance"]) {
    assert(!story.includes(phrase), `story mentions "${phrase}"`);
  }
});
