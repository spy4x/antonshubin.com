/**
 * Keeps Fresh from marking the rail's links to `/` as the current section on
 * every page (#433).
 *
 * Fresh's renderer gives every `<a>` with no `aria-current` its own value,
 * and it counts `/` as the section of every path, so the portrait and the
 * More sheet's Home row would read `aria-current="true"` on every page. The
 * library `Rail` leaves `aria-current` unset on an entry that is not current,
 * and its types allow only `"page"` or `"true"`, so this Preact vnode hook
 * sets `"false"` on a rail entry (`data-e2e="rail-shell-entry"`) to `/` that
 * the `Rail` left unset. Fresh's renderer skips a link whose `aria-current`
 * is set. It runs before Fresh's own hook, so `main.ts` imports this module
 * after `fresh`.
 */
import { options, type VNode } from "preact";

const previous = options.vnode;

options.vnode = (vnode: VNode) => {
  if (vnode.type === "a") {
    const props = vnode.props as Record<string, unknown>;
    if (
      props.href === "/" &&
      props["data-e2e"] === "rail-shell-entry" &&
      props["aria-current"] === undefined
    ) {
      props["aria-current"] = "false";
    }
  }
  previous?.(vnode);
};
