// #454: a custom tool page changes the hero through `ToolFrame`'s options,
// and the shared frame check reads those choices from the markup the frame
// writes, so a lane's page passes the check without editing a shared test.
import { AssertionError, assertThrows } from "jsr:@std/assert@^1.0.0";
import { render } from "npm:preact-render-to-string@^6.6.3";
import type { ComponentChildren } from "preact";
import { assertToolFrame } from "./tool-frame.ts";
import { loadToolPage } from "../components/tool-frame/tool-page.ts";
import {
  ToolHero,
  type ToolHeroProps,
} from "../components/tool-frame/ToolHero.tsx";
import { ToolDetails } from "../components/tool-frame/ToolDetails.tsx";
import { ToolBand } from "../components/tool-frame/ToolBand.tsx";
import { ToolMore } from "../components/tool-frame/ToolMore.tsx";

const data = (await loadToolPage("oko"))!;

/** The frame's page body as the site renders it, with `hero` as a custom page passes it. */
function body(hero: Omit<ToolHeroProps, "data">, middle?: ComponentChildren) {
  return `<div id="main-content">${
    render(
      <>
        <ToolHero data={data} {...hero} />
        {middle}
        <ToolDetails data={data} />
        <ToolBand data={data} />
        <ToolMore data={data} />
      </>,
    )
  }<footer class="site-footer">`;
}

Deno.test("the frame check passes a custom page that hides the job and brings its own media, with no options", () => {
  // A headline page; its own media is a lazy picture, so it has no eager image.
  assertToolFrame(
    data.tool,
    body({
      showJob: false,
      media: <img src="/img/x.webp" alt="A diagram" loading="lazy" />,
    }),
  );
});

Deno.test("the frame check reads a hidden job from the marker, and fails when the marker is missing", () => {
  const html = body({ showJob: false }).replace(
    "data-tool-job-hidden",
    "data-x",
  );
  assertThrows(
    () => assertToolFrame(data.tool, html),
    AssertionError,
    "/tools/oko: job",
  );
});
