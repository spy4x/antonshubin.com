interface CTASectionProps {
  variant?: "compact" | "full";
}

export function CTASection({ variant = "compact" }: CTASectionProps) {
  const isCompact = variant === "compact";
  
  return (
    <div class={isCompact ? "mt-12 pt-8 border-t border-gray-700" : "mb-16 md:mb-24"}>
      {isCompact && (
        <h2 class="text-lg font-medium text-white mb-4 text-center">
          Interested in working together?
        </h2>
      )}
      <div class={`flex flex-wrap ${isCompact ? "gap-3" : "gap-4"} justify-center`}>
        <a
          href="mailto:anton@antonshubin.com"
          class={`inline-flex items-center ${isCompact ? "px-5 py-3" : "gap-2 px-6 py-3"} border border-transparent text-base font-medium rounded-${isCompact ? "md" : "lg"} shadow-sm text-white ${isCompact ? "bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400" : "bg-gray-700 hover:bg-gray-600 transition-colors"}`}
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
          href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
          target="_blank"
          class={`inline-flex items-center ${isCompact ? "px-5 py-3" : "gap-2 px-6 py-3"} border border-transparent text-base font-medium rounded-${isCompact ? "md" : "lg"} shadow-sm text-white ${isCompact ? "bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400" : "bg-orange-600 hover:bg-orange-500 transition-colors"}`}
        >
          {isCompact && <span class="mr-1">Hire me</span>}
          {isCompact ? (
            <svg
              class="w-6 h-6"
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          ) : (
            <>
              <svg class="w-auto h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 102 28" role="img" aria-hidden="true" height="20">
                <path fill="currentColor" d="M28.18,19.06A6.54,6.54,0,0,1,23,16c.67-5.34,2.62-7,5.2-7s4.54,2,4.54,5-2,5-4.54,5m0-13.34a7.77,7.77,0,0,0-7.9,6.08,26,26,0,0,1-1.93-5.62H12v7.9c0,2.87-1.3,5-3.85,5s-4-2.12-4-5l0-7.9H.49v7.9A8.61,8.61,0,0,0,2.6,20a7.27,7.27,0,0,0,5.54,2.35c4.41,0,7.5-3.39,7.5-8.24V8.77a25.87,25.87,0,0,0,3.66,8.05L17.34,28h3.72l1.29-7.92a11,11,0,0,0,1.36,1,8.32,8.32,0,0,0,4.14,1.28h.34A8.1,8.1,0,0,0,36.37,14a8.12,8.12,0,0,0-8.19-8.31" />
                <path fill="currentColor" d="M80.8,7.86V6.18H77.2V21.81h3.65V15.69c0-3.77.34-6.48,5.4-6.13V6c-2.36-.18-4.2.31-5.45,1.87" />
                <polygon fill="currentColor" points="55.51 6.17 52.87 17.11 50.05 6.17 45.41 6.17 42.59 17.11 39.95 6.17 36.26 6.17 40.31 21.82 44.69 21.82 47.73 10.71 50.74 21.82 55.12 21.82 59.4 6.17 55.51 6.17" />
                <path fill="currentColor" d="M67.42,19.07c-2.59,0-4.53-2.05-4.53-5s2-5,4.53-5S72,11,72,14s-2,5-4.54,5m0-13.35A8.1,8.1,0,0,0,59.25,14,8.18,8.18,0,1,0,75.6,14a8.11,8.11,0,0,0-8.18-8.31" />
                <path fill="currentColor" d="M91.47,14.13h.84l5.09,7.69h4.11l-5.85-8.53a7.66,7.66,0,0,0,4.74-7.11H96.77c0,3.37-2.66,4.65-5.3,4.65V0H87.82V21.82h3.64Z" />
              </svg>
              Hire me
            </>
          )}
        </a>
        {!isCompact && (
          <a
            href="/pay"
            class="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            <svg
              class="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Pay Me
          </a>
        )}
      </div>
    </div>
  );
}
