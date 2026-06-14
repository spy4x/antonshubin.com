import type { ComponentChildren } from "preact";
import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

function FaqItem(
  { q, children }: { q: string; children: ComponentChildren },
) {
  return (
    <details class="bg-gray-800 rounded-xl border border-gray-700 p-5 group open:border-orange-500 transition-colors">
      <summary class="text-white font-medium cursor-pointer list-none flex items-center justify-between">
        <span>{q}</span>
        <svg
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
      <p class="text-gray-400 text-sm mt-3 leading-relaxed">
        {children}
      </p>
    </details>
  );
}

const policies = [
  {
    icon: "🛡️",
    title: "14-Day Mutual Alignment Guarantee",
    desc:
      "If within the first two weeks either party feels the communication style, workflow, or technical approach isn't working, the contract is terminated immediately and a 100% refund is issued — no questions asked. Software architecture requires absolute trust. This guarantee makes it risk-free.",
    why:
      "I'd rather lose a project than force a partnership that doesn't click. This protects both of us.",
  },
  {
    icon: "⏱️",
    title: "Async-First Execution",
    desc:
      "One structured weekly alignment call (30-60 min). All daily standups, updates, and demonstrations handled asynchronously via text or Loom video. You pay for engineering throughput, not meeting bloat.",
    why:
      "Synchronous meetings kill deep work. Async-first means more code shipped, fewer hours billed to meetings.",
  },
  {
    icon: "🔑",
    title: "Clean Handoff & IP Sovereignty",
    desc:
      "You hold the root infrastructure keys and own 100% of the source code and intellectual property from Day 1. I build on open-source, self-hostable stacks — no proprietary lock-in, no vendor hostage.",
    why:
      "Your product is your asset. I build it so you can take it anywhere, anytime.",
  },
  {
    icon: "🎯",
    title: "Fixed-Price Milestones",
    desc:
      "Once a milestone is funded, the scope is locked to guarantee delivery dates. New ideas or features introduced mid-sprint are automatically captured in a structured V2 Backlog — quoted only after the current version is deployed to production.",
    why:
      "No scope creep. No surprise costs. You know exactly what you're paying for and when you'll get it.",
  },
  {
    icon: "🔧",
    title: "30-Day Code Warranty",
    desc:
      "I patch any bugs or regressions within the delivered scope for free for 30 days post-launch. If something breaks that shouldn't have, I fix it on my dime.",
    why:
      "I stand by my architecture. This isn't 'ship and forget' — it's 'ship and support.'",
  },
  {
    icon: "💬",
    title: "No Jargon Guarantee",
    desc:
      "Every technical decision gets a plain-English explanation. You will never hear opaque jargon without a clear translation of what it means for your product, timeline, and budget.",
    why:
      "Non-technical founders should not need a translator. I speak both business and engineering fluently.",
  },
  {
    icon: "🌐",
    title: "Community-Driven Architecture",
    desc:
      "I build with proven technologies: Deno/Node.js, Preact/React, PostgreSQL, Valkey/Redis, Docker/Podman. AI integrations via OpenAI, Claude, and DeepSeek APIs. No proprietary frameworks. No single-vendor risk. Developers everywhere already know these tools — there is no research or retraining needed.",
    why:
      "Your product should not be held hostage by a niche technology choice. Open-source means portable, auditable, and sustainable.",
  },
  {
    icon: "🛟",
    title: "Post-Launch Support & Maintenance",
    desc:
      "Ongoing infrastructure oversight after your project ships. Server monitoring, backup verification, disk space tracking, security patch updates, and monthly status reports. Critical issues get an 8-hour response time.",
    why:
      "Your software is your asset — it deserves care after launch. This is not just bug fixes; it is peace of mind that your product stays healthy, secure, and fast.",
    link: "/catalog/post-launch-support-maintenance",
  },
];

