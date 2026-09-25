import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import { TestimonialCard } from "./TestimonialCard.tsx";
import type { Testimonial } from "../lib/testimonials.ts";
import type { Project } from "../lib/data.ts";

const withSource: Testimonial = {
  id: "example-1",
  projectSlug: "example",
  contract: 1,
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
    !html.includes("Review on Upwork"),
    `rendered card shows a source link it shouldn't:\n${html}`,
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
