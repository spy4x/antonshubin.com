import { define } from "../utils.ts";
import { Layout } from "../components/Layout.tsx";
import {
  YouTubeIcon,
  PenIcon,
  CodeIcon,
  BookmarkIcon,
  StarIcon,
  QuoteIcon,
  UpworkIcon,
  UpworkBadgeIcon,
} from "../components/Icons.tsx";

export default define.page(function Home(ctx) {
  return (
    <Layout currentPath={ctx.url.pathname}>
      {/* Hero Section */}
      <div class="relative overflow-hidden mb-12 md:mb-20">
        <div class="max-w-7xl mx-auto">
          <div class="relative py-9 z-10 bg-slate-900 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              class="hidden absolute right-0 inset-y-0 h-full w-48 text-slate-900 transform lg:block translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>
            <main class="mx-auto max-w-7xl sm:px-6 md:mt-12 lg:mt-20 lg:px-8 xl:mt-28">
              <div class="sm:text-center lg:text-left">
                <h1 class="text-4xl font-bold text-gray-100 mb-4 sm:text-5xl md:text-6xl">
                  <span class="block xl:inline">Hey, I'm Anton!</span>
                </h1>
                <div class="text-base text-gray-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-8 md:text-2xl lg:mx-0">
                  <p class="mb-4">
                    I develop
                    <span class="inline-flex items-center rounded-md font-medium bg-orange-500 px-2 py-0.5 mx-2">
                      SaaS applications
                    </span>
                    from idea to revenue for my freelance clients and myself.
                  </p>
                  <p>
                    Oh, and I love to travel{" "}
                    <span role="img" aria-label="luggage">
                      &#x1F9F3;
                    </span>
                    , ski{" "}
                    <span role="img" aria-label="skiing">
                      &#x26F7;&#xFE0F;
                    </span>
                    , and tinker devices using Arduino, Raspberry Pi, and ESP32{" "}
                    <span role="img" aria-label="tools">
                      &#x1F6E0;&#xFE0F;
                    </span>
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            class="h-56 w-full object-cover rounded-lg sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="/img/photo-big.webp"
            alt="Anton Shubin"
          />
        </div>
      </div>

      {/* Current Work Section */}
      <section class="text-gray-400 bg-gray-900 body-font container mx-auto mb-12 md:mb-20">
        <h2 class="h1 mb-10 text-center">I'm currently working on:</h2>
        <div class="grid text-center gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="https://www.youtube.com/@anton-shubin"
            target="_blank"
            class="current-work hover:border-orange-500 transition-colors"
          >
            <YouTubeIcon class="text-orange-500 w-12 h-12 mb-3 inline-block" />
            <h3 class="text-lg text-gray-50">YouTube channel</h3>
            <p class="text-grey-100">
              Live-coding, sharing tips & tricks and entrepreneur experience in
              startups
            </p>
          </a>
          <a
            href="/blog"
            class="current-work hover:border-orange-500 transition-colors"
          >
            <PenIcon class="text-orange-500 w-12 h-12 mb-3 inline-block" />
            <h3 class="text-lg text-gray-50">Blog</h3>
            <p class="text-grey-100">
              About SaaS startups and how to survive in them
            </p>
          </a>
          <a
            href="https://toread.today/"
            target="_blank"
            class="current-work hover:border-orange-500 transition-colors"
          >
            <BookmarkIcon class="text-teal-400 w-12 h-12 mb-3 inline-block" />
            <h3 class="text-lg text-gray-50">Toread.Today</h3>
            <p class="text-grey-100">
              A cloud tool to organise things to read/watch later
            </p>
          </a>
          <a
            href="https://github.com/spy4x/seed"
            target="_blank"
            class="current-work hover:border-orange-500 transition-colors"
          >
            <CodeIcon class="text-orange-500 w-12 h-12 mb-3 inline-block" />
            <h3 class="text-lg text-gray-50">The Seed</h3>
            <p class="text-grey-100">
              A one-person SaaS application codebase template.
            </p>
          </a>
        </div>
        <div class="text-center mb-6">
          <a
            class="text-xl title-font text-slate-500 sm:text-2xl"
            href="/projects#freelance"
          >
            <span class="mr-1">
              You can also check projects I made for my clients
            </span>
            <span class="underline decoration-gray-600">here</span>
          </a>
        </div>
      </section>

      {/* Testimonials Section */}
      <section class="text-gray-50 container mx-auto max-w-3xl mb-12 md:px-12 md:mb-20">
        <h2 class="h1 mb-10 text-center">What clients say about me:</h2>
        <a
          href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
          target="_blank"
          class="block relative py-8 px-6 bg-gray-800 rounded-md border-2 border-gray-800 hover:border-orange-500 transition-colors md:px-10"
        >
          <div class="mb-6 md:flex md:justify-between md:items-center">
            <div>
              <p class="font-medium font-base">Technical Lead for a Startup</p>
              <p class="text-gray-400 text-sm">Jul 6, 2020 - Feb 28, 2021</p>
            </div>
            <div class="flex gap-1 items-center">
              <StarIcon class="text-orange-500 w-6 h-6" filled />
              <StarIcon class="text-orange-500 w-6 h-6" filled />
              <StarIcon class="text-orange-500 w-6 h-6" filled />
              <StarIcon class="text-orange-500 w-6 h-6" filled />
              <StarIcon class="text-orange-500 w-6 h-6" filled />
              <span class="ml-2">5.00</span>
            </div>
          </div>
          <blockquote class="text-sm italic">
            <p class="mb-4">
              "Anton is the greatest developer I've ever worked with hands down.
              He's taken a role in our startup as tech lead and has been doing a
              beyond excellent job with communication, honesty, hard work and
              accuracy. He understands that a startup is a fast pace environment
              with lots of moving pieces and adjusted himself to work with that,
              which is one of the best things that I like about Anton.
            </p>
            <p class="mb-4">
              On top of that, Anton is extremely skilled and offers really great
              feedback. He isn't one of the type of developers that just says,
              "sure, I can do that." He's thoughtful and will give his honest
              feedback and advice on everything.
            </p>
            <p class="mb-4">
              Overall, 12/10 of a developer. I really got lucky with Anton.
              Thanks for all that you do and am so excited to see where our
              startup goes!"
            </p>
          </blockquote>
          <div class="h-1 w-24 rounded bg-orange-500 my-6 mx-auto" />
          <div class="flex justify-center items-center mb-2">
            <div class="mr-2">
              <span class="font-medium mr-1">5900+</span>total hours on
            </div>
            <UpworkIcon class="w-auto h-5 text-gray-50" />
          </div>
          <div class="flex justify-center items-center mb-2">
            100% Job Success
          </div>
          <div class="flex justify-center items-center">
            <UpworkBadgeIcon class="w-6 mr-2" />
            <span>Expert-vetted</span>
          </div>
          <div class="hidden md:block">
            <p class="absolute top-6 left-0 -ml-16">
              <QuoteIcon class="inline-block w-8 h-8 text-orange-500" />
            </p>
            <p class="absolute bottom-6 right-0 -mr-16">
              <QuoteIcon class="inline-block w-8 h-8 text-orange-500" />
            </p>
          </div>
        </a>
      </section>

      {/* CTA Section */}
      <div class="flex flex-wrap gap-3 justify-center mb-12 md:mb-20">
        <a
          href="mailto:2spy4x+ws@gmail.com"
          class="inline-flex items-center pl-6 pr-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <span class="mr-1">Contact me</span>
          <svg
            class="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>
        <a
          href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
          target="_blank"
          class="inline-flex items-center pl-6 pr-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
        >
          <span class="mr-1">Hire me</span>
          <svg
            class="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
        <a
          href="/pay"
          class="inline-flex items-center pl-6 pr-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
        >
          <span class="mr-1">Pay me</span>
          <svg
            class="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>
    </Layout>
  );
});
