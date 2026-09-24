import { page } from "fresh";
import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SearchIcon } from "../components/Icons.tsx";

function notFoundResponse() {
  return page(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export const handler = define.handlers({
  GET: notFoundResponse,
  HEAD: notFoundResponse,
});

export default define.page(function NotFound() {
  return (
    <Layout currentPath="/404">
      <div class="max-w-2xl mx-auto px-4 py-24 text-center">
        <SearchIcon class="w-16 h-16 mb-6 mx-auto text-graphite" />
        <h1 class="text-4xl sm:text-5xl font-bold text-parchment mb-4">
          404
        </h1>
        <p class="text-xl text-graphite mb-2">
          This page does not exist.
        </p>
        <p class="text-graphite mb-8 max-w-md mx-auto">
          The link might be broken, or the page may have been moved. Let's get
          you back on track.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <a
            href="/"
            class="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors"
          >
            ← Back to home
          </a>
          <a
            href="/catalog"
            class="inline-flex items-center gap-2 px-6 py-3 bg-lamp hover:bg-rule-strong text-parchment font-semibold rounded-lg transition-colors"
          >
            View services
          </a>
          <a
            href="/contact-me"
            class="inline-flex items-center gap-2 px-6 py-3 bg-lamp hover:bg-rule-strong text-parchment font-semibold rounded-lg transition-colors"
          >
            Contact me
          </a>
        </div>
      </div>
    </Layout>
  );
});
