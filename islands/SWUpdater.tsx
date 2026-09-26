import { useEffect, useState } from "preact/hooks";
import Button from "../components/Button.tsx";

export default function SWUpdater() {
  const [available, setAvailable] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof globalThis === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      setReg(registration);

      if (registration.waiting) {
        setAvailable(true);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setAvailable(true);
          }
        });
      });
    }).catch((err) => {
      console.error("[SW] registration failed:", err);
    });

    // Reload only when a new worker replaces one that already controlled the
    // page, which is the update the button asks for. On a first visit no
    // worker controls the page, and the first one taking control is no
    // update: reloading then drops whatever the visitor opened (#259).
    let controlled = navigator.serviceWorker.controller !== null;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (controlled) {
        globalThis.location.reload();
        return;
      }
      controlled = true;
    });
  }, []);

  const reload = () => {
    reg?.waiting?.postMessage({ action: "skipWaiting" });
  };

  if (!available) {
    return null;
  }
  return (
    <div class="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-paper border border-rule px-4 py-3 text-parchment shadow-lg sm:top-4 sm:left-auto sm:right-4 sm:w-auto sm:rounded-lg">
      <span class="text-sm">New version available</span>
      <Button
        type="button"
        onClick={reload}
        class="ml-auto sm:ml-0 px-3 py-1 text-sm"
      >
        Reload
      </Button>
    </div>
  );
}
