import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL, UPWORK_URL } from "../lib/config.ts";
import { type Project, projects } from "../lib/data.ts";
import { catalogItems, INTRO_CALL, priceLabel } from "../lib/catalog.ts";
import { ROLE } from "../lib/head.ts";
import LeadForm from "../islands/LeadForm.tsx";
import { BookCallLink } from "../components/BookCallLink.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import {
  ArrowRightIcon,
  CalendarIcon,
  StarIcon,
  UpworkIcon,
} from "../components/Icons.tsx";

/** The three numbers of the proof strip. All three are on my Upwork profile. */
const proofNumbers = [
  { value: "80", label: "jobs on Upwork" },
  { value: "100%", label: "Job Success" },
  { value: "$395K", label: "earned on Upwork" },
];

/**
 * The three case studies named on the home page. Role and outcome are read
 * from lib/data.ts, so a figure lives in one place.
 */
const caseStudies: Project[] = ["smartlite", "foodrazor", "corecircle"].map(
  (slug) => {
    const project = projects.freelance.find((p) => p.slug === slug);
    if (!project) throw new Error(`routes/index.tsx: no project "${slug}"`);
    return project;
  },
);

/** Three steps, drawn from the five promises on /how-i-work and nothing else. */
const steps = [
  {
    title: "We talk",
    desc:
      "A free 30-minute call. Tell me what you need and I will tell you how I would go about it.",
  },
  {
    title: "A small first milestone",
    desc:
      "We start with one or two weeks of work. Either of us can stop at the end of it, and you keep everything built so far. If in the first five days you feel this is not working, I refund what you paid.",
  },
  {
    title: "Working software every week",
    desc:
      "You see working software every week, with a short written update. Code, accounts, servers and keys are in your name from day one, and bugs in what I delivered are fixed free for 30 days.",
  },
];

