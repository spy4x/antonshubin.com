import type { ComponentChildren, JSX } from "preact";
import { cn } from "@spy4x/preact-cn";
import {
  Button as LibraryButton,
  buttonClasses,
} from "@spy4x/preact-ui/button";

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
 * button is the library's `outline` (a `border-control` border), not its
 * `secondary` (a filled `bg-hover` box).
 */
const LIBRARY_VARIANT = {
  primary: "primary",
  secondary: "outline",
} as const;

/**
 * What the site changes on the library's button. Plex Sans ships no 500
 * weight, so `font-semibold`; `rounded-lg`, as before; and no padding, gap or
 * text size of its own (`px-0 py-0 gap-0`, and a font size inherited from
 * the parent instead of the `md` size's `text-sm`): every call site passes
 * its own through `extra`. `cn()` (tailwind-merge) keeps the last class of
 * each group, so a caller's `px-6` replaces `px-0` in the class attribute
 * itself instead of competing with it in the stylesheet.
 */
const SITE =
  "rounded-lg font-semibold font-sans gap-0 px-0 py-0 text-[length:inherit]";

const SITE_VARIANT: Record<ButtonVariant, string> = {
  // A transparent border, so Book is the same size as an outline button beside it.
  primary: "border border-transparent",
  // The outline button sits on whatever surface is behind it, not on a Paper
  // fill. Its border names Rule strong directly (the same colour as the
  // library's `border-control` token): test/frame.test.ts finds the
  // not-found page's buttons by that class.
  secondary: "bg-transparent border-rule-strong",
};

/**
 * The primary/secondary button classes as a plain string, for the call sites
 * that can't render a `<Button>` directly: `components/BookCallLink.tsx`
 * (it owns the `href`/`target`/empty-`url` behaviour `<Button href=…>`
 * doesn't) and a few links and islands. Built by `@spy4x/preact-ui/button`'s
 * `buttonClasses()`, coloured by the theme tokens in `assets/styles.css`.
 * `extra` adds the call site's sizing and layout and wins over the defaults.
 * `variant="primary"` is reserved for the Book action — see `Button`'s own
 * doc comment.
 */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  extra = "",
): string {
  return buttonClasses(
    LIBRARY_VARIANT[variant],
    "md",
    cn(SITE, SITE_VARIANT[variant], extra),
  );
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
      class={cn(SITE, SITE_VARIANT[variant], className)}
      {...marker}
      {...(rest as Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class">)}
    >
      {children}
    </LibraryButton>
  );
}
