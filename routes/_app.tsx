import { define } from "../lib/utils.ts";

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

        {/* Preload critical images for LCP optimization */}
        <link
          rel="preload"
          href="/img/photo-mobile.webp"
          as="image"
          type="image/webp"
          media="(max-width: 640px)"
        />
        <link
          rel="preload"
          href="/img/photo-big.webp"
          as="image"
          type="image/webp"
          media="(min-width: 641px)"
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.upwork.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.upwork.com" />

        {/* Favicon / Apple Touch Icons */}
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/apple-icon-57x57.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/apple-icon-60x60.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/apple-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/apple-icon-76x76.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/apple-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/apple-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-icon-180x180.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-icon-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />

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
        <script
          defer
          data-domain="antonshubin.com"
          src="https://analytics.antonshubin.com/js/script.js"
        />
        <script
          defer
          src="https://stats.antonshubin.com/script.js"
          data-website-id="288aa145-0bba-48d8-960e-94bc4f8e17a1"
        />
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
