// The email field of `/api/subscribe` and `/api/lead` (#255).
import { isAddress } from "@spy4x/email/address";

/**
 * Returns the bare address a form's email field holds, trimmed, or `null` when
 * it holds anything else. `isAddress()` from `@spy4x/email` accepts only an
 * ASCII addr-spec such as `jane@example.com`: no display name, no `<`, `>` or
 * `"`, no control character and no lone surrogate. A value like
 * `"Verify at https://evil.example"<victim@example.com>` would otherwise reach
 * the welcome mail's `To:` line with the caller's words as its display name.
 */
export function bareAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const address = value.trim();
  return isAddress(address) ? address : null;
}
