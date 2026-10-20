import type { ComparisonValue } from "@spy4x/preact-ui/comparison-table";
import type { Faq } from "./faqs.ts";
import { firstSentence } from "./llms.ts";
import { WHY_NOT_JUST_AI } from "./nav.ts";
import { decapitalize, promise } from "./promises.ts";
import { proof } from "./proof.ts";

/**
 * The "Why not just AI?" page's wording (#486): the page, its JSON-LD, both
 * llms files and the OG image script read it, like `lib/how-i-work.ts` for
 * /how-i-work. Promises come through `promise()` and figures through
 * `proof()`, so the guards in `test/proof-promises-notes.test.ts` still hold.
 * No imports of config or the environment, so a script can load it.
 */

export const WHY_NOT_JUST_AI_PATH = WHY_NOT_JUST_AI.href;

/** The bare page name for the breadcrumb and the footer's Site group. */
export const WHY_NOT_JUST_AI_NAME = WHY_NOT_JUST_AI.label;

/** The `<title>`. */
export const WHY_NOT_JUST_AI_TITLE =
  "Hire a developer or just use AI? An honest answer — Anton Shubin";

/** The meta description and the OG image's subtitle. */
export const WHY_NOT_JUST_AI_DESCRIPTION =
  "I use AI coding agents every day. What they do well, what I add on top, and when an AI subscription alone is enough for your product.";

export const WHY_NOT_JUST_AI_H1 = "Why hire me instead of an AI subscription?";

/** The answer in one paragraph: the line answer engines quote. */
export const WHY_NOT_JUST_AI_LEAD =
  "An AI subscription writes code. I decide what to build, make sure every change is reviewed, run it in production and answer for the result. I use the same AI tools every day, so you get their speed too.";

/** The sentence and link label other pages use to point here (/how-i-work, the MVP page). */
export const WHY_NOT_JUST_AI_PROMPT =
  "Weighing this against an AI subscription?";
export const WHY_NOT_JUST_AI_LINK_LABEL = "Why not just use AI?";

/** The public repository the agents' rules live in. */
export const DOTFILES_URL = "https://github.com/spy4x/dotfiles";

/** The fact card's "AI tools" row. */
export const AI_TOOLS_FACT =
  "I use AI coding agents every day. My rules for them are public.";

/** The fact card's "Track record" row: one proof line, no stacked badges. */
export function trackRecordLine(): string {
  return `${proof("top-percent")} on Upwork · ${
    proof("job-success")
  } Job Success · ${proof("projects")} projects`;
}

export const ENOUGH_HEADING = "When a subscription is enough";
export const ENOUGH_INTRO = "Often it is, and then you don't need me yet.";
export const ENOUGH_CASES: string[] = [
  "You want a clickable prototype to show a few potential customers.",
  "It is a landing page, an internal tool or a script that nobody's money or data depends on.",
  "You are an engineer with the time to review every change yourself.",
  "You are still finding out whether anyone wants the product.",
];
export const ENOUGH_CLOSING =
  "Come to me when real users, real money or real data depend on it.";

export const COMPARISON_HEADING = "What I add on top";
export const COMPARISON_CAPTION = "What you get from each";
export const COMPARISON_PRODUCTS = [
  "Me, with AI agents",
  "An AI subscription on its own",
] as const;
/**
 * When the table was last checked against how I work: the spec's date, as a
 * UTC midnight that the page formats in UTC, so no server time zone moves it.
 */
export const COMPARISON_CHECKED_ON = new Date(Date.UTC(2026, 9, 20));
/** The zone the table's checked date is formatted in. */
export const COMPARISON_TIME_ZONE = "UTC";
export const COMPARISON_METHOD =
  "Based on how I work today, described in my public agent rules, and on my own measurements in the two posts linked here.";
/** The words of `COMPARISON_METHOD` that link the agent rules on the page. */
export const COMPARISON_RULES_LINK = "my public agent rules";
export const COMPARISON_FIT =
  "If the subscription column covers what you need, use it.";

