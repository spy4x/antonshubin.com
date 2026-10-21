// Shows the key a viewer should notice as a small keycap at the bottom of
// the recorded page, because a video shows no keyboard. It follows real
// keydown events (capture phase); `__demoKey(label)` shows a key the page
// never receives, such as the browser's own F5. Recording context only.
;(() => {
  if (globalThis !== globalThis.top) return
  const NAMES = { Escape: "Esc", " ": "Space" }
  const cap = document.createElement("div")
  cap.setAttribute("aria-hidden", "true")
  cap.style.cssText =
    "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);" +
    "z-index:2147483647;pointer-events:none;padding:8px 16px;border-radius:10px;" +
    "font:600 22px/1.2 ui-monospace,monospace;color:#efebe2;background:#25211d;" +
    "border:2px solid #857f79;box-shadow:0 3px 0 #413c38;opacity:0;transition:opacity 160ms"
  let timer = 0
  const show = (label) => {
    cap.textContent = label
    if (!cap.isConnected) {
      ;(document.body ?? document.documentElement).appendChild(cap)
    }
    cap.style.opacity = "1"
    clearTimeout(timer)
    timer = setTimeout(() => cap.style.opacity = "0", 900)
  }
  globalThis.__demoKey = show
  addEventListener("keydown", (e) => show(NAMES[e.key] ?? e.key), true)
})()
