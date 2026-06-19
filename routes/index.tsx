import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { CTASection } from "../components/CTASection.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";
import { blogArticles, prettyDate, youtubeVideos } from "../lib/data.ts";
import {
  CalendarIcon,
  GithubIcon,
  LinkedInIcon,
  PenIcon,
  ServerIcon,
  StarIcon,
  TelegramIcon,
  UpworkIcon,
  WalletIcon,
  YouTubeIcon,
} from "../components/Icons.tsx";

export default define.page(function Home(ctx) {
  return (
    <Layout currentPath={ctx.url.pathname}>
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

              <div class="mt-6 flex flex-wrap gap-2">
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
              <div class="mt-4 flex flex-wrap gap-2">
                <a
                  href={SCHEDULE_URL}
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-500 transition-colors"
                >
                  <CalendarIcon class="w-4 h-4" />
                  Schedule a call
                </a>
                <a
                  href="/contact-me"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500 transition-colors"
                >
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
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  Contact me
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
            <div class="p-6 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="text-2xl mb-3">🔥</div>
              <h3 class="text-lg font-semibold text-white mb-2">
                Overpromised, underdelivered
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                You've hired devs who promised the world and delivered a
                nightmare. I've fixed those messes.
              </p>
            </div>
            <div class="p-6 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
              <div class="text-2xl mb-3">💰</div>
              <h3 class="text-lg font-semibold text-white mb-2">
                Bloated costs, slow progress
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Your SaaS is running on $500/month AWS when it should cost $40
                on Hetzner.
              </p>
            </div>
            <div class="p-6 bg-gray-800 rounded-xl border-l-4 border-orange-500 border border-gray-700">
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
              class="p-5 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
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
              class="p-5 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
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
              class="p-5 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
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
              class="p-5 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
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
              class="p-5 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group sm:col-span-2 lg:col-span-1"
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
              class="p-5 block bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-all group"
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

        {/* Why I Do This — psychologist recommendation */}
        <section class="mb-16 md:mb-24">
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 sm:p-10">
            <div class="flex flex-col sm:flex-row items-start gap-6">
              <div class="text-4xl shrink-0">👨‍💻</div>
              <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Why I Do This
                </h2>
                <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                  I started as an enterprise dev in 2010. Became a team lead.
                  Hit the salary ceiling at $1000/month. Quit to freelance —
                  almost went bankrupt. Couldn't afford a pizza. Parents gave me
                  an ultimatum: one month to find a contract or go back to the
                  office.
                </p>
                <p class="text-gray-400 leading-relaxed mb-4">
                  Found work on Upwork. Over eight years I went from $2/hour
                  with zero English to $150/hour as a system architect leading
                  teams. The secret? Taking responsibility for outcomes, not
                  hours. One client told me I was the only dev willing to sit on
                  a call and explain things until they made sense.
                </p>
                <p class="text-gray-400 leading-relaxed mb-4">
                  Built my own startups too. Some failed — bad tech choices,
                  over-engineering. I also fixed products dying because devs hid
                  behind jargon or thought complexity was the goal.
                </p>
                <p class="text-gray-400 leading-relaxed">
                  I've been the employee, the freelancer, the founder, the
                  fixer. Eighty-plus projects across a decade and a half —
                  software, electronics, infrastructure. I do this because I
                  genuinely love tinkering until things click, and this corner
                  of the internet is my workshop. No empire to sell, no
                  newsletter to grow. Just a domain I own, code I'm proud of,
                  and the quiet satisfaction of building systems that earn their
                  keep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Services — from Catalog */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">How to Work Together</h2>
          <div class="grid gap-5 md:grid-cols-3">
            <a
              href="/catalog/strategy-call"
              class="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">🎯</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                Technical Consultation
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                60-minute video call. Deep-dive into your project. Honest
                feedback and a clear technical path forward.
              </p>
              <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                $150 — 60 min
              </span>
            </a>
            <a
              href="/catalog/zero-to-production-saas-mvp"
              class="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
            >
              <div class="text-3xl mb-3">🚀</div>
              <h3 class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2">
                SaaS MVP
              </h3>
              <p class="text-gray-400 text-sm mb-3 flex-1 leading-relaxed">
                Full MVP from idea to live deployment. Auth, payments, API,
                admin panel. Built to scale.
              </p>
              <span class="inline-block px-2.5 py-0.5 bg-green-600/40 text-green-300 text-xs font-medium rounded-full mt-auto self-start">
                From $8,000 — 21 days
              </span>
            </a>
            <a
              href="/catalog/free-architecture-audit"
              class="p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group flex flex-col"
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

        {/* G1: Free Architecture Audit Lead Magnet */}
        <section class="mb-16 md:mb-24">
          <div class="bg-gray-800 rounded-xl border border-orange-500/40 p-8 sm:p-10 text-center">
            <div class="text-3xl mb-4">🔍</div>
            <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
              Not sure where to start?
            </h2>
            <p class="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-6">
              Send me your current tech stack or idea — I'll send back 3
              concrete architectural improvements within 48 hours.
              <span class="text-orange-400 font-semibold block sm:inline">
                No cost.
              </span>{" "}
              <span class="text-orange-400 font-semibold block sm:inline">
                No commitment.
              </span>
            </p>
            <a
              href="/contact-me"
              class="inline-block px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              Send my stack for audit →
            </a>
            <p class="text-gray-400 text-sm mt-3">
              I'll respond within 48 hours. No sales pitch — just honest
              architectural feedback.
            </p>
            <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5 text-gray-500 text-xs">
              <span class="inline-flex items-center gap-1">
                <svg
                  class="w-3.5 h-3.5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Expert-Vetted (Top 1%)
              </span>
              <span class="inline-flex items-center gap-1">
                <svg
                  class="w-3.5 h-3.5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                80+ projects shipped
              </span>
              <span class="inline-flex items-center gap-1">
                <svg
                  class="w-3.5 h-3.5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                100% Job Success
              </span>
              <span class="inline-flex items-center gap-1">
                <svg
                  class="w-3.5 h-3.5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </section>

        {/* Featured Projects Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">Open Source Projects</h2>
          <div class="grid gap-6 md:grid-cols-2">
            {/* Homelab */}
            <a
              href="/projects/homelab"
              class="group block p-6 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-green-500 transition-all"
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
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Docker
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Ansible
                </span>
              </div>
            </a>

            {/* Financy */}
            <a
              href="/projects/financy"
              class="group block p-6 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-purple-500 transition-all"
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
              <div class="flex flex-wrap gap-2">
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Deno
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  Preact
                </span>
                <span class="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                  PostgreSQL
                </span>
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
            <div class="p-6 bg-gray-800 rounded-xl border-2 border-gray-700">
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
            <div class="p-6 bg-gray-800 rounded-xl border-2 border-gray-700">
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
          <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 sm:p-10">
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
            <div class="p-6 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
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
                  MVP Development • $4,000 fixed price
                </p>
              </div>
            </div>

            {/* Testimonial 2: Technical Lead */}
            <div class="p-6 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
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
            <div class="p-6 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
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
                  Technical Consultation • $115 fixed price
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
            <div class="p-6 bg-gray-800 rounded-xl border border-gray-700">
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
            <div class="p-6 bg-gray-800 rounded-xl border border-gray-700">
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
