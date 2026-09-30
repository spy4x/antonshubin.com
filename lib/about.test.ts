import { assert, assertEquals } from "jsr:@std/assert@^1.0.0";
import {
  ABOUT_HOBBIES,
  ABOUT_TRAVEL,
  aboutDescription,
  aboutSteps,
  paymentList,
  paymentSentence,
} from "./about.ts";
import { META_DESCRIPTION_MAX } from "./home.ts";
import { bannedWordsIn, moneyAmountIn } from "../test/about-words.ts";

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

/** Every piece of About copy `lib/about.ts` exports, as one text. */
const aboutCopy = [
  ...aboutSteps.map((s) => s.text),
  aboutDescription("Example City"),
  ABOUT_HOBBIES,
  ABOUT_TRAVEL,
  paymentSentence(),
  paymentList(),
].join(" ");

Deno.test("the about copy names no income, loan, 80/20 split or exit goal from the post", () => {
  assertEquals(bannedWordsIn(aboutCopy), []);
});

Deno.test("the about copy states no money amount", () => {
  assertEquals(moneyAmountIn(aboutCopy), undefined);
});
