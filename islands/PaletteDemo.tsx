import type { ComponentChildren, ComponentType } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import type { PaletteDemoProps } from "../components/tools/preact-components/PaletteDemoLive.tsx"

/**
 * The palette demo's island on /tools/preact-components (#522), kept small so
 * it does not compete with the hero poster, the page's largest paint. It
 * shows `ssr`, the demo as the server rendered it (controls disabled), and
 * swaps in the live demo from a chunk of its own once the page has loaded and
 * the browser is idle, or at once when a pointer or focus comes near.
 */
export default function PaletteDemo(
  { ssr, ...props }: PaletteDemoProps & { ssr: ComponentChildren },
) {
  const [Live, setLive] = useState<ComponentType<PaletteDemoProps> | null>(
    null,
  )
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let started = false
    const load = () => {
      if (started) return
      started = true
      // The demo's stylesheet comes with it, so no other page carries its rules.
      Promise.all([
        import("../components/tools/preact-components/PaletteDemoLive.tsx"),
        import("../assets/palette-demo.css"),
      ]).then(([m]) => setLive(() => m.PaletteDemoLive))
        // A failed load leaves the disabled demo; the next approach retries.
        .catch(() => started = false)
    }
    const idle = () =>
      "requestIdleCallback" in globalThis
        ? requestIdleCallback(load, { timeout: 2000 })
        : setTimeout(load, 200)
    if (document.readyState === "complete") idle()
    else addEventListener("load", idle, { once: true })
    const el = root.current
    el?.addEventListener("pointerenter", load)
    el?.addEventListener("focusin", load)
    return () => {
      removeEventListener("load", idle)
      el?.removeEventListener("pointerenter", load)
      el?.removeEventListener("focusin", load)
    }
  }, [])

  return (
    <div ref={root} class="contents">
      {Live ? <Live {...props} /> : ssr}
    </div>
  )
}
