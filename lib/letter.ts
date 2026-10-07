/**
 * The one layout of every mail a subscriber gets (#364): the newsletter, the
 * confirmation and the welcome. It reads as a letter from Anton: his portrait
 * and name, the content, a P.S. with the booking link, a line inviting a
 * reply and a small grey footer. The owner notice and the lead mail stay
 * plain text and do not use it.
 *
 * The shell, the block helpers and the per-recipient unsubscribe link are
 * `@spy4x/email/letter`'s (#405). This module builds what is Anton's: the
 * portrait header, the P.S. and reply line (the letter's afterword), the
 * accent button and the footer's link to the site. Every value reaches the
 * HTML through `escapeHtml`, never by hand. Every link into the site is the
 * `email` channel's tagged URL (`scripts/utm.ts`, docs/utm.md), so Umami
 * counts the visits a mail brings; only a link that does a job (a
 * confirmation or unsubscribe link) is left as it is, because its URL carries
 * a token.
 */
import { escapeHtml } from "@spy4x/email/html";
import {
  bulletList,
  button as letterButton,
  heading,
  type Letter,
  type LetterBlock,
  linkedImage,
  paragraph,
  renderLetter as renderShell,
  UNSUBSCRIBE_PLACEHOLDER,
} from "@spy4x/email/letter";
import { channelUrl } from "@/scripts/utm.ts";
import {
  type BlogArticle,
  postCover,
  postCoverAlt,
  postIntro,
} from "./blog-posts.ts";
import { ROLE } from "./head.ts";
import { BOOK_LABEL } from "./nav.ts";

export {
  bulletList,
  heading,
  type Letter,
  linkedImage,
  paragraph,
  UNSUBSCRIBE_PLACEHOLDER,
};
export { fillUnsubscribe } from "@spy4x/email/letter";

/** Anton's portrait for mail: 96×96 PNG, shown at 48×48. */
export const PORTRAIT_PATH = "/img/email/anton-96.png";

/** The accent filled button: Accent with Ink text (`assets/styles.css`'s `@theme`). */
export const BUTTON_COLORS = { background: "#f97316", color: "#0b0d10" };

const HEADING_FONT = "Georgia,'Times New Roman',serif";
const BODY_FONT = "Arial,Helvetica,sans-serif";
const MUTED = "#6b7280";
const LINK = "#b45309";

/** The accent button; the plain-text version is its label and link on two
 * lines. Throws a `TypeError` for a link that is not `https:`, `http:` or
 * `mailto:`. */
export function button(href: string, label: string): LetterBlock {
  return letterButton(href, label, BUTTON_COLORS);
}

/** What {@linkcode renderLetter} needs. */
export interface LetterInput {
  /** The site's origin; images and every tagged link are built from it. */
  baseUrl: string;
  /** The `utm_campaign` of every link into the site. */
  campaign: string;
  /** The hidden preview line the inbox shows next to the subject. */
  preheader?: string;
  blocks: readonly LetterBlock[];
  /** Show the P.S. with the booking link; the confirmation mail has none. */
  ps?: boolean;
  /** The question or sentence before the booking link in the P.S. */
  psLead?: string;
  /** Why the reader gets this mail, one sentence. */
  reason: string;
  /**
   * The reader's own unsubscribe link, or {@linkcode UNSUBSCRIBE_PLACEHOLDER}.
   * Omitted when the mail goes to someone who has not subscribed yet.
   */
  unsubscribeLink?: string;
}

/** `path` on the site as the `email` channel's tagged URL. */
export function emailLink(
  baseUrl: string,
  path: string,
  campaign: string,
): string {
  return channelUrl(baseUrl, path, "email", campaign);
}

/** Anton's portrait, name and role above the content. */
function portraitHeader(baseUrl: string): LetterBlock {
  return {
    html:
      `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td width="56" valign="middle"><img src="${
        escapeHtml(`${baseUrl}${PORTRAIT_PATH}`)
      }" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:24px;border:0"></td><td valign="middle" style="font-family:${BODY_FONT}"><div style="font-family:${HEADING_FONT};font-size:18px;font-weight:bold;line-height:1.3">Anton Shubin</div><div style="font-size:13px;line-height:1.4;color:${MUTED}">${
        escapeHtml(ROLE)
      }</div></td></tr></table>`,
    text: `Anton Shubin\n${ROLE}`,
  };
}

/** Wraps `blocks` in the letter layout and returns both parts. */
export function renderLetter(input: LetterInput): Letter {
  const { baseUrl, campaign } = input;
  const bookUrl = emailLink(baseUrl, "/book", campaign);
  const psLead = input.psLead ?? "Working on something like this?";
  const replyLine = "Reply to this email: it comes straight to me.";

  const ps: LetterBlock = {
    html: `<p style="margin:16px 0 0">P.S. ${escapeHtml(psLead)} <a href="${
      escapeHtml(bookUrl)
    }" style="color:${LINK}">${escapeHtml(BOOK_LABEL)}</a>.</p>`,
    text: `P.S. ${psLead} ${BOOK_LABEL}: ${bookUrl}`,
  };
  const reply: LetterBlock = {
    html: `<p style="margin:16px 0 0">${escapeHtml(replyLine)}</p>`,
    text: replyLine,
  };

  return renderShell({
    header: portraitHeader(baseUrl),
    blocks: input.blocks,
    afterword: input.ps === false ? [reply] : [ps, reply],
    footer: {
      reason: input.reason,
      ...(input.unsubscribeLink === undefined
        ? {}
        : { unsubscribeLink: input.unsubscribeLink }),
      links: [{
        href: emailLink(baseUrl, "/", campaign),
        label: new URL(baseUrl).host,
      }],
    },
    theme: {
      background: "#ffffff",
      color: "#1f2937",
      mutedColor: MUTED,
      linkColor: MUTED,
    },
    ...(input.preheader ? { preheader: input.preheader } : {}),
  });
}

/**
 * Why a newsletter reader gets the mail; the welcome mail says the same. No
 * full stop: `@spy4x/email/letter` joins the footer's reason and links with
 * " · ", and a dot before that separator reads as a typo.
 */
export const SUBSCRIBED_REASON =
  "You get this because you subscribed to Anton Shubin's newsletter";

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
