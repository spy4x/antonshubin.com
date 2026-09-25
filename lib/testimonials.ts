import { UPWORK_URL } from "./config.ts";
import { type Project, projects } from "./data.ts";

/**
 * Client reviews: the single source, like `lib/catalog.ts` is for prices.
 * Every entry is a public review on Anton's Upwork profile, copied character
 * for character from `upwork/portfolio/<Project>/feedback.txt` in his
 * archive, including the client's own spelling (#231). Never correct a
 * quote: an `excerpt` cuts around a misspelling instead.
 *
 * Decision recorded on #186: these are public reviews, so they are cited by
 * project and period with a link to the profile (`sourceHref`), and no
 * client's personal name is attached to a quote.
 *
 * A project page (`routes/projects/[slug].tsx`) shows every visible review
 * of its project in full; the home page shows the excerpts listed in
 * `homeTestimonialIds`.
 */
export interface Testimonial {
  /** `<projectSlug>-<contract>`. */
  id: string;
  /** The project the review is about; `testimonialProject()` throws on a typo. */
  projectSlug: string;
  /** Which Upwork contract with this client the review closed, from 1. */
  contract: number;
  /** The full review, verbatim. Paragraphs are separated by `\n`. */
  quote: string;
  /** Exact pieces of `quote`, in order, joined by `EXCERPT_JOIN`. */
  excerpt: string;
  sourceHref?: string;
  /** True once Anton has confirmed the review may be quoted on the site. */
  permission: boolean;
}

/** What separates two verbatim pieces of a quote inside an excerpt. */
export const EXCERPT_JOIN = " … ";

