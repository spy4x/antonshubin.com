import { useSignal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { ArrowRightIcon, CheckIcon } from "../components/Icons.tsx";
import { NewTabHint } from "../components/NewTabHint.tsx";
import { proof } from "../lib/proof.ts";
import { embedUrl, NEW_TAB_LABEL } from "../lib/meet-embed.ts";
import { briefPrefill, isEmptyBrief } from "../lib/brief-prefill.ts";
import { type BriefErrorReason, eventAttrs, track } from "../lib/analytics.ts";

/** The calendar island's component, loaded only when the success panel needs it. */
type MeetEmbedComponent = typeof import("./MeetEmbed.tsx").default;

/** What the written brief promises; the form and `/book` without a scheduler both say it. */
export const BRIEF_PROMISE =
  "Send me your idea or your current app and I'll write back with 3 concrete architectural improvements. No cost. No commitment.";

/** The catalog item a visitor came from (`/book?service=<slug>`), already checked against `lib/catalog.ts`. */
export interface LeadService {
  slug: string;
  shortTitle: string;
}

interface LeadFormProps {
  scheduleUrl: string;
  /**
   * The id-link of a calendar already on the page (`/book` passes
   * `#book`). The success panel then points up to it instead of rendering a
   * second calendar (#272).
   */
  calendarAbove?: string;
  /** Prefills the brief with "About: <shortTitle>" and sends the slug with it. */
  service?: LeadService;
  /** False when the page's own heading already says "Send a written brief" and its promise. */
  intro?: boolean;
}

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
  serviceTitle?: string,
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
  if (isEmptyBrief(form.techStack, serviceTitle)) {
    return {
      field: "lead-stack",
      message: "Describe your idea or your current app",
    };
  }
  return null;
}

