import { define } from "../lib/utils.ts";
import { PLAUSIBLE_URL, UMAMI_ID, UMAMI_URL } from "../lib/config.ts";

interface AppProps {
  Component: preact.ComponentType;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

export default define.page(function App({ Component }: AppProps) {
  const title = "Anton Shubin | Fractional CTO & SaaS Architect for Startups";
  const description =
    "Fractional CTO and Lead Architect. I take your SaaS from napkin sketch to production — fixed-price milestones, zero-bloat architecture, no dev-team drama.";
  const canonical = "https://antonshubin.com/";

  return (
    <html lang="en" class="h-full bg-slate-900">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        {/* Primary meta */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#0f172a" />
        <link rel="canonical" href={canonical} />

        {/* AI crawler meta — these are parsed by GPTBot, Google-Extended, etc. */}
        <meta name="author" content="Anton Shubin" />
        <meta
          name="keywords"
          content="Fractional CTO, Lead Architect, SaaS Development, Deno, TypeScript, MVP Development, Backend Architecture, AI Integration, Tech Consultant, Fixed-Price Development, Startup Technical Advisor, Non-Technical Founder, Napkin to Production"
        />
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large"
        />

        {/* Twitter Card — large summary with image */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@antonshubin" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content="https://antonshubin.com/img/photo-big.webp"
        />

        {/* Open Graph */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta
          property="og:image"
          content="https://antonshubin.com/img/photo-big.webp"
        />
        <meta property="og:site_name" content="Anton Shubin" />
        <meta property="og:locale" content="en_US" />

        {/* Minimal critical CSS to prevent FOUC while CSS loads */}
        <style>{`html,body{background-color:#0f172a}body,a,button{color:#e2e8f0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}`}</style>

        {/* Preload LCP hero image with fetchpriority */}
        <link
          rel="preload"
          href="/img/photo-mobile.webp"
          as="image"
          type="image/webp"
          media="(max-width: 640px)"
          fetchpriority="high"
        />
        <link
          rel="preload"
          href="/img/photo-big.webp"
          as="image"
          type="image/webp"
          media="(min-width: 641px)"
          fetchpriority="high"
        />

        {/* Favicon + Apple Touch Icons (modern sizes only) */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* JSON-LD Structured Data — multiple schemas for AI crawlers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  "@id": "https://antonshubin.com/#person",
                  "name": "Anton Shubin",
                  "jobTitle": "Fractional CTO & Lead Architect",
                  "description":
                    "I take non-technical founders from napkin sketch to production. Fixed-price milestones. Zero-bloat architecture. No dev-team drama.",
                  "url": "https://antonshubin.com",
                  "knowsAbout": [
                    "Software Architecture",
                    "SaaS Development",
                    "Backend Engineering",
                    "AI Integration",
                    "Cloud Infrastructure",
                    "Deno",
                    "PostgreSQL",
                    "System Design",
                    "System Performance Optimization",
                  ],
                  "worksFor": {
                    "@type": "Organization",
                    "name": "NeatSoft PTE LTD",
                    "url": "https://neatsoft.dev",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://antonshubin.com/#website",
                  "url": "https://antonshubin.com",
                  "name": "Anton Shubin — Fractional CTO & Lead Architect",
                  "description": description,
                  "inLanguage": "en-US",
                  "publisher": { "@id": "https://antonshubin.com/#person" },
                },
                {
                  "@type": "BreadcrumbList",
                  "@id": "https://antonshubin.com/#breadcrumb",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": "https://antonshubin.com",
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Catalog",
                      "item": "https://antonshubin.com/catalog",
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "How I Work",
                      "item": "https://antonshubin.com/how-i-work",
                    },
                    {
                      "@type": "ListItem",
                      "position": 4,
                      "name": "Blog",
                      "item": "https://antonshubin.com/blog",
                    },
                    {
                      "@type": "ListItem",
                      "position": 5,
                      "name": "Projects",
                      "item": "https://antonshubin.com/projects",
                    },
                  ],
                },
              ],
            }),
          }}
        />
        {PLAUSIBLE_URL && (
          <script defer data-domain="antonshubin.com" src={PLAUSIBLE_URL} />
        )}
        {UMAMI_URL && UMAMI_ID && (
          <script defer src={UMAMI_URL} data-website-id={UMAMI_ID} />
        )}
      </head>
      <body class="h-full">
        <a
          href="#main-content"
          class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-orange-600 focus:text-white focus:font-semibold"
        >
          Skip to main content
        </a>
        <Component />
        <script
          dangerouslySetInnerHTML={{
            __html:
              `if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");`,
          }}
        />
      </body>
    </html>
  );
});
