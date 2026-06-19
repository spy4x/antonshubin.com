import { useEffect, useState } from "preact/hooks";

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

    // When a new SW takes over, reload the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      globalThis.location.reload();
    });
  }, []);

  const reload = () => {
    reg?.waiting?.postMessage({ action: "skipWaiting" });
  };

  if (!available) {
    return null;
  }
  return (
    <div class="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-orange-600 px-4 py-3 text-white shadow-lg sm:top-4 sm:left-auto sm:right-4 sm:w-auto sm:rounded-lg">
      <span class="text-sm">New version available</span>
      <button
        type="button"
        onClick={reload}
        class="ml-auto sm:ml-0 cursor-pointer rounded bg-white px-3 py-1 text-sm font-semibold text-orange-600 hover:bg-orange-100"
      >
        Reload
      </button>
    </div>
  );
}
