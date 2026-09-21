import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { Layout } from "../components/Layout.tsx";
import { SEOHead } from "../components/SEOHead.tsx";
import { ArrowRightIcon } from "../components/Icons.tsx";
import { catalogPath } from "../lib/catalog.ts";
import { SCHEDULE_URL } from "../lib/config.ts";
import { getBreadcrumb, head } from "../lib/head.ts";
import { define } from "../lib/utils.ts";

const outcomes = [
  {
    title: "Deployable",
    description:
      "A release follows a documented, repeatable path instead of one person's memory.",
  },
  {
    title: "Observable",
    description:
      "Monitoring is designed to surface failures early and preserve diagnostic context.",
  },
  {
    title: "Recoverable",
    description:
      "Backups are checked, retained deliberately, and paired with restore tooling.",
  },
  {
    title: "Transferable",
    description:
      "Versioned configuration and documented operating paths reduce dependence on one builder.",
  },
];

const proofAreas = [
  {
    title: "Versioned delivery",
    summary:
      "Infrastructure changes travel with product changes, so releases can be reviewed, repeated, and handed over.",
    details:
      "My public Production Infrastructure Lab uses reusable infrastructure as code, Deno deployment automation, Docker Compose, and Traefik for TLS and routing. Configuration and deployment logic stay versioned rather than living as undocumented server steps.",
  },
  {
    title: "Failure detection",
    summary:
      "Health checks and metrics make product risk visible while there is still time to act.",
    details:
      "VictoriaMetrics records operational signals while Gatus checks service health. This separates customer-facing availability checks from deeper system measurements and creates useful diagnostic context when something fails.",
  },
  {
    title: "Recovery",
    summary:
      "A backup only matters when its integrity, retention, and restore path are understood.",
    details:
      "Restic automation covers integrity checks, retention policies, and restore tooling. Recovery work is treated as part of system design, not a command to research for the first time during an incident.",
  },
  {
    title: "Clean handoff",
    summary:
      "Ownership includes operating knowledge, access boundaries, and a path for the next team.",
    details:
      "Versioned configuration and deployment tooling reduce dependence on one operator. Authelia provides centralized SSO and 2FA, helping keep access explicit while preserving a system another team can understand and take over.",
  },
];

