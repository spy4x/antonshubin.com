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

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-base font-medium font-sans transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const VARIANTS: Record<ButtonVariant, string> = {
  // The one filled-accent action on the site: Book. Never any other button.
  primary: "bg-accent text-ink border border-transparent hover:bg-accent-hover",
  // Every other action: an outline button on the surrounding surface.
  secondary:
    "bg-transparent text-parchment border border-rule-strong hover:bg-lamp",
};

/**
 * The site's one button component (#184). `variant="primary"` is reserved
 * for the booking action — never use it for anything else, or the
 * accent-is-only-for-Book contrast test fails. Renders an `<a>` when `href`
 * is given, a `<button>` otherwise; everything else (text, click handlers)
 * passes through unchanged.
 */
export default function Button(
  { variant = "secondary", class: className, children, href, ...rest }:
    | AnchorProps
    | ButtonProps,
) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className ?? ""}`.trim();
  if (href !== undefined) {
    return (
      <a
        href={href}
        class={cls}
        {...(rest as JSX.HTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      class={cls}
      {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
