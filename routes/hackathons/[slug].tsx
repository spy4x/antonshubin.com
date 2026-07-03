import { define } from "../../lib/utils.ts";
import { Layout } from "../../components/Layout.tsx";
import { type Hackathon, hackathons } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { CalendarIcon, CodeIcon, StarIcon } from "../../components/Icons.tsx";

function getHackathonBySlug(slug: string): Hackathon | undefined {
  return hackathons.find((h) => h.slug === slug);
}

export default define.page(function HackathonDetail(ctx) {
  const { slug } = ctx.params;
  const h = getHackathonBySlug(slug);

  if (!h) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <h1 class="text-3xl font-bold text-white mb-4">Not Found</h1>
          <p class="text-gray-400 mb-6">
            That hackathon does not exist.
          </p>
          <a
            href="/hackathons"
            class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium"
          >
            &larr; Back to hackathons
          </a>
        </div>
      </Layout>
    );
  }

  head.value = {
    ...head.value,
    title: `${h.title} — Anton Shubin Hackathons`,
    description: h.description,
    canonical: `https://antonshubin.com/hackathons/${h.slug}/`,
    ogType: "article",
    ogImage: `https://antonshubin.com${h.photos[0]}`,
  };

  return (
    <Layout currentPath="/hackathons">
      <SEOHead />
      <div class="max-w-3xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, head.value.title)}
        />

        <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Photo */}
          <div class="aspect-[16/7] bg-gray-700 overflow-hidden">
            <img
              src={h.photos[0]}
              alt={`${h.title} at ${h.event}`}
              class="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          <div class="p-6 sm:p-8">
            {/* Event badge + win/loss */}
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
                <CalendarIcon class="w-3.5 h-3.5" />
                {h.event} &middot; {h.date}
              </span>
              {h.won
                ? (
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/15 text-yellow-400 text-xs font-bold rounded-full">
                    <StarIcon class="w-3.5 h-3.5" filled />
                    {h.place || "Winner"}
                  </span>
                )
                : (
                  <span class="inline-flex items-center px-3 py-1 bg-blue-600/15 text-blue-400 text-xs font-medium rounded-full">
                    {h.place || "Participant"}
                  </span>
                )}
              {h.prize && (
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-600/15 text-green-400 text-xs font-medium rounded-full">
                  <svg
                    class="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {h.prize}
                </span>
              )}
            </div>

            <h1 class="text-2xl sm:text-3xl font-bold text-white mb-6">
              {h.title}
            </h1>

            {/* Project Idea */}
            <section class="mb-8">
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                The Idea
              </h2>
              <p class="text-gray-300 leading-relaxed">{h.projectIdea}</p>
            </section>

            {/* Divider */}
            <div class="h-px bg-gray-700 mb-8" />

            {/* Achievement */}
            <section class="mb-8">
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                The Achievement
              </h2>
              <div class="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
                <p class="text-green-300 leading-relaxed">{h.achievement}</p>
              </div>
            </section>

            {/* Tech Stack */}
            <section class="mb-8">
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tech Stack
              </h2>
              <div class="flex flex-wrap gap-2">
                {h.techStack.map((t) => (
                  <span
                    key={t}
                    class="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>

            {/* Learnings */}
            <section class="mb-8">
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Key Learning
              </h2>
              <div class="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <p class="text-blue-300 leading-relaxed italic">
                  "{h.learnings}"
                </p>
              </div>
            </section>

            {/* Divider */}
            <div class="h-px bg-gray-700 mb-8" />

            {/* CTA — convert interest into service */}
            <div class="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
              <div class="flex items-start gap-4">
                <CodeIcon class="w-8 h-8 text-orange-400 shrink-0" />
                <div>
                  <h3 class="text-lg font-semibold text-white mb-2">
                    {h.ctaLabel || "Let's build something similar for you"}
                  </h3>
                  <p class="text-gray-400 text-sm leading-relaxed mb-4">
                    The same skills that delivered this hackathon under extreme
                    pressure are available for your project. Fixed-price
                    milestones, zero-bloat architecture, no dev-team drama.
                  </p>
                  <div class="flex flex-wrap gap-3">
                    <a
                      href={h.ctaLink || SCHEDULE_URL}
                      target={h.ctaLink ? undefined : "_blank"}
                      class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200 text-sm"
                    >
                      {h.ctaLabel || "Book a free intro call"}
                    </a>
                    <a
                      href={SCHEDULE_URL}
                      target="_blank"
                      class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Free intro call
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <div class="mt-6">
              <a
                href="/hackathons"
                class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                All hackathons
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});
