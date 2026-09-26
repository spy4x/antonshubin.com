import { useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";
import { NavGlyph } from "../components/Icons.tsx";
import {
  FOCUS,
  LinkGroups,
  navIcon,
  STACKED,
  STATES,
} from "../components/NavParts.tsx";
import { moreItems, navCurrent } from "../lib/nav.ts";

/**
 * The phone tab bar's More button and its `<dialog>` (#185): Home, How I
 * work, Writing, Infrastructure and the Links groups. Escape, the Close
 * button or a tap on the backdrop closes it, and focus returns to More.
 */
export default function NavMore(
  { currentPath, upworkUrl }: { currentPath: string; upworkUrl: string },
) {
  const isMoreOpen = useSignal(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // This island hydrates, and hydration drops every attribute its own vnode
  // lacks, so it sets `aria-current` on its links itself rather than leaving
  // it to Fresh's server renderer. In the browser it reads the real URL;
  // `currentPath` is only the section on some pages (e.g. "/catalog" on a
  // catalog item).
  const path = typeof location === "undefined"
    ? currentPath
    : location.pathname;
  const moreHoldsCurrent = moreItems.some((item) =>
    item.href !== "/" && navCurrent(path, item.href) !== "false"
  );

  const openMore = () => {
    dialogRef.current?.showModal();
    isMoreOpen.value = true;
  };

  const closeMore = () => dialogRef.current?.close();

  // Runs however the dialog closed — Escape, the Close button or a tap on
  // the backdrop — so focus always lands back on More.
  const onDialogClose = () => {
    isMoreOpen.value = false;
    moreButtonRef.current?.focus();
  };

  return (
    <>
      <button
        ref={moreButtonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isMoreOpen.value}
        aria-controls="mobile-menu"
        data-section-current={moreHoldsCurrent || undefined}
        class={`${STACKED} ${STATES} ${FOCUS} w-full h-14 rounded-xl px-1`}
        onClick={openMore}
      >
        <NavGlyph name="more" />
        <span>More</span>
      </button>
      {/* Phone "More" sheet */}
      <dialog
        id="mobile-menu"
        ref={dialogRef}
        aria-labelledby="mobile-menu-title"
        class="m-0 mt-auto w-full max-w-full max-h-[85dvh] rounded-t-2xl border-t border-rule bg-lamp p-0 text-parchment backdrop:bg-ink/70"
        onClose={onDialogClose}
        onClick={(e) => {
          // A click whose target is the <dialog> itself landed on the
          // backdrop: the inner panel covers the whole dialog box.
          if (e.target === dialogRef.current) closeMore();
        }}
      >
        <div class="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div class="flex items-center justify-between pb-2">
            <h2 id="mobile-menu-title" class="px-3 text-lg">More</h2>
            <button
              type="button"
              aria-label="Close"
              class={`rounded-lg p-2 text-graphite hover:bg-paper hover:text-parchment ${FOCUS}`}
              onClick={closeMore}
            >
              <NavGlyph name="close" />
            </button>
          </div>
          {
            /* Rendered only while open: nothing below is in the server
              HTML, which keeps it from competing with the home page's LCP
              image (see components/Nav.tsx). */
          }
          {isMoreOpen.value && (
            <>
              <ul class="space-y-1 pb-4 mb-3 border-b border-rule">
                {moreItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={navCurrent(path, item.href)}
                      class={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${STATES} ${FOCUS}`}
                    >
                      {navIcon(item.icon)}
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <LinkGroups idPrefix="more-links" upworkUrl={upworkUrl} />
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
