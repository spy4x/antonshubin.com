/**
 * The About page's own wording that other modules also need (#294): its
 * path, title, meta description and the career steps. `routes/about.tsx`,
 * `routes/llms-full.txt.ts` and `scripts/og-images.ts` read them from here,
 * so the story is written once.
 *
 * Every fact comes from the issue's list of allowed material: the 2022 post
 * `from-office-job-to-freelance-to-my-startups` (without its income figures,
 * the loan, the 80/20 split or its "leave freelance" goal), the old home page
 * "Outside Work" section, and `/contact-me`'s NeatSoft line.
 */

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
      "I'm co-founder and CEO of NeatSoft PTE LTD in Singapore, and clients can contract through it. I build SaaS for clients and my own open-source tools.",
  },
];

/**
 * The meta description: only the listed facts a buyer checks after a name
 * search (SEO 2). `location` is `lib/config.ts`'s `LOCATION`, passed in so
 * this module reads no environment.
 */
export function aboutDescription(location: string): string {
  return `Software developer since 2010, freelancing since 2013, co-founder and CEO of NeatSoft PTE LTD in Singapore. Based in ${location}.`;
}