/** One row of the comparison; `values` follow `COMPARISON_PRODUCTS`. */
export interface ComparisonLine {
  capability: string;
  values: [ComparisonValue, ComparisonValue];
  note?: string;
}

export function comparisonRows(): ComparisonLine[] {
  return [
    { capability: "Writes code fast", values: ["yes", "yes"] },
    {
      capability: "Decides what to build, and what to leave out",
      values: ["yes", "partial"],
      note: "It builds what you ask for.",
    },
    {
      capability: "Reviews every change before you see it",
      values: ["yes", "partial"],
      note:
        "Neither AI reviewer caught every security bug on its own in my test.",
    },
    {
      capability:
        "Sets up servers, deploys and backups, and keeps them running",
      values: ["yes", "no"],
    },
    {
      capability: "Someone answers for the result",
      values: ["yes", "no"],
      note: `${promise("weekly-software").title}, ${
        decapitalize(promise("free-bugfixes").title)
      }.`,
    },
    { capability: "Costs less", values: ["no", "yes"] },
  ];
}

export const BILL_ME_HEADING = "Will you just run Claude and bill me for it?";

/** The first paragraph of the answer, with ownership spliced from its promise. */
export function billMeAnswer(): string {
  const ownership = decapitalize(promise("ownership").desc).replace(/\.$/, "");
  return `Partly, yes. AI agents type much of my code, and I say so openly. You pay for the result, not for my typing: on a fixed scope the price is fixed, and ${ownership} from day one.`;
}

/** The weekly audit: Anton's own check, now that a reviewer agent checks every change (#489). */
export const WEEKLY_AUDIT =
  "Every week I audit the work myself, to make sure the project is on the right track and the quality is still high.";

/** How a change gets made, in order; the last step is the weekly promise. */
export function processSteps(): string[] {
  return [
    "A written spec before any code.",
    "AI agents write the change.",
    "A separate reviewer agent checks it; sign-in, payments and secrets get a security review.",
    "Nothing reaches you until it passes that review.",
    WEEKLY_AUDIT,
    firstSentence(promise("weekly-software").desc),
  ];
}

/**
 * Why the rules matter more than the tools, in Anton's words on #489: he has
 * vibe-coded, and without his rules and definition of quality the result is
 * mediocre and not maintainable.
 */
export const RULES_WHY =
  "The tools are not the hard part. I have vibe-coded too: without clear rules and a definition of quality, the result is mediocre and hard to maintain.";
/** Before the dotfiles link; the link text is the repository's name. */
export const RULES_LINE_BEFORE = "Mine are public in";
export const RULES_LINE_AFTER = ", so you can read exactly how I work.";
export const AI_PROVIDER_LINK = {
  href: "/how-i-work#faq-ai-and-your-code",
  label: "Does my code go to an AI provider?",
};

/** My own numbers, each with its limit, linked to the post it comes from. */
export interface AiFigure {
  value: string;
  caption: string;
  href: string;
}

export const AI_FIGURES: AiFigure[] = [
  {
    value: "1,845",
    caption:
      "pull requests merged in my first 30 days on Claude Code. Volume is not value, and much of the jump is not the model alone.",
    href: "/blog/claude-code-vs-minimax-m3-30-days",
  },
  {
    value: "13% vs 33%",
    caption:
      "how often the cheaper and the stronger model passed their first review. Review is where a person still earns their fee.",
    href: "/blog/opus-5-5-vs-sonnet-5-agent-costs",
  },
];

export const BUILT_HEADING = "Already built it with AI?";
export const BUILT_BODY =
  "Good. Keep going if it works. When real users, payments or personal data arrive, a second pair of eyes before launch is worth it.";
/** What each of the two small first steps gives, by catalog slug. */
export const BUILT_STEPS: { slug: string; line: string }[] = [
  {
    slug: "codebase-health-audit",
    line: "I check what is solid, what is risky and what to fix first.",
  },
  {
    slug: "strategy-call",
    line: "One hour to talk through your next technical decision.",
  },
];

