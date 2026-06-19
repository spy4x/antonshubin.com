import { useSignal } from "@preact/signals";

interface CopyButtonProps {
  elementId: string;
  label?: string;
  class?: string;
  title?: string;
}

export default function CopyButton(
  { elementId, label = "📋 Copy address", class: className, title }:
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
    "text-xs text-green-400 hover:text-green-300 transition-colors";

  return (
    <button
      onClick={handleCopy}
      class={`${className || ""} ${baseClass}`.trim()}
      {...(title ? { title } : {})}
    >
      {copied.value ? "✅ Copied!" : label}
    </button>
  );
}
