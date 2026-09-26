/**
 * Builds staging's env file from production's.
 *
 * Only `DOMAIN` and `WWW_DOMAIN` move to the staging host. Every other value
 * that refers to `${DOMAIN}` (the SMTP relay, the sender, the contact inbox, the
 * booking page) names a service that exists only on the production domain, so
 * it is resolved against production's `DOMAIN` first. Without that, staging
 * sent mail to `mail.<staging host>`, which has no DNS record.
 *
 * `WWW_DOMAIN` is pinned to the staging host itself, not `www.<staging host>`:
 * that name has no DNS record, Traefik would request a certificate for it, and
 * Let's Encrypt would fail the whole order, leaving staging with none.
 */
export function stagingEnv(prodEnv: string, stagingHost: string): string {
  const prodDomain = prodEnv.match(/^DOMAIN=(.*)$/m)?.[1]?.trim();
  if (!prodDomain) throw new Error("DOMAIN is missing from the production env");
  // Anchor both replacements: an unanchored /DOMAIN=.*/ also matches the tail
  // of WWW_DOMAIN=.
  return prodEnv
    .replaceAll("${DOMAIN}", prodDomain)
    .replace(/^DOMAIN=.*$/m, `DOMAIN=${stagingHost}`)
    .replace(/^WWW_DOMAIN=.*$/m, `WWW_DOMAIN=${stagingHost}`);
}