export default define.page(function HowIWork() {
  return (
    <Layout currentPath="/how-i-work">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": policies.map((p) => ({
              "@type": "Question",
              "name": p.title,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": p.desc + " " + p.why,
              },
            })),
          }),
        }}
      />
      <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          How I Deliver
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          Zero micromanagement. Complete transparency. Predictable outcomes.
        </p>

        <div class="space-y-8">
          {policies.map((p, i) => (
            <div
              key={i}
              class="bg-gray-800 rounded-xl border border-gray-700 p-6 sm:p-8"
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
                  {(p as any).link && (
                    <a
                      href={(p as any).link}
                      class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium mt-3"
                    >
                      View details and pricing →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div class="text-center mt-12">
          <a
            href={SCHEDULE_URL}
            target="_blank"
            class="inline-block px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
          >
            Book a free 30-min intro call
          </a>
        </div>

        {/* FAQ Section */}
        <section class="mt-16">
          <h2 class="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
            Frequently Asked Questions
          </h2>
          <p class="text-gray-400 text-center mb-10 text-base">
            Honest answers to the questions I get most often.
          </p>
          <div class="space-y-4 max-w-3xl mx-auto">
            <FaqItem q="What if we start working together and it is not a good fit?">
              That is exactly why I offer the 14-Day Mutual Alignment Guarantee.
              If within the first two weeks either of us feels the communication
              style, workflow, or technical approach is not working, I issue a
              100% refund — no questions asked. I would rather lose a project
              than force a partnership that does not click.
            </FaqItem>

            <FaqItem q="How do you handle scope changes mid-project?">
              Once a milestone is funded, the scope is locked to guarantee
              delivery dates. New ideas or features that come up during
              development are automatically captured in a structured V2 Backlog
              — quoted separately after the current version is deployed. This
              protects your timeline and your budget.
            </FaqItem>

            <FaqItem q="Do you work with clients who already have a development team?">
              Yes, that is one of the most common scenarios. Founders come to me
              when their existing team is moving too slow, building the wrong
              thing, or the technical debt is piling up. I step in as a Tech
              Lead or Architect to set direction, review code, and get things
              back on track — without replacing your entire team.
            </FaqItem>

            <FaqItem q="What kind of projects do you take on an hourly basis?">
              I prefer fixed-price for clearly defined projects from our catalog
              (MVPs, audits, API builds). But I am open to hourly for staff
              augmentation, consulting, or when the scope is not fully clear yet
              — such as helping your existing team, reviewing code, or advising
              on architecture decisions. The key is transparency: you will know
              upfront whether a project fits better as fixed-price or hourly.
            </FaqItem>

            <FaqItem q="How do you communicate during a project?">
              We hold one structured weekly alignment call (30-60 minutes). All
              daily updates, code demonstrations, and questions are handled
              asynchronously via text or Loom video. You are always in the loop
              without sitting through daily standups. You pay for engineering
              throughput, not meeting bloat.
            </FaqItem>

            <FaqItem q="How long does a typical project take?">
              It depends on the scope. A Codebase Health Audit takes 3 days. A
              Backend API takes around 14 days. A full SaaS MVP is typically 21
              days. The Technical Discovery Sprint (3 days) helps us define the
              exact timeline before committing to a larger milestone. Every
              project ships in weeks, not months.
            </FaqItem>

            <FaqItem q="What technologies do you use?">
              My core stack is Deno/Node.js, TypeScript, Preact/React,
              PostgreSQL, Valkey/Redis, Docker/Podman, and Traefik. For AI work,
              I integrate OpenAI, Claude, and DeepSeek APIs. Everything is
              open-source and self-hostable — no proprietary frameworks, no
              vendor lock-in.
            </FaqItem>

            <FaqItem q="Can you work with my existing codebase?">
              Yes, I regularly take over existing projects that need
              architecture improvements, performance fixes, or new features. The
              Codebase Health Audit is specifically designed for this — I review
              your code and deliver a prioritized roadmap of what to fix, what
              to keep, and what to rewrite.
            </FaqItem>

            <FaqItem q="What if I don't have a clear idea yet?">
              That is what the Free Architecture Audit is for. Send me a
              paragraph about your idea or problem, and I will send back 3
              concrete recommendations within 48 hours. No cost, no pitch. From
              there, we can decide if a consultation or discovery sprint makes
              sense.
            </FaqItem>

            <FaqItem q="What if my project needs more work after launch?">
              Every project comes with a 30-Day Code Warranty — I fix any bugs
              within the delivered scope for free. For ongoing needs, I offer a
              {" "}
              <a
                href="/catalog/post-launch-support-maintenance"
                class="text-orange-400 hover:text-orange-300 underline"
              >
                Post-Launch Support & Maintenance
              </a>{" "}
              package that covers server monitoring, backup verification,
              security patches, and priority support. You can also fund
              additional milestones from the V2 Backlog at any time.
            </FaqItem>

            <FaqItem q="How do I know you are the right person for my project?">
              Start with a free architecture audit — send me your tech stack or
              idea, and I will send back 3 concrete improvements within 48
              hours. No cost, no pitch. If you like the quality of the feedback,
              we can schedule a consultation. If not, you have lost nothing
              except an email. I have done this for 80+ projects across 15
              years, and I am confident I can help you too.
            </FaqItem>
          </div>
        </section>
      </div>
    </Layout>
  );
});