export const testimonials: Testimonial[] = [
  {
    id: "foodrazor-1",
    projectSlug: "foodrazor",
    contract: 1,
    quote:
      "Anton has been outstanding over the last year, helping to guide and advise the development of our application with Firebase. I look forward to working with him again in the future.",
    excerpt:
      "Anton has been outstanding over the last year, helping to guide and advise the development of our application with Firebase.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "foodrazor-2",
    projectSlug: "foodrazor",
    contract: 2,
    quote:
      "Anton has helped our company build a world-class application, not only with his master class programming skills but also helping us find other amazing developers to join our team. His communication skills are top level and he worked hard every day to ensure the quality of work was of the highest level. I highly recommend him and he is worth every cent. I plan to work with him the future and if he ever wants to move to Singapore I would hire him full-time in a heartbeat.",
    excerpt:
      "Anton has helped our company build a world-class application, not only with his master class programming skills but also helping us find other amazing developers to join our team. … I highly recommend him and he is worth every cent.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "corecircle-1",
    projectSlug: "corecircle",
    contract: 1,
    quote:
      "I've been working with Anton for over a year now and as always he does a fantastic job. A few months back, we were having major problems with the code that was implemented by our first back-end developer. Users were seeing empty home feeds, they got logged out and couldn't get logged back in and a few other nightmares.\n\nAnton helped us out and solved all of the problems we had. He also optimized many places of the app so that it could function smoother and faster.\n\nWhoever hires Anton is lucky, I'll tell you that! Thanks so much for all of your help and hope we can work again in the near future. :)",
    excerpt:
      "A few months back, we were having major problems with the code that was implemented by our first back-end developer. … Anton helped us out and solved all of the problems we had.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "roley-1",
    projectSlug: "roley",
    contract: 1,
    quote:
      "Anton was a terrific partner to me in developing an MVP of a web app I've been dreaming of for ages. He is a highly skilled developer, a super resourceful problem-solver, and a conscientious and communicative collaborator. Hiring someone you don't know to build your idea can be scary, and I'm grateful I found my way to Anton. If you're looking for a fast, expert, transparent guide to help you bring a big idea to life, working with Anton is a great choice.",
    excerpt:
      "Anton was a terrific partner to me in developing an MVP of a web app I've been dreaming of for ages. … If you're looking for a fast, expert, transparent guide to help you bring a big idea to life, working with Anton is a great choice.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "roley-2",
    projectSlug: "roley",
    contract: 2,
    quote:
      "Anton has been a terrific collaborator and thought partner to me. In addition to his expertise, I particularly appreciate his real-talk, practical advice on the smartest options to move forward with a new idea or navigating an issue. He's a great communicator and an easy collaborator.",
    excerpt:
      "In addition to his expertise, I particularly appreciate his real-talk, practical advice on the smartest options to move forward with a new idea or navigating an issue.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "connectful-1",
    projectSlug: "connectful",
    contract: 1,
    quote:
      "Anton is the greatest developer I've ever worked with hands down. He's taken a role in our startup as tech lead and has been doing a beyond excellent job with communication, honesty, hard work and accuracy. He understands that a startup is a fast pace environment with lots of moving pieces and adjusted himself to work with that, which is one of the best things that I like about Anton.\n\nOn top of that, Anton is extremely skilled and offers really great feedback. He isn't one of the type of developers that just says, \"sure, I can do that.\" He's thoughtful and will give his honest feedback and advice on everything.\n\nOverall, 12/10 of a developer. I really got lucky with Anton. Thanks for all that you do and am so excited to see where our startup goes!",
    excerpt:
      "He's taken a role in our startup as tech lead and has been doing a beyond excellent job with communication, honesty, hard work and accuracy. … Overall, 12/10 of a developer. I really got lucky with Anton.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "connectful-2",
    projectSlug: "connectful",
    contract: 2,
    quote:
      "I've been working with Anton for 7+ months now, and he has been a remarkable tech lead for my first app. He was always there to answer my questions, give honest feedback and tell me when something was needed to be done differently from how I wanted it to be done. I've noticed that many people are quick to say \"yes,\" to everything but Anton actually cares about the clients and company's best interest.\n\nI enjoyed all of those months that Anton worked on the project for and I know that we will continue to remain in touch. He's very honest, communicative, and a great backend developer, which are all quantities that clients want in their developers. Thanks for bringing my first app to fruition, I will never forget that!\n\nThank you Anton for all of your great work. Your next client will be lucky! :)",
    excerpt:
      "I've been working with Anton for 7+ months now, and he has been a remarkable tech lead for my first app. … Anton actually cares about the clients and company's best interest.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "gopingu-1",
    projectSlug: "gopingu",
    contract: 1,
    quote:
      "Anton has been a dream to work with. He helped us to hire a team and takes care of our every need. His most amazing attribute is how he looks after our money like it is his own. Anything and everything he can do to increase efficiency is on the table.\nHe also desperately wants your project to be a success.\n\nThere is no question that he is one of the best developers in Europe.",
    excerpt:
      "He helped us to hire a team and takes care of our every need. His most amazing attribute is how he looks after our money like it is his own.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "code-review-1",
    projectSlug: "code-review",
    contract: 1,
    quote:
      "Anton is a highly skilled full-stack engineer and consultant. We hired Anton to help us to hire a back end engineer to work with us. Anton is organised, communicates constantly, and kept us updated on progress on a daily basis. He worked within our budget, and executed the contract perfectly. Anton is also extremely honest and hardworking. He has been a pleasure to work with and we look forward to working with him again!",
    excerpt:
      "We hired Anton to help us to hire a back end engineer to work with us. … He worked within our budget, and executed the contract perfectly.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "microwork-1",
    projectSlug: "microwork",
    contract: 1,
    quote:
      "Anton was leading our development team and has set up an app that is covered in tests, full of quality guidelines and control, he adheres to schedules and communicates brilliantly.",
    excerpt:
      "Anton was leading our development team and has set up an app that is covered in tests, full of quality guidelines and control, he adheres to schedules and communicates brilliantly.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "microwork-2",
    projectSlug: "microwork",
    contract: 2,
    quote:
      "Anton has been working with us as our Development Team Leader for over 6 months, during which time he has he taken what was a shambolic code base, and created a fantastic app that we have successfully taken to market.\nDuring this time Anton has given his all, his commitment has been total and his dedication unparalleled amongst any freelancer I have ever worked with.\nHe has brought order to chaos, he is a guy that can get things done, he can be trusted to always do his best, and his best is brilliant.\nAnton is moving onto a new contract with us, and I hope we can continue to work together for many years. He has become more than a Leader, he has become a shoulder to cry on, a trusted advisor and a friend.",
    excerpt:
      "Anton has been working with us as our Development Team Leader for over 6 months … He has brought order to chaos, he is a guy that can get things done, he can be trusted to always do his best, and his best is brilliant.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "microwork-3",
    projectSlug: "microwork",
    contract: 3,
    quote:
      "Anton came in as a temporary team leader and in the short time he has been here transformed our operations, we are now about twice as productive as we were.\n\nWe are rehiring Anton in a senior position.",
    excerpt:
      "Anton came in as a temporary team leader and in the short time he has been here transformed our operations, we are now about twice as productive as we were.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "microwork-4",
    projectSlug: "microwork",
    contract: 4,
    quote:
      "We are so sad to see Anton go, he has been our greatest hire. Anton has taken us from a broken PoC to Revenue, which is exactly what we needed. Perfect hire.",
    excerpt:
      "Anton has taken us from a broken PoC to Revenue, which is exactly what we needed. Perfect hire.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "calltrack-1",
    projectSlug: "calltrack",
    contract: 1,
    quote:
      "Anton is one of the gratest freelancers I have ever worked with. He was always available via skype, not only by terxt but also by voice chat. He mainly overtook the frontend dev part of a SaaS solution we have developed. I was very happy with his mindset (thinking in solutions instead of problems) and with his communcation and development skills. (mainly AngularJS)",
    excerpt:
      "He mainly overtook the frontend dev part of a SaaS solution we have developed. … I was very happy with his mindset (thinking in solutions instead of problems)",
    sourceHref: UPWORK_URL,
    permission: true,
  },
  {
    id: "sajari-1",
    projectSlug: "sajari",
    contract: 1,
    quote:
      "Anton is an excellent web app developer and developer in general. His communication skills and attentiveness is what sets him apart.",
    excerpt:
      "Anton is an excellent web app developer and developer in general. His communication skills and attentiveness is what sets him apart.",
    sourceHref: UPWORK_URL,
    permission: true,
  },
];