export default define.page(function Home(ctx) {
  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-4xl mx-auto">
        {/* 1. Hero */}
        <section data-home-section="hero" class="mb-16 md:mb-24">
          <div class="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            <div class="flex-1 mb-8 lg:mb-0">
              <h1 class="text-4xl font-bold text-gray-100 mb-6 sm:text-5xl">
                Anton Shubin — {ROLE}
              </h1>
              <p class="text-base text-gray-300 sm:text-lg md:text-xl mb-4">
                I build and run SaaS products{" "}
                <span class="text-white font-semibold bg-orange-600 px-2 py-0.5 rounded-md whitespace-nowrap">
                  end to end
                </span>
                {", and you own the code, the servers and the keys from day one."}
              </p>
              <p class="text-sm sm:text-base text-gray-300 leading-relaxed">
                Fixed price when the scope is fixed, hourly when it's
                open-ended. A change to the scope gets a quote before I start on
                it.
              </p>

              <div class="mt-6">
                <BookCallLink
                  url={SCHEDULE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="hero-book-call"
                  data-e2e="hero-book-call"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200 text-base"
                >
                  <CalendarIcon class="w-5 h-5" />
                  Book a {INTRO_CALL}
                </BookCallLink>
                <p class="mt-3 text-sm text-gray-400">
                  Rather write?{" "}
                  <a
                    href="#audit-form"
                    data-umami-event="hero-audit-link"
                    class="text-orange-400 hover:text-orange-300 underline underline-offset-4"
                  >
                    Get a free written audit
                  </a>
                </p>
              </div>
            </div>
            {
              /* Hero media. The intro video (#118) replaces the <picture> inside
                this box; the box keeps its width, so nothing else moves. */
            }
            <div data-hero-media class="lg:w-[400px] lg:flex-shrink-0">
              <picture>
                <source
                  media="(max-width: 640px)"
                  srcset="/img/photo-mobile.webp"
                  type="image/webp"
                />
                <img
                  class="w-full h-auto rounded-xl object-cover"
                  src="/img/photo-big.webp"
                  alt="Anton Shubin"
                  width="800"
                  height="600"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                  fetchpriority="high"
                  loading="eager"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </section>

        {/* 2. Proof strip: three numbers, three named case studies */}
        <section data-home-section="proof" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">The work is real</h2>
          <a
            href={UPWORK_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="home-outbound-upwork"
            class="grid grid-cols-3 gap-3 sm:gap-5 mb-3 group"
          >
            {proofNumbers.map((n) => (
              <div
                key={n.label}
                class="p-3 sm:p-4 bg-gray-800 rounded-xl border border-gray-700 group-hover:border-orange-500 transition-colors text-center"
              >
                <p class="text-2xl sm:text-4xl font-bold text-white">
                  {n.value}
                </p>
                <p class="text-gray-400 text-xs sm:text-sm mt-1">{n.label}</p>
              </div>
            ))}
            <NewTabHint />
          </a>
          <p class="text-gray-400 text-sm mb-8">
            Expert-Vetted on Upwork (top 1%), 6,600+ hours.{" "}
            <a
              href={UPWORK_URL}
              target="_blank"
              rel="noopener noreferrer"
              class="text-orange-400 hover:text-orange-300 underline underline-offset-4"
            >
              Check it on my Upwork profile
              <NewTabHint />
            </a>
          </p>
          <div class="grid gap-5 md:grid-cols-3">
            {caseStudies.map((p) => (
              <a
                key={p.slug}
                href={`/projects/${p.slug}`}
                data-e2e={`home-view-${p.slug}`}
                class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
              >
                <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {p.title}
                </h3>
                <p class="text-xs uppercase tracking-wide text-gray-500 mt-1 mb-3">
                  {p.role}
                </p>
                <p class="text-gray-300 text-sm leading-relaxed flex-1">
                  {p.outcome}
                </p>
                <span class="mt-3 inline-flex items-center gap-1 text-sm text-orange-400 font-medium">
                  Read the case study
                  <ArrowRightIcon class="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
          <div class="mt-6 text-right">
            <a
              href="/projects"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              See all work
              <ArrowRightIcon class="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 3. The offers — titles and prices come from lib/catalog.ts */}
        <section data-home-section="offers" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">What it costs</h2>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {catalogItems.map((item) => (
              <a
                key={item.slug}
                href={`/catalog/${item.slug}`}
                data-umami-event={`home-offer-${item.slug}`}
                class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
              >
                <div class="text-3xl mb-3">{item.icon}</div>
                <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                  {item.shortTitle}
                </h3>
                <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                  {item.summary}
                </p>
                <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                  {priceLabel(item)}
                </span>
                <span class="text-gray-500 text-xs mt-1.5">
                  {item.delivery}
                </span>
              </a>
            ))}
          </div>
          <p class="text-gray-400 text-sm mt-6">
            A price that says "from" gets a quote for your scope before any work
            starts.
          </p>
        </section>

        {/* Testimonial Section */}
        <section data-home-section="testimonials" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">What clients say</h2>
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1: MVP Development */}
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
              <div class="flex gap-1 items-center mb-3">
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <span class="ml-1 text-white font-medium text-sm">5.0</span>
              </div>
              <p class="text-sm italic text-gray-300 mb-4 leading-relaxed flex-1">
                "Anton was a terrific partner to me in developing an MVP of a
                web app I've been dreaming of for ages. He is a highly skilled
                developer, a super resourceful problem-solver, and a
                conscientious and communicative collaborator."
              </p>
              <div>
                <p class="font-medium text-white text-sm">Startup Founder</p>
                <p class="text-gray-400 text-sm">
                  MVP Development
                </p>
              </div>
            </div>

            {/* Testimonial 2: Technical Lead */}
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
              <div class="flex gap-1 items-center mb-3">
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <span class="ml-1 text-white font-medium text-sm">5.0</span>
              </div>
              <p class="text-sm italic text-gray-300 mb-4 leading-relaxed flex-1">
                "He isn't one of the type of developers that just says 'sure, I
                can do that.' He's thoughtful and will give his honest feedback
                and advice on everything. Overall, 12/10 of a developer. I
                really got lucky with Anton."
              </p>
              <div>
                <p class="font-medium text-white text-sm">Product Owner</p>
                <p class="text-gray-400 text-sm">
                  Tech Lead • $55,749 • 7+ months
                </p>
              </div>
            </div>

            {/* Testimonial 3: Consultation */}
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
              <div class="flex gap-1 items-center mb-3">
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <StarIcon class="text-orange-500 w-4 h-4" filled />
                <span class="ml-1 text-white font-medium text-sm">5.0</span>
              </div>
              <p class="text-sm italic text-gray-300 mb-4 leading-relaxed flex-1">
                "On an hour consultation, he killed it. He didn't just talk, we
                got work done during the call. He was very knowledgeable on
                pretty much everything I needed and I'll certainly be going back
                more than a few times."
              </p>
              <div>
                <p class="font-medium text-white text-sm">Startup Founder</p>
                <p class="text-gray-400 text-sm">
                  Technical Consultation
                </p>
              </div>
            </div>
          </div>

          {/* Link to Upwork */}
          <div class="mt-6 text-right">
            <a
              href="https://www.upwork.com/freelancers/ashubin"
              target="_blank"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              View all reviews on <UpworkIcon class="w-auto h-4 text-white" />
              <span class="sr-only">Upwork</span>
              <svg
                aria-hidden="true"
                focusable="false"
                class="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
              <NewTabHint />
            </a>
          </div>
        </section>

        {/* 5. How it works — three steps drawn from the five promises */}
        <section data-home-section="how-it-works" class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How it works</h2>
          <ol class="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li
                key={s.title}
                class="p-4 bg-gray-800 rounded-xl border border-gray-700"
              >
                <p class="text-orange-400 font-bold text-lg mb-2">{i + 1}</p>
                <h3 class="text-lg font-semibold text-white mb-2">
                  {s.title}
                </h3>
                <p class="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
          <div class="mt-6 text-right">
            <a
              href="/how-i-work"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              The five promises in full
              <ArrowRightIcon class="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* 6. One primary call to action; the written audit is the secondary path */}
        <section
          id="cta-bottom"
          data-home-section="cta"
          class="mb-16 md:mb-24 text-center"
        >
          <h2 class="h1 mb-4">Let's talk</h2>
          {SCHEDULE_URL && (
            <p class="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-6">
              Thirty minutes, free, no pitch. We talk about what you are
              building and whether I can help.
            </p>
          )}
          <BookCallLink
            url={SCHEDULE_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="home-book-call"
            data-primary-cta
            class="inline-flex items-center gap-2.5 px-8 py-3.5 text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-500/25 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200"
          >
            <CalendarIcon class="w-5 h-5" />
            Book a {INTRO_CALL}
          </BookCallLink>
          <p class="mt-4 text-sm text-gray-400">
            Rather write?{" "}
            <a
              href="#audit-form"
              data-umami-event="cta-audit-link"
              class="text-orange-400 hover:text-orange-300 underline underline-offset-4"
            >
              Send me your idea or your app for a free written audit
            </a>
          </p>
          <div id="audit-form" class="mt-12 scroll-mt-4 text-left">
            <LeadForm scheduleUrl={SCHEDULE_URL} />
          </div>
        </section>
      </div>
    </Layout>
  );
});
