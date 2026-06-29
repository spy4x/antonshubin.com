import { Head } from "fresh/runtime";
import { breadcrumbFromCanonical, head } from "../lib/head.ts";
import { SAME_AS_URLS } from "../lib/config.ts";

export function SEOHead() {
  const h = head.value;

  return (
    <Head>
      {/* Primary meta */}
      <title>{h.title}</title>
      <meta name="description" content={h.description} />
      <link rel="canonical" href={h.canonical} />
      <meta name="robots" content="index, follow" />

      {/* Twitter Card — large summary with image */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@antonshubin" />
      <meta name="twitter:title" content={h.title} />
      <meta name="twitter:description" content={h.description} />
      <meta name="twitter:image" content={h.ogImage} />

      {/* Open Graph */}
      <meta property="og:type" content={h.ogType} />
      <meta property="og:title" content={h.title} />
      <meta property="og:description" content={h.description} />
      <meta property="og:url" content={h.canonical} />
      <meta property="og:image" content={h.ogImage} />
      <meta property="og:site_name" content="Anton Shubin" />
      <meta property="og:locale" content="en_US" />

      {/* JSON-LD Structured Data */}
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
                "givenName": "Anton",
                "familyName": "Shubin",
                "jobTitle": "Fractional CTO & Lead Architect",
                "description":
                  "I take non-technical founders from napkin sketch to production. Fixed-price milestones. Zero-bloat architecture. No dev-team drama.",
                "url": "https://antonshubin.com",
                "image": "https://antonshubin.com/img/photo-big.webp",
                "email": "mailto:hello@antonshubin.com",
                "knowsLanguage": ["en", "ru"],
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
                "award": [
                  "Upwork Expert-Vetted",
                  "Upwork 100% Job Success",
                  "$395K+ earned on Upwork across 80+ projects",
                ],
                "sameAs": [...SAME_AS_URLS],
                "worksFor": {
                  "@type": "Organization",
                  "@id": "https://neatsoft.dev/#org",
                  "name": "NeatSoft PTE LTD",
                  "url": "https://neatsoft.dev",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://neatsoft.dev/#org",
                "name": "NeatSoft PTE LTD",
                "url": "https://neatsoft.dev",
                "founder": { "@id": "https://antonshubin.com/#person" },
              },
              {
                "@type": "WebSite",
                "@id": "https://antonshubin.com/#website",
                "url": "https://antonshubin.com",
                "name": "Anton Shubin — Fractional CTO & Lead Architect",
                "description": h.description,
                "inLanguage": "en-US",
                "publisher": { "@id": "https://antonshubin.com/#person" },
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${h.canonical}#breadcrumb`,
                "itemListElement": breadcrumbFromCanonical(
                  h.canonical,
                  h.title,
                ),
              },
            ],
          }),
        }}
      />
    </Head>
  );
}
