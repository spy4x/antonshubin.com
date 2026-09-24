import { useSignal } from "@preact/signals";
import { CheckIcon, CopyIcon } from "../components/Icons.tsx";

interface CopyButtonProps {
  elementId: string;
  label?: string;
  class?: string;
  title?: string;
}

export default function CopyButton(
  { elementId, label = "Copy address", class: className, title }:
    CopyButtonProps,
) {
  const copied = useSignal(false);

  const handleCopy = () => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const txt = el.textContent?.trim() || "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt);
    } else {
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 10000);
  };

  const baseClass =
    "inline-flex items-center gap-1 text-xs text-sage hover:text-sage transition-colors";

  return (
    <button
      onClick={handleCopy}
      class={`${className || ""} ${baseClass}`.trim()}
      aria-live="polite"
      {...(title && !copied.value ? { title, "aria-label": title } : {})}
    >
      {copied.value
        ? (
          <>
            <CheckIcon class="w-3.5 h-3.5" /> Copied!
          </>
        )
        : (
          <>
            <CopyIcon class="w-3.5 h-3.5" /> {label}
          </>
        )}
    </button>
  );
}
