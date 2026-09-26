import { assert } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import { InstallLine } from "./InstallLine.tsx";
import { type Tool, tools } from "../lib/tools.ts";

// Made-up tools, so these tests hold whatever the real registry says is published.
const published: Tool = {
  ...tools[0],
  name: "Sample",
  slug: "sample",
  registry: {
    name: "JSR",
    url: "https://jsr.io/@example",
    version: "9.9.9",
    published: true,
    install: "deno add jsr:@example/sample@9.9.9",
  },
};
const unpublished: Tool = {
  ...published,
  registry: { ...published.registry, published: false },
};

Deno.test("a published tool's install line offers a copy button", () => {
  const html = render(<InstallLine tool={published} id="install" />);
  assert(html.includes("<button"), `no copy button:\n${html}`);
  assert(
    html.includes(`title="Copy the install command for Sample"`),
    `copy button has no title naming the tool:\n${html}`,
  );
  assert(!html.includes("Not yet available"), `marked not yet:\n${html}`);
});

Deno.test("an unpublished tool's install line has no copy button and says it is not yet available", () => {
  const html = render(<InstallLine tool={unpublished} id="install" />);
  assert(!html.includes("<button"), `copy button offered:\n${html}`);
  assert(
    html.includes("Not yet available: 9.9.9 is being published to JSR now."),
    `no "not yet available" note:\n${html}`,
  );
});
