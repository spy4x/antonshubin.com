/**
 * The About page's own wording that other modules also need (#294): its
 * path, title, meta description, the career steps, the hobbies and travel
 * clauses and the payment methods. `routes/about.tsx`,
 * `routes/llms-full.txt.ts` and `scripts/og-images.ts` read them from here,
 * so the story is written once.
 *
 * Every fact comes from the issue's list of allowed material: the 2022 post
 * `from-office-job-to-freelance-to-my-startups` (without its income figures,
 * the loan, the 80/20 split or its "leave freelance" goal), the old home page
 * "Outside Work" section, and `/book`'s NeatSoft line.
 */

import { COMPANY } from "./company.ts";

export const ABOUT_PATH = "/about";

/** The page's name: the `<h1>`, the breadcrumb's last item and the `ProfilePage` name. */
export const ABOUT_NAME = "About Anton Shubin";

/** One dated step of the career story. */
export interface AboutStep {
  /** The year column: a year, or a word for a step without one. */
  when: string;
  text: string;
}

/** The career in four dated steps, oldest first. */
export const aboutSteps: AboutStep[] = [
  {
    when: "2010",
    text:
      "I started as a software developer in an office job after university. I asked for more responsibility, got a team lead role, and learned fast how to lead a team.",
  },
  {
    when: "2013",
    text:
      "I went freelance and found clients from the US and the EU on Upwork. I could barely speak English on calls then, and learned on long daily calls with my first client. Clear, honest communication has shaped how I work ever since.",
  },
  {
    when: "Later",
    text:
      "Asking for more responsibility kept working: I led teams and took the system architect role in many SaaS startups.",
  },
  {
    when: "Today",
    text:
      `I'm co-founder and CEO of ${COMPANY.name} in ${COMPANY.country}, and clients can contract through it. I build SaaS for clients and my own open-source tools.`,
  },
];

/**
 * The meta description: only the listed facts a buyer checks after a name
 * search (SEO 2). `location` is `lib/config.ts`'s `LOCATION`, passed in so
 * this module reads no environment.
 */
export function aboutDescription(location: string): string {
  return `Software developer since 2010, freelancing since 2013, co-founder and CEO of ${COMPANY.name} in ${COMPANY.country}. Based in ${location}.`;
}

/** The hobbies clause, shared by `/about`'s "Outside work" and `/llms-full.txt`. */
export const ABOUT_HOBBIES = "Outside work I ride enduro, ski and scuba dive";

/**
 * The travel clause after "I've", shared by `/about`'s "Outside work" and
 * `/llms-full.txt`. "I've" stays in each caller so the page keeps rendering
 * its apostrophe from static JSX, byte for byte as before.
 */
export const ABOUT_TRAVEL =
  "travelled to more than 25 countries across Asia and Europe";

/** One way a client can pay, and the service or rail behind it. */
export interface PaymentMethod {
  name: string;
  via?: string;
}

const CARD: PaymentMethod = { name: "card", via: "Stripe" };
const BANK: PaymentMethod = { name: "US bank transfer", via: "ACH or Fedwire" };
const CRYPTO: PaymentMethod = { name: "crypto" };

/** The payment methods as `/about` says them, a full sentence. */
export function paymentSentence(): string {
  return `You can pay by ${CARD.name} through ${CARD.via}, by ${BANK.name} (${BANK.via}) or in ${CRYPTO.name}.`;
}

/** The payment methods as `/llms-full.txt` lists them, a clause. */
export function paymentList(): string {
  return `${CARD.name} (${CARD.via}), ${BANK.name} (${BANK.via}) or ${CRYPTO.name}`;
}
