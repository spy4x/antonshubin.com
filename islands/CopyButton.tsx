import { useSignal } from "@preact/signals";
import { copyToClipboard } from "@spy4x/platform/browser/clipboard";
import { CheckIcon, CopyIcon } from "../components/Icons.tsx";
import type { EventAttrs } from "../lib/analytics.ts";

interface CopyButtonProps {
  elementId: string;
  /**
   * Visible text. Defaults to `title`, so what a visitor reads is what a
   * screen reader announces (#236).
   */
  label?: string;
  class?: string;
  title?: string;
  /** The Umami event the press records (`eventAttrs()`), if any. */
  analytics?: EventAttrs;
}

export default function CopyButton(
  { elementId, label, class: className, title, analytics }: CopyButtonProps,
) {
  const copied = useSignal(false);
  const failed = useSignal(false);

  const handleCopy = async () => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const txt = el.textContent?.trim() || "";
    if (!(await copyToClipboard(txt))) {
      failed.value = true;
      setTimeout(() => {
        failed.value = false;
      }, 3000);
      return;
    }
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 10000);
  };

  // One colour class at a time: a failure reads in Brick (error), everything else in Sage.
  const colorClass = failed.value
    ? "text-brick hover:text-brick"
    : "text-sage hover:text-sage";
  const baseClass =
    `inline-flex items-center min-h-6 gap-1 text-xs ${colorClass} transition-colors`;

  return (
    <button
      onClick={handleCopy}
      class={`${className || ""} ${baseClass}`.trim()}
      aria-live="polite"
      {...analytics}
      {...(title && !copied.value && !failed.value
        ? { title, "aria-label": title }
        : {})}
    >
      {copied.value
        ? (
          <>
            <CheckIcon class="w-3.5 h-3.5" /> Copied!
          </>
        )
        : failed.value
        ? <>Copy failed</>
        : (
          <>
            <CopyIcon class="w-3.5 h-3.5" /> {label ?? title ?? "Copy address"}
          </>
        )}
    </button>
  );
}
