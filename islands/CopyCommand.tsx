import { CopyButton } from "@spy4x/preact-ui/copy-button";
import type { EventAttrs } from "../lib/analytics.ts";

/**
 * The copy button beside a tool page's quick-start command (#448): the
 * library's `CopyButton`, which confirms and announces the copy itself. The
 * command's box is server markup around this island.
 *
 * Not the library's `CopyBlock`: that module imports `cn()` (tailwind-merge),
 * and an island ships what it imports, which `test/library-classes.test.tsx`
 * forbids. `CopyButton` composes its classes with `join`.
 */
export default function CopyCommand(
  { text, analytics }: {
    /** The command, copied as written. */
    text: string;
    /** The Umami event a press records (`eventAttrs()`). */
    analytics?: EventAttrs;
  },
) {
  return (
    <CopyButton
      textToCopy={text}
      title="Copy"
      copyLabel="Copy the command"
      class="shrink-0"
      {...analytics}
    />
  );
}
