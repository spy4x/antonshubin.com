import { define } from "../lib/utils.ts";
import { UMAMI_ID, UMAMI_PRECONNECT_ORIGIN, UMAMI_URL } from "../lib/config.ts";
import SWUpdater from "../islands/SWUpdater.tsx";
import { resetHead } from "../lib/head.ts";
import { isBot } from "../lib/bots.ts";

export default define.page(function App({ Component, req }) {
  resetHead();

  // Known bots (issue #179) get no analytics script: deciding here, before
  // anything renders, means no regex rewriting the response body afterward.
  const isCrawler = isBot(req.headers.get("user-agent") || "");

  return (
    <html lang="en" class="h-full bg-ink">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="theme-color" content="#15120f" />

        {/* Minimal critical CSS to prevent FOUC while CSS loads */}
        <style>
          {`html,body{background-color:#15120f}body{color:#efebe2}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}`}
        </style>

        {
          /* Font budget (#184): only the two files the first paint needs —
            Literata 600 for the H1, Plex Sans 400 for body text — Latin
            subset only (a Cyrillic-only visitor repaints once the matching
            Cyrillic file arrives unpreloaded, same as any other subset).
            fetchpriority="low": the home page's actual LCP element is the
            hero <img fetchpriority="high"> (routes/index.tsx), not text —
            an unprioritized font preload competed with it for bandwidth on
            a throttled connection and pushed LCP out (see the PR body's
            before/after numbers); low keeps these two requests from ever
            outrunning that image while still starting well before the
            fonts would otherwise be discovered. */
        }
        <link
          rel="preload"
          href="/fonts/literata-latin-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
          fetchpriority="low"
        />
        <link
          rel="preload"
          href="/fonts/ibm-plex-sans-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
          fetchpriority="low"
        />

        {/* Favicon + Apple Touch Icons (modern sizes only) */}
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
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-icon-180x180.png"
        />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* RSS feed discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Anton Shubin — Blog"
          href="https://antonshubin.com/rss.xml"
        />

        {/* Analytics — skipped for known bots, see isCrawler above */}
        {UMAMI_URL && UMAMI_ID && !isCrawler && (
          <>
            {UMAMI_PRECONNECT_ORIGIN && (
              <>
                <link rel="preconnect" href={UMAMI_PRECONNECT_ORIGIN} />
                <link rel="dns-prefetch" href={UMAMI_PRECONNECT_ORIGIN} />
              </>
            )}
            <script
              defer
              src={UMAMI_URL}
              data-website-id={UMAMI_ID}
              data-performance="true"
            />
          </>
        )}
      </head>
      <body class="h-full">
        <a
          href="#main-content"
          class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-accent focus:text-ink focus:font-semibold"
        >
          Skip to main content
        </a>
        <Component />
        <SWUpdater />
      </body>
    </html>
  );
});
