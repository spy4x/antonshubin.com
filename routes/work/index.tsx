import { type ComponentChildren, Fragment } from "preact";
import { define } from "../../lib/utils.ts";
import { getBreadcrumb, head, ROLE } from "../../lib/head.ts";
import { SEOHead } from "../../components/SEOHead.tsx";
import { Breadcrumb } from "../../components/Breadcrumb.tsx";
import { Layout } from "../../components/Layout.tsx";
import {
  formatPeriod,
  type Project,
  projectScreenshots,
} from "../../lib/data.ts";
import { firstSentence, metaDescription, projectLead } from "../../lib/llms.ts";
import { projectTestimonials } from "../../lib/testimonials.ts";
import {
  type ArchiveEntry,
  archiveFrame,
  clientWork,
  clientWorkInOrder,
  formatYearSpan,
  hiredAgainSlugs,
  projectStatus,
  repeatClientsSegments,
  WORK_PATH,
  workDescription,
  workHref,
  workScopeLine,
  yearSpan,
} from "../../lib/work.ts";
import { toJsonLd } from "../../lib/json-ld.ts";
import { NewTabHint } from "../../components/NewTabHint.tsx";
import { ReviewSource } from "../../components/ReviewSource.tsx";
import { ClosingBand } from "../../components/ClosingBand.tsx";
import { ArrowRightIcon } from "../../components/Icons.tsx";
import { StatusMark } from "@spy4x/preact-ui/status-mark";
import { eventAttrs } from "../../lib/analytics.ts";

const BASE = "https://antonshubin.com";

/** A project title as a link: Parchment, underlined, accent on hover. */
const TITLE_LINK =
  "text-parchment underline decoration-rule-strong underline-offset-4 hover:decoration-accent focus-visible:decoration-accent";

/**
 * The `CollectionPage` and its `ItemList` (SEO 1 on #270): every client
 * project in page order, each pointing at the project node its own page
 * declares (`/work/<slug>#project`). No `Review` or rating: those are the
 * clients' words on Upwork, and self-served review markup is not eligible.
 */
function workJsonLd(list: Project[], canonical: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#page`,
        "url": canonical,
        "name": head.value.title,
        "description": description,
        "isPartOf": { "@id": `${BASE}/#website` },
        "about": { "@id": `${BASE}/#person` },
        "author": { "@id": `${BASE}/#person` },
        "breadcrumb": { "@id": `${canonical}#breadcrumb` },
        "mainEntity": { "@id": `${canonical}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${canonical}#list`,
        "numberOfItems": list.length,
        "itemListOrder": "https://schema.org/ItemListUnordered",
        "itemListElement": list.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "url": `${BASE}${workHref(p.slug ?? "")}`,
          "name": p.title,
          "item": { "@id": `${BASE}${workHref(p.slug ?? "")}#project` },
        })),
      },
    ],
  };
}

/**
 * One Graphite line of facts, in the fact card's order (UX 3, Psych 4 on
 * #270): client, period, role, status, and "Hired again" where a client came
 * back. `period: false` leaves the period out (the archive shows it in its
 * own column).
 */
function MetaLine(
  { project, hiredAgain, period = true }: {
    project: Project;
    hiredAgain: boolean;
    period?: boolean;
  },
) {
  const status = projectStatus(project);
  const parts: ComponentChildren[] = [
    project.madeForName,
    period && project.period && (
      <span key="period" data-project-period class="price">
        {formatPeriod(project.period)}
      </span>
    ),
    project.role,
    status && <StatusMark key="status" status={status} />,
    hiredAgain && <span key="hired" data-hired-again>Hired again</span>,
  ].filter(Boolean);
  return (
    <p class="text-sm text-graphite">
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true" class="mx-1.5">·</span>}
          {part}
        </Fragment>
      ))}
    </p>
  );
}

/** A review excerpt with who wrote it and where, as the archive rows show it. */
function Excerpt(
  { project, excerpt, href, class: className = "" }: {
    project: Project;
    excerpt: string;
    href?: string;
    class?: string;
  },
) {
  return (
    <figure
      class={`pl-3 border-l-2 border-rule-strong text-sm ${className}`}
    >
      <blockquote class="inline text-parchment italic">“{excerpt}”</blockquote>
      <figcaption class="inline text-graphite">
        {" — "}
        <ReviewSource project={project} href={href} />
      </figcaption>
    </figure>
  );
}

/**
 * The picture in a highlight card's 16:10 frame (UX 1, UX 10 on #270): the
 * card image, a phone screenshot centred on the Lamp panel, or the logo when
 * a project has no card image. Only the first card loads eagerly, and none
 * asks for high priority: `/work` has no hero image.
 */
