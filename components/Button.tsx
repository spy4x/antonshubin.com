import type { ComponentChildren } from "preact";
import {
  Button as LibraryButton,
  buttonClasses,
  type ButtonLinkProps as LibraryLinkProps,
  type ButtonProps as LibraryButtonProps,
} from "@spy4x/preact-ui/button";
import { join } from "@spy4x/preact-cn/join";

export type ButtonVariant = "primary" | "secondary";

/** What the site sets itself and never takes from a call site: the size. */
type SiteOwned = "variant" | "size" | "class" | "children";

interface SharedProps {
  variant?: ButtonVariant;
  class?: string;
  children: ComponentChildren;
}

type AnchorProps = SharedProps & Omit<LibraryLinkProps, SiteOwned>;

type ButtonProps =
  & SharedProps
  & { href?: undefined }
  & Omit<LibraryButtonProps, SiteOwned>;

/**
 * The `@spy4x/preact-ui/button` variant each site variant renders. The site's
 * secondary button is the library's `ghost` (a transparent box) with a border
 * added in `SITE_VARIANT`: the library's `outline` fills itself with Paper,
 * which the site's outline button never had.
 */
export const LIBRARY_VARIANT = {
  primary: "primary",
  secondary: "ghost",
} as const;

/**
 * What the site adds to the library's classes, per variant. Plex Sans, not
 * the inherited font; the radius the site's buttons always had, marked
 * important because the library appends a caller's classes after its own
 * `rounded-md` instead of merging them (no call site sets a radius of its
 * own). The library's `font-medium` already renders 600 here, since
 * `--font-weight-medium` is 600 (Plex Sans ships no 500). The size is the
 * library's `none`, so the call site's own padding, gap and text size decide.
 */
export const SITE_VARIANT: Record<ButtonVariant, string> = {
  // A transparent border, so Book is the same size as an outline button beside it.
  primary: "font-sans rounded-lg! border border-transparent",
  // Rule strong, the control border colour. test/frame.test.ts finds the
  // not-found page's buttons by this class.
  secondary: "font-sans rounded-lg! border border-rule-strong",
};

/**
 * The primary/secondary button classes as a plain string, for the call sites
 * that style their own `<a>`: a link that needs its own `data-*` markers and
 * `islands/ImageGallery.tsx`. `extra` adds the call site's sizing and layout,
 * appended plainly by the library's `join` (no tailwind-merge reaches an
 * island). `variant="primary"` is reserved for the Book action — see
 * `Button`'s own doc comment.
 */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  extra = "",
): string {
  return buttonClasses(
    LIBRARY_VARIANT[variant],
    "none",
    join(SITE_VARIANT[variant], extra),
  );
}

/**
 * The site's one button component (#184): `@spy4x/preact-ui/button`'s
 * `Button` with `size="none"`, the variant mapped by `LIBRARY_VARIANT` and the
 * site's look from `SITE_VARIANT`. `variant` defaults to `secondary`.
 * `variant="primary"` is reserved for the booking action — never use it for
 * anything else, or the accent-is-only-for-Book contrast test fails. Renders
 * an `<a>` when `href` is given and a `<button type="button">` otherwise.
 * A primary button also gets `data-primary-book`, the marker
 * `test/visual-system.browser.test.ts`'s accent-usage guard looks for
 * instead of guessing from text content or element shape.
 */
export default function Button(
  { variant = "secondary", class: className, href, ...rest }:
    | AnchorProps
    | ButtonProps,
) {
  const marker = variant === "primary" ? { "data-primary-book": true } : {};
  const look = {
    variant: LIBRARY_VARIANT[variant],
    size: "none" as const,
    class: join(SITE_VARIANT[variant], className),
  };
  if (href !== undefined) {
    return (
      <LibraryButton
        {...(rest as Omit<AnchorProps, "href" | keyof SharedProps>)}
        {...marker}
        {...look}
        href={href}
      />
    );
  }
  return (
    <LibraryButton
      {...(rest as Omit<ButtonProps, "href" | keyof SharedProps>)}
      {...marker}
      {...look}
    />
  );
}
