import type { ComponentChildren, JSX } from "preact";
import { cn } from "@spy4x/preact-cn";
import { Button as LibraryButton } from "@spy4x/preact-ui/button";

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
 * The library variant each site variant draws with. The site's secondary
 * button is the library's `outline` (a control-coloured border), not its
 * `secondary` (a filled box).
 */
export const LIBRARY_VARIANT = {
  primary: "primary",
  secondary: "outline",
} as const;

/**
 * What the site changes on the library's button: Plex Sans ships no 500
 * weight, so semibold, and the radius the site's buttons always had.
 */
export const SITE_LOOK = "rounded-lg font-semibold font-sans";

export const SITE_VARIANT: Record<ButtonVariant, string> = {
  // A transparent border, so Book is the same size as an outline button beside it.
  primary: "border border-transparent",
  // The outline button sits on whatever surface is behind it, not on a Paper
  // fill. Its border names Rule strong directly (the same colour as the
  // library's control border token): test/frame.test.ts finds the
  // not-found page's buttons by that class.
  secondary: "bg-transparent border-rule-strong",
};

/**
 * Removes the library's `md` padding, gap and text size, so a call site's
 * own sizing decides. Only for the library `<Button>` below, whose `cn()`
 * keeps the caller's class of each group.
 */
export const SIZE_RESET = "gap-0 px-0 py-0 text-[length:inherit]";

/**
 * The class string the library's `buttonClasses()` gives each variant with
 * the site's look, written out. `buttonClass()` must not call the library:
 * its `cn()` brings tailwind-merge (about 28 KB) into every island that
 * imports `buttonClass`, such as the project gallery. No padding, gap or text
 * size here, so a call site's sizing never competes with a default.
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
 * The site's one button component (#184), over `@spy4x/preact-ui/button`.
 * `variant="primary"` is reserved for the booking action — never use it for
 * anything else, or the accent-is-only-for-Book contrast test fails. Renders
 * an `<a>` when `href` is given (the library's button is a `<button>` only),
 * the library's `<Button>` otherwise; everything else (text, click handlers)
 * passes through unchanged. A primary button also gets `data-primary-book`,
 * the marker `test/visual-system.browser.test.ts`'s accent-usage guard
 * looks for instead of guessing from text content or element shape.
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
    <LibraryButton
      variant={LIBRARY_VARIANT[variant]}
      class={cn(SITE_LOOK, SIZE_RESET, SITE_VARIANT[variant], className)}
      {...marker}
      {...(rest as Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class">)}
    >
      {children}
    </LibraryButton>
  );
}
