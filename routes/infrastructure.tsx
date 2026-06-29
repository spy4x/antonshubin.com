import { define } from "../lib/utils.ts";
import { Layout } from "../components/Layout.tsx";
import { getBreadcrumb, head } from "../lib/head.ts";
import { SEOHead } from "../components/SEOHead.tsx";
import { Breadcrumb } from "../components/Breadcrumb.tsx";
import { SCHEDULE_URL } from "../lib/config.ts";

const services = [
  ["Traefik", "Reverse proxy + auto SSL", "🌐"],
  ["Grafana + Prometheus", "Self-hosted monitoring stack", "📈"],
  ["Docker Compose", "Container orchestration", "🐳"],
  ["PostgreSQL", "Relational database", "🗄️"],
  ["Authentik", "SSO / Identity provider", "🔑"],
  ["Home Assistant", "Smart home automation", "🏠"],
  ["Jellyfin", "Media streaming", "🎬"],
  ["Immich", "Photo backup (Google Photos alt)", "📸"],
  ["VaultWarden", "Password manager (Bitwarden)", "🔐"],
  ["Syncthing", "File sync across devices", "🔄"],
  ["Paperless-ngx", "Document management + OCR", "📄"],
  ["Gitea", "Self-hosted Git", "🦊"],
  ["Woodpecker CI", "CI/CD pipelines", "⚡"],
  ["Ollama + Open WebUI", "Local LLM inference", "🤖"],
  ["SearXNG", "Private metasearch engine", "🔍"],
  ["Ntfy", "Push notifications", "🔔"],
  ["WireGuard", "VPN server", "🔒"],
  ["AdGuard Home", "DNS-level ad blocking", "🛡️"],
  ["MinIO", "S3-compatible storage", "💾"],
  ["Stirling PDF", "PDF manipulation tools", "📄"],
  ["Uptime Kuma / Gatus", "Service health monitoring", "❤️"],
  ["Transmission", "Torrent client", "⬇️"],
  ["Metube", "YouTube downloading", "🎥"],
  ["Healthchecks", "Cron job monitoring", "⏱️"],
  ["Calendly / Radicale", "Calendar sync", "📅"],
  ["Firefly III", "Finance tracking", "💰"],
  ["Monica", "CRM / relationship manager", "👥"],
  ["Plausible + Umami", "Web analytics", "📊"],
  ["Watchtower", "Auto container updates", "🔄"],
  ["Cloudflared", "Cloudflare Tunnel", "☁️"],
  ["Stalwart Mail", "Mail server", "📧"],
  ["Akaunting", "Accounting", "📊"],
  ["IT Tools", "Developer utilities", "🧰"],
  ["Mailer", "Email sending", "📨"],
  ["Piped", "YouTube frontend (alt interface)", "▶️"],
  ["Usememos", "Lightweight notes", "📝"],
  ["Audiobookshelf", "Audiobook server", "🎧"],
  ["Mirotalk", "Video calls (self-hosted Meet)", "📹"],
];

