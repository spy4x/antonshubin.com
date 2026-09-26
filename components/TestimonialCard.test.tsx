import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import { TestimonialCard } from "./TestimonialCard.tsx";
import type { Testimonial } from "../lib/testimonials.ts";
import type { Project } from "../lib/data.ts";

const withSource: Testimonial = {
  id: "example-1",
  projectSlug: "example",
  contract: 1,
  rating: 5,
  quote: "Great work. Would hire again.",
  excerpt: "Great work.",
  sourceHref: "https://example.com/review",
  permission: true,
};

const project: Project = {
  title: "Example App",
  slug: "example",
  description: "An example.",
  period: { from: 2018, to: 2019 },
  madeForName: "Jane Example",
  madeForURL: "https://example.com/in/jane",
};

Deno.test("a testimonial with a sourceHref renders a link to it", () => {
  const html = render(<TestimonialCard t={withSource} project={project} />);
  assert(
    html.includes(`href="${withSource.sourceHref}"`),
    `rendered card has no link to sourceHref:\n${html}`,
  );
});

Deno.test("a testimonial with no sourceHref renders no source link", () => {
  const { sourceHref: _drop, ...rest } = withSource;
  const html = render(<TestimonialCard t={rest} project={project} />);
  assert(
    !/<a [^>]*>Upwork/.test(html),
    `rendered card links Upwork with no source:\n${html}`,
  );
});

Deno.test("a card names the client, linked to their profile, as the reviewer", () => {
  const html = render(<TestimonialCard t={withSource} project={project} />);
  const text = html.replace(/<[^>]+>/g, "").replace(
    /\u00a0\(opens in a new tab\)/g,
    "",
  );
  assert(
    text.includes("Jane Example reviewed on Upwork"),
    `no "Jane Example reviewed on Upwork":\n${html}`,
  );
  assert(
    html.includes(`href="https://example.com/in/jane"`),
    `the client's name is not linked:\n${html}`,
  );
});

Deno.test("a card for a project with no named client says Reviewed on Upwork", () => {
  const { madeForName: _n, madeForURL: _u, ...anonymous } = project;
  const html = render(<TestimonialCard t={withSource} project={anonymous} />);
  const text = html.replace(/<[^>]+>/g, "").replace(
    /\u00a0\(opens in a new tab\)/g,
    "",
  );
  assert(
    text.includes("Reviewed on Upwork"),
    `no "Reviewed on Upwork":\n${html}`,
  );
});

Deno.test("a card shows the excerpt, not the full quote, and names its project, period and page", () => {
  const html = render(<TestimonialCard t={withSource} project={project} />);
  assert(html.includes("Great work."), `no excerpt:\n${html}`);
  assert(!html.includes("Would hire again."), `full quote shown:\n${html}`);
  assert(
    html.includes(`href="/projects/example"`),
    `no project link:\n${html}`,
  );
  assert(html.includes("Example App"), `no project title:\n${html}`);
  assert(html.includes("2018–2019"), `no period:\n${html}`);
});

Deno.test("a card shows the review's star rating, named for screen readers", () => {
  const html = render(<TestimonialCard t={withSource} project={project} />);
  assert(html.includes(`data-rating="5.0"`), `no rating:\n${html}`);
  assert(
    html.replace(/<[^>]+>/g, "").includes("Rated 5.0 out of 5"),
    `rating has no accessible text:\n${html}`,
  );
  assert(
    /<span class="sr-only">Rated 5\.0 out of 5<\/span>/.test(html),
    `the rating's label is not hidden from view:\n${html}`,
  );
  assert(
    /<span aria-hidden="true">5\.0<\/span>/.test(html),
    `the visible 5.0 is not hidden from screen readers:\n${html}`,
  );
});
