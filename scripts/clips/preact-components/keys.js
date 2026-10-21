// Draws the keys a recorded demo presses in a small pill at the bottom right,
// so a viewer can follow the keyboard part of the clip. Load it with
// `context.addInitScript({ path })` on the recording context only. It listens
// in the capture phase and changes nothing the page sees.
(() => {
  if (globalThis !== globalThis.top) return;
  const NAMES = {
    ArrowDown: "↓",
    ArrowUp: "↑",
    ArrowLeft: "←",
    ArrowRight: "→",
    Enter: "Enter ⏎",
    Escape: "Esc",
    Tab: "Tab",
    " ": "Space",
  };
  const pill = document.createElement("div");
  pill.setAttribute("aria-hidden", "true");
  pill.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483645;" +
    "pointer-events:none;display:flex;gap:8px;align-items:center;padding:10px 14px;" +
    "border-radius:12px;background:#15120f;border:2px solid #857f79;color:#efebe2;" +
    "font:600 18px/1 ui-monospace,SFMono-Regular,Menlo,monospace;opacity:0;" +
    "transition:opacity 160ms ease-out;box-shadow:0 6px 24px rgba(0,0,0,.5)";
  const mount = () => {
    if (!pill.isConnected) {
      (document.body ?? document.documentElement)?.appendChild(pill);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  }
  mount();
  let typed = "";
  let timer = 0;
  const keyCap = (label) => {
    const k = document.createElement("span");
    k.textContent = label;
    k.style.cssText = "padding:6px 10px;border-radius:8px;background:#2f2a26;" +
      "border:1px solid #857f79;min-width:1.4em;text-align:center";
    return k;
  };
  addEventListener("keydown", (e) => {
    if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
    mount();
    const single = e.key.length === 1 && e.key !== " " && e.key !== "/";
    if (single) {
      typed += e.key;
      if (pill.lastChild?.dataset?.typed) pill.lastChild.textContent = typed;
      else {
        const k = keyCap(typed);
        k.dataset.typed = "1";
        pill.appendChild(k);
      }
    } else {
      typed = "";
      pill.appendChild(keyCap(NAMES[e.key] ?? e.key));
    }
    while (pill.childNodes.length > 4) pill.firstChild.remove();
    pill.style.opacity = "1";
    clearTimeout(timer);
    timer = setTimeout(() => {
      pill.style.opacity = "0";
      setTimeout(() => {
        if (pill.style.opacity === "0") pill.replaceChildren();
        typed = "";
      }, 200);
    }, 1300);
  }, true);
})();
