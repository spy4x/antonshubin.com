import { define } from "../../lib/utils.ts"
import { catalogPath } from "../../lib/catalog.ts"
import { eventAttrs } from "../../lib/analytics.ts"
import { NotFound } from "../../components/NotFound.tsx"
import { FACT_LINK } from "../../components/FactCard.tsx"
import { ToolFrame } from "../../components/tool-frame/ToolFrame.tsx"
import { loadToolPage } from "../../components/tool-frame/tool-page.ts"
import { DefaultMiddle } from "../../components/tool-frame/DefaultMiddle.tsx"

// /tools/ringmaster (#636): the frame with the default middle and the demo
// clip, but no repository, live link or install line, since its source is not
// public and it takes no users. The band says when you can run it yourself and
// sends "Have me build it" to the Ongoing offer.

const OFFER = catalogPath("cto-advisory-retainer")

export default define.page(async function RingmasterPage(ctx) {
  const data = await loadToolPage("ringmaster")
  if (!data) return <NotFound pathname={ctx.url.pathname} />
  return (
    <ToolFrame
      data={data}
      currentPath={ctx.url.pathname}
      hero={{
        children: (
          <p class="text-sm text-graphite">
            It runs on my own machine, on my own Claude Code subscription, and
            only I sign in.
          </p>
        ),
      }}
      band={{
        yourself: (
          <p class="mt-2 text-graphite">
            Not yet. The source will open under AGPL-3.0, free to run on your
            own server, and a hosted cloud comes after that. Neither has a date
            yet.
          </p>
        ),
        buildLine:
          "I set up the same workflow on your team's repositories, with your rules and your budget.",
        buildLinks: (
          <a
            href={OFFER}
            {...eventAttrs("cta", { place: "band", target: OFFER })}
            class={FACT_LINK}
          >
            See the Ongoing offer
          </a>
        ),
      }}
      more={["dotfiles", "seed", "financy"]}
    >
      <DefaultMiddle data={data} />
    </ToolFrame>
  )
})