export default define.page(function Infrastructure() {
  head.value = {
    ...head.value,
    title: "Infrastructure & Architecture — Anton Shubin",
    description:
      "Self-hosted infrastructure stack powering 40+ services on a $50/mo budget.",
    canonical: "https://antonshubin.com/infrastructure/",
    ogType: "website",
  };

  return (
    <Layout currentPath="/infrastructure">
      <SEOHead />
      <Breadcrumb
        items={getBreadcrumb(head.value.canonical, head.value.title)}
      />
      <div class="max-w-4xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
          Infrastructure Laboratory
        </h1>
        <p class="text-gray-400 text-center mb-10 sm:mb-12 text-base sm:text-lg max-w-2xl mx-auto">
          Where I develop and test the architecture patterns that keep client
          SaaS costs near zero. 40+ services. One server. $50/month.
        </p>

        {/* Cost comparison hero */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
          <div class="grid gap-6 sm:grid-cols-2">
            <div class="text-center p-4 bg-gray-900/50 rounded-lg">
              <p class="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Typical AWS setup for 40+ services
              </p>
              <p class="text-4xl font-bold text-red-400">$3,000+</p>
              <p class="text-gray-500 text-xs mt-1">
                per month (shared CPU/RAM VMs)
              </p>
            </div>
            <div class="text-center p-4 bg-gray-900/50 rounded-lg">
              <p class="text-gray-500 text-xs uppercase tracking-wide mb-1">
                What I run on (Hetzner dedicated)
              </p>
              <p class="text-4xl font-bold text-green-400">$50</p>
              <p class="text-gray-500 text-xs mt-1">
                per month (dedicated CPU/RAM/NVMe)
              </p>
            </div>
          </div>
          <p class="text-center text-gray-400 text-sm mt-4">
            ~20x better performance on a dedicated CPU/RAM/NVMe server vs shared
            EC2 VMs. Same reliability. 98% cost reduction.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
          <h2 class="text-xl font-semibold text-white mb-4">
            🏗️ Architecture
          </h2>
          <img
            src="/infrastructure-architecture.svg"
            alt="Infrastructure architecture diagram showing Cloudflare → Traefik → Docker Compose → Backups flow"
            class="w-full rounded-lg"
            loading="lazy"
          />
        </div>

        {/* Live dashboard */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
          <h2 class="text-xl font-semibold text-white mb-4">
            📡 Live Status
          </h2>
          <p class="text-gray-400 text-sm leading-relaxed mb-4">
            Real-time health status for all services. Runs on the same
            monitoring stack I deploy for client projects.
          </p>
          <a
            href="https://uptime-cloud.antonshubin.com"
            target="_blank"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            View live dashboard →
          </a>
        </div>

        {/* All services */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
          <h2 class="text-xl font-semibold text-white mb-4">
            📦 40+ Services Running
          </h2>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(([name, desc, icon]) => (
              <div
                key={name}
                class="flex items-center gap-2 p-2.5 bg-gray-900/50 rounded-lg"
              >
                <span class="text-lg shrink-0">{icon}</span>
                <div class="min-w-0">
                  <p class="text-white text-sm font-medium truncate">{name}</p>
                  <p class="text-gray-500 text-xs truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
          <h2 class="text-xl font-semibold text-white mb-4">
            💰 Real Cost Breakdown
          </h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
              <span class="text-gray-300 text-sm">
                Hetzner dedicated server
              </span>
              <span class="text-green-400 text-sm font-mono font-medium">
                $47/mo
              </span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
              <span class="text-gray-300 text-sm">Domain names</span>
              <span class="text-green-400 text-sm font-mono font-medium">
                $12/year
              </span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
              <span class="text-gray-300 text-sm">Cloudflare (free tier)</span>
              <span class="text-green-400 text-sm font-mono font-medium">
                $0
              </span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
              <span class="text-gray-300 text-sm">
                SSL (Let's Encrypt, auto via Traefik)
              </span>
              <span class="text-green-400 text-sm font-mono font-medium">
                $0
              </span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
              <span class="text-gray-300 text-sm">
                Monitoring (self-hosted Grafana + Prometheus)
              </span>
              <span class="text-green-400 text-sm font-mono font-medium">
                $0
              </span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-gray-700">
              <span class="text-gray-300 text-sm">
                Backups (Syncthing + restic → other devices)
              </span>
              <span class="text-green-400 text-sm font-mono font-medium">
                $0
              </span>
            </div>
            <div class="flex justify-between items-center py-2 font-bold">
              <span class="text-white">Total</span>
              <span class="text-green-400 font-mono">~$50/month</span>
            </div>
          </div>
        </div>

        {/* Apply to your project */}
        <div class="bg-gray-800 rounded-xl border border-orange-500/40 p-4 text-center">
          <h2 class="text-xl font-semibold text-white mb-3">
            Your SaaS Can Run on the Same Stack
          </h2>
          <p class="text-gray-400 text-sm max-w-lg mx-auto mb-6">
            Every client SaaS I build uses the same infrastructure patterns —
            Docker Compose, Traefik, dedicated server. Your MVP does not need a
            $500/month cloud bill with shared CPU.
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
