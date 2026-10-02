import { define } from "../lib/utils.ts";
import { EMAIL_ADDRESS } from "../lib/profiles.ts";
import { BASE_URL, LOCATION } from "../lib/config.ts";
import { COMPANY, COMPANY_LINE } from "../lib/company.ts";
import { ABOUT_PATH } from "../lib/about.ts";
import { hackathons, highlightSlugs } from "../lib/data.ts";
import { llmsBlogSections } from "../lib/blog.ts";
import { catalogItems, INTRO_CALL, priceLabel } from "../lib/catalog.ts";
import { decapitalize, promises } from "../lib/promises.ts";
import { proof } from "../lib/proof.ts";
import { ROLE } from "../lib/head.ts";
import {
  BOOK_HREF,
  BOOK_LABEL,
  BRIEF_LABEL,
  WRITE_FALLBACK_HREF,
} from "../lib/nav.ts";
import {
  clientProject,
  llmsClientSummary,
  toolLines,
  whoThisSuits,
} from "../lib/llms.ts";
import {
  clientWork,
  clientWorkInOrder,
  formatYearSpan,
  yearSpan,
} from "../lib/work.ts";
import { toolsLive, withLiveVersion } from "../lib/tools-live.ts";
import { tools } from "../lib/tools.ts";

export const handler = define.handlers({
  async GET() {
    // The tool pages read the live version; so does the install line here (#391).
    const live = await toolsLive();
    const liveTools = tools.map((t) => withLiveVersion(t, live));

    // Listed only while lib/data.ts holds real entries.
    const hackathonsLink = hackathons.length > 0
      ? `\n- [Hackathons](${BASE_URL}/hackathons)`
      : "";

    // Titles and prices come from lib/catalog.ts; nothing here restates one.
    const services = catalogItems
      .map((i) =>
        `- [${i.shortTitle}](${BASE_URL}/catalog/${i.slug}) — ${
          priceLabel(i)
        }, ${i.delivery.toLowerCase()}. ${i.summary}`
      )
      .join("\n");

    // The first three highlights, the same as the home page, in the order /work shows them
    // (highlightSlugs is ordered strongest-first),
    // generated from lib/data.ts: what each product is, then its outcome (see
    // clientSummary's docs).
    const clientList = highlightSlugs
      .slice(0, 3)
      .map((slug) => {
        const p = clientProject(slug);
        return `- [${p.title}](${BASE_URL}/work/${p.slug}) — ${
          llmsClientSummary(p)
        }`;
      })
      .join("\n");

    // Every post grouped by its topic with its tool link, then the Archive
    // (#274, SEO 10), from lib/blog.ts; nothing sorts the shared array.
    const writing = llmsBlogSections(BASE_URL, false);

    // Titles and descriptions come from lib/promises.ts; nothing here
    // restates a promise's title or wording by hand.
    const promisesList = promises
      .map((p) => `- ${p.title} — ${decapitalize(p.desc)}`)
      .join("\n");

    // Counted from the data, like /work's own scope line.
    const workList = clientWorkInOrder(clientWork());
    const workLine = `${workList.length} client projects, ${
      formatYearSpan(yearSpan(workList))
    }, with reviews`;

    const txt = `# Anton Shubin — ${ROLE}

> I'm a senior full-stack engineer and tech lead. I build and run SaaS products end to end, and you own the code, the servers and the keys from day one.

## Quick Facts

- Role: ${ROLE}
- Company: ${COMPANY_LINE} — Anton is co-founder and CEO
- Expertise: SaaS architecture, product delivery, open-source and self-hostable infrastructure, dedicated bare-metal on Hetzner, managed cloud (AWS, GCP, Supabase), platform engineering, observability, backup and disaster recovery, identity and access management, cloud cost optimization, AI integration, MCP server engineering
- Stack: Deno/Node.js, Preact/React, PostgreSQL, Valkey/Redis, Docker/Podman, Traefik, MCP — built on web standards (Fetch, Web Crypto, Streams, ES modules), portable across runtimes
- AI APIs: OpenAI, Claude, DeepSeek
- Upwork: ${proof("expert-vetted")} (${proof("top-percent")}), ${
      proof("job-success")
    } Job Success, ${proof("earned")} earned, ${proof("jobs")} jobs
- Pricing: fixed price when the scope is fixed, hourly when open-ended; every price is listed under Services below
- Location: ${LOCATION} (${COMPANY.country}-based entity)

## Services

Start with a ${INTRO_CALL}, or send a written brief (${BASE_URL}/book#brief): I write back with 3 concrete architectural improvements, free, within one working day.

${services}

Fixed price when the scope is fixed, hourly when the work is open-ended. A change to scope gets a quote before I start on it.

## Promises

${promisesList}

## Key Pages

- [Home](${BASE_URL}/) — Who I am, the Upwork figures, prices, client work, reviews and how to book
- [About](${BASE_URL}${ABOUT_PATH}) — Who I am, since 2010: the career story, what I run myself and how to pay
- [SaaS Architecture Guide](${BASE_URL}/saas-architecture-guide) — Pillar page linking all blog posts and projects by topic: architecture, MVP, CI/CD, infrastructure, AI
- [Services and prices](${BASE_URL}/catalog) — the four services with their prices and what each includes
- [How I work](${BASE_URL}/how-i-work) — The five promises in the order a project meets them, prices, who does the work, my AI-agent setup and the questions clients ask
- [How I run production](${BASE_URL}/infrastructure) — The live services I run, a map of how they connect in four lanes, and how handover, backups, monitoring and deploys are handled
- [Contact](${BASE_URL}${BOOK_HREF}) — ${BOOK_LABEL} on the page, ${
      decapitalize(BRIEF_LABEL)
    } (${BASE_URL}${WRITE_FALLBACK_HREF}), or email ${EMAIL_ADDRESS}, or Telegram @spy4x
- [Writing](${BASE_URL}/blog) — Posts on decisions for founders, AI and MCP, and self-hosting
- [Work](${BASE_URL}/work) — ${workLine}
- [Tools](${BASE_URL}/tools) — Open-source tools I build and use, with status, CI status and install
- [Privacy](${BASE_URL}/privacy) — What the brief form, the newsletter and analytics collect${hackathonsLink}

## Tools

${toolLines(BASE_URL, liveTools)}

## Writing

${writing}

## Client Work Highlights

${clientList}

All client work: ${BASE_URL}/work

## Who this suits

${whoThisSuits()}
`;

    return new Response(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "max-age=86400",
      },
    });
  },
});
