import { useSignal } from "@preact/signals";
import { NavGlyph } from "../components/Icons.tsx";
import { FOCUS, LinkGroups, STACKED, STATES } from "../components/NavParts.tsx";

/**
 * The desktop rail's Links button and its native `popover` (#185). The
 * popover opens without JS; its groups render the first time it opens, so
 * they are not in the server HTML of every page, where their bytes competed
 * with the home page's LCP image on a slow connection (see
 * components/Nav.tsx).
 */
export default function NavLinks() {
  const shown = useSignal(false);
  return (
    <>
      <button
        type="button"
        popovertarget="nav-links"
        class={`${STACKED} ${STATES} ${FOCUS} rounded-xl px-1 py-2`}
      >
        <NavGlyph name="links" />
        <span>Links</span>
      </button>
      <div
        id="nav-links"
        popover
        // Before it shows, so it never paints empty.
        onBeforeToggle={(e) => {
          if (e.newState === "open") shown.value = true;
        }}
        class="m-0 top-auto right-auto bottom-3 left-20 lg:left-24 w-64 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl border border-rule bg-lamp p-2 text-parchment shadow-lg"
      >
        {shown.value && <LinkGroups idPrefix="rail-links" />}
      </div>
    </>
  );
}
