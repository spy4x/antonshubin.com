#!/usr/bin/env bash
# Fills infra/envs/.env of the Seed copy in $1 with throwaway local values: random
# secrets, a project name of its own, the admin profile and spare host ports.
set -euo pipefail
f="$1/infra/envs/.env"
r() { openssl rand -hex 24; }
sed -i \
  -e "s/^PROJECT=.*/PROJECT=seeddemo455/" \
  -e "s/^COMPOSE_PROFILES=.*/COMPOSE_PROFILES=admin/" \
  -e "s/^KV_PASSWORD=.*/KV_PASSWORD=$(r)/" \
  -e "s/^AUTH_COOKIE_SECRET=.*/AUTH_COOKIE_SECRET=$(r)$(r)/" \
  -e "s/^AUTH_PEPPER=.*/AUTH_PEPPER=$(r)$(r)/" \
  -e "s/^SEED_PASSWORD=.*/SEED_PASSWORD=demo-$(openssl rand -hex 8)/" \
  -e "s/^DB_HOST_PORT=.*/DB_HOST_PORT=127.0.0.1:55432/" \
  -e "s/^KV_HOST_PORT=.*/KV_HOST_PORT=127.0.0.1:56380/" \
  -e "s/^GRAFANA_HOST_PORT=.*/GRAFANA_HOST_PORT=127.0.0.1:53000/" \
  -e "s/^DENO_LOG=.*/DENO_LOG=info/" \
  "$f"
