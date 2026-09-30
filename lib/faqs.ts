import { PRICING_RULE } from "./how-i-work.ts";
import { decapitalize, promise } from "./promises.ts";

/**
 * The How I work page's questions (#275): the only written copy. The page,
 * its `FAQPage` JSON-LD and the FAQ section of `llms-full.txt` all read
 * `faqs`, and every promise an answer mentions is spliced through
 * `promise()`, so the promise guard in `test/proof-promises-notes.test.ts`
 * (which scans this file too) still holds. The who-does-the-work and mobile
 * answers come from the facts Anton recorded on #249 (26 Sep 2026).
 *
 * No imports of config or the environment, so a script can load it.
 */

export interface Faq {
  /** Stable anchor: the question is linkable as `/how-i-work#faq-<id>`. */
  id: string;
  q: string;
  /** Plain text: the same string is shown on the page and sent as FAQ JSON-LD. */
  a: string;
  link?: { href: string; label: string };
}

/** The most questions the page carries. */
export const MAX_FAQS = 7;

/** New information first, the fit question last. */
export const faqs: Faq[] = [
  {
    id: "who-does-the-work",
    q: "Who does the work?",
    a: "I do. I build greenfield SaaS solo, or with a team I assemble for the project from my own pool of senior developers, and only seniors. I also join existing teams.",
  },
  {
    id: "pricing",
    q: "Do you work fixed price or hourly, and what happens when the scope changes?",
    a: `Both. ${PRICING_RULE} If the scope changes once we have started, you get a quote for the change before I start on it — no surprise costs.`,
  },
  {
    id: "ownership",
    q: "Who owns the code, the accounts and the servers?",
    a: `You do. ${promise("ownership").desc} That is ${
      promise("ownership").phrase
    }, not something you get at the end.`,
  },
  {
    id: "existing-team",
    q: "Do you work with clients who already have a development team?",
    a: "Yes, that is one of the most common ways I work. I join as a tech lead to set direction, review code and unblock the work, alongside your developers rather than instead of them.",
  },
  {
    id: "mobile",
    q: "Do you build mobile apps?",
    a: "Not yet, and I'm looking at Capacitor. I build the web app, the backend, the DevOps and the architecture, including the APIs a mobile app talks to.",
  },
  {
    id: "no-clear-idea",
    q: "What if I don't have a clear idea yet?",
    a: "Send me a paragraph about your idea or problem as a written brief and I will write back with 3 concrete architectural improvements. No cost, no pitch.",
    link: { href: "/book#brief", label: "Send me your idea" },
  },
  {
    id: "not-a-good-fit",
    q: "What if we start working together and it is not a good fit?",
    a: `That is exactly why I offer ${promise("refund").phrase}. ${
      promise("refund").desc
    } We also start with ${promise("first-milestone").phrase}: ${
      decapitalize(promise("first-milestone").desc)
    }`,
  },
];
