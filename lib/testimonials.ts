/**
 * Testimonials: the single source, like `lib/catalog.ts` is for prices. The
 * home page's testimonials section (`routes/index.tsx`) renders only from
 * this list, and only entries with `sourceHref` and `permission: true` — a
 * quote with no confirmed public source or no client permission stays in
 * this file but off the site (#186). Anton has not yet confirmed which of
 * these reviews may be quoted by name, so every entry below ships with
 * `permission: false` until he does.
 *
 * This module has no imports on purpose, so tests and scripts can load it
 * without environment access — same reason `lib/catalog.ts` has none.
 */

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role?: string;
  sourceHref?: string;
  /** True once Anton has confirmed the client agreed to be quoted by name. */
  permission: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: "mvp-development",
    quote:
      "Anton was a terrific partner to me in developing an MVP of a web app I've been dreaming of for ages. He is a highly skilled developer, a super resourceful problem-solver, and a conscientious and communicative collaborator.",
    name: "Startup Founder",
    role: "MVP Development",
    permission: false,
  },
  {
    id: "tech-lead",
    quote:
      "He isn't one of the type of developers that just says 'sure, I can do that.' He's thoughtful and will give his honest feedback and advice on everything. Overall, 12/10 of a developer. I really got lucky with Anton.",
    name: "Product Owner",
    role: "Tech Lead • $55,749 • 7+ months",
    permission: false,
  },
  {
    id: "consultation",
    quote:
      "On an hour consultation, he killed it. He didn't just talk, we got work done during the call. He was very knowledgeable on pretty much everything I needed and I'll certainly be going back more than a few times.",
    name: "Startup Founder",
    role: "Technical Consultation",
    permission: false,
  },
];

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