export default function LeadForm(
  {
    scheduleUrl,
    calendarAbove,
    service,
    intro = true,
  }: LeadFormProps,
) {
  const name = useSignal("");
  const email = useSignal("");
  const techStack = useSignal(
    service ? briefPrefill(service.shortTitle) : "",
  );
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
    const error = validate(form, service?.shortTitle);
    if (error) {
      status.value = {
        type: "error",
        message: error.message,
        field: error.field,
      };
      track("brief-error", { reason: "invalid" });
      return;
    }
    status.value = { type: "submitting" };
    let reason: BriefErrorReason = "server";
    try {
      const resp = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(service ? { service: service.slug } : {}),
          _t: pageLoad.value,
          _website: "",
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        // 400 is the server refusing what was typed; anything else is the
        // server or the network failing (#318).
        reason = resp.status === 400 ? "invalid" : "server";
        throw new Error(body?.error || "Something went wrong. Try again.");
      }
      status.value = { type: "success" };
      // Counted only once the server accepted the brief, never on the click.
      track("brief-sent", { service: service?.slug });
    } catch (err) {
      status.value = {
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      };
      track("brief-error", { reason });
    }
  };

  const isSuccess = status.value.type === "success";
  const errorField = status.value.type === "error"
    ? status.value.field
    : undefined;

  // The calendar's code is fetched only once a brief went out and this panel
  // is going to show it (#272).
  const [MeetEmbed, setMeetEmbed] = useState<MeetEmbedComponent | null>(null);
  const wantsCalendar = isSuccess && Boolean(scheduleUrl) && !calendarAbove;
  useEffect(() => {
    if (!wantsCalendar || MeetEmbed) return;
    import("./MeetEmbed.tsx")
      .then((m) => setMeetEmbed(() => m.default))
      // A failed chunk load (offline, a deploy in between) leaves the panel
      // without a calendar; the new-tab link under it still works.
      .catch(() => {});
  }, [wantsCalendar]);

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
    <div class="bg-paper rounded-xl border border-rule p-4 sm:p-6 relative overflow-hidden">
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
        {intro && (
          <>
            <h3 class="text-xl sm:text-2xl text-parchment mb-3">
              Send a written brief
            </h3>
            <p class="text-graphite text-base mb-6">{BRIEF_PROMISE}</p>
          </>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
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
              class="w-full px-4 py-3 bg-lamp border border-rule-strong rounded-lg text-parchment placeholder-graphite focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
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
              class="w-full px-4 py-3 bg-lamp border border-rule-strong rounded-lg text-parchment placeholder-graphite focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
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
              class="w-full px-4 py-3 bg-lamp border border-rule-strong rounded-lg text-parchment placeholder-graphite focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y disabled:opacity-50"
              required
            />
          </div>

          {status.value.type === "error" && (
            <p
              id="lead-form-error"
              role="alert"
              class="text-brick text-sm text-center"
            >
              {status.value.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.value.type === "submitting"}
            class="w-full px-8 py-3.5 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {status.value.type === "submitting" ? "Sending..." : (
              <>
                Send my brief
                <ArrowRightIcon class="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5 text-graphite text-xs">
          <span class="inline-flex items-center gap-1">
            <svg
              aria-hidden="true"
              focusable="false"
              class="w-3.5 h-3.5 text-sage"
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
            {proof("expert-vetted")} ({proof("top-percent")})
          </span>
          <span class="inline-flex items-center gap-1">
            <svg
              aria-hidden="true"
              focusable="false"
              class="w-3.5 h-3.5 text-sage"
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
            {proof("jobs")} jobs on Upwork
          </span>
          <span class="inline-flex items-center gap-1">
            <svg
              aria-hidden="true"
              focusable="false"
              class="w-3.5 h-3.5 text-sage"
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
            {proof("job-success")} Job Success
          </span>
        </div>
      </div>

      {
        /* Success section. maxHeight (2400px) must clear the tallest this
          panel can get: MeetEmbed's iframe caps at MAX_EMBED_HEIGHT_PX
          (MeetEmbed.tsx, 2000px as of mig#44) plus the icon, heading and
          three paragraphs around it (roughly 300px, so at least cap + 350
          for margin) — comfortably inside 2400px, with headroom to spare.
          Raising MAX_EMBED_HEIGHT_PX means raising this maxHeight too, or a
          taller-than-expected frame gets clipped by this panel's
          `overflow: hidden` before the iframe's own height ever comes into
          play. Taller than the form section's maxHeight (800px) for the
          same reason. `inert` until success, so the new-tab link can't be
          Tab'd to while this panel is collapsed to `maxHeight: 0` and
          `opacity: 0`. The calendar itself mounts only on success.

          The heading below is rendered only once `isSuccess` flips (#269:
          crawlers that split a page at its headings must not read "Your
          brief is queued" as a section of the home page), in the same commit
          that removes `inert` from this wrapper. It gets focus right after
          that commit (see the `useEffect` above), which is also what
          announces the success message to a screen reader; a live region
          would need the text to mutate inside an already-mounted node. */
      }
      <div
        class="transition-all duration-500 ease-in-out text-center"
        data-lead-success="true"
        inert={!isSuccess}
        style={{
          opacity: isSuccess ? 1 : 0,
          transform: isSuccess ? "translateY(0)" : "translateY(12px)",
          maxHeight: isSuccess ? "2400px" : "0px",
          overflow: "hidden",
        }}
      >
        <CheckIcon class="w-14 h-14 mb-4 mx-auto text-sage" />
        {isSuccess && (
          <h3
            id="lead-success-heading"
            ref={successHeadingRef}
            tabIndex={-1}
            class="text-2xl sm:text-3xl text-parchment mb-3 focus:outline-none"
          >
            Your brief is queued
          </h3>
        )}
        <p class="text-graphite text-base sm:text-lg max-w-xl mx-auto mb-6">
          I'll review what you sent and write back with 3 concrete architectural
          improvements.
          {scheduleUrl && !calendarAbove &&
            " If you'd rather talk it through, book an intro call."}
          {scheduleUrl && calendarAbove && (
            <>
              {" If you'd rather talk it through, "}
              <a
                href={calendarAbove}
                class="text-parchment underline underline-offset-4 hover:text-accent"
              >
                book an intro call
              </a>{" "}
              in the calendar above.
            </>
          )}
        </p>
        {scheduleUrl && !calendarAbove && (
          <>
            {
              /* Mounted only after a successful submit, from code loaded only
                then: the calendar inserts its frame as soon as it mounts, and
                neither the scheduler nor the calendar's script may slow every
                home page view. */
            }
            {isSuccess && MeetEmbed && (
              <div class="flex justify-center">
                <MeetEmbed
                  url={embedUrl(scheduleUrl)}
                  scheduleUrl={scheduleUrl}
                />
              </div>
            )}
            <p class="mt-4">
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-calendar-newtab="true"
                {...eventAttrs("book", { place: "calendar" })}
                class="text-graphite hover:text-accent underline underline-offset-4 text-sm"
              >
                {NEW_TAB_LABEL}
                <NewTabHint />
              </a>
            </p>
            <p class="text-graphite text-sm mt-4">
              No pressure. It's a free 30-minute call.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
