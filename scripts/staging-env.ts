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
  if (!/^[a-z0-9.-]+$/i.test(prodDomain)) {
    throw new Error("DOMAIN in the production env is not a bare host name");
  }
  const resolved = prodEnv.replaceAll("${DOMAIN}", prodDomain);
  // Compose also expands `$DOMAIN` and `${DOMAIN:-…}`; this helper does not,
  // so refuse them rather than let staging silently point at the staging host.
  const other = resolved.match(/^(?:export\s+)?(\w+)=.*\$\{?DOMAIN\b/m);
  if (other) {
    throw new Error(
      `${other[1]} refers to DOMAIN in a form other than \${DOMAIN}`,
    );
  }
  // Anchor both replacements: an unanchored /DOMAIN=.*/ also matches the tail
  // of WWW_DOMAIN=.
  return resolved
    .replace(/^DOMAIN=.*$/m, `DOMAIN=${stagingHost}`)
    .replace(/^WWW_DOMAIN=.*$/m, `WWW_DOMAIN=${stagingHost}`);
}
