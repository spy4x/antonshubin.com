import { HttpError } from "fresh";
import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import { type Hackathon, hackathons } from "../../lib/data.ts";
import { SCHEDULE_URL } from "../../lib/config.ts";
import { CalendarIcon, CodeIcon, PersonIcon } from "../../components/Icons.tsx";
import { BookCallLink } from "../../components/BookCallLink.tsx";

function HackathonCard({ h }: { h: Hackathon }) {
  return (
    <a
      href={`/hackathons/${h.slug}`}
      class="block bg-paper rounded-xl border-2 border-rule hover:border-accent transition-all group"
    >
      {/* Photo header */}
      <div class="aspect-[16/9] bg-lamp rounded-t-xl overflow-hidden relative">
        <img
          src={h.photos[0]}
          alt={`${h.title} hackathon`}
          class="w-full h-full object-cover transition-transform duration-500"
          loading="lazy"
        />
        {/* Win/loss badge */}
        {h.won
          ? (
            <div class="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-lamp text-mist text-xs font-bold rounded-full">
              <svg
                aria-hidden="true"
                focusable="false"
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {h.place || "Winner"}
            </div>
          )
          : (
            <div class="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-lamp text-graphite text-xs font-medium rounded-full">
              {h.place || "Participant"}
            </div>
          )}
      </div>

      <div class="p-5">
        {/* Event name + date */}
        <div class="flex items-center gap-2 text-xs text-graphite mb-2">
          <CalendarIcon class="w-3.5 h-3.5" />
          <span>{h.event} &middot; {h.date}</span>
        </div>

        <h3 class="text-lg font-semibold text-parchment group-hover:text-accent transition-colors mb-2">
          {h.title}
        </h3>

        <p class="text-graphite text-sm leading-relaxed mb-3">
          {h.description}
        </p>

        {/* Achievement highlight */}
        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-sage/15 text-sage text-xs font-medium rounded-full mb-4">
          <svg
            aria-hidden="true"
            focusable="false"
            class="w-3.5 h-3.5 shrink-0"
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
          {h.achievement.length > 100
            ? h.achievement.slice(0, 100) + "..."
            : h.achievement}
        </div>

        {/* Tech tags */}
        <div class="flex flex-wrap gap-1.5">
          {h.techStack.map((t) => (
            <span
              key={t}
              class="px-2 py-0.5 bg-lamp text-graphite text-xs rounded"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

// No entries means no page: an empty trophy shelf is worse than none.
export const handler = define.handlers({
  GET() {
    if (hackathons.length === 0) throw new HttpError(404);
    return { data: null };
  },
});

export default define.page(function Hackathons(ctx) {
  const wins = hackathons.filter((h) => h.won).length;
  const prizes = hackathons
    .filter((h) => h.prize)
    .map((h) => h.prize)
    .join(" · ");

  head.value = {
    ...head.value,
    title: "Hackathons — Anton Shubin",
    description:
      "Real hackathon wins and projects. I compete to prove my architecture skills under extreme time pressure — 48-hour builds, self-healing infra, and payment orchestration. Results speak for themselves.",
    canonical: "https://antonshubin.com/hackathons",
    ogType: "website",
  };

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        {/* Hero section — marketing-driven */}
        <div class="mb-12">
          <h1 class="text-3xl sm:text-4xl font-bold text-parchment mb-3">
            Hackathons & competitive engineering
          </h1>
          <p class="text-graphite text-base sm:text-lg leading-relaxed max-w-2xl">
            I compete in hackathons to stress-test my architecture skills under
            extreme time pressure. Every event sharpens the same skills I bring
            to your project — speed, reliability, and shipping under
            constraints.
          </p>
        </div>

        {/* Stats bar */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div class="bg-paper rounded-xl border border-rule p-4 text-center">
            <div class="text-2xl font-bold text-accent">
              {hackathons.length}
            </div>
            <div class="text-xs text-graphite mt-1">Hackathons Competed</div>
          </div>
          <div class="bg-paper rounded-xl border border-rule p-4 text-center">
            <div class="text-2xl font-bold text-sage">{wins}</div>
            <div class="text-xs text-graphite mt-1">Wins</div>
          </div>
          <div class="bg-paper rounded-xl border border-rule p-4 text-center">
            <div class="text-2xl font-bold text-mist">
              {hackathons.filter((h) => !h.won).length}
            </div>
            <div class="text-xs text-graphite mt-1">Finalist/Placed</div>
          </div>
          <div class="bg-paper rounded-xl border border-rule p-4 text-center">
            <div class="text-lg font-bold text-mist truncate text-sm sm:text-base">
              {prizes.length > 20 ? prizes.slice(0, 25) + "..." : prizes}
            </div>
            <div class="text-xs text-graphite mt-1">Prize Pool</div>
          </div>
        </div>

        {/* Why this matters — marketing injection */}
        <div class="bg-paper border border-rule rounded-xl p-5 mb-12">
          <div class="flex items-start gap-3">
            <PersonIcon class="w-6 h-6 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 class="text-parchment font-semibold mb-1">
                Why hackathons matter for your project
              </h2>
              <p class="text-graphite text-sm leading-relaxed">
                Every hackathon below was a real delivery under real pressure.
                The same architecture patterns, tooling decisions, and
                error-handling discipline go into every client project I ship.
                When I say I can deliver your MVP in 21 days — I've proven I can
                do it in 48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Hackathon cards */}
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {hackathons.map((h) => <HackathonCard key={h.slug} h={h} />)}
        </div>

        {/* Bottom CTA — convert interest into action */}
        <div class="text-center bg-paper rounded-xl border border-rule p-8">
          <CodeIcon class="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 class="text-2xl font-bold text-parchment mb-3">
            Ready to build something that wins?
          </h2>
          <p class="text-graphite mb-6 max-w-lg mx-auto">
            Whether it's an MVP, infrastructure overhaul, or AI integration — I
            bring the same competitive edge to your project.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <BookCallLink
              url={SCHEDULE_URL}
              target="_blank"
              class="gap-2 px-6 py-3"
            >
              Book a free intro call
            </BookCallLink>
            <a
              href="/catalog"
              class="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-rule-strong hover:bg-lamp text-parchment font-semibold rounded-lg transition-colors"
            >
              View services
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});
