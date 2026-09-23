import { useEffect } from "preact/hooks";

/**
 * Post-processes markdown-rendered `.blog-content` for two accessibility
 * gaps `dangerouslySetInnerHTML` leaves no JSX attribute to fix directly:
 *
 * - Checklist checkboxes: `marked` renders `- [ ] item` as
 *   `<li><input type="checkbox" disabled> item text</li>`, with the checkbox
 *   and its text as unrelated siblings — no `<label>`, no `aria-label`. Axe's
 *   "label" rule (WCAG 4.1.2) flags every one, disabled or not. Reads each
 *   checkbox's own list item text at mount and sets it as `aria-label`.
 * - Code blocks: a `<pre>` wider than its container scrolls horizontally but
 *   was never in the tab order, so a keyboard user could not reach that
 *   scrolled content at all. Axe's "scrollable-region-focusable" rule flags
 *   any such `<pre>` whose scroll width exceeds its own width; those get
 *   `tabindex="0"` so they can be scrolled with arrow keys once focused.
 */
export default function BlogContentA11y() {
  useEffect(() => {
    const blogContent = document.querySelector(".blog-content");
    if (!blogContent) return;

    const boxes = blogContent.querySelectorAll('li > input[type="checkbox"]');
    boxes.forEach((box) => {
      const text = box.parentElement?.textContent?.trim();
      if (text) box.setAttribute("aria-label", text);
    });

    const codeBlocks = blogContent.querySelectorAll("pre");
    codeBlocks.forEach((pre) => {
      if (pre.scrollWidth > pre.clientWidth) {
        pre.tabIndex = 0;
      }
    });
  }, []);

  return null;
}
