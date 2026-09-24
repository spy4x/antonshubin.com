import { useState } from "preact/hooks";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState("");

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("done");
        setMsg("Subscribed!");
      } else {
        const err = await res.json();
        setStatus("error");
        setMsg(err.error || "Error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setMsg("Network error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <form
      class="flex flex-wrap items-stretch gap-2 w-full sm:w-auto"
      onSubmit={submit}
    >
      {status === "done"
        ? (
          <span class="px-3 py-2 bg-sage/15 text-sage text-sm font-medium rounded-lg">
            Subscribed! Check your inbox.
          </span>
        )
        : (
          <>
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
              class="flex-1 min-w-[200px] px-3 py-2 bg-ink border border-rule-strong rounded-lg text-parchment text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              class="px-4 py-2 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm"
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
  );
}
