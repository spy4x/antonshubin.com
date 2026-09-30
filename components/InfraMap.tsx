import { Fragment } from "preact";
import { NewTabHint } from "./NewTabHint.tsx";
import { linkEvent } from "../lib/analytics.ts";
import {
  type InfraLane,
  infraLanes,
  infraNode,
  laneConnections,
} from "../lib/infrastructure.ts";

const LINK =
  "text-parchment underline underline-offset-4 hover:text-accent focus-visible:text-accent";

/**
 * A connector's arrow, drawn in CSS and one triangle, never read aloud: the
 * verb beside it says the same in words. It points the way the arrow runs,
 * down or up below 1024px and right or left from it. The reversed flex
 * direction puts the head first for a backward arrow.
 */
function Arrow({ forward }: { forward: boolean }) {
  return (
    <span
      aria-hidden="true"
      class={`flex items-center ${
        forward
          ? "flex-col lg:flex-row"
          : "flex-col-reverse lg:flex-row-reverse"
      }`}
    >
      <span class="block w-0.5 h-3 lg:w-12 lg:h-0.5 bg-rule-strong" />
      <svg
        viewBox="0 0 10 10"
        class={`w-2.5 h-2.5 -m-px fill-rule-strong ${
          forward ? "lg:-rotate-90" : "rotate-180 lg:rotate-90"
        }`}
      >
        <path d="M0 0h10L5 10z" />
      </svg>
    </span>
  );
}

/** One lane: a chain of linked boxes joined by labelled arrows, all in one piece of markup. */
function Lane({ lane }: { lane: InfraLane }) {
  const links = laneConnections(lane);
  return (
    <li
      data-infra-lane={lane.id}
      class="bg-desk border border-rule rounded-xl p-3 sm:p-5"
    >
      <h3 class="text-base sm:text-lg text-parchment mb-2 sm:mb-3">
        {lane.title}
      </h3>
      <ol class="flex flex-col lg:flex-row lg:items-stretch lg:justify-start">
        {lane.nodes.map((id, i) => {
          const n = infraNode(id);
          const link = links[i - 1];
          return (
            <Fragment key={n.id}>
              {link && (
                <li
                  key={`${link.edge.from}-${link.edge.to}`}
                  data-infra-edge={`${link.edge.from}-${link.edge.to}`}
                  class="flex flex-row lg:flex-col items-center justify-center gap-2 lg:gap-1 py-0 lg:py-0 lg:px-3 lg:w-28 lg:shrink-0 text-xs text-graphite"
                >
                  <Arrow forward={link.forward} />
                  <span class="font-semibold text-graphite">
                    {link.edge.verb}
                  </span>
                </li>
              )}
              <li
                data-infra-node={n.id}
                class="relative bg-paper border border-rule rounded-lg px-3 py-1.5 lg:px-4 lg:py-3 lg:w-52 lg:shrink-0"
              >
                <a
                  href={n.href}
                  {...(n.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  {...linkEvent(n.href, { to: n.id })}
                  class={`${LINK} font-semibold break-words after:absolute after:inset-0`}
                >
                  {n.label}
                  {n.external && <NewTabHint />}
                </a>
                <p class="text-xs text-graphite">{n.job}</p>
              </li>
            </Fragment>
          );
        })}
      </ol>
      {lane.post && (
        <p class="mt-2 text-sm">
          <a href={lane.post.href} class={LINK}>{lane.post.label}</a>
        </p>
      )}
    </li>
  );
}

/**
 * The map of `/infrastructure` (#344): the lanes of `lib/infrastructure.ts`
 * drawn as HTML. Every box is a real link, every connector carries its verb
 * as visible text and a decorative arrow. No script, no image.
 */
export function InfraMap() {
  return (
    <ul class="grid gap-3 sm:gap-4">
      {infraLanes.map((lane) => <Lane key={lane.id} lane={lane} />)}
    </ul>
  );
}
