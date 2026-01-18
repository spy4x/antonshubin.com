import { define } from "../utils.ts";
import { Layout } from "../components/Layout.tsx";
import {
  GithubIcon,
  LinkedInIcon,
  PenIcon,
  QuoteIcon,
  ServerIcon,
  StarIcon,
  UpworkBadgeIcon,
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
                Hey, I'm Anton!
              </h1>
              <div class="text-base text-gray-300 sm:text-lg md:text-xl">
                <p class="mb-4">
                  Full-stack developer building{" "}
                  <span class="text-white font-semibold bg-orange-600 px-2 py-0.5 rounded-md whitespace-nowrap">
                    SaaS applications
                  </span>{" "}
                  and open-source tools.
                </p>
                <p class="text-gray-300">
                  I love self-hosting, home automation, traveling, and skiing.
                </p>
              </div>
              <div class="mt-8 flex flex-wrap gap-2">
                <a
                  href="https://github.com/spy4x"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <GithubIcon class="w-4 h-4" />
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/anton-shubin"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-600 transition-colors"
                >
                  <LinkedInIcon class="w-4 h-4" />
                  LinkedIn
                </a>
                <a
                  href="https://www.youtube.com/@anton-shubin"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  <YouTubeIcon class="w-4 h-4" />
                  YouTube
                </a>
              </div>
            </div>
            {/* Hero Image */}
            <div class="lg:w-[320px] lg:flex-shrink-0">
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
          <div class="mt-6 text-center">
            <a
              href="/projects"
              class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
            <a
              href="https://www.youtube.com/@anton-shubin"
              target="_blank"
              class="group flex items-start gap-4 p-6 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-red-500 transition-colors"
            >
              <div class="p-3 bg-red-500/20 rounded-lg shrink-0">
                <YouTubeIcon class="text-red-400 w-8 h-8" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                  YouTube Channel
                </h3>
                <p class="text-gray-300 text-sm">
                  Live-coding sessions, dev tips & tricks, and startup journey
                  sharing.
                </p>
              </div>
            </a>
            <a
              href="/blog"
              class="group flex items-start gap-4 p-6 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-orange-500 transition-colors"
            >
              <div class="p-3 bg-orange-500/20 rounded-lg shrink-0">
                <PenIcon class="text-orange-400 w-8 h-8" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
                  Blog
                </h3>
                <p class="text-gray-300 text-sm">
                  Articles about SaaS development, productivity, and indie
                  hacking.
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* Testimonial Section */}
        <section class="mb-16 md:mb-24">
          <h2 class="h1 mb-8">What Clients Say</h2>
          <a
            href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
            target="_blank"
            class="block relative py-8 px-6 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-orange-500 transition-colors md:px-10"
          >
            <div class="mb-6 md:flex md:justify-between md:items-center">
              <div>
                <p class="font-medium text-white">
                  Technical Lead for a Startup
                </p>
                <p class="text-gray-400 text-sm">Jul 6, 2020 - Feb 28, 2021</p>
              </div>
              <div class="flex gap-1 items-center mt-2 md:mt-0">
                <StarIcon class="text-orange-500 w-5 h-5" filled />
                <StarIcon class="text-orange-500 w-5 h-5" filled />
                <StarIcon class="text-orange-500 w-5 h-5" filled />
                <StarIcon class="text-orange-500 w-5 h-5" filled />
                <StarIcon class="text-orange-500 w-5 h-5" filled />
                <span class="ml-2 text-white font-medium">5.00</span>
              </div>
            </div>
            <blockquote class="text-sm italic text-gray-300">
              <p class="mb-3">
                "Anton is the greatest developer I've ever worked with hands
                down. He's taken a role in our startup as tech lead and has been
                doing a beyond excellent job with communication, honesty, hard
                work and accuracy."
              </p>
              <p class="mb-3">
                "He isn't one of the type of developers that just says, 'sure, I
                can do that.' He's thoughtful and will give his honest feedback
                and advice on everything."
              </p>
              <p>
                "Overall, 12/10 of a developer. I really got lucky with Anton."
              </p>
            </blockquote>
            <div class="h-1 w-24 rounded bg-orange-500 my-6 mx-auto" />
            <div class="flex flex-col items-center gap-2 text-gray-300">
              <div class="flex items-center">
                <span class="font-medium text-white mr-1">5900+</span>
                <span class="mr-2">hours on</span>
                <UpworkIcon class="w-auto h-5 text-white" />
              </div>
              <div class="flex items-center gap-2">
                <span>100% Job Success</span>
                <span class="text-gray-500">|</span>
                <UpworkBadgeIcon class="w-5" />
                <span>Expert-vetted</span>
              </div>
            </div>
            <div class="hidden md:block">
              <p class="absolute top-6 left-0 -ml-4 lg:-ml-12">
                <QuoteIcon class="w-8 h-8 text-orange-500" />
              </p>
              <p class="absolute bottom-6 right-0 -mr-4 lg:-mr-12">
                <QuoteIcon class="w-8 h-8 text-orange-500" />
              </p>
            </div>
          </a>
        </section>

        {/* CTA Section */}
        <section class="mb-16 md:mb-24">
          <div class="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:2spy4x+ws@gmail.com"
              class="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-lg text-white bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Contact Me
            </a>
            <a
              href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
              target="_blank"
              class="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-500 transition-colors"
            >
              <UpworkIcon class="w-auto h-4" />
              Hire on Upwork
            </a>
            <a
              href="/pay"
              class="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              <svg
                class="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Pay Me
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
});
