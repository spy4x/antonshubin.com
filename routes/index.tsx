import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { CTASection } from "../components/CTASection.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";
import { blogArticles, homeBlogSlugs, prettyDate } from "../lib/data.ts";
import LeadForm from "../islands/LeadForm.tsx";
import {
  ArrowRightIcon,
  BullseyeIcon,
  ClockIcon,
  DollarIcon,
  FireIcon,
  FlagIcon,
  GithubIcon,
  KeyIcon,
  PenIcon,
  ServerIcon,
  ShieldCheckIcon,
  StarIcon,
  UpworkIcon,
  WrenchIcon,
  YouTubeIcon,
} from "../components/Icons.tsx";
import GhStars from "../islands/GhStars.tsx";

export default define.page(function Home(ctx) {
  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <div class="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div class="mb-16 md:mb-24">
          <div class="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            {/* Text Content */}
            <div class="flex-1 mb-8 lg:mb-0">
              <h1 class="text-4xl font-bold text-gray-100 mb-6 sm:text-5xl">
                Anton Shubin — Fractional CTO & Lead Architect
              </h1>
              <div class="text-base text-gray-300 sm:text-lg md:text-xl">
                <p class="mb-4">
                  One accountable technical lead from{" "}
                  <span class="text-white font-semibold bg-orange-600 px-2 py-0.5 rounded-md whitespace-nowrap">
                    architecture through production
                  </span>
                </p>
                <ul class="space-y-1 text-gray-300">
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>
                      Fixed price when the scope is fixed, hourly when it's
                      open-ended
                    </span>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>
                      Architecture decisions explained in plain English
                    </span>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>You own the code, infrastructure, and root keys</span>
                  </li>
                </ul>
              </div>

              <p class="mt-6 text-sm sm:text-base text-gray-300 leading-relaxed">
                I default to open-source and self-hostable stacks — FOSS
                preferred for cost discipline, performance, and portability. I
                work with managed services (AWS, GCP, Supabase) when the
                business calls for it. Bare-metal on Hetzner when the workload
                justifies it. Single technical owner with the keys, not a vendor
                middleman.
              </p>

              {/* Metrics Bar — linked to Upwork for proof */}
              <div class="mt-6 grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:flex-row sm:items-center sm:gap-x-4 text-sm sm:text-base text-gray-400">
                <a
                  href="https://www.upwork.com/freelancers/ashubin"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  Expert-Vetted (Top 1%)
                </a>
                <span class="hidden sm:inline text-gray-600">|</span>
                <a
                  href="https://www.upwork.com/freelancers/ashubin"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  80+ Projects
                </a>
                <span class="hidden sm:inline text-gray-600">|</span>
                <a
                  href="https://www.upwork.com/freelancers/ashubin"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 hover:text-orange-400 transition-colors"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  100% Job Success
                </a>
              </div>

              {/* Primary CTA — Free Audit (low commitment, leads to #audit-form) */}
              <div class="mt-6">
                <a
                  href="#audit-form"
                  data-umami-event="hero-audit-cta"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200 text-base"
                  data-e2e="hero-book-call"
                >
                  Get my free architecture audit
                  <ArrowRightIcon class="w-5 h-5" />
                </a>
                {/* Risk-reversal micro-copy (no-pitch reassurance) */}
                <p class="mt-2 text-sm text-gray-400">
                  No pitch. 3 concrete improvements in your inbox within 48
                  hours.
                </p>
                {/* Secondary link to production-credibility proof */}
                <p class="mt-3">
                  <a
                    href="/infrastructure"
                    class="inline-flex min-h-11 items-center px-2 text-sm font-medium text-orange-400 underline underline-offset-4 transition-colors hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                    data-e2e="hero-production-proof"
                  >
                    See production operations proof →
                  </a>
                </p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://github.com/spy4x"
                  target="_blank"
                  data-umami-event="home-outbound-github"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <GithubIcon class="w-4 h-4" />
                  GitHub
                </a>
                <a
                  href="https://www.youtube.com/@anton-shubin"
                  target="_blank"
                  data-umami-event="home-outbound-youtube"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  <YouTubeIcon class="w-4 h-4" />
                  YouTube
                </a>
                <a
                  href="https://www.upwork.com/freelancers/ashubin"
                  target="_blank"
                  data-umami-event="home-outbound-upwork"
                  class="inline-flex items-center justify-center px-3 py-2 rounded-md text-white bg-green-700 hover:bg-green-600 transition-colors"
                  title="Upwork profile"
                >
                  <UpworkIcon class="w-auto h-4 text-white" />
                </a>
              </div>
            </div>
            {/* Hero Image */}
            <div class="lg:w-[400px] lg:flex-shrink-0">
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
        </div>

        {/* B2: Pain Point Recognition Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">
            Are you a non-technical founder who's been burned by developers?
          </h2>
          <div class="grid gap-5 md:grid-cols-3">
            <div class="p-4 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="p-2 bg-orange-500/15 rounded-lg inline-block mb-3 text-orange-400">
                <FireIcon class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">
                Overpromised, underdelivered
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                You've hired devs who promised the world and delivered a
                nightmare. I've fixed those messes.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="p-2 bg-orange-500/15 rounded-lg inline-block mb-3 text-orange-400">
                <DollarIcon class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">
                Infrastructure chosen by habit
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Infrastructure cost should follow actual load, recovery needs,
                compliance, and your team's capacity — not a default stack.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="p-2 bg-orange-500/15 rounded-lg inline-block mb-3 text-orange-400">
                <FlagIcon class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">
                No ownership, no clarity
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                You need a technical partner who owns the outcome — not a
                time-tracker who owns the hours.
              </p>
            </div>
          </div>
        </section>

        {/* Infrastructure ownership proof */}
        <section class="mb-16 md:mb-24">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <div class="p-3 bg-orange-500/15 rounded-xl shrink-0">
                <ServerIcon class="w-8 h-8 text-orange-400" />
              </div>
              <div class="flex-1">
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Architecture That Still Works After Launch
                </h2>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-3">
                  Product architecture includes deployment, observability,
                  recovery, security, cost controls, and clean handoff. My
                  obsession with cost discipline, performance, and lean stacks
                  shapes every decision — dedicated Hetzner when the workload
                  justifies it, managed cloud when the business calls for it,
                  hybrid in between.
                </p>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-5">
                  I bring the same operational mindset whether you operate on a
                  fresh laptop, a $50/month Hetzner box, or a managed AWS fleet.
                  The decisions are about your product, not my preferences.
                </p>
                <a
                  href="/infrastructure"
                  data-e2e="home-view-infrastructure-proof"
                  class="min-h-11 inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-md transition-colors font-medium"
                >
                  See how I architect production →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* B3: Engagement Terms Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How I Deliver</h2>
          <p class="text-gray-400 mb-8 text-base sm:text-lg">
            Five promises, no fine print.
          </p>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="p-2 bg-green-500/15 rounded-lg inline-block mb-2 text-green-400">
                <ShieldCheckIcon class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                Five-Day Refund
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                If in the first five days you feel this is not working, tell me
                and I refund what you paid.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="p-2 bg-orange-500/15 rounded-lg inline-block mb-2 text-orange-400">
                <BullseyeIcon class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                A Small First Milestone
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                We start with one or two weeks of work. If either of us wants to
                stop at the end of it, we stop — you keep everything built so
                far.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="p-2 bg-amber-500/15 rounded-lg inline-block mb-2 text-amber-400">
                <KeyIcon class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                You Own Everything From Day One
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Code, accounts, servers and keys are in your name.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="p-2 bg-blue-500/15 rounded-lg inline-block mb-2 text-blue-400">
                <ClockIcon class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                Weekly Working Software
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                You see working software every week, with a short written
                update. Calls when they help, not on a schedule for its own
                sake.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group sm:col-span-2 lg:col-span-1"
            >
              <div class="p-2 bg-gray-700/60 rounded-lg inline-block mb-2 text-gray-300">
                <WrenchIcon class="w-5 h-5" />
              </div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                Free Bug Fixes for 30 Days
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Bugs in what I delivered are fixed free for 30 days.
              </p>
            </a>
          </div>

          <p class="text-gray-400 text-sm mt-6 max-w-2xl">
            Pricing: fixed price when the scope is fixed, hourly when the work
            is open-ended. A change to scope gets a quote before I start on it.
          </p>

          <div class="mt-6 text-right">
            <a
              href="/how-i-work"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              Read more about how I work
              <svg
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
            </a>
          </div>
        </section>

        {/* Who This Is For — 3 persona cards for self-categorization */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">Who This Is For</h2>
          <div class="grid gap-5 md:grid-cols-3">
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <p class="text-xs uppercase tracking-wide text-orange-400 font-semibold mb-2">
                Founder
              </p>
              <h3 class="text-base font-semibold text-white mb-2">
                You have the idea. Need one technical partner to ship it.
              </h3>
              <ul class="text-gray-400 text-sm space-y-1.5 leading-relaxed">
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Driving the vision, not the codebase</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Idea, napkin sketch, or pre-seed traction</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Want one accountable owner, not a dev agency</span>
                </li>
              </ul>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <p class="text-xs uppercase tracking-wide text-orange-400 font-semibold mb-2">
                CTO
              </p>
              <h3 class="text-base font-semibold text-white mb-2">
                Need a senior pair of hands on architecture and AI tooling.
              </h3>
              <ul class="text-gray-400 text-sm space-y-1.5 leading-relaxed">
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Tech debt slowing velocity</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Architecture review or security audit</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Want AI / MCP integration without lock-in</span>
                </li>
              </ul>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <p class="text-xs uppercase tracking-wide text-orange-400 font-semibold mb-2">
                Scaling Founder
              </p>
              <h3 class="text-base font-semibold text-white mb-2">
                Post-PMF with a team. Need fractional leadership.
              </h3>
              <ul class="text-gray-400 text-sm space-y-1.5 leading-relaxed">
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Funded SaaS, in-build or scaling</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>AWS bill climbing, perf degrading</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-500 shrink-0">—</span>
                  <span>Want predictable delivery and plain-English comms</span>
                </li>
              </ul>
            </div>
          </div>
          <p class="mt-5 text-gray-400 text-sm leading-relaxed">
            AI-augmented execution with human-owned architecture + spec-driven
            development.{" "}
            <a
              href="/how-i-work#ai-augmented"
              class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 underline font-medium"
            >
              See how I work
              <ArrowRightIcon class="w-4 h-4" />
            </a>
          </p>
        </section>

        {/* Featured Services — from Catalog */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How to Work Together</h2>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/catalog/strategy-call"
              data-umami-event="home-cta-strategy-call"
              class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">🎯</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                Strategy Session
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                60-minute deep-dive with actionable roadmap and tech stack
                recommendations.
              </p>
              <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                $350 — 60 min
              </span>
            </a>
            <a
              href="/catalog/cto-advisory-retainer"
              data-umami-event="home-cta-retainer"
              class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">👔</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                CTO Advisory Retainer
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                Ongoing fractional CTO partnership — strategy, architecture,
                team leadership. Async execution, calls when they help.
              </p>
              <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                $3K–$5K/mo — Monthly
              </span>
            </a>
            <a
              href="/catalog/zero-to-production-saas-mvp"
              data-umami-event="home-cta-mvp"
              class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">🚀</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                SaaS MVP
              </h3>
              <p class="text-gray-400 text-sm mb-3 leading-relaxed">
                Full MVP from idea to live deployment.
              </p>
              <ul class="text-xs text-gray-300 space-y-1 mb-3 leading-relaxed">
                <li class="flex items-start gap-1.5">
                  <span class="text-green-400 shrink-0">✓</span>
                  <span>Auth (email + social login)</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-green-400 shrink-0">✓</span>
                  <span>Stripe payments + webhooks</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-green-400 shrink-0">✓</span>
                  <span>REST API + admin dashboard</span>
                </li>
                <li class="flex items-start gap-1.5">
                  <span class="text-green-400 shrink-0">✓</span>
                  <span>Docker deploy + 30-day warranty</span>
                </li>
              </ul>
              <div class="mt-auto flex items-center justify-between gap-2">
                <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full self-start">
                  From $15,000 — 21 days
                </span>
                <span class="text-xs text-orange-400 group-hover:text-orange-300 transition-colors font-medium">
                  Full scope →
                </span>
              </div>
            </a>
            <a
              href="/catalog/free-architecture-audit"
              data-umami-event="home-cta-audit"
              class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">🔍</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                Free Architecture Audit
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                Send your idea or your current app. I'll send back 3 concrete
                improvements within 48 hours. No cost.
              </p>
              <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                Free — 48 hours
              </span>
            </a>
          </div>
          <div class="mt-6 text-right">
            <a
              href="/catalog"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              View all services
              <svg
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
            </a>
          </div>
        </section>

        {/* G1: Free Architecture Audit Lead Magnet — interactive form */}
        <section id="audit-form" class="mb-16 md:mb-24 scroll-mt-4">
          <LeadForm scheduleUrl={SCHEDULE_URL} />
        </section>

        {/* Mid-funnel escape hatch — demoted to muted text link */}
        <p class="mb-16 md:mb-24 text-center text-sm text-gray-400">
          Rather just talk?{" "}
          <a
            href="#cta-bottom"
            data-umami-event="mid-funnel-talk-link"
            class="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 underline font-medium"
          >
            Schedule a free intro call
            <ArrowRightIcon class="w-4 h-4" />
          </a>
        </p>

        {/* Featured Projects Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">
            Production Systems & Engineering Proof
          </h2>
          <div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p class="text-sm sm:text-base text-gray-200 leading-relaxed">
              Client production ownership first, backed by public systems you
              can inspect.
            </p>
          </div>
          <div class="grid gap-6 md:grid-cols-2">
            {/* SmartLite — client production system */}
            <a
              href="/projects/smartlite"
              data-e2e="home-view-smartlite"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-blue-500/20 rounded-lg">
                  <svg
                    class="w-6 h-6 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  SmartLite
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Real-time IoT control platform for about 200 lamp poles at
                Gardens by the Bay, in production since 2024. Built from zero to
                production in three months: operator web app, backend, AWS
                infrastructure, deployment pipeline, alerts, and role-based
                access with 2FA.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  IoT
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Production
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  AWS
                </span>
              </div>
            </a>

            {/* Production Infrastructure Lab — public operations proof */}
            <a
              href="/projects/homelab"
              data-e2e="home-view-infrastructure-lab"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-green-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-green-500/20 rounded-lg">
                  <ServerIcon class="w-6 h-6 text-green-400" />
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-green-400 transition-colors">
                  Production Infrastructure Lab
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Sanitized infrastructure case study covering versioned delivery,
                observability, backup integrity checks, retention and restore
                tooling, and identity controls.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  IaC
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Operations
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Recovery
                </span>
              </div>
            </a>

            {/* caldav-mcp — public engineering proof */}
            <a
              href="/projects/caldav-mcp"
              data-e2e="home-view-caldav-mcp"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-blue-500/20 rounded-lg">
                  <svg
                    class="w-6 h-6 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  caldav-mcp
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Native Deno MCP server for CalDAV events and tasks. Zero npm
                dependencies, single binary, and public source.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  MCP
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  CalDAV
                </span>
                <GhStars repo="spy4x/caldav-mcp" class="ml-auto" />
              </div>
            </a>

            {/* TodoApp — CalDAV Task Manager (PWA) */}
            <a
              href="/projects/todoapp-caldav"
              data-e2e="home-view-todoapp"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-cyan-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-cyan-500/20 rounded-lg">
                  <svg
                    class="w-6 h-6 text-cyan-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  TodoApp (CalDAV PWA)
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Self-hosted task manager talking to any CalDAV server. PWA, no
                vendor lock-in. Built because Tasks.org had no web UI.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Preact
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Hono
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  CalDAV
                </span>
                <GhStars repo="spy4x/caldav-tasks-web" class="ml-auto" />
              </div>
            </a>

            {/* rostok — self-hosted homelab scaffolder */}
            <a
              href="/projects/rostok"
              data-e2e="home-view-rostok"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-emerald-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-emerald-500/20 rounded-lg">
                  <svg
                    class="w-6 h-6 text-emerald-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  rostok
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                One-command scaffolder for a self-hosted homelab. Curated
                catalog of services, sensible defaults, age-encrypted secrets
                you can commit.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  CLI
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  IaC
                </span>
                <GhStars repo="spy4x/rostok" class="ml-auto" />
              </div>
            </a>

            {/* Deno Platform Template */}
            <a
              href="/projects/template"
              data-e2e="home-view-template"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-amber-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-amber-500/20 rounded-lg">
                  <svg
                    class="w-6 h-6 text-amber-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                    />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-amber-400 transition-colors">
                  Deno Platform Template
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Reusable Deno baseline for SaaS: API, SPA, MPA, worker,
                persistence, and offline sync. Distilled from 80+ client
                projects, no product code.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Template
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  CQRS
                </span>
                <GhStars repo="spy4x/template" class="ml-auto" />
              </div>
            </a>
          </div>

          {/* View All Projects Link */}
          <div class="mt-6 text-right">
            <a
              href="/projects"
              class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              View all projects
              <svg
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
            </a>
          </div>
        </section>

        {/* Content Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">Content & Writing</h2>
          <div class="grid gap-6 md:grid-cols-2">
            <div class="p-4 bg-gray-800 rounded-xl border-2 border-gray-700">
              <div class="flex items-start gap-4">
                <div class="p-3 bg-red-500/20 rounded-lg shrink-0">
                  <YouTubeIcon class="text-red-400 w-8 h-8" />
                </div>
                <div>
                  <a
                    href="https://www.youtube.com/@anton-shubin"
                    target="_blank"
                    class="text-lg font-semibold text-white hover:text-red-400 transition-colors"
                  >
                    YouTube Channel →
                  </a>
                  <p class="text-gray-300 text-sm mt-1">
                    AI-augmented architecture, deterministic LLM pipelines, MCP
                    tooling, and startup engineering from a Fractional CTO who
                    ships them.
                  </p>
                </div>
              </div>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border-2 border-gray-700">
              <div class="flex items-start gap-4 mb-5">
                <div class="p-3 bg-orange-500/20 rounded-lg shrink-0">
                  <PenIcon class="text-orange-400 w-8 h-8" />
                </div>
                <div>
                  <a
                    href="/blog"
                    class="text-lg font-semibold text-white hover:text-orange-400 transition-colors"
                  >
                    Blog →
                  </a>
                  <p class="text-gray-300 text-sm mt-1">
                    SaaS architecture, production patterns, and lessons from 80+
                    shipped projects.
                  </p>
                </div>
              </div>
              <div class="space-y-3">
                {homeBlogSlugs
                  .map((slug) => blogArticles.find((a) => a.slug === slug))
                  .filter((a) => a !== undefined)
                  .map((a) => (
                    <a
                      key={a.slug}
                      href={`/blog/${a.slug}`}
                      class="flex items-start gap-2 group"
                    >
                      <span class="text-orange-400 shrink-0 mt-0.5">▸</span>
                      <span>
                        <span class="text-sm text-gray-300 group-hover:text-orange-400 transition-colors">
                          {a.title}
                        </span>
                        <span class="block text-xs text-gray-500 mt-0.5">
                          {prettyDate(a.publishedAt)}
                        </span>
                      </span>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">What Clients Say</h2>
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
              <svg
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
            </a>
          </div>
        </section>

        {/* Outside Work Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">Outside Work</h2>
          <div class="grid gap-5 sm:grid-cols-2">
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <h3 class="text-lg font-semibold text-white mb-3">
                🛠️ Infrastructure & IoT
              </h3>
              <ul class="space-y-3 text-gray-400 text-sm">
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>
                    Self-hosted production environment on Fedora + Hetzner:
                    Traefik, Docker Compose, PostgreSQL, Restic backups,
                    Authelia SSO
                  </span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <a
                    href="/infrastructure"
                    class="text-orange-400 hover:text-orange-300 underline"
                  >
                    Full stack architecture and operating practice
                  </a>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>
                    Custom{" "}
                    <a
                      href="https://www.instagram.com/p/ChWl-7Vr_nU/?img_index=1"
                      target="_blank"
                      class="text-orange-400 hover:text-orange-300 underline"
                    >
                      ESP32 air quality sensor
                    </a>{" "}
                    feeding into Home Assistant
                  </span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>
                    Open-source{" "}
                    <a
                      href="https://financy.dev"
                      target="_blank"
                      class="text-orange-400 hover:text-orange-300 underline"
                    >
                      finance tracker
                    </a>{" "}
                    (double-entry accounting, PWA)
                  </span>
                </li>
              </ul>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <h3 class="text-lg font-semibold text-white mb-3">
                🏍️ Adventure
              </h3>
              <ul class="space-y-3 text-gray-400 text-sm">
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <a
                    href="https://www.youtube.com/@anton-shubin-live"
                    target="_blank"
                    class="text-orange-400 hover:text-orange-300 underline"
                  >
                    Enduro, skiing, and scuba diving
                  </a>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>Traveled 25+ countries across Asia and Europe</span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>
                    Currently based in{" "}
                    <a
                      href="https://www.google.com/maps/@16.3078576,107.9941552,7.28z?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      class="text-orange-400 hover:text-orange-300 underline"
                    >
                      Da Nang, Vietnam
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div class="text-center mb-8">
          <p class="text-gray-500 text-sm">
            Also available through my Singapore-based agency{" "}
            <a
              href="https://neatsoft.dev"
              target="_blank"
              class="text-orange-400 hover:text-orange-300 underline"
            >
              NeatSoft PTE LTD
            </a>
          </p>
          <p class="text-gray-500 text-xs mt-3">
            <a href="/pay" class="hover:text-orange-400 transition-colors">
              Accepted payment: Stripe · SWIFT · BTC · ETH · Solana
            </a>
          </p>
        </div>

        <CTASection variant="full" id="cta-bottom" />
        <div class="h-[40vh]" />
      </div>
    </Layout>
  );
});
