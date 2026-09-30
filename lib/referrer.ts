/**
 * The referrer policy of the pages whose URL carries a token (#327):
 * `/unsubscribe` and `/subscribe/confirm`. `strict-origin` sends the next page
 * only `https://antonshubin.com/`, never the path or token, and unlike
 * `no-referrer` it leaves the page's own form POST a real `Origin` header.
 * With `no-referrer` that POST sends `Origin: null`, which Fresh's `csrf()`
 * passes only with `Sec-Fetch-Site: same-origin`, and Safari before 16.4 does
 * not send that header, so the buttons would answer 403 there.
 *
 * `routes/_middleware.ts` sends it as a header and `routes/_app.tsx` as a
 * `<meta name="referrer">`, because the proxy in front of the site overwrites
 * the header and a meta policy wins for the document.
 */
export const TOKEN_PAGE_REFERRER_POLICY = "strict-origin";

/** The policy for `pathname`, or `undefined` for a page that keeps the default.
 * A trailing slash serves the same page, so it counts. */
export function referrerPolicyFor(pathname: string): string | undefined {
  const page = pathname.replace(/\/+$/, "") || "/";
  return page === "/unsubscribe" || page === "/subscribe/confirm"
    ? TOKEN_PAGE_REFERRER_POLICY
    : undefined;
}
