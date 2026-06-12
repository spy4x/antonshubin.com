import { useState } from "preact/hooks";

interface Props {
  addressId: string;
}

export default function CopyButton({ addressId }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const el = document.getElementById(addressId);
    if (!el) return;
    try {
      await navigator.clipboard.writeText(el.textContent!.trim());
    } catch {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 10000);
  };

  return (
    <button
      onClick={handleClick}
      class="mt-2 text-xs text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-1"
    >
      {copied ? "✅ Copied!" : "📋 Copy address"}
    </button>
  );
}
