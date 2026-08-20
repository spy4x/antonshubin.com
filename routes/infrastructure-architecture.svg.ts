import { define } from "../lib/utils.ts";

export const handler = define.handlers({
  GET() {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" role="img" aria-labelledby="title description">
  <title id="title">Production operations lifecycle</title>
  <desc id="description">Product delivery flows through deployment, observability, and recovery.</desc>
  <rect width="800" height="320" rx="16" fill="#111827"/>
  <text x="400" y="54" text-anchor="middle" fill="#f97316" font-family="system-ui" font-size="24" font-weight="700">Production Operations Lifecycle</text>
  <g font-family="system-ui" font-size="18" font-weight="600" text-anchor="middle">
    <rect x="45" y="120" width="150" height="72" rx="12" fill="#1f2937" stroke="#f97316"/>
    <text x="120" y="163" fill="#f9fafb">Product</text>
    <rect x="230" y="120" width="150" height="72" rx="12" fill="#1f2937" stroke="#f97316"/>
    <text x="305" y="163" fill="#f9fafb">Deploy</text>
    <rect x="415" y="120" width="150" height="72" rx="12" fill="#1f2937" stroke="#f97316"/>
    <text x="490" y="163" fill="#f9fafb">Observe</text>
    <rect x="600" y="120" width="150" height="72" rx="12" fill="#1f2937" stroke="#f97316"/>
    <text x="675" y="163" fill="#f9fafb">Recover</text>
  </g>
  <g stroke="#9ca3af" stroke-width="3">
    <path d="M195 156h35"/><path d="M380 156h35"/><path d="M565 156h35"/>
  </g>
  <text x="400" y="255" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="17">Versioned delivery · failure detection · recovery planning · clean handoff</text>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
});
