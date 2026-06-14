import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

export default define.page(function Infrastructure() {
  return (
    <Layout currentPath="/infrastructure">
      <div class="max-w-4xl mx-auto px-4 py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          My Infrastructure Laboratory
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg max-w-2xl mx-auto">
          This is where I develop and test the architecture patterns that keep
          client SaaS costs near zero.
        </p>

        {/* Cost comparison hero */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <div class="grid gap-6 sm:grid-cols-2">
            <div class="text-center p-6 bg-gray-900/50 rounded-lg">
              <p class="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Typical AWS setup for 20 services
              </p>
              <p class="text-4xl font-bold text-red-400">$2,800</p>
              <p class="text-gray-500 text-xs mt-1">per month</p>
            </div>
            <div class="text-center p-6 bg-gray-900/50 rounded-lg">
              <p class="text-gray-500 text-xs uppercase tracking-wide mb-1">
                What I run on (Hetzner)
              </p>
              <p class="text-4xl font-bold text-green-400">$50</p>
              <p class="text-gray-500 text-xs mt-1">per month</p>
            </div>
          </div>
          <p class="text-center text-gray-400 text-sm mt-4">
            98% cost reduction. Same reliability, same performance.
          </p>
        </div>

        {/* Architecture overview */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <h2 class="text-xl font-semibold text-white mb-4">
            🏗️ Architecture Overview
          </h2>
          <p class="text-gray-400 text-sm leading-relaxed mb-4">
            Single Hetzner dedicated server running Fedora Linux with Docker
            Compose and Traefik as the reverse proxy. All services are
            containerized, auto-restart on failure, and monitored via Grafana.
          </p>
          {/* Arch diagram placeholder */}
          <div class="bg-gray-900/50 rounded-lg p-8 text-center border-2 border-dashed border-gray-700">
            <div class="text-4xl mb-3">📊</div>
            <p class="text-gray-500 text-sm">
              Architecture diagram — coming soon
            </p>
            <p class="text-gray-600 text-xs mt-1">
              [Image: Traefik → Docker Compose → Service Mesh diagram]
            </p>
          </div>
        </div>

        {/* Live dashboard */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <h2 class="text-xl font-semibold text-white mb-4">
            📡 Live Status Dashboard
          </h2>
          <p class="text-gray-400 text-sm leading-relaxed mb-4">
            Real-time uptime and health status for all my self-hosted services.
            This dashboard runs on the same server and monitoring stack I deploy
            for client projects.
          </p>
          <a
            href="https://uptime-cloud.antonshubin.com"
            target="_blank"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            View live dashboard →
          </a>
        </div>

        {/* Services */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <h2 class="text-xl font-semibold text-white mb-4">
            📦 Services Running
          </h2>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Home Assistant", "Smart home automation", "🏠"],
              ["Jellyfin", "Media streaming", "🎬"],
              ["Immich", "Photo backup", "📸"],
              ["VaultWarden", "Password manager", "🔑"],
              ["Syncthing", "File sync", "🔄"],
              ["Grafana", "Monitoring", "📈"],
              ["Nginx", "Reverse proxy", "🌐"],
              ["PostgreSQL", "Database", "🗄️"],
              ["MinIO", "Object storage", "💾"],
              ["Paperless-ngx", "Document management", "📄"],
              ["Firefly III", "Finance tracking", "💰"],
              ["Joplin Server", "Notes sync", "📝"],
            ].map(([name, desc, icon]) => (
              <div
                key={name}
                class="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
              >
                <span class="text-xl">{icon}</span>
                <div>
                  <p class="text-white text-sm font-medium">{name}</p>
                  <p class="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <h2 class="text-xl font-semibold text-white mb-4">
            💰 Real Cost Breakdown
          </h2>
          <div class="space-y-3">
            {[
              ["Hetzner dedicated server (AX102)", "$47/mo"],
              ["Domain names", "$12/year"],
              ["Cloudflare (free tier)", "$0"],
              ["SSL certificates (Let's Encrypt)", "$0"],
              ["Monitoring (Grafana Cloud free tier)", "$0"],
              ["Backup storage (Backblaze B2)", "~$3/mo"],
            ].map(([item, cost]) => (
              <div
                key={item}
                class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
              >
                <span class="text-gray-300 text-sm">{item}</span>
                <span class="text-green-400 text-sm font-mono font-medium">
                  {cost}
                </span>
              </div>
            ))}
            <div class="flex justify-between items-center py-2 font-bold">
              <span class="text-white">Total</span>
              <span class="text-green-400 font-mono">~$50/month</span>
            </div>
          </div>
        </div>

        {/* Apply to your project */}
        <div class="bg-gray-800 rounded-xl border border-orange-500/40 p-8 text-center">
          <h2 class="text-xl font-semibold text-white mb-3">
            Your SaaS Can Run on the Same Stack
          </h2>
          <p class="text-gray-400 text-sm max-w-lg mx-auto mb-6">
            Every client SaaS I build uses the same infrastructure patterns —
            Docker Compose, Traefik, Hetzner. Your MVP does not need a
            $500/month AWS bill.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              href="/catalog/bulletproof-backend-api"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-lg shadow-lg shadow-orange-500/25 hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              See backend API pricing →
            </a>
            <a
              href={SCHEDULE_URL}
              target="_blank"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Book a free intro call
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
});
