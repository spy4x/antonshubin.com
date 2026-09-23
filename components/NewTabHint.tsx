/**
 * Screen-reader-only text noting that the link it sits inside opens in a new
 * tab — nothing about it is visible, so it never changes how a link looks.
 * Use inside a `target="_blank"` link that has no `aria-label` of its own;
 * a link with an `aria-label` should get the hint appended to that label
 * text instead, since `aria-label` replaces child content in the accessible
 * name computation and would make this span invisible to assistive tech.
 */
export function NewTabHint() {
  return <span class="sr-only">&nbsp;(opens in a new tab)</span>;
}
