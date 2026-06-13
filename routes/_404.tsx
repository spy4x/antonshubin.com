import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";

export default define.page(function NotFound() {
  return (
    <Layout currentPath="/404">
      <div class="max-w-2xl mx-auto px-4 py-24 text-center">
        <div class="text-7xl mb-6">🔍</div>
        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">
          404
        </h1>
        <p class="text-xl text-gray-300 mb-2">
          This page does not exist.
        </p>
        <p class="text-gray-400 mb-8 max-w-md mx-auto">
          The link might be broken, or the page may have been moved. Let's get
          you back on track.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <a
            href="/"
            class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to home
          </a>
          <a
            href="/catalog"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            View project catalog
          </a>
          <a
            href="/contact-me"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Contact me
          </a>
        </div>
      </div>
    </Layout>
  );
});
