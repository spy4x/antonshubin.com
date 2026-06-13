import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

export default define.page(function Consultation() {
  return (
    <Layout currentPath="/consultation">
      <div class="max-w-3xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Strategy Call
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg">
          30 minutes. No pitch. Just honest architectural feedback.
        </p>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <div class="flex items-center gap-4 mb-6">
            <span class="text-4xl">🎯</span>
            <div>
              <h2 class="text-2xl font-bold text-white">What you get</h2>
            </div>
          </div>

          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <span class="text-green-400 text-lg shrink-0 mt-0.5">✓</span>
              <div>
                <p class="text-white font-medium">30-minute video call</p>
                <p class="text-gray-400 text-sm">
                  Structured, focused discussion about your project or idea.
                </p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400 text-lg shrink-0 mt-0.5">✓</span>
              <div>
                <p class="text-white font-medium">
                  Honest technical assessment
                </p>
                <p class="text-gray-400 text-sm">
                  I will tell you what works, what does not, and what to watch
                  out for — no sugarcoating.
                </p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400 text-lg shrink-0 mt-0.5">✓</span>
              <div>
                <p class="text-white font-medium">
                  Architecture recommendations
                </p>
                <p class="text-gray-400 text-sm">
                  Tech stack suggestions, infrastructure approach, and cost
                  estimates tailored to your specific needs.
                </p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400 text-lg shrink-0 mt-0.5">✓</span>
              <div>
                <p class="text-white font-medium">No commitment required</p>
                <p class="text-gray-400 text-sm">
                  If we are a good fit, we can talk about next steps. If not,
                  you walk away with actionable advice.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <div class="flex items-center gap-4 mb-6">
            <span class="text-4xl">👤</span>
            <div>
              <h2 class="text-2xl font-bold text-white">Who this is for</h2>
            </div>
          </div>
          <ul class="space-y-3">
            <li class="flex items-start gap-3 text-gray-300">
              <span class="text-orange-400 shrink-0">→</span>
              Non-technical founders with an idea who need technical guidance
            </li>
            <li class="flex items-start gap-3 text-gray-300">
              <span class="text-orange-400 shrink-0">→</span>
              Startup teams considering a tech stack or architecture change
            </li>
            <li class="flex items-start gap-3 text-gray-300">
              <span class="text-orange-400 shrink-0">→</span>
              Existing product owners wondering why their server bill is too
              high
            </li>
            <li class="flex items-start gap-3 text-gray-300">
              <span class="text-orange-400 shrink-0">→</span>
              Anyone who wants a second opinion from an experienced Fractional
              CTO
            </li>
          </ul>
        </div>

        <div class="text-center">
          <a
            href={SCHEDULE_URL}
            target="_blank"
            class="inline-block px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
          >
            Book your call now
          </a>
          <p class="text-gray-500 text-sm mt-3">
            $100 for 30 minutes. Paid via Stripe or crypto.
          </p>
        </div>
      </div>
    </Layout>
  );
});
