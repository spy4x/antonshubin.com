export function CTASection() {
  return (
    <div class="mt-12 pt-8 border-t border-gray-700">
      <h2 class="text-lg font-medium text-white mb-4 text-center">
        Interested in working together?
      </h2>
      <div class="flex flex-wrap gap-3 justify-center">
        <a
          href="mailto:2spy4x+ws@gmail.com"
          class="inline-flex items-center pl-6 pr-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          <span class="mr-1">Contact me</span>
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
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>
        <a
          href="https://www.upwork.com/freelancers/~01bad246d7ab0effef"
          target="_blank"
          class="inline-flex items-center pl-6 pr-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
        >
          <span class="mr-1">Hire me</span>
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
        </a>
      </div>
    </div>
  );
}
