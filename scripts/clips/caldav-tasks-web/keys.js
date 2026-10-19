// Shows each key press that is not plain typing as a small key cap at the
// bottom of the page, for a recorded demo: a viewer cannot see the keyboard.
// Load it with `context.addInitScript({ path })` on the recording context only.
(() => {
  if (globalThis !== globalThis.top) return;
  const NAMES = {
    " ": `Space`,
    ArrowUp: `↑`,
    ArrowDown: `↓`,
    ArrowLeft: `←`,
    ArrowRight: `→`,
    Escape: `Esc`,
    Enter: `Enter`,
  };
  const cap = document.createElement(`div`);
  cap.setAttribute(`aria-hidden`, `true`);
  // A manual popover sits in the top layer, so it stays above a modal <dialog>.
  cap.popover = `manual`;
  cap.style.cssText =
    `inset:auto;margin:0;position:fixed;left:50%;bottom:36px;transform:translateX(-50%);` +
    `pointer-events:none;z-index:2147483646;padding:10px 22px;border-radius:12px;` +
    `background:#2a2622;color:#f3ead8;border:2px solid #5a524a;` +
    `font:600 28px/1 ui-monospace,monospace;box-shadow:0 4px 18px rgba(0,0,0,.6);` +
    `opacity:0;transition:opacity 120ms ease-out`;
  let timer = 0;
  // Raised again whenever a dialog opens over it, as the key may have opened one.
  let modals = -1;
  const raise = () => {
    if (!cap.isConnected) return;
    if (cap.matches(`:popover-open`)) cap.hidePopover();
    cap.showPopover();
    modals = document.querySelectorAll(`:modal`).length;
  };
  setInterval(() => {
    if (
      cap.isConnected && document.querySelectorAll(`:modal`).length !== modals
    ) raise();
  }, 50);
  // A letter typed into a text field is typing, not a shortcut. A checkbox is no text field.
  const FIELD =
    `textarea, input:not([type=checkbox], [type=radio], [type=button], [type=submit])`;
  const typing = (target, key) =>
    key.length === 1 && target instanceof HTMLElement &&
    (target.isContentEditable || target.matches(FIELD));
  addEventListener(`keydown`, (event) => {
    if (event.key === `Shift` || typing(event.target, event.key)) return;
    if (event.key.length > 1 && !(event.key in NAMES)) return;
    if (!cap.isConnected) document.documentElement?.appendChild(cap);
    raise();
    cap.textContent = NAMES[event.key] ?? event.key;
    cap.style.opacity = `1`;
    clearTimeout(timer);
    timer = setTimeout(() => (cap.style.opacity = `0`), 900);
  }, true);
})();
