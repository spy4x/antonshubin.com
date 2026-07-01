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
          <span class="px-3 py-2 bg-green-600/20 text-green-400 text-sm font-medium rounded-lg">
            Subscribed! Check your inbox.
          </span>
        )
        : (
          <>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              class="flex-1 min-w-[200px] px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              class="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
            {status === "error" && (
              <p class="w-full text-red-400 text-xs mt-1">{msg}</p>
            )}
          </>
        )}
    </form>
  );
}
