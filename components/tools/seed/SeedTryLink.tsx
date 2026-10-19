import { IconArrowUpRight } from "@spy4x/preact-icons";
import { FACT_LINK } from "../../FactCard.tsx";
import { NewTabHint } from "../../NewTabHint.tsx";
import { eventAttrs } from "../../../lib/analytics.ts";
import type { TryLink } from "./demo.ts";

/**
 * A quiet link from a "What you get" card into Seed's demo, in a new tab,
 * sending `outbound` with `place: card`. It sits inside the card's text
 * paragraph, so it is an inline element laid out as its own line.
 */
export function SeedTryLink({ link }: { link: TryLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener"
      data-seed-try={link.to}
      {...eventAttrs("outbound", { to: link.to, item: "seed", place: "card" })}
      class={`mt-3 flex w-fit items-center gap-1 text-sm ${FACT_LINK}`}
    >
      {link.label}
      <IconArrowUpRight class="size-4 shrink-0" />
      <NewTabHint />
    </a>
  );
}
