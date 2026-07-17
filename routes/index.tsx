import { define } from "../lib/utils.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Layout } from "../components/Layout.tsx";
import { CTASection } from "../components/CTASection.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";
import { blogArticles, prettyDate, youtubeVideos } from "../lib/data.ts";
import LeadForm from "../islands/LeadForm.tsx";
import {
  CalendarIcon,
  GithubIcon,
  PenIcon,
  ServerIcon,
  StarIcon,
  UpworkIcon,
  WalletIcon,
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
                  I take your SaaS from{" "}
                  <span class="text-white font-semibold bg-orange-600 px-2 py-0.5 rounded-md whitespace-nowrap">
                    napkin sketch to production
                  </span>
                </p>
                <ul class="space-y-1 text-gray-300">
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>Without the dev-team drama</span>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>Autonomous technical partner</span>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>Fixed-price milestones</span>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <span class="text-orange-500 shrink-0">—</span>
                    <span>Zero-bloat architecture</span>
                  </li>
                </ul>
              </div>

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

              {/* Primary CTA — prominent gradient button */}
              <div class="mt-6">
                <a
                  href={SCHEDULE_URL}
                  target="_blank"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200 text-base"
                >
                  <CalendarIcon class="w-5 h-5" />
                  Book a free intro call — no pitch, just advice
                </a>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://github.com/spy4x"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <GithubIcon class="w-4 h-4" />
                  GitHub
                </a>
                <a
                  href="https://www.youtube.com/@anton-shubin"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  <YouTubeIcon class="w-4 h-4" />
                  YouTube
                </a>
                <a
                  href="https://www.upwork.com/freelancers/ashubin"
                  target="_blank"
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
              <div class="text-2xl mb-3">🔥</div>
              <h3 class="text-lg font-semibold text-white mb-2">
                Overpromised, underdelivered
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                You've hired devs who promised the world and delivered a
                nightmare. I've fixed those messes.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="text-2xl mb-3">💰</div>
              <h3 class="text-lg font-semibold text-white mb-2">
                Bloated costs, slow progress
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Your SaaS is running on $500/month AWS when it should cost $40
                on Hetzner.
              </p>
            </div>
            <div class="p-4 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="text-2xl mb-3">🎯</div>
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

        {/* B3: Engagement Terms Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How I Deliver — The Terms of Engagement</h2>
          <p class="text-gray-400 mb-8 text-base sm:text-lg">
            Zero micromanagement. Complete transparency.
          </p>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="text-2xl mb-2">🛡️</div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                14-Day Mutual Alignment Guarantee
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                If we're not a perfect fit within 2 weeks, I issue a 100% refund
                — no questions asked.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="text-2xl mb-2">⏱️</div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                Async-First Execution
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                One weekly alignment call. All daily updates async via text or
                Loom. You pay for engineering throughput, not meeting bloat.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="text-2xl mb-2">🔑</div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                Clean Handoff & IP Sovereignty
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                You hold the root keys and own 100% of source code from Day 1.
                No proprietary lock-in, no vendor hostage.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="text-2xl mb-2">🎯</div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                Fixed-Price Milestones
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Once a milestone is funded, scope is locked. New ideas go into a
                V2 Backlog — quoted after launch.
              </p>
            </a>
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group sm:col-span-2 lg:col-span-1"
            >
              <div class="text-2xl mb-2">🔧</div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                30-Day Code Warranty
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                I patch any bugs within the delivered scope for free for 30 days
                post-launch.
              </p>
            </a>

            {/* Policy 6: No Jargon Guarantee */}
            <a
              href="/how-i-work"
              class="p-4 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
            >
              <div class="text-2xl mb-2">💬</div>
              <h3 class="text-base font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
                No Jargon Guarantee
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Every technical decision gets a plain-English explanation.
                You'll never hear "we need to refactor the microservices layer"
                without a clear translation of what it means for your product,
                timeline, and budget.
              </p>
            </a>
          </div>

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

        {/* Who This Is For */}
        <section class="mb-16 md:mb-24">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <div class="text-4xl shrink-0">🎯</div>
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Who This Is For
                </h2>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                  You are a founder, CTO, or product owner who knows what good
                  looks like — but your current team, contractor, or agency is
                  not delivering it. Deadlines slip. The codebase accumulates
                  tech debt faster than features. AWS bills climb while
                  performance degrades. You need someone who takes ownership of
                  outcomes, not hours.
                </p>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                  You have a technical product — or are building one — and you
                  need architectural leadership that bridges business goals and
                  engineering reality. You value clear communication,
                  predictable delivery, and a partner who explains complex
                  tradeoffs in plain English instead of hiding behind jargon.
                </p>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                  You want a system architect who aligns with your vision, owns
                  the technical roadmap, and ships measurable results — on time,
                  on budget, with no surprises.
                </p>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed">
                  I work with funded startups, lean SaaS teams, and established
                  businesses that have outgrown their current technical setup.
                  If you are stuck between "it works" and "it scales" — this is
                  the right place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Services — from Catalog */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How to Work Together</h2>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/catalog/strategy-call"
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
              class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">👔</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                CTO Advisory Retainer
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                Ongoing fractional CTO partnership — strategy, architecture,
                team leadership. Weekly calls, async execution.
              </p>
              <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                $3K–$5K/mo — Monthly
              </span>
            </a>
            <a
              href="/catalog/zero-to-production-saas-mvp"
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
              class="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">🔍</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                Free Architecture Audit
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                Send your tech stack or idea. I'll send back 3 concrete
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
        <section class="mb-16 md:mb-24">
          <LeadForm scheduleUrl={SCHEDULE_URL} />
        </section>

        {/* Featured Projects Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">Open Source Projects</h2>
          <div class="grid gap-6 md:grid-cols-2">
            {/* Homelab */}
            <a
              href="/projects/homelab"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-green-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-green-500/20 rounded-lg">
                  <ServerIcon class="w-6 h-6 text-green-400" />
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-green-400 transition-colors">
                  Homelab
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Infrastructure-as-code framework for self-hosting 20+ services
                with Docker, Traefik, automated backups, and monitoring.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Docker
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Ansible
                </span>
                <GhStars repo="spy4x/homelab" class="ml-auto" />
              </div>
            </a>

            {/* Financy */}
            <a
              href="/projects/financy"
              class="group block p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-purple-500 transition-all"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-purple-500/20 rounded-lg">
                  <WalletIcon class="w-6 h-6 text-purple-400" />
                </div>
                <h3 class="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                  Financy
                </h3>
              </div>
              <p class="text-gray-300 text-sm mb-4">
                Self-hostable finance tracking with double-entry accounting,
                multi-currency, real-time collaboration, and PWA support.
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Preact
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  PostgreSQL
                </span>
                <GhStars repo="spy4x/financy" class="ml-auto" />
              </div>
            </a>

            {/* caldav-mcp */}
            <a
              href="/projects/caldav-mcp"
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
                Native Deno MCP server for CalDAV. Events + tasks, zero npm
                dependencies, single binary. Works with Claude, Cursor, and Open
                WebUI.
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

            {/* TodoApp — CalDAV Task Manager */}
            <a
              href="/projects/todoapp-caldav"
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
              <div class="flex items-start gap-4 mb-5">
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
                    Architecture deep-dives, cost optimization strategies, and
                    startup engineering from a Fractional CTO.
                  </p>
                </div>
              </div>
              <div class="space-y-3">
                {youtubeVideos.slice(0, 3).map((v) => (
                  <a
                    key={v.videoId}
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank"
                    class="flex items-start gap-2 group"
                  >
                    <span class="text-red-400 shrink-0 mt-0.5">▶</span>
                    <span>
                      <span class="text-sm text-gray-300 group-hover:text-red-400 transition-colors">
                        {v.title}
                      </span>
                      <span class="block text-xs text-gray-500 mt-0.5">
                        {prettyDate(v.publishedAt)}
                      </span>
                    </span>
                  </a>
                ))}
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
                {blogArticles
                  .filter((a) => a.category === "startups")
                  .sort((a, b) => b.index - a.index)
                  .slice(0, 3)
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

        {/* Infrastructure Section */}
        <section class="mb-16 md:mb-24">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <div class="text-4xl shrink-0">🛠️</div>
              <div class="flex-1">
                <a
                  href="/infrastructure"
                  class="text-2xl sm:text-3xl font-bold text-white hover:text-orange-400 transition-colors"
                >
                  Infrastructure →
                </a>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mt-3 mb-4">
                  Self-hosted homelab running 40+ services on a single dedicated
                  server for $50/month. Traefik, Docker, Grafana, PostgreSQL,
                  and more — all running on Fedora at Hetzner.
                </p>
                <a
                  href="/infrastructure"
                  class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium underline underline-offset-2"
                >
                  Architecture breakdown and cost analysis
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

        {/* CTA Section */}
        {/* Beyond the Code Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">Beyond the Code</h2>
          <div class="grid gap-5 sm:grid-cols-2">
            <div class="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <h3 class="text-lg font-semibold text-white mb-3">
                🛠️ Infrastructure & IoT
              </h3>
              <ul class="space-y-3 text-gray-400 text-sm">
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>
                    Self-host 20+ services on Fedora with{" "}
                    <a
                      href="https://uptime-cloud.antonshubin.com"
                      target="_blank"
                      class="text-orange-400 hover:text-orange-300 underline"
                    >
                      Docker/Podman
                    </a>
                  </span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <a
                    href="/infrastructure"
                    class="text-orange-400 hover:text-orange-300 underline"
                  >
                    Full infrastructure breakdown ($50/mo, 40+ services)
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
                    in Home Assistant
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
                  <span>
                    <a
                      href="https://www.youtube.com/@anton-shubin-live"
                      target="_blank"
                      class="text-orange-400 hover:text-orange-300 underline"
                    >
                      Enduro, skiing, and scuba diving
                    </a>
                  </span>
                </li>
                <li class="flex items-baseline gap-2">
                  <span class="text-orange-400 shrink-0">→</span>
                  <span>
                    Traveled 25+ countries across Asia and Europe
                  </span>
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

        <CTASection variant="full" />
        <div class="h-[40vh]" />
      </div>
    </Layout>
  );
});
