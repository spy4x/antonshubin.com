import { define } from "../lib/utils.ts";

export const handler = define.handlers({
  GET() {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="800" height="900" fill="url(#bg)" rx="16"/>

  <text x="400" y="45" text-anchor="middle" fill="#f97316" font-family="system-ui" font-size="20" font-weight="bold">Infrastructure Architecture</text>
  <text x="400" y="68" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="13">40+ services · 1 dedicated server · $50/month</text>

  <rect x="200" y="95" width="400" height="50" rx="8" fill="#334155" stroke="#475569" stroke-width="1.5"/>
  <text x="400" y="125" text-anchor="middle" fill="#38bdf8" font-family="system-ui" font-size="14" font-weight="600">☁️ Cloudflare (DNS + CDN)</text>

  <line x1="400" y1="145" x2="400" y2="175" stroke="#475569" stroke-width="2"/>
  <polygon points="400,180 394,170 406,170" fill="#475569"/>

  <rect x="200" y="185" width="400" height="50" rx="8" fill="#334155" stroke="#475569" stroke-width="1.5"/>
  <text x="400" y="215" text-anchor="middle" fill="#22d3ee" font-family="system-ui" font-size="14" font-weight="600">🔄 Traefik (Reverse Proxy + SSL)</text>

  <line x1="400" y1="235" x2="400" y2="265" stroke="#475569" stroke-width="2"/>
  <polygon points="400,270 394,260 406,260" fill="#475569"/>

  <rect x="80" y="275" width="640" height="380" rx="12" fill="#1e293b" stroke="#f97316" stroke-width="1.5" stroke-dasharray="6,3"/>
  <rect x="80" y="275" width="640" height="35" rx="12" fill="#f97316" opacity="0.15"/>
  <text x="400" y="298" text-anchor="middle" fill="#f97316" font-family="system-ui" font-size="13" font-weight="600">🐳 Docker Compose (Hetzner Dedicated Server)</text>

  <rect x="100" y="325" width="195" height="310" rx="8" fill="#334155" stroke="#475569" stroke-width="1"/>
  <text x="197" y="350" text-anchor="middle" fill="#a78bfa" font-family="system-ui" font-size="12" font-weight="600">Core Infrastructure</text>
  <line x1="110" y1="360" x2="285" y2="360" stroke="#475569" stroke-width="1"/>
  <text x="115" y="380" fill="#cbd5e1" font-family="system-ui" font-size="11">PostgreSQL</text>
  <text x="115" y="398" fill="#cbd5e1" font-family="system-ui" font-size="11">MinIO (S3 storage)</text>
  <text x="115" y="416" fill="#cbd5e1" font-family="system-ui" font-size="11">Authentik (SSO)</text>
  <text x="115" y="434" fill="#cbd5e1" font-family="system-ui" font-size="11">Redis / Valkey</text>
  <text x="115" y="452" fill="#cbd5e1" font-family="system-ui" font-size="11">WireGuard VPN</text>
  <text x="115" y="470" fill="#cbd5e1" font-family="system-ui" font-size="11">Docker Registry</text>
  <text x="115" y="488" fill="#cbd5e1" font-family="system-ui" font-size="11">Cloudflared</text>
  <text x="115" y="506" fill="#cbd5e1" font-family="system-ui" font-size="11">Watchtower (updates)</text>

  <rect x="302" y="325" width="195" height="310" rx="8" fill="#334155" stroke="#475569" stroke-width="1"/>
  <text x="400" y="350" text-anchor="middle" fill="#34d399" font-family="system-ui" font-size="12" font-weight="600">Services</text>
  <line x1="312" y1="360" x2="487" y2="360" stroke="#475569" stroke-width="1"/>
  <text x="310" y="380" fill="#cbd5e1" font-family="system-ui" font-size="11">Jellyfin (media)</text>
  <text x="310" y="398" fill="#cbd5e1" font-family="system-ui" font-size="11">Immich (photos)</text>
  <text x="310" y="416" fill="#cbd5e1" font-family="system-ui" font-size="11">VaultWarden (passwords)</text>
  <text x="310" y="434" fill="#cbd5e1" font-family="system-ui" font-size="11">Paperless-ngx (docs)</text>
  <text x="310" y="452" fill="#cbd5e1" font-family="system-ui" font-size="11">Gitea (Git)</text>
  <text x="310" y="470" fill="#cbd5e1" font-family="system-ui" font-size="11">Home Assistant</text>
  <text x="310" y="488" fill="#cbd5e1" font-family="system-ui" font-size="11">Plausible + Umami</text>
  <text x="310" y="506" fill="#cbd5e1" font-family="system-ui" font-size="11">+ 30 more services</text>

  <rect x="504" y="325" width="195" height="310" rx="8" fill="#334155" stroke="#475569" stroke-width="1"/>
  <text x="602" y="350" text-anchor="middle" fill="#fbbf24" font-family="system-ui" font-size="12" font-weight="600">Monitoring & AI</text>
  <line x1="514" y1="360" x2="689" y2="360" stroke="#475569" stroke-width="1"/>
  <text x="510" y="380" fill="#cbd5e1" font-family="system-ui" font-size="11">Grafana + Prometheus</text>
  <text x="510" y="398" fill="#cbd5e1" font-family="system-ui" font-size="11">Gatus (health checks)</text>
  <text x="510" y="416" fill="#cbd5e1" font-family="system-ui" font-size="11">Healthchecks.io</text>
  <text x="510" y="434" fill="#cbd5e1" font-family="system-ui" font-size="11">Ollama (local LLM)</text>
  <text x="510" y="452" fill="#cbd5e1" font-family="system-ui" font-size="11">Open WebUI</text>
  <text x="510" y="470" fill="#cbd5e1" font-family="system-ui" font-size="11">SearXNG (search)</text>
  <text x="510" y="488" fill="#cbd5e1" font-family="system-ui" font-size="11">Woodpecker CI</text>

  <line x1="400" y1="655" x2="400" y2="685" stroke="#475569" stroke-width="2"/>
  <polygon points="400,690 394,680 406,680" fill="#475569"/>

  <rect x="150" y="695" width="500" height="50" rx="8" fill="#334155" stroke="#475569" stroke-width="1.5"/>
  <text x="400" y="725" text-anchor="middle" fill="#f87171" font-family="system-ui" font-size="13" font-weight="600">💾 Backups: Syncthing + restic → Mini PCs, Laptop, Android</text>

  <line x1="400" y1="745" x2="400" y2="775" stroke="#475569" stroke-width="2"/>
  <polygon points="400,780 394,770 406,770" fill="#475569"/>

  <rect x="150" y="785" width="500" height="50" rx="8" fill="#334155" stroke="#f97316" stroke-width="1.5"/>
  <text x="400" y="815" text-anchor="middle" fill="#f97316" font-family="system-ui" font-size="13" font-weight="600">🌍 Client SaaS — Same Patterns, Same Stack</text>

  <rect x="230" y="855" width="340" height="30" rx="15" fill="#166534" stroke="#22c55e" stroke-width="1"/>
  <text x="400" y="875" text-anchor="middle" fill="#4ade80" font-family="system-ui" font-size="13" font-weight="600">~20× better perf · 98% cost reduction vs AWS</text>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
});
