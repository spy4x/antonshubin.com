import { useState } from "preact/hooks"
import { honeypotField } from "@spy4x/preact-ui/honeypot"
import { HONEYPOT_FIELD_NAME } from "@spy4x/platform/universal/honeypot"
import { track } from "../lib/analytics.ts"

/**
 * The site's focus ring, on the field and Subscribe alike (#645): Chromium's
 * default ring differs between an input and a button.
 */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-parchment"

/** The newsletter signup; a success counts as `newsletter-signup` (#274, #318). */
export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  )
  const [msg, setMsg] = useState("")

  const submit = async (e: Event) => {
    e.preventDefault()
    if (!email) return
    // Read before the first `await`: `currentTarget` is gone afterwards.
    const trap = (e.currentTarget as HTMLFormElement).elements.namedItem(
      HONEYPOT_FIELD_NAME,
    ) as HTMLInputElement | null
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The route refuses a body without the honeypot field (#733).
        body: JSON.stringify({
          email,
          [HONEYPOT_FIELD_NAME]: trap?.value ?? "",
        }),
      })
      if (res.ok) {
        setStatus("done")
        setMsg("Check your inbox to confirm.")
        track("newsletter-signup")
      } else {
        const err = await res.json()
        setStatus("error")
        setMsg(err.error || "Error")
        setTimeout(() => setStatus("idle"), 3000)
      }
    } catch {
      setStatus("error")
      setMsg("Network error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <form
      class="flex flex-wrap items-stretch gap-2 w-full sm:w-auto"
      onSubmit={submit}
    >
      {status === "done"
        ? (
          <span class="px-3 py-2 bg-sage/15 text-sage text-sm font-medium rounded-lg">
            Check your inbox to confirm your address.
          </span>
        )
        : (
          <>
            {honeypotField()}
            <input
              type="email"
              required
              placeholder="you@example.com"
              aria-label="Email address"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              aria-invalid={status === "error" ? "true" : undefined}
              aria-describedby={status === "error"
                ? "newsletter-form-error"
                : undefined}
              class={`flex-1 min-w-[200px] px-3 py-2 bg-ink border border-rule-strong rounded-lg text-parchment text-sm placeholder-graphite focus:border-parchment ${FOCUS_RING}`}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              class={`px-4 py-2 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm ${FOCUS_RING}`}
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
            {status === "error" && (
              <p
                id="newsletter-form-error"
                role="alert"
                class="w-full text-brick text-xs mt-1"
              >
                {msg}
              </p>
            )}
          </>
        )}
    </form>
  )
}
