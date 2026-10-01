import {
  assertEquals,
  assertStringIncludes,
  assertThrows,
} from "jsr:@std/assert@^1.0.0";
import {
  bulletList,
  button,
  fillUnsubscribe,
  heading,
  linkedImage,
  paragraph,
  postLetter,
  renderLetter,
  UNSUBSCRIBE_PLACEHOLDER,
} from "./letter.ts";
import { BOOK_LABEL } from "./nav.ts";
import { ROLE } from "./head.ts";

const BASE = "https://example.com";
const HOSTILE = `<script>alert("x")</script> & 'q'`;

function render(extra: Partial<Parameters<typeof renderLetter>[0]> = {}) {
  return renderLetter({
    baseUrl: BASE,
    campaign: "a-campaign",
    blocks: [paragraph("Hello.")],
    reason: "You get this because you asked.",
    ...extra,
  });
}

Deno.test("the letter opens with the portrait, Anton's name and the role, and closes with the reply line and the footer", () => {
  const { html, text } = render({
    unsubscribeLink: "https://example.com/u?t=1",
  });
  assertStringIncludes(html, `src="${BASE}/img/email/anton-96.png"`);
  assertStringIncludes(html, ">Anton Shubin<");
  assertStringIncludes(html, "Senior Full-Stack Engineer &amp; Tech Lead");
  assertEquals(ROLE.includes("&"), true);
  assertStringIncludes(html, "Reply to this email: it comes straight to me.");
  assertStringIncludes(html, 'href="https://example.com/u?t=1"');
  assertStringIncludes(html, "You get this because you asked.");
  assertEquals(text.startsWith(`Anton Shubin\n${ROLE}\n\nHello.`), true);
  assertStringIncludes(text, "Unsubscribe: https://example.com/u?t=1");
});

Deno.test("the P.S. links the booking page with its one wording, as the email channel's tagged link, and the confirmation turns it off", () => {
  const withPs = render();
  const book =
    `${BASE}/book?utm_source=email&utm_medium=email&utm_campaign=a-campaign`;
  assertStringIncludes(withPs.html, `href="${book.replaceAll("&", "&amp;")}"`);
  assertStringIncludes(withPs.html, `>${BOOK_LABEL}</a>`);
  assertStringIncludes(
    withPs.text,
    `P.S. Working on something like this? ${BOOK_LABEL}: ${book}`,
  );
  assertStringIncludes(
    withPs.html,
    "P.S. Working on something like this? <a ",
  );
  assertStringIncludes(withPs.html, `${BOOK_LABEL}</a>.</p>`);
  const without = render({ ps: false });
  assertEquals(without.html.includes("P.S."), false);
  assertEquals(without.text.includes("P.S."), false);
});

Deno.test("a mail to someone who has not subscribed has no unsubscribe link", () => {
  const { html, text } = render();
  assertEquals(html.includes("Unsubscribe"), false);
  assertEquals(text.includes("Unsubscribe"), false);
});

Deno.test("every value is escaped in the HTML and left as written in the text", () => {
  const { html, text } = render({
    blocks: [
      linkedImage({ src: `${BASE}/a.png`, alt: HOSTILE, href: `${BASE}/p` }),
      heading(HOSTILE),
      paragraph(HOSTILE),
      bulletList([HOSTILE]),
      button(`${BASE}/go?a=1&b=2`, HOSTILE),
    ],
    reason: HOSTILE,
    preheader: HOSTILE,
  });
  assertEquals(html.includes("<script>"), false);
  assertEquals(html.includes('alert("x")'), false);
  assertEquals(html.split("&lt;script&gt;").length - 1 >= 6, true);
  assertStringIncludes(html, `href="${BASE}/go?a=1&amp;b=2"`);
  assertStringIncludes(text, HOSTILE);
});

Deno.test("the preheader is hidden text first in the body, and absent when none is given", () => {
  const { html } = render({ preheader: "Preview line" });
  assertEquals(
    html.indexOf("Preview line") < html.indexOf("Anton Shubin"),
    true,
  );
  assertStringIncludes(html, "display:none");
  assertEquals(render().html.includes("display:none"), false);
});

Deno.test("the button is the accent fill with ink text and refuses a javascript: link", () => {
  assertStringIncludes(button(`${BASE}/x`, "Go").html, "#f97316");
  assertStringIncludes(button(`${BASE}/x`, "Go").html, "#0b0d10");
  assertThrows(() => button("javascript:alert(1)", "Go"), TypeError);
});

Deno.test("fillUnsubscribe puts the subscriber's link in both parts and escapes it in the HTML", () => {
  const letter = render({ unsubscribeLink: UNSUBSCRIBE_PLACEHOLDER });
  const filled = fillUnsubscribe(letter, `${BASE}/u?a=1&b=2`);
  assertStringIncludes(filled.html, `href="${BASE}/u?a=1&amp;b=2"`);
  assertStringIncludes(filled.text, `Unsubscribe: ${BASE}/u?a=1&b=2`);
  assertEquals(filled.html.includes(UNSUBSCRIBE_PLACEHOLDER), false);
  assertEquals(filled.text.includes(UNSUBSCRIBE_PLACEHOLDER), false);
});

Deno.test("a post's letter is 600px wide with the cover first, then the intro, then In short and one button", () => {
  const letter = postLetter({
    slug: "a-post",
    title: "A post",
    description: "Search snippet",
    intro: "Why I wrote it.",
    coverImage: "/img/blog/a-post/cover.png",
    coverAlt: "A cover",
    tldr: ["First.", "Second."],
    readTime: 5,
    publishedAt: "2026-10-02",
    topic: "founders",
  }, { baseUrl: BASE, campaign: "a-post" });
  assertStringIncludes(letter.html, "max-width:600px");
  assertStringIncludes(
    letter.html,
    `src="${BASE}/img/blog/a-post/cover.png" alt="A cover"`,
  );
  assertStringIncludes(letter.html, "Why I wrote it.");
  assertEquals(letter.html.includes("Search snippet"), false);
  assertEquals(letter.html.split("Read the article · 5 min").length - 1, 1);
  assertStringIncludes(letter.html, "#f97316");
});
