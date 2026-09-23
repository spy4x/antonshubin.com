import { define } from "../lib/utils.ts";
import { getBreadcrumb, head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { Layout } from "../components/Layout.tsx";
import { ArrowRightIcon } from "../components/Icons.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";
import { catalogItem, catalogPath, priceLabel } from "../lib/catalog.ts";
import MeetEmbed, { embedUrl } from "../islands/MeetEmbed.tsx";
import { toJsonLd } from "../lib/json-ld.ts";

interface Faq {
  q: string;
  /** Plain text: the same string is shown on the page and sent as FAQ JSON-LD. */
  a: string;
  link?: { href: string; label: string };
}

const ongoing = catalogItem("cto-advisory-retainer");

/** At most five. The FAQPage JSON-LD below is generated from this array. */
const faqs: Faq[] = [
  {
    q: "What if we start working together and it is not a good fit?",
    a: "That is exactly why I offer a five-day refund. If in the first five days you feel this is not working, tell me and I refund what you paid. We also start with a small first milestone — one or two weeks of work — so if either of us wants to stop at the end of it, we stop, and you keep everything built so far.",
  },
  {
    q: "Do you work fixed price or hourly, and what happens when the scope changes?",
    a: "Both. I work fixed price when the scope is fixed, and hourly for staff augmentation, code reviews, or when the work is open-ended. If the scope changes once we have started, you get a quote for the change before I start on it — no surprise costs.",
  },
  {
    q: "Do you work with clients who already have a development team?",
    a: "Yes, that is one of the most common scenarios. Founders come to me when their existing team is moving too slow, building the wrong thing, or the technical debt is piling up. I step in as a tech lead to set direction, review code, and get things back on track — without replacing your entire team.",
  },
  {
    q: "What if I don't have a clear idea yet?",
    a: SCHEDULE_URL
      ? "Book the free 30-minute intro call, or send me a paragraph about your idea or problem through the form on the home page and I will write back with 3 concrete recommendations. No cost, no pitch."
      : "Send me a paragraph about your idea or problem through the form on the home page and I will write back with 3 concrete recommendations. No cost, no pitch.",
    link: { href: "/#audit-form", label: "Send me your idea" },
  },
  {
    q: "What if my project needs more work after launch?",
    a: `Bugs in what I delivered are fixed free for 30 days. For ongoing needs after that there is the Ongoing item in my catalog (${
      priceLabel(ongoing)
    }), which covers post-launch support. You can also fund a new milestone at any time; if the scope changes, I quote it before I start.`,
    link: { href: catalogPath(ongoing.slug), label: ongoing.title },
  },
];

function FaqItem({ faq }: { faq: Faq }) {
  return (
    <details
      data-faq
      class="bg-gray-800 rounded-xl border border-gray-700 p-4 group open:border-orange-500 transition-colors"
    >
      <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">
        <span>{faq.q}</span>
        <svg
          aria-hidden="true"
          focusable="false"
          class="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </summary>
      <p class="text-gray-400 text-sm mt-3 leading-relaxed">{faq.a}</p>
      {faq.link && (
        <a
          href={faq.link.href}
          class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 underline text-sm mt-2"
        >
          {faq.link.label}
          <ArrowRightIcon class="w-4 h-4" />
        </a>
      )}
    </details>
  );
}

interface PolicyItem {
  icon: string;
  title: string;
  desc: string;
  why: string;
  link?: string;
}

const policies: PolicyItem[] = [
  {
    icon: "🛡️",
    title: "Five-Day Refund",
    desc:
      "If in the first five days you feel this is not working, tell me and I refund what you paid.",
    why:
      "In fifteen years the few engagements that needed a refund all showed it within two or three days, so five days is a promise I can keep.",
  },
  {
    icon: "🎯",
    title: "A Small First Milestone",
    desc:
      "We start with one or two weeks of work. If either of us wants to stop at the end of it, we stop — you keep everything built so far.",
    why:
      "You don't have to commit to months of work before we know the collaboration is right.",
  },
  {
    icon: "🔑",
    title: "You Own Everything From Day One",
    desc: "Code, accounts, servers and keys are in your name.",
    why:
      "Your product is your asset. Nothing about how I work should get in the way of you taking it wherever you need it.",
  },
  {
    icon: "🗓️",
    title: "Weekly Working Software",
    desc:
      "You see working software every week, with a short written update. Calls when they help, not on a schedule for its own sake.",
    why:
      "You always know where the project stands, without sitting through meetings that do not move it forward.",
  },
  {
    icon: "🔧",
    title: "Free Bug Fixes for 30 Days",
    desc: "Bugs in what I delivered are fixed free for 30 days.",
    why:
      "I stand behind what I build. If something I shipped breaks, I fix it on my time, not yours.",
  },
];

export default define.page(function HowIWork() {
  head.value = {
    ...head.value,
    title: "How I Deliver — Anton Shubin",
    description:
      "Five promises, no fine print: a five-day refund, a small first milestone, full ownership from day one, weekly working software, and free bug fixes for 30 days.",
    canonical: "https://antonshubin.com/how-i-work",
    ogType: "website",
  };

  return (
    <Layout currentPath="/how-i-work">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          }),
        }}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          How I Deliver
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Five promises, no fine print.
        </p>

        <div class="space-y-8">
          {policies.map((p, i) => (
            <div
              key={i}
              data-promise
              class="bg-gray-800 rounded-xl border border-gray-700 p-3 sm:p-4"
            >
              <div class="flex items-start gap-4 sm:gap-6">
                <div class="text-3xl shrink-0 mt-1">{p.icon}</div>
                <div class="min-w-0">
                  <h2 class="text-xl font-semibold text-white mb-2">
                    {p.title}
                  </h2>
                  <p class="text-gray-300 text-sm sm:text-base leading-relaxed mb-3">
                    {p.desc}
                  </p>
                  <p class="text-gray-400 text-base leading-relaxed border-l-2 border-gray-600 pl-3">
                    <span class="text-orange-400 font-medium">
                      Why this matters:
                    </span>{" "}
                    {p.why}
                  </p>
                  {p.link && (
                    <a
                      href={p.link}
                      class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium mt-3"
                    >
                      View details and pricing
                      <ArrowRightIcon class="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p class="text-gray-400 text-center max-w-2xl mx-auto mt-8 text-sm sm:text-base">
          Pricing: fixed price when the scope is fixed, hourly when the work is
          open-ended. A change to scope gets a quote before I start on it.
        </p>

        <section id="ai-augmented" class="mt-16 scroll-mt-4">
          <h2 class="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            AI-Augmented Execution
          </h2>
          <p class="text-gray-400 text-center mb-8 text-base">
            Human-owned architecture + spec-driven development. Two rules I
            keep, two alternatives I avoid.
          </p>
          <div class="grid gap-5 md:grid-cols-2">
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <h3 class="text-base font-semibold text-white mb-2">
                What "human-owned" means
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Every architectural decision is made by me, not by a model. I
                draft specs, choose stacks, and own the system diagram. AI
                assists with boilerplate, refactors, and test scaffolding — the
                parts where consistency matters more than judgement.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <h3 class="text-base font-semibold text-white mb-2">
                What "spec-driven" means
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Every change starts as a written spec — a brief paragraph on
                intent, edge cases, and acceptance criteria. Code follows the
                spec, not the other way around. If the spec changes, the diff
                includes the spec update first, so reviewers can reason about
                intent before implementation.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border border-orange-900/40">
              <p class="text-xs uppercase tracking-wide text-orange-400 font-semibold mb-2">
                Vs vibe-coding
              </p>
              <h3 class="text-base font-semibold text-white mb-2">
                What "AI owns the architecture" looks like
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Ask an LLM to "build me a SaaS", paste the output, ship it. No
                system diagram. No stack rationale. Three weeks in: tech debt
                the model can't see, dependencies it picked for vibes, auth
                flows it hallucinated. You own the codebase. Nobody owns the
                decisions in it.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border border-orange-900/40">
              <p class="text-xs uppercase tracking-wide text-orange-400 font-semibold mb-2">
                Vs code-first
              </p>
              <h3 class="text-base font-semibold text-white mb-2">
                What "ship now, spec later" looks like
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Move fast, write code, document when there's time. There is no
                time. Six months later, no one remembers why the auth flow skips
                email verification for legacy users, or why that one table has
                no foreign key. The spec lives only in Slack threads and
                ex-employers' heads.
              </p>
            </div>
          </div>
          <p class="mt-6 text-gray-400 text-sm text-center">
            Stack I work with: Deno, Preact, TypeScript, PostgreSQL, Docker,
            MCP, self-hosted infra. See{" "}
            <a
              href="/infrastructure"
              class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 underline font-medium"
            >
              my infrastructure setup
              <ArrowRightIcon class="w-4 h-4" />
            </a>{" "}
            for proof.
          </p>
        </section>

        {/* FAQ Section */}
        <section class="mt-16">
          <h2 class="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            Frequently Asked Questions
          </h2>
          <p class="text-gray-400 text-center mb-10 text-base">
            Honest answers to the questions I get most often.
          </p>
          <div class="space-y-4 max-w-3xl mx-auto">
            {faqs.map((f) => <FaqItem key={f.q} faq={f} />)}
          </div>
        </section>

        {
          /* Booking ask, after the FAQ: objections cleared before the ask.
          Rendered only when SCHEDULE_URL is set — otherwise MeetEmbed shows
          nothing and the fallback link below would carry an empty href. */
        }
        {SCHEDULE_URL && (
          <div class="text-center mt-16">
            <MeetEmbed url={embedUrl(SCHEDULE_URL)} />
            <p class="mt-4 text-gray-400 text-sm">
              Or{" "}
              <a
                href={SCHEDULE_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="meet-embed-fallback-click"
                class="hover:text-orange-300 underline underline-offset-4"
              >
                open standalone
                <NewTabHint />
              </a>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
});
