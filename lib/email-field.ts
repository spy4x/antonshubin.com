// The email field of `/api/subscribe` and `/api/lead` (#255).
import { isAddress } from "@spy4x/email/address";

/** RFC 5321's limits: a path of 256 octets less its angle brackets, and a
 * local part of 64. `isAddress()` checks the shape only, not the length. */
const MAX_ADDRESS_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;

/**
 * Returns the bare address a form's email field holds, trimmed, or `null` when
 * it holds anything else. `isAddress()` from `@spy4x/email` accepts only an
 * ASCII addr-spec such as `jane@example.com`: no display name, no `<`, `>` or
 * `"`, no control character and no lone surrogate. A value like
 * `"Verify at https://evil.example"<victim@example.com>` would otherwise reach
 * the welcome mail's `To:` line with the caller's words as its display name.
 * An address over 254 characters, or with a local part over 64, is refused
 * too: no relay delivers it, and it would only grow the subscriber file.
 */
export function bareAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const address = value.trim();
  if (address.length > MAX_ADDRESS_LENGTH) return null;
  if (address.indexOf("@") > MAX_LOCAL_PART_LENGTH) return null;
  return isAddress(address) ? address : null;
}
