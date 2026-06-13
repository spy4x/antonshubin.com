import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

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
  },
];

export default define.page(function HowIWork() {
  return (
    <Layout currentPath="/how-i-work">
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
      </div>
    </Layout>
  );
});
