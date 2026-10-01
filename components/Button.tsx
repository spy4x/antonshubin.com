import type { ComponentChildren, JSX } from "preact";

export type ButtonVariant = "primary" | "secondary";

interface SharedProps {
  variant?: ButtonVariant;
  class?: string;
  children: ComponentChildren;
}

type AnchorProps =
  & SharedProps
  & { href: string }
  & Omit<
    JSX.HTMLAttributes<HTMLAnchorElement>,
    "class" | "href"
  >;

type ButtonProps =
  & SharedProps
  & { href?: undefined }
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    "class"
  >;

/**
 * The `@spy4x/preact-ui/button` variant each site variant copies. The site's
 * secondary button is the library's `outline` (a control-coloured border), not
 * its `secondary` (a filled box).
 */
export const LIBRARY_VARIANT = {
  primary: "primary",
  secondary: "outline",
} as const;

/** What the site adds to every button: Plex Sans, not the inherited font. */
export const SITE_LOOK = "font-sans";

/** The radius the site's buttons always had, and semibold: Plex Sans ships no 500. */
const SHAPE = "rounded-lg font-semibold";

/**
 * What the site puts in place of the classes in `SIZE_RESET`, per variant.
 */
export const SITE_VARIANT: Record<ButtonVariant, string> = {
  // A transparent border, so Book is the same size as an outline button beside it.
  primary: `${SHAPE} border border-transparent`,
  // The outline button sits on whatever surface is behind it, not on a Paper
  // fill. Its border names Rule strong directly (the same colour as the
  // library's control border token): test/frame.test.ts finds the
  // not-found page's buttons by that class.
  secondary: `${SHAPE} bg-transparent border-rule-strong`,
};

/**
 * The library button's classes the site leaves out: its `md` gap, padding
 * and text size, so a call site's own sizing decides, and the radius, weight,
 * fill and border that `SITE_VARIANT` replaces. Since 2.0.0 the library
 * appends a caller's classes instead of merging them, so leaving these out
 * is the only way to replace them without `!`, which would also beat a call
 * site's sizing.
 */
export const SIZE_RESET =
  "gap-2 px-3 py-2 text-sm rounded-md font-medium bg-surface border-control";

/**
 * The class string the library's `buttonClasses()` gives each variant, less
 * `SIZE_RESET`, plus the site's look, written out. Copied rather than
 * computed, so an island that imports `buttonClass`, such as the project
 * gallery, ships no library code. No padding, gap or text size here, so a
 * call site's sizing never competes with a default.
 * `test/library-classes.test.tsx` fails when this drifts from the library.
 * The library's `dark:` classes are left out: the site has no `.dark`.
 */
export const BUTTON_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-focus focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 bg-accent-900 text-accent-foreground hover:bg-accent-800 rounded-lg font-semibold font-sans border border-transparent",
  secondary:
    "inline-flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-focus focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 border text-foreground hover:bg-hover rounded-lg font-semibold font-sans bg-transparent border-rule-strong",
};

/**
 * The primary/secondary button classes as a plain string, for the call sites
 * that can't render a `<Button>` directly: `components/BookCallLink.tsx`
 * (it owns the `href`/`target`/empty-`url` behaviour `<Button href=…>`
 * doesn't), a few links and `islands/ImageGallery.tsx`. `extra` adds the
 * call site's sizing and layout, joined plainly (see `BUTTON_CLASSES`).
 * `variant="primary"` is reserved for the Book action — see `Button`'s own
 * doc comment.
 */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  extra = "",
): string {
  return [BUTTON_CLASSES[variant], extra].filter(Boolean).join(" ");
}

/**
 * The site's one button component (#184), drawn with the library button's
 * classes (`BUTTON_CLASSES`). `variant="primary"` is reserved for the booking
 * action — never use it for anything else, or the accent-is-only-for-Book
 * contrast test fails. Renders an `<a>` when `href` is given and a
 * `<button type="button">` otherwise, both with `buttonClass()`: the
 * library's `<Button>` appends a caller's classes since 2.0.0, so it cannot
 * leave out `SIZE_RESET`. Everything else (text, click handlers) passes
 * through unchanged. A primary button also gets `data-primary-book`, the
 * marker `test/visual-system.browser.test.ts`'s accent-usage guard looks for
 * instead of guessing from text content or element shape.
 */
export default function Button(
  { variant = "secondary", class: className, children, href, ...rest }:
    | AnchorProps
    | ButtonProps,
) {
  const marker = variant === "primary" ? { "data-primary-book": true } : {};
  if (href !== undefined) {
    return (
      <a
        href={href}
        class={buttonClass(variant, className)}
        {...marker}
        {...(rest as JSX.HTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      class={buttonClass(variant, className)}
      {...marker}
      {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
