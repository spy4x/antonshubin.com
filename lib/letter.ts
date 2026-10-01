/**
 * The one layout of every mail a subscriber gets (#364): the newsletter, the
 * confirmation and the welcome. It reads as a letter from Anton: his portrait
 * and name, the content, a P.S. with the booking link, a line inviting a
 * reply and a small grey footer. The owner notice and the lead mail stay
 * plain text and do not use it.
 *
 * Callers build the content from {@linkcode Block}s, each an HTML and a
 * plain-text rendering of the same thing, and {@linkcode renderLetter} wraps
 * both. Every value reaches the HTML through `escapeHtml`, never by hand.
 * Every link into the site is the `email` channel's tagged URL
 * (`scripts/utm.ts`, docs/utm.md), so Umami counts the visits a mail brings;
 * only a link that does a job (a confirmation or unsubscribe link) is left as
 * it is, because its URL carries a token.
 *
 * Light background, inline styles, Georgia headings and Arial body, so a
 * client that inverts the colours for dark mode still shows it readably.
 */
import { emailButton, escapeHtml, htmlWrap } from "@spy4x/email/html";
import { channelUrl } from "@/scripts/utm.ts";
import {
  type BlogArticle,
  postCover,
  postCoverAlt,
  postIntro,
} from "./blog-posts.ts";
import { ROLE } from "./head.ts";
import { BOOK_LABEL } from "./nav.ts";

/** Anton's portrait for mail: 96×96 PNG, shown at 48×48. */
export const PORTRAIT_PATH = "/img/email/anton-96.png";

/** The accent filled button: Accent with Ink text (`assets/styles.css`'s `@theme`). */
export const BUTTON_COLORS = { background: "#f97316", color: "#0b0d10" };

/**
 * Stands where a subscriber's own unsubscribe link goes in an issue that is
 * rendered once and sent many times (`publish:blog` renders it, the container
 * fills it in per recipient with {@linkcode fillUnsubscribe}).
 */
export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe-link}}";

const HEADING_FONT = "Georgia,'Times New Roman',serif";
const BODY_FONT = "Arial,Helvetica,sans-serif";
const MUTED = "#6b7280";
const LINK = "#b45309";

/** The mail's content: the same thing as HTML (already escaped) and as plain text. */
export interface Block {
  html: string;
  text: string;
}

/** A paragraph of plain prose. */
export function paragraph(text: string): Block {
  return {
    html: `<p style="margin:0 0 16px">${escapeHtml(text)}</p>`,
    text,
  };
}

/** A small heading, such as "In short". */
export function heading(text: string): Block {
  return {
    html:
      `<h2 style="margin:24px 0 8px;font-family:${HEADING_FONT};font-size:20px;line-height:1.3">${
        escapeHtml(text)
      }</h2>`,
    text: text.toUpperCase(),
  };
}

/** A bulleted list. */
export function bulletList(lines: readonly string[]): Block {
  const items = lines.map((l) =>
    `<li style="margin:0 0 6px">${escapeHtml(l)}</li>`
  ).join("");
  return {
    html: `<ul style="margin:0 0 16px;padding-left:20px">${items}</ul>`,
    text: lines.map((l) => `- ${l}`).join("\n"),
  };
}

/** The accent button; the plain-text version is its label and link on two lines. */
export function button(href: string, label: string): Block {
  return {
    html: emailButton({ href, label, ...BUTTON_COLORS }),
    text: `${label}:\n${href}`,
  };
}

/** A picture linked to `href`, as wide as the letter column (600px). */
export function linkedImage(
  { src, alt, href }: { src: string; alt: string; href: string },
): Block {
  return {
    html: `<p style="margin:0 0 16px"><a href="${escapeHtml(href)}"><img src="${
      escapeHtml(src)
    }" alt="${
      escapeHtml(alt)
    }" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:6px"></a></p>`,
    text: "",
  };
}

/** What {@linkcode renderLetter} needs. */
export interface LetterInput {
  /** The site's origin; images and every tagged link are built from it. */
  baseUrl: string;
  /** The `utm_campaign` of every link into the site. */
  campaign: string;
  /** The hidden preview line the inbox shows next to the subject. */
  preheader?: string;
  blocks: readonly Block[];
  /** Show the P.S. with the booking link; the confirmation mail has none. */
  ps?: boolean;
  /** Why the reader gets this mail, one sentence. */
  reason: string;
  /**
   * The reader's own unsubscribe link, or {@linkcode UNSUBSCRIBE_PLACEHOLDER}.
   * Omitted when the mail goes to someone who has not subscribed yet.
   */
  unsubscribeLink?: string;
}

/** A finished mail: the HTML part and the plain-text part. */
export interface Letter {
  html: string;
  text: string;
}

