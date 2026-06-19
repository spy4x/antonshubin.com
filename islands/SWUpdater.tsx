import { useEffect, useState } from "preact/hooks";

export default function SWUpdater() {
  const [available, setAvailable] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof globalThis === "undefined" || !("serviceWorker" in navigator)) {
      console.log("[SW] no serviceWorker support");
      return;
    }

    console.log("[SW] registering...");

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      console.log("[SW] registered", {
        scope: registration.scope,
        state: registration.active?.state,
        waiting: !!registration.waiting,
        installing: !!registration.installing,
      });

      setReg(registration);

      if (registration.waiting) {
        console.log("[SW] update already waiting, showing banner");
        setAvailable(true);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) {
          console.log("[SW] updatefound but no installing worker");
          return;
        }
        console.log("[SW] updatefound, installing state:", installing.state);

        installing.addEventListener("statechange", () => {
          console.log("[SW] installing state:", installing.state);
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[SW] new version installed and ready, showing banner");
            setAvailable(true);
          }
        });
      });
    }).catch((err) => {
      console.log("[SW] registration failed:", err);
    });

    // When a new SW takes over, reload the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[SW] controller changed, reloading");
      globalThis.location.reload();
    });
  }, []);

  const reload = () => {
    console.log("[SW] user clicked reload, posting skipWaiting");
    reg?.waiting?.postMessage({ action: "skipWaiting" });
  };

  if (!available) {
    console.log("[SW] no update available, not rendering banner");
    return null;
  }

  console.log("[SW] rendering banner");
  return (
    <div class="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-orange-600 px-4 py-3 text-white shadow-lg sm:top-4 sm:left-auto sm:right-4 sm:w-auto sm:rounded-lg">
      <span class="text-sm">New version available</span>
      <button
        onClick={reload}
        class="ml-auto sm:ml-0 cursor-pointer rounded bg-white px-3 py-1 text-sm font-semibold text-orange-600 hover:bg-orange-100"
      >
        Reload
      </button>
    </div>
  );
}
