import { assert, assertFalse } from "jsr:@std/assert@^1.0.0";
import { isBot } from "./bots.ts";

Deno.test("recognizes an AI crawler user agent", () => {
  assert(
    isBot(
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
    ),
  );
});

Deno.test("matches bingbot's real, lowercase user agent (issue #179)", () => {
  // The old case-sensitive match against "Bingbot" never caught this.
  assert(
    isBot(
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    ),
  );
});

Deno.test("does not flag a normal browser user agent", () => {
  assertFalse(
    isBot(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    ),
  );
});

Deno.test("treats a missing user agent as a client failure, not a bot", () => {
  assertFalse(isBot(""));
});
