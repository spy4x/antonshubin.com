import { define } from "../../lib/utils.ts";
import { NotFound } from "../../components/NotFound.tsx";
import { FACT_LINK } from "../../components/FactCard.tsx";
import { eventAttrs } from "../../lib/analytics.ts";
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx";
import { loadToolPage } from "../../components/tool-frame/tool-page.ts";
import { QuickStart } from "../../components/tool-frame/ToolBand.tsx";
import {
  AgentSetup,
  DotfilesStanding,
  HarnessMap,
  InstallWarning,
} from "../../components/tools/dotfiles/DotfilesMiddle.tsx";

// /tools/dotfiles (#460): the frame with the clip of drift caught and fixed,
// the safe quick start, and a middle of its own: where each source file goes
// in each harness, and the AI-agent setup as six cards.

export default define.page(async function DotfilesPage(ctx) {
  const data = await loadToolPage("dotfiles");
  if (!data) return <NotFound pathname={ctx.url.pathname} />;
  const { tool } = data;
  const rules = tool.proofLinks![0];
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{
        action: {
          label: "Read the global agent rules",
          href: rules.href,
          to: "github",
        },
        children: (
          <>
            <QuickStart tool={tool} id="quick-start-dotfiles" />
            <InstallWarning />
          </>
        ),
      }}
      beside={<DotfilesStanding data={data} />}
      band={{
        buildLinks: (
          <a
            href="/how-i-work"
            {...eventAttrs("cta", { place: "band", target: "/how-i-work" })}
            class={FACT_LINK}
          >
            How I work
          </a>
        ),
      }}
      more={["caldav-mcp", "ts-libs", "preact-components"]}
    >
      <HarnessMap />
      <AgentSetup />
    </ToolFrame>
  );
});