function CardPicture({ project, eager }: { project: Project; eager: boolean }) {
  const image = project.cardImage;
  const alt = projectScreenshots(project)[0]?.alt ?? "";
  return (
    <div class="aspect-[16/10] bg-lamp flex items-center justify-center overflow-hidden">
      {image
        ? (
          <img
            src={image.src}
            alt={alt}
            width={image.width}
            height={image.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            class={image.width > image.height
              ? "w-full h-full object-cover object-top"
              : "h-full w-auto"}
          />
        )
        : project.logoImageURL && (
          <img
            src={project.logoImageURL}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            loading={eager ? "eager" : "lazy"}
            class={`w-24 h-24 object-contain${
              project.logoPlate ? " bg-parchment rounded-lg p-2" : ""
            }`}
          />
        )}
    </div>
  );
}

/**
 * A highlight card, a small version of the project page (UX 1–4 on #270):
 * picture, logo beside the name, the facts line, the outcome, one review
 * excerpt where the project has one, and the stack. The name is the card's
 * one link, stretched over the card; the review's own links sit above it.
 */
function HighlightCard(
  { project, eager, hiredAgain }: {
    project: Project;
    eager: boolean;
    hiredAgain: boolean;
  },
) {
  const review = projectTestimonials(project.slug ?? "")[0];
  return (
    <li
      data-highlight={project.slug}
      class="relative flex flex-col bg-paper border border-rule rounded-xl overflow-hidden transition-colors hover:border-rule-strong focus-within:border-rule-strong"
    >
      <CardPicture project={project} eager={eager} />
      <div class="flex flex-col gap-3 p-5 flex-1">
        <h3 class="flex items-center gap-3 text-xl">
          {project.logoImageURL && (
            <img
              src={project.logoImageURL}
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              loading="lazy"
              class={`w-7 h-7 shrink-0 object-contain${
                project.logoPlate ? " bg-parchment rounded p-0.5" : ""
              }`}
            />
          )}
          <a
            href={workHref(project.slug ?? "")}
            data-work-link={project.slug}
            {...eventAttrs("cta", {
              place: "body",
              target: workHref(project.slug ?? ""),
            })}
            class={`${TITLE_LINK} after:absolute after:inset-0 after:rounded-xl`}
          >
            {project.title}
          </a>
        </h3>
        <MetaLine project={project} hiredAgain={hiredAgain} />
        <p
          data-project-lead
          class="font-heading font-semibold text-lg text-parchment leading-snug"
        >
          {projectLead(project)}
        </p>
        {review && (
          <Excerpt
            project={project}
            excerpt={review.excerpt}
            href={review.sourceHref}
            class="relative z-10"
          />
        )}
        {project.tags && project.tags.length > 0 && (
          <p data-stack class="mt-auto pt-1 text-xs text-graphite">
            {project.tags.join(" · ")}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * One archive row, a dated list entry (UX 7 on #270): the period in its own
 * column from 768px, the name as the row's link, the facts line, one
 * sentence, the first review's excerpt and the company's later outcome.
 * The name's link is stretched over the row (#336); the excerpt's and the
 * outcome's own links sit above it.
 */
function ArchiveRow(
  { entry, hiredAgain }: { entry: ArchiveEntry; hiredAgain: boolean },
) {
  const { project, review } = entry;
  return (
    <li
      data-archive-row={project.slug}
      class="relative py-5 border-t border-rule first:border-t-0 md:grid md:grid-cols-[8rem_minmax(0,1fr)] md:gap-6"
    >
      <p class="text-sm text-graphite mb-1 md:mb-0 md:pt-1">
        {project.period && (
          <span data-project-period class="price">
            {formatPeriod(project.period)}
          </span>
        )}
      </p>
      <div>
        <h3 class="text-lg">
          <a
            href={workHref(project.slug ?? "")}
            data-work-link={project.slug}
            {...eventAttrs("cta", {
              place: "body",
              target: workHref(project.slug ?? ""),
            })}
            class={`${TITLE_LINK} after:absolute after:inset-0`}
          >
            {project.title}
          </a>
        </h3>
        <div class="mt-1">
          <MetaLine project={project} hiredAgain={hiredAgain} period={false} />
        </div>
        <p class="text-graphite text-sm leading-relaxed mt-2">
          {firstSentence(project.description)}
        </p>
        {review && (
          <Excerpt
            project={project}
            excerpt={review.excerpt}
            href={review.sourceHref}
            class="relative z-10 mt-3"
          />
        )}
        {project.companyOutcome && (
          <p
            data-company-outcome
            class="relative z-10 mt-3 text-sm text-graphite"
          >
            The company:{" "}
            <a
              href={project.companyOutcome.href}
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent hover:text-accent underline underline-offset-4"
            >
              {project.companyOutcome.text}
              <NewTabHint />
            </a>
            .
          </p>
        )}
      </div>
    </li>
  );
}

/** The repeat-clients line, with every project it names linked to its page (Mkt 7). */
function RepeatClientsLead() {
  return (
    <p
      data-repeat-clients
      class="font-heading text-xl text-parchment leading-snug text-balance max-w-3xl"
    >
      {repeatClientsSegments().map((s, i) =>
        s.slug
          ? (
            <a
              key={i}
              href={workHref(s.slug)}
              class="underline decoration-rule-strong underline-offset-4 hover:decoration-accent"
            >
              {s.text}
            </a>
          )
          : s.text
      )}
    </p>
  );
}

export default define.page(function Work(ctx) {
  // clientWork() throws on a highlightSlugs typo, so a bad slug fails loudly.
  const work = clientWork();
  const { highlights, archive } = work;
  const all = clientWorkInOrder(work);
  const description = metaDescription(workDescription(ROLE, work));
  head.value = {
    ...head.value,
    title: "Client work and case studies — Anton Shubin",
    pageName: "Work",
    description,
    canonical: `${BASE}${WORK_PATH}`,
    ogType: "website",
    ogImage: `${BASE}/img/og/work.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };
  const breadcrumb = getBreadcrumb(head.value.canonical, "Work");

  if (all.length === 0) {
    return (
      <Layout currentPath={ctx.url.pathname}>
        <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12 text-center">
          <SEOHead />
          <Breadcrumb items={breadcrumb} />
          <h1 class="text-3xl text-parchment mb-4">Client work</h1>
          <p class="text-graphite">No projects to display yet.</p>
        </div>
      </Layout>
    );
  }

  const hiredAgain = new Set(hiredAgainSlugs());

  return (
    <Layout currentPath={ctx.url.pathname}>
      <SEOHead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(workJsonLd(all, head.value.canonical, description)),
        }}
      />
      <Breadcrumb items={breadcrumb} />
      <div class="max-w-6xl mx-auto">
        <header class="mb-10 sm:mb-12">
          <h1 class="text-3xl sm:text-4xl text-parchment mb-4">
            Client work
          </h1>
          <RepeatClientsLead />
          <p data-work-scope class="mt-3 text-sm text-graphite">
            {workScopeLine(ROLE, work)}
          </p>
        </header>

        {highlights.length > 0 && (
          <section
            data-projects-section="highlights"
            aria-labelledby="work-highlights"
          >
            <h2 id="work-highlights" class="text-2xl text-parchment mb-6">
              Highlights
            </h2>
            <ul class="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mb-16">
              {highlights.map((project, i) => (
                <HighlightCard
                  key={project.slug}
                  project={project}
                  eager={i === 0}
                  hiredAgain={hiredAgain.has(project.slug ?? "")}
                />
              ))}
            </ul>
          </section>
        )}

        {archive.length > 0 && (
          <section
            data-projects-section="archive"
            aria-labelledby="work-archive"
          >
            <h2 id="work-archive" class="text-2xl text-parchment mb-2">
              Archive,{" "}
              <span class="price">
                {formatYearSpan(yearSpan(archive.map((e) => e.project)))}
              </span>
            </h2>
            <p data-archive-frame class="text-graphite mb-4">
              {archiveFrame(archive)}
            </p>
            <ul class="border-y border-rule">
              {archive.map((entry) => (
                <ArchiveRow
                  key={entry.project.slug}
                  entry={entry}
                  hiredAgain={hiredAgain.has(entry.project.slug ?? "")}
                />
              ))}
            </ul>
          </section>
        )}

        <ClosingBand
          catalogLink={
            <a
              href="/catalog"
              {...eventAttrs("cta", { place: "band", target: "/catalog" })}
              class="inline-flex items-center gap-1 text-sm text-parchment underline underline-offset-4 hover:text-accent"
            >
              Services and prices
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </a>
          }
          links={[
            {
              href: "/how-i-work",
              label: "How I work",
            },
            {
              href: "/infrastructure",
              label: "Infrastructure",
            },
          ]}
        />
        <p data-tools-line class="mt-8 text-sm text-graphite">
          <a
            href="/tools"
            class="inline-flex items-center gap-1 underline underline-offset-4 hover:text-accent"
          >
            My own open-source tools
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </a>
        </p>
      </div>
    </Layout>
  );
});