/** The three excerpts on the home page, in order. */
export const homeTestimonialIds: string[] = [
  "roley-1",
  "corecircle-1",
  "connectful-1",
];

/** Looks a testimonial up by id and throws on a typo. */
export function testimonial(id: string): Testimonial {
  const t = testimonials.find((x) => x.id === id);
  if (!t) throw new Error(`lib/testimonials.ts: no testimonial "${id}"`);
  return t;
}

/** The client project a review is about; throws when `projectSlug` resolves to none. */
export function testimonialProject(t: Testimonial): Project {
  const p = projects.freelance.find((x) => x.slug === t.projectSlug);
  if (!p) {
    throw new Error(
      `lib/testimonials.ts: "${t.id}" names no client project "${t.projectSlug}"`,
    );
  }
  return p;
}

/**
 * The subset a page may render: a confirmed public source and permission.
 * `list` defaults to `testimonials` so a page needs no argument; a test
 * passes a synthetic list to check the filter itself without editing the
 * real data.
 */
export function visibleTestimonials(
  list: Testimonial[] = testimonials,
): Testimonial[] {
  return list.filter((t) => t.sourceHref && t.permission);
}

/** Visible reviews of one project, in contract order. */
export function projectTestimonials(slug: string): Testimonial[] {
  return visibleTestimonials()
    .filter((t) => t.projectSlug === slug)
    .sort((a, b) => a.contract - b.contract);
}
