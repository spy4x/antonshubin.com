import { useSignal } from "@preact/signals";

interface FormState {
  name: string;
  email: string;
  techStack: string;
}

type SubmitStatus =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success" }
  | { type: "error"; message: string };

function validate(form: FormState): string | null {
  if (!form.name.trim()) return "Name is required";
  if (!form.email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return "Please enter a valid email";
  }
  if (!form.techStack.trim()) return "Describe your tech stack or idea";
  return null;
}

export default function LeadForm({ scheduleUrl }: { scheduleUrl: string }) {
  const name = useSignal("");
  const email = useSignal("");
  const techStack = useSignal("");
  const status = useSignal<SubmitStatus>({ type: "idle" });

  // Set page-load timestamp on mount
  const pageLoad = useSignal(Date.now());

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form: FormState = {
      name: name.value,
      email: email.value,
      techStack: techStack.value,
    };
    const error = validate(form);
    if (error) {
      status.value = { type: "error", message: error };
      return;
    }
    status.value = { type: "submitting" };
    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          _t: pageLoad.value,
          _website: "",
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.error || "Something went wrong. Try again.");
      }
      status.value = { type: "success" };
    } catch (err) {
      status.value = {
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      };
    }
  };

  const isSuccess = status.value.type === "success";

  return (
    <div class="bg-gray-800 rounded-xl border border-orange-500/40 p-4 sm:p-6 relative overflow-hidden">
      {/* Form section */}
      <div
        class="transition-all duration-500 ease-in-out"
        style={{
          opacity: isSuccess ? 0 : 1,
          transform: isSuccess ? "translateY(-12px)" : "translateY(0)",
          maxHeight: isSuccess ? "0px" : "800px",
          overflow: "hidden",
        }}
      >
        <div class="text-3xl mb-4 text-center">🔍</div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3 text-center">
          Not sure where to start?
        </h2>
        <p class="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-6 text-center">
          Send me your current tech stack or idea — I'll send back 3 concrete
          architectural improvements within 48 hours.
          <span class="text-orange-400 font-semibold block sm:inline">
            {" "}No cost.
          </span>{" "}
          <span class="text-orange-400 font-semibold block sm:inline">
            No commitment.
          </span>
        </p>

        <form onSubmit={handleSubmit} class="max-w-lg mx-auto space-y-4">
          {/* Honeypot — off-screen so bots fill it, humans never see */}
          <div class="absolute -left-[9999px]" aria-hidden="true">
            <label for="lead-website">Website</label>
            <input
              id="lead-website"
              name="_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value=""
            />
          </div>

          <div>
            <label for="lead-name" class="sr-only">Your name</label>
            <input
              id="lead-name"
              type="text"
              placeholder="Your name"
              value={name}
              onInput={(e) => name.value = (e.target as HTMLInputElement).value}
              disabled={status.value.type === "submitting"}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label for="lead-email" class="sr-only">Your email</label>
            <input
              id="lead-email"
              type="email"
              placeholder="Your email"
              value={email}
              onInput={(e) =>
                email.value = (e.target as HTMLInputElement).value}
              disabled={status.value.type === "submitting"}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label for="lead-stack" class="sr-only">
              Describe your tech stack or idea
            </label>
            <textarea
              id="lead-stack"
              placeholder="Describe your tech stack, idea, or what you need help with..."
              value={techStack}
              onInput={(e) =>
                techStack.value = (e.target as HTMLTextAreaElement).value}
              disabled={status.value.type === "submitting"}
              rows={4}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y disabled:opacity-50"
              required
            />
          </div>

          {status.value.type === "error" && (
            <p class="text-red-400 text-sm text-center">
              {status.value.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.value.type === "submitting"}
            class="w-full px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.value.type === "submitting"
              ? "Sending..."
              : "Send my stack for audit →"}
          </button>
        </form>

        <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5 text-gray-500 text-xs">
          <span class="inline-flex items-center gap-1">
            <svg
              class="w-3.5 h-3.5 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Expert-Vetted (Top 1%)
          </span>
          <span class="inline-flex items-center gap-1">
            <svg
              class="w-3.5 h-3.5 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            80+ projects shipped
          </span>
          <span class="inline-flex items-center gap-1">
            <svg
              class="w-3.5 h-3.5 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            100% Job Success
          </span>
        </div>
      </div>

      {/* Success section */}
      <div
        class="transition-all duration-500 ease-in-out text-center"
        style={{
          opacity: isSuccess ? 1 : 0,
          transform: isSuccess ? "translateY(0)" : "translateY(12px)",
          maxHeight: isSuccess ? "400px" : "0px",
          overflow: "hidden",
        }}
      >
        <div class="text-5xl mb-4">✅</div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">
          Your audit is queued
        </h2>
        <p class="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-6">
          I'll review your stack and send you 3 concrete architectural
          improvements within 48 hours. While you wait, let's fast-track things
          with a quick intro call.
        </p>
        <a
          href={scheduleUrl}
          target="_blank"
          class="inline-block px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
        >
          Book a free intro call →
        </a>
        <p class="text-gray-500 text-sm mt-4">
          No pressure. Just a 15-min chat to align expectations.
        </p>
      </div>
    </div>
  );
}