export const SHIPPED_HEADING = "Shipped to production";
export const SHIPPED_INTRO =
  "An AI tool can write code. It can't point to products it shipped, saw acquired, or still runs.";
/** The projects shown, by `lib/data.ts` slug, with the mark each gets. */
export const SHIPPED: { slug: string; status: "live" | "outcome" }[] = [
  { slug: "smartlite", status: "live" },
  { slug: "foodrazor", status: "outcome" },
  { slug: "corecircle", status: "outcome" },
];

export const QUESTIONS_HEADING = "Questions";

/**
 * The page's questions, also its `FAQPage` JSON-LD; none repeats /how-i-work's.
 * Who pays for the AI tools is Anton's answer on #488.
 */
export function whyNotJustAiFaqs(): Faq[] {
  return [
    {
      id: "prompt-it-myself",
      q: "Can't I just prompt an agent myself?",
      a: "You can, and for a prototype you should. What takes years is knowing what to ask for, spotting the change that looks right but isn't, and keeping it running once people depend on it. That is the part you hire me for.",
    },
    {
      id: "who-pays-for-ai",
      q: "Who pays for the AI tools?",
      a: "I do. My AI subscription is part of how I work, not a line on your invoice. If you would rather it ran on your company's own AI account, for example to keep your code under your own contract, I can work through that one.",
    },
    {
      id: "take-it-from-here",
      q: "I already built something with AI. Can you take it from here?",
      a: "Yes. I start with a code audit, so you know what is solid, what is risky and what to fix before launch. Then you decide whether I continue, your team does, or you keep going on your own.",
    },
    {
      id: "didnt-need-you",
      q: "What if it turns out I didn't need you?",
      a: `${promise("refund").desc} ${promise("first-milestone").desc}`,
    },
  ];
}

export const CLOSING_HEADING = "Not sure which you need?";
/**
 * The band's promises: not the refund and first milestone, which the last
 * question's answer, right above the band, already gives (#490).
 */
export const CLOSING_PROMISES = ["ownership", "free-bugfixes"];
/** The band's line before the call's name (`INTRO_CALL`). */
export const CLOSING_LINE_BEFORE = "Tell me what you are building on a";

/** The words a reader of the llms files sees for a table value. */
const VALUE_WORDS: Record<ComparisonValue, string> = {
  yes: "yes",
  partial: "partly",
  no: "no",
};

/**
 * The page as a section of `llms-full.txt`: the lead, when a subscription is
 * enough, the comparison, how the work is done, the figures and the questions.
 */
export function whyNotJustAiLlmsSection(baseUrl: string): string {
  const [me, sub] = COMPARISON_PRODUCTS;
  const rows = comparisonRows().map((r) =>
    `- ${r.capability}: ${me.toLowerCase()}, ${VALUE_WORDS[r.values[0]]}; ${
      sub.charAt(0).toLowerCase() + sub.slice(1)
    }, ${VALUE_WORDS[r.values[1]]}.${r.note ? ` ${r.note}` : ""}`
  );
  return `## ${WHY_NOT_JUST_AI_H1} (${baseUrl}${WHY_NOT_JUST_AI_PATH})

${WHY_NOT_JUST_AI_LEAD}

### ${ENOUGH_HEADING}

${ENOUGH_INTRO}

${ENOUGH_CASES.map((c) => `- ${c}`).join("\n")}

${ENOUGH_CLOSING}

### ${COMPARISON_HEADING}

${rows.join("\n")}

### ${BILL_ME_HEADING}

${billMeAnswer()}

${processSteps().map((s, i) => `${i + 1}. ${s}`).join("\n")}

${RULES_WHY} ${RULES_LINE_BEFORE} spy4x/dotfiles (${DOTFILES_URL})${RULES_LINE_AFTER}

${
    AI_FIGURES.map((f) => `- **${f.value}** ${f.caption} ${baseUrl}${f.href}`)
      .join("\n")
  }

### ${BUILT_HEADING}

${BUILT_BODY}

${whyNotJustAiFaqs().map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}`;
}
