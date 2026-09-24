import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { WrenchIcon } from "../components/Icons.tsx";

export default define.page(function ServerError() {
  return (
    <Layout currentPath="/500">
      <div class="max-w-2xl mx-auto px-4 py-24 text-center">
        <WrenchIcon class="w-16 h-16 mb-6 mx-auto text-graphite" />
        <h1 class="text-4xl sm:text-5xl font-bold text-parchment mb-4">
          500
        </h1>
        <p class="text-xl text-graphite mb-2">
          Something went wrong on our end.
        </p>
        <p class="text-graphite mb-8 max-w-md mx-auto">
          An unexpected error occurred. I have been notified and will look into
          it shortly.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <a
            href="/"
            class="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-rule-strong text-parchment hover:bg-lamp font-semibold rounded-lg transition-colors"
          >
            ← Back to home
          </a>
          <a
            href="/contact-me"
            class="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-rule-strong hover:bg-lamp text-parchment font-semibold rounded-lg transition-colors"
          >
            Report this issue
          </a>
        </div>
      </div>
    </Layout>
  );
});