/** `path` on the site as the `email` channel's tagged URL. */
export function emailLink(
  baseUrl: string,
  path: string,
  campaign: string,
): string {
  return channelUrl(baseUrl, path, "email", campaign);
}

/** Wraps `blocks` in the letter layout and returns both parts. */
export function renderLetter(input: LetterInput): Letter {
  const { baseUrl, campaign } = input;
  const bookUrl = emailLink(baseUrl, "/book", campaign);
  const siteUrl = emailLink(baseUrl, "/", campaign);
  const site = new URL(baseUrl).host;
  const replyLine = "Reply to this email: it comes straight to me.";

  const top =
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td width="56" valign="middle"><img src="${
      escapeHtml(`${baseUrl}${PORTRAIT_PATH}`)
    }" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:24px;border:0"></td><td valign="middle" style="font-family:${BODY_FONT}"><div style="font-family:${HEADING_FONT};font-size:18px;font-weight:bold;line-height:1.3">Anton Shubin</div><div style="font-size:13px;line-height:1.4;color:${MUTED}">${
      escapeHtml(ROLE)
    }</div></td></tr></table>`;

  const ps = input.ps === false
    ? ""
    : `<p style="margin:16px 0 0">P.S. <a href="${
      escapeHtml(bookUrl)
    }" style="color:${LINK}">${escapeHtml(BOOK_LABEL)}</a></p>`;
  const reply = `<p style="margin:16px 0 0">${escapeHtml(replyLine)}</p>`;

  const unsubscribe = input.unsubscribeLink === undefined
    ? ""
    : ` <a href="${
      escapeHtml(input.unsubscribeLink)
    }" style="color:${MUTED}">Unsubscribe</a> ·`;
  const footer =
    `<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.5;color:${MUTED}">${
      escapeHtml(input.reason)
    }${unsubscribe} <a href="${escapeHtml(siteUrl)}" style="color:${MUTED}">${
      escapeHtml(site)
    }</a></p>`;

  const content = `<div style="font-family:${BODY_FONT}">\n${top}\n${
    input.blocks.map((b) => b.html).join("\n")
  }\n${ps}\n${reply}\n${footer}\n</div>`;

  const html = htmlWrap({
    body: content,
    maxWidth: 600,
    signaturePrefix: null,
    theme: {
      background: "#ffffff",
      color: "#1f2937",
      mutedColor: MUTED,
      linkColor: LINK,
    },
    ...(input.preheader ? { preheader: input.preheader } : {}),
  });

  const textParts = [
    `Anton Shubin\n${ROLE}`,
    ...input.blocks.map((b) => b.text).filter((t) => t !== ""),
    ...(input.ps === false ? [] : [`P.S. ${BOOK_LABEL}:\n${bookUrl}`]),
    replyLine,
    `--\n${input.reason}${
      input.unsubscribeLink === undefined
        ? ""
        : `\nUnsubscribe: ${input.unsubscribeLink}`
    }\n${siteUrl}`,
  ];
  return { html, text: `${textParts.join("\n\n")}\n` };
}

/**
 * Puts a subscriber's own link where {@linkcode UNSUBSCRIBE_PLACEHOLDER}
 * stands, escaped for the HTML part.
 */
export function fillUnsubscribe(
  letter: Letter,
  link: string,
): Letter {
  return {
    html: letter.html.replaceAll(UNSUBSCRIBE_PLACEHOLDER, escapeHtml(link)),
    text: letter.text.replaceAll(UNSUBSCRIBE_PLACEHOLDER, link),
  };
}

/** Why a newsletter reader gets the mail; the welcome mail says the same. */
export const SUBSCRIBED_REASON =
  "You get this because you subscribed to Anton Shubin's newsletter.";

/**
 * The announcement of a blog post: the cover (linked to the post), the intro,
 * "In short" with the TL;DR, one button. The subject is the post's title
 * alone, so the body does not repeat it; the preheader is the first TL;DR
 * line. The unsubscribe link is {@linkcode UNSUBSCRIBE_PLACEHOLDER}, filled
 * in per recipient.
 */
export function postLetter(
  article: BlogArticle,
  { baseUrl, campaign }: { baseUrl: string; campaign: string },
): Letter {
  const url = emailLink(baseUrl, `/blog/${article.slug}`, campaign);
  return renderLetter({
    baseUrl,
    campaign,
    preheader: article.tldr[0],
    blocks: [
      linkedImage({
        src: `${baseUrl}${postCover(article)}`,
        alt: postCoverAlt(article),
        href: url,
      }),
      paragraph(postIntro(article)),
      heading("In short"),
      bulletList(article.tldr),
      button(url, `Read the article · ${article.readTime} min`),
    ],
    reason: SUBSCRIBED_REASON,
    unsubscribeLink: UNSUBSCRIBE_PLACEHOLDER,
  });
}
