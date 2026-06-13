import { CalendarIcon } from "./Icons.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

interface CTASectionProps {
  variant?: "compact" | "full";
}

export function CTASection({ variant = "compact" }: CTASectionProps) {
  const isCompact = variant === "compact";

  return (
    <div
      class={isCompact
        ? "mt-12 pt-8 border-t border-gray-700"
        : "mb-16 md:mb-24"}
    >
      {isCompact && (
        <h2 class="text-lg font-medium text-white mb-4 text-center">
          Interested in working together?
        </h2>
      )}
      <div
        class={`flex flex-wrap ${isCompact ? "gap-3" : "gap-4"} justify-center`}
      >
        <a
          href={SCHEDULE_URL}
          target="_blank"
          class={`inline-flex items-center ${
            isCompact ? "px-5 py-3" : "gap-2.5 px-8 py-3.5"
          } border border-transparent ${
            isCompact ? "text-base" : "text-lg font-semibold"
          } rounded-${isCompact ? "md" : "lg"} text-white ${
            isCompact
              ? "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400"
              : "bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-500/25 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200"
          }`}
        >
          {isCompact && <span class="mr-1">Schedule a call</span>}
          <CalendarIcon class={isCompact ? "w-6 h-6" : "w-5 h-5"} />
          {!isCompact && "Schedule a call"}
        </a>
        <a
          href="mailto:anton@antonshubin.com"
          class={`inline-flex items-center ${
            isCompact ? "px-5 py-3" : "gap-2.5 px-8 py-3.5"
          } border border-transparent ${
            isCompact ? "text-base" : "text-lg font-semibold"
          } rounded-${isCompact ? "md" : "lg"} text-white ${
            isCompact
              ? "bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              : "bg-gradient-to-r from-gray-600 to-gray-500 shadow-lg shadow-gray-500/20 hover:scale-105 hover:shadow-xl hover:shadow-gray-500/25 transition-all duration-200"
          }`}
        >
          {isCompact && <span class="mr-1">Contact me</span>}
          <svg
            class={`${isCompact ? "w-6 h-6" : "w-5 h-5"}`}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          {!isCompact && "Contact Me"}
        </a>
        <a
          href="/catalog"
          class={`inline-flex items-center ${
            isCompact ? "px-5 py-3" : "gap-2.5 px-8 py-3.5"
          } border border-transparent ${
            isCompact ? "text-base" : "text-lg font-semibold"
          } rounded-${isCompact ? "md" : "lg"} text-white ${
            isCompact
              ? "bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
              : "bg-gradient-to-r from-orange-600 to-amber-500 shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200"
          }`}
        >
          {isCompact && <span class="mr-1">View catalog</span>}
          <svg
            class={isCompact ? "w-6 h-6" : "w-5 h-5"}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          {!isCompact && "View catalog"}
        </a>
      </div>
    </div>
  );
}