export default define.page(function Infrastructure() {
  head.value = {
    ...head.value,
    title: "Production Infrastructure, Owned End to End — Anton Shubin",
    description:
      "How Anton designs deployable, observable, recoverable, and transferable production systems as a senior full-stack engineer and tech lead.",
    canonical: "https://antonshubin.com/infrastructure",
    ogType: "website",
  };

  return (
    <Layout currentPath="/infrastructure">
      <SEOHead />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <Breadcrumb
          items={getBreadcrumb(head.value.canonical, head.value.title)}
        />

        <header class="text-center mb-12 sm:mb-16">
          <p class="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-3">
            Operational judgment, made visible
          </p>
          <h1 class="text-3xl sm:text-5xl font-bold text-white text-balance mb-5">
            Production Infrastructure, Owned End to End
          </h1>
          <p class="text-gray-300 text-base sm:text-xl leading-relaxed max-w-3xl mx-auto">
            Shipping the product is half the job. Deployment, observability,
            recovery, security, and cost controls need to be designed with it —
            so the business gets a system designed for operability after launch.
          </p>
        </header>

        <section aria-labelledby="operational-outcomes" class="mb-12 sm:mb-16">
          <div class="mb-6">
            <h2
              id="operational-outcomes"
              class="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              What ownership looks like in production
            </h2>
            <p class="text-gray-400 text-base sm:text-lg leading-relaxed max-w-3xl">
              Founders should not need to manage infrastructure. They should
              know how product risk is controlled, what happens when something
              fails, and whether another team can take over cleanly.
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            {outcomes.map((outcome) => (
              <article
                key={outcome.title}
                class="bg-gray-800 rounded-xl border border-gray-700 p-5"
              >
                <h3 class="text-lg font-semibold text-white mb-2">
                  <span class="text-orange-400" aria-hidden="true">✓</span>{" "}
                  {outcome.title}
                </h3>
                <p class="text-gray-400 text-sm sm:text-base leading-relaxed">
                  {outcome.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="workload-fit"
          class="bg-gray-800 rounded-xl border border-gray-700 p-5 sm:p-7 mb-12 sm:mb-16"
        >
          <h2
            id="workload-fit"
            class="text-2xl sm:text-3xl font-bold text-white mb-3"
          >
            Infrastructure follows the workload
          </h2>
          <p class="text-gray-300 leading-relaxed mb-6">
            There is no universal self-hosting template. Recommendation follows
            workload, team capability, compliance needs, recovery targets, and
            budget.
          </p>
          <div class="grid gap-4 lg:grid-cols-3 mb-6">
            <article class="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
              <h3 class="text-lg font-semibold text-white mb-2">
                Open-source, self-hostable — the default
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                FOSS preferred for cost discipline, performance, portability,
                and auditability. Dedicated hardware on Hetzner when the
                workload justifies it — single-tenant CPU, NVMe, predictable
                cost.
              </p>
            </article>
            <article class="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
              <h3 class="text-lg font-semibold text-white mb-2">
                Managed cloud when the business calls for it
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                AWS, GCP, Supabase, and friends are the right choice when they
                remove meaningful operational risk, satisfy compliance needs, or
                let a small team move faster. Recommendation is workload-fit,
                not ideology.
              </p>
            </article>
            <article class="bg-gray-900/50 rounded-lg border border-gray-700 p-4">
              <h3 class="text-lg font-semibold text-white mb-2">
                Hybrid when constraints differ
              </h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Keep managed services where they remove risk while placing
                stable workloads on dedicated hardware where control and
                capacity matter more. Most production setups end up here.
              </p>
            </article>
          </div>
          <p class="text-gray-300 leading-relaxed mb-3">Decision follows:</p>
          <ul class="grid gap-2 sm:grid-cols-2 text-gray-400">
            <li>— Compliance and data-control requirements</li>
            <li>— Elasticity and traffic patterns</li>
            <li>— User geography and latency</li>
            <li>— Team capacity to operate systems</li>
            <li>— Uptime and recovery needs</li>
            <li>— Current and expected budget</li>
          </ul>
        </section>

        <section aria-labelledby="operational-proof" class="mb-12 sm:mb-16">
          <div class="mb-6">
            <h2
              id="operational-proof"
              class="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              Production and operational proof
            </h2>
            <p class="text-gray-400 text-base sm:text-lg leading-relaxed max-w-3xl">
              Client production work shows outcome ownership. Sanitized case
              studies make the operating practice concrete without exposing
              sensitive topology.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 mb-6">
            <a
              href="/projects/smartlite"
              data-e2e="infrastructure-view-smartlite"
              class="group min-h-44 rounded-xl border border-gray-700 bg-gray-800 p-5 transition-colors hover:border-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            >
              <p class="text-sm font-semibold text-orange-400 mb-2">
                Professional production proof
              </p>
              <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-orange-300">
                SmartLite
              </h3>
              <p class="text-gray-400 leading-relaxed">
                End-to-end ownership of a live IoT control platform: product,
                backend, infrastructure, deployment, observability, alerts, and
                access controls.
              </p>
            </a>
            <a
              href="/projects/homelab"
              data-e2e="infrastructure-view-homelab"
              class="group min-h-44 rounded-xl border border-gray-700 bg-gray-800 p-5 transition-colors hover:border-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            >
              <p class="text-sm font-semibold text-orange-400 mb-2">
                Operational engineering proof
              </p>
              <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-orange-300">
                Production Infrastructure Lab
              </h3>
              <p class="text-gray-400 leading-relaxed">
                Reusable infrastructure as code showing versioned delivery,
                monitoring, recovery tooling, and identity controls.
              </p>
            </a>
          </div>

          <div class="space-y-4">
            {proofAreas.map((area, index) => (
              <details
                key={area.title}
                class="group bg-gray-800 rounded-xl border border-gray-700 open:border-orange-500/50"
              >
                <summary
                  data-e2e={`infrastructure-proof-${index + 1}`}
                  class="min-h-14 cursor-pointer list-none p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset rounded-xl"
                >
                  <span class="flex items-start justify-between gap-4">
                    <span>
                      <span class="block text-lg font-semibold text-white mb-1">
                        {area.title}
                      </span>
                      <span class="block text-gray-400 text-sm sm:text-base leading-relaxed">
                        {area.summary}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      class="text-orange-400 text-xl transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <div class="px-5 pb-5 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-gray-700 pt-4">
                  {area.details}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="discovery-heading"
          class="bg-gray-800 rounded-xl border border-orange-500/40 p-5 sm:p-7 text-center"
        >
          <p class="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-2">
            Start with decisions, not vendors
          </p>
          <h2
            id="discovery-heading"
            class="text-2xl sm:text-3xl font-bold text-white mb-3"
          >
            Map the operating model before committing to the build
          </h2>
          <p class="text-gray-300 leading-relaxed max-w-2xl mx-auto mb-5">
            Every build I take on opens with a short discovery sprint: an
            architecture blueprint, the main risks, an operating-cost estimate,
            and a phased scope grounded in your product and team.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={catalogPath("zero-to-production-saas-mvp")}
              data-e2e="infrastructure-start-discovery"
              class="min-h-11 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 transition-all duration-200"
            >
              See how a build starts
              <ArrowRightIcon class="w-5 h-5" />
            </a>
            <a
              href="/#audit-form"
              data-e2e="infrastructure-request-audit"
              class="min-h-11 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
            >
              Request a free audit
            </a>
            <a
              href={SCHEDULE_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-e2e="infrastructure-book-intro"
              class="min-h-11 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
            >
              Book an intro call
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
});
