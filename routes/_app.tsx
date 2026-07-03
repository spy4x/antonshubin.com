import { define } from "../lib/utils.ts";
import { UMAMI_ID, UMAMI_URL } from "../lib/config.ts";
import SWUpdater from "../islands/SWUpdater.tsx";
import { resetHead } from "../lib/head.ts";

export default define.page(function App({ Component }) {
  resetHead();

  return (
    <html lang="en" class="h-full bg-slate-900">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="theme-color" content="#0f172a" />

        {/* Minimal critical CSS to prevent FOUC while CSS loads */}
        <style>
          {`html,body{background-color:#0f172a}body,a,button{color:#e2e8f0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}`}
        </style>

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

        {/* Analytics */}
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
        <SWUpdater />
      </body>
    </html>
  );
});
