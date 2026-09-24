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

// No padding, gap or text size here on purpose: two Tailwind utility classes
// for the same property (e.g. this class string's own `px-6` and a caller's
// `px-8`) don't reliably resolve by source order in the class *attribute* —
// Tailwind v4 emits each utility once, in the order it first saw that class
// across the whole scanned codebase, so whichever of `px-6`/`px-8` Tailwind
// happens to emit later in the compiled stylesheet wins, not whichever comes
// later in a given element's `class="..."` string. Every call site supplies
// its own sizing via `extra`/`class` instead of fighting a default here.
const BASE =
  "inline-flex items-center rounded-lg font-medium font-sans transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const VARIANTS: Record<ButtonVariant, string> = {
  // The one filled-accent action on the site: Book. Never any other button.
  primary: "bg-accent text-ink border border-transparent hover:bg-accent-hover",
  // Every other action: an outline button on the surrounding surface.
  secondary:
    "bg-transparent text-parchment border border-rule-strong hover:bg-lamp",
};

/**
 * The primary/secondary button classes as a plain string, for the several
 * call sites that can't render a `<Button>` directly — `components/
 * BookCallLink.tsx`'s callers (it owns the `href`/`target`/empty-`url`
 * behaviour `<Button href=…>` doesn't) and `islands/MeetEmbed.tsx`'s
 * click-to-load facade (a `<button>` that swaps itself for an `<iframe>`,
 * outside Fresh's server-rendered tree). `extra` appends page-specific
 * layout classes (icon gaps, one-off sizes) the shared class string doesn't
 * cover. `variant="primary"` is reserved for the Book action — see
 * `Button`'s own doc comment.
 */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  extra = "",
): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

/**
 * The site's one button component (#184). `variant="primary"` is reserved
 * for the booking action — never use it for anything else, or the
 * accent-is-only-for-Book contrast test fails. Renders an `<a>` when `href`
 * is given, a `<button>` otherwise; everything else (text, click handlers)
 * passes through unchanged. A primary button also gets `data-primary-book`,
 * the marker `test/visual-system.browser.test.ts`'s accent-usage guard
 * looks for instead of guessing from text content or element shape.
 */
export default function Button(
  { variant = "secondary", class: className, children, href, ...rest }:
    | AnchorProps
    | ButtonProps,
) {
  const cls = buttonClass(variant, className);
  const marker = variant === "primary" ? { "data-primary-book": true } : {};
  if (href !== undefined) {
    return (
      <a
        href={href}
        class={cls}
        {...marker}
        {...(rest as JSX.HTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      class={cls}
      {...marker}
      {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
