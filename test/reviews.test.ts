// #231: every client project page shows its period and its clients' full
// reviews with a link to the Upwork profile, and the home page shows three
// review excerpts that each name and link their project and period. Checked
// on the built pages, since the wiring lives in the route files.
import { assert } from "jsr:@std/assert@^1.0.0";
import { type Site, startSite } from "./harness.ts";
import { visibleText } from "./html.ts";
import { formatPeriod, projects } from "../lib/data.ts";
import {
  homeTestimonialIds,
  projectTestimonials,
  testimonial,
  testimonialProject,
} from "../lib/testimonials.ts";
import { UPWORK_URL } from "../lib/config.ts";

/** Registers a test that gets a running copy of the built site and always stops it. */
function siteTest(name: string, fn: (site: Site) => Promise<void>) {
  Deno.test(name, async () => {
    const site = await startSite();
    try {
      await fn(site);
    } finally {
      await site.stop();
    }
  });
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

siteTest(
  "every client project page shows its period and each of its reviews in full",
  async (site) => {
    let reviewsSeen = 0;
    for (const project of projects.freelance) {
      const html = await site.html(`/projects/${project.slug}`);
      const text = visibleText(html);
      const period = formatPeriod(project.period!);
      assert(
        /data-project-period/.test(html) && text.includes(`Period ${period}`),
        `/projects/${project.slug} does not show its period ${period}`,
      );
      const reviews = projectTestimonials(project.slug!);
      if (reviews.length === 0) continue;
      assert(
        html.includes("data-project-reviews"),
        `/projects/${project.slug} has reviews but no review section`,
      );
      assert(
        html.includes(`href="${UPWORK_URL}"`),
        `/projects/${project.slug} does not link the Upwork profile`,
      );
      for (const t of reviews) {
        reviewsSeen++;
        assert(
          text.includes(squash(t.quote)),
          `/projects/${project.slug} does not show review ${t.id} in full`,
        );
      }
    }
    assert(reviewsSeen > 0, "no review checked — the loop passed vacuously");
  },
);

siteTest(
  "the home page shows three review excerpts, each naming and linking its project and period",
  async (site) => {
    const html = await site.html("/");
    const start = html.indexOf('data-home-section="testimonials"');
    assert(start > 0, "the home page has no testimonials section");
    const section = html.slice(start, html.indexOf("</section>", start));
    const text = visibleText(section);
    assert(homeTestimonialIds.length === 3, "not three home excerpts");
    for (const id of homeTestimonialIds) {
      const t = testimonial(id);
      const project = testimonialProject(t);
      assert(
        text.includes(t.excerpt),
        `excerpt ${id} missing from the home page`,
      );
      assert(
        section.includes(`href="/projects/${project.slug}"`),
        `excerpt ${id} does not link /projects/${project.slug}`,
      );
      assert(
        text.includes(`${project.title} · ${formatPeriod(project.period!)}`),
        `excerpt ${id} does not name ${project.title} and its period`,
      );
    }
  },
);
