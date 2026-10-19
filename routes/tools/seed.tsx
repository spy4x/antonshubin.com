import { define } from "../../lib/utils.ts";
import { NotFound } from "../../components/NotFound.tsx";
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx";
import { loadToolPage } from "../../components/tool-frame/tool-page.ts";
import { ShowcaseFeatures } from "../../components/ToolShowcase.tsx";
import { SeedStart } from "../../components/tools/seed/SeedStart.tsx";
import { SeedRunning } from "../../components/tools/seed/SeedRunning.tsx";
import { SeedTryLink } from "../../components/tools/seed/SeedTryLink.tsx";
import { TRY_LINKS } from "../../components/tools/seed/demo.ts";

// Seed's own page (#455): the shared tool frame with the hero clip, the quick
// start and its next commands under the actions, then "See it running" (the
// three live surfaces) and "What you get" with a link into the demo per card.
export default define.page(async function SeedPage(ctx) {
  const data = await loadToolPage("seed");
  if (!data) return <NotFound pathname={ctx.url.pathname} />;
  const { tool } = data;
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{ children: <SeedStart tool={tool} /> }}
      more={["preact-components", "ts-libs", "mig"]}
    >
      <SeedRunning />
      <ShowcaseFeatures
        tool={tool}
        after={(f) =>
          TRY_LINKS[f.title] && <SeedTryLink link={TRY_LINKS[f.title]} />}
      />
    </ToolFrame>
  );
});
