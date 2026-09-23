import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { ArrowRightIcon } from "../components/Icons.tsx";
import MeetEmbed, { embedUrl } from "./MeetEmbed.tsx";

interface FormState {
  name: string;
  email: string;
  techStack: string;
}

type SubmitStatus =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success" }
  | { type: "error"; message: string; field?: string };

/** The id of the field a validation error is about, so it can carry aria-invalid/aria-describedby. */
function validate(
  form: FormState,
): { field: string; message: string } | null {
  if (!form.name.trim()) {
    return { field: "lead-name", message: "Name is required" };
  }
  if (!form.email.trim()) {
    return { field: "lead-email", message: "Email is required" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return { field: "lead-email", message: "Please enter a valid email" };
  }
  if (!form.techStack.trim()) {
    return {
      field: "lead-stack",
      message: "Describe your idea or your current app",
    };
  }
  return null;
}

export default function LeadForm({ scheduleUrl }: { scheduleUrl: string }) {
  const name = useSignal("");
  const email = useSignal("");
  const techStack = useSignal("");
  const status = useSignal<SubmitStatus>({ type: "idle" });

  // Set page-load timestamp on mount
  const pageLoad = useSignal(Date.now());

  // Focus moves to the success heading once the submit succeeds, so a screen
  // reader announces it — see the note on the success wrapper below for why
  // focus rather than a live region.
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form: FormState = {
      name: name.value,
      email: email.value,
      techStack: techStack.value,
    };
    const error = validate(form);
    if (error) {
      status.value = {
        type: "error",
        message: error.message,
        field: error.field,
      };
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
  const errorField = status.value.type === "error"
    ? status.value.field
    : undefined;

  // Runs after the DOM commits the success state, once the heading is no
  // longer inside an `inert` subtree and can actually take focus.
  useEffect(() => {
    // `preventScroll` matters: the success panel is still `max-height: 0`
    // at this instant (its own transition hasn't started), so an unguarded
    // focus() scrolls the page down to where the panel will end up, then
    // back up as the panel expands — a ~150ms jump-and-settle that doesn't
    // happen on the server-rendered page at all.
    if (isSuccess) successHeadingRef.current?.focus({ preventScroll: true });
  }, [isSuccess]);

  return (
    <div class="bg-gray-800 rounded-xl border border-orange-500/40 p-4 sm:p-6 relative overflow-hidden">
      {
        /* Form section. `inert` once success shows, so its now-hidden inputs
          drop out of the tab order and out of assistive tech, matching the
          `maxHeight: 0` collapse below it. */
      }
      <div
        class="transition-all duration-500 ease-in-out"
        data-lead-form="true"
        inert={isSuccess}
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
          Send me your idea or your current app and I'll write back with 3
          concrete architectural improvements.
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
              aria-invalid={errorField === "lead-name" ? "true" : undefined}
              aria-describedby={errorField === "lead-name"
                ? "lead-form-error"
                : undefined}
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
              aria-invalid={errorField === "lead-email" ? "true" : undefined}
              aria-describedby={errorField === "lead-email"
                ? "lead-form-error"
                : undefined}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label for="lead-stack" class="sr-only">
              Describe your idea or your current app
            </label>
            <textarea
              id="lead-stack"
              placeholder="Describe your idea, your current app, or what you need help with..."
              value={techStack}
              onInput={(e) =>
                techStack.value = (e.target as HTMLTextAreaElement).value}
              disabled={status.value.type === "submitting"}
              aria-invalid={errorField === "lead-stack" ? "true" : undefined}
              aria-describedby={errorField === "lead-stack"
                ? "lead-form-error"
                : undefined}
              rows={4}
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y disabled:opacity-50"
              required
            />
          </div>

          {status.value.type === "error" && (
            <p
              id="lead-form-error"
              role="alert"
              class="text-red-400 text-sm text-center"
            >
              {status.value.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.value.type === "submitting"}
            data-umami-event="form-submit-audit"
            class="w-full px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {status.value.type === "submitting" ? "Sending..." : (
              <>
                Get my free architecture audit
                <ArrowRightIcon class="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5 text-gray-500 text-xs">
          <span class="inline-flex items-center gap-1">
            <svg
              aria-hidden="true"
              focusable="false"
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
              aria-hidden="true"
              focusable="false"
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
              aria-hidden="true"
              focusable="false"
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

      {
        /* Success section. maxHeight must clear the 760px iframe MeetEmbed
          opens inline once clicked, so it's taller than the form section's.
          `inert` until success, so the facade button and fallback link can't
          be Tab'd to (and silently activated) while this panel is collapsed
          to `maxHeight: 0` and `opacity: 0` — without it, Tab from the last
          form field reaches these controls and Enter loads a cross-origin
          iframe invisibly.

          The heading below gets focus once `isSuccess` flips (see the
          `useEffect` above), which is also what announces the success
          message to a screen reader. A live region was the other option, but
          this whole section — including the heading's text — is already in
          the DOM before submit (only collapsed and `inert`), so nothing about
          it mutates at the moment of success; an `aria-live` region only
          announces on a text mutation, not on an ancestor losing `inert` or
          `max-height: 0`, so it would stay silent. Moving focus works because
          it targets the heading node directly, independent of that. */
      }
      <div
        class="transition-all duration-500 ease-in-out text-center"
        data-lead-success="true"
        inert={!isSuccess}
        style={{
          opacity: isSuccess ? 1 : 0,
          transform: isSuccess ? "translateY(0)" : "translateY(12px)",
          maxHeight: isSuccess ? "1400px" : "0px",
          overflow: "hidden",
        }}
      >
        <div class="text-5xl mb-4">✅</div>
        <h2
          id="lead-success-heading"
          ref={successHeadingRef}
          tabIndex={-1}
          class="text-2xl sm:text-3xl font-bold text-white mb-3 focus:outline-none"
        >
          Your audit is queued
        </h2>
        <p class="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-6">
          I'll review what you sent and write back with 3 concrete architectural
          improvements.
          {scheduleUrl &&
            " If you'd rather talk it through, book an intro call."}
        </p>
        {scheduleUrl && (
          <>
            <MeetEmbed url={embedUrl(scheduleUrl)} />
            <p class="mt-4">
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="meet-embed-fallback-click"
                class="text-gray-400 hover:text-orange-300 underline underline-offset-4 text-sm"
              >
                Open standalone
              </a>
            </p>
            <p class="text-gray-500 text-sm mt-4">
              No pressure. It's a free 30-minute call.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
