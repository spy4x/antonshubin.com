/**
 * Rents and deletes the throwaway Hetzner Cloud server the rostok clip deploys to.
 *
 * ```bash
 * deno run --allow-net=api.hetzner.cloud --allow-env --allow-run -R -W vm.ts up <dir>
 * deno run --allow-net=api.hetzner.cloud --allow-env vm.ts down
 * ```
 *
 * `up` writes a fresh SSH key into `<dir>`, registers it, creates the cheapest x86 server with
 * Docker installed by cloud-init, waits until `docker compose version` answers over SSH, and
 * writes the server's IPv4 address to `<dir>/ip`. `down` deletes every server and SSH key that
 * carries the label {@link LABEL}, waits until none is left and prints what it deleted. Both
 * read `HETZNER_CLOUD_API_TOKEN` from the environment; it goes to the API in a header only.
 * Behaviour ported from spy4x/rostok `scripts/e2e-vps/`.
 *
 * @module
 */
import { join } from "@std/path";

/** Every object this script creates carries this label; `down` deletes only those. */
export const LABEL = "antonshubin-clip";
const API = "https://api.hetzner.cloud/v1";
const KINDS = ["servers", "ssh_keys"] as const;
const CLOUD_INIT = `#cloud-config
runcmd:
  - curl -fsSL https://get.docker.com | sh
`;

// deno-lint-ignore no-explicit-any
type Json = any;

function token(): string {
  const t = Deno.env.get("HETZNER_CLOUD_API_TOKEN")?.trim();
  if (!t) throw new Error("HETZNER_CLOUD_API_TOKEN is not set");
  return t;
}

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<Json> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(
      `Hetzner API ${method} ${path}: ${res.status} ${json?.error?.code ?? ""}`,
    );
  }
  return json;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Calls `probe` every 5 s until it returns a value, or throws once `ms` have passed. */
async function waitFor<T>(
  what: string,
  ms: number,
  probe: () => Promise<T | undefined>,
) {
  const end = Date.now() + ms;
  let last = "";
  while (Date.now() < end) {
    try {
      const value = await probe();
      if (value !== undefined) return value;
    } catch (err) {
      last = (err as Error).message;
    }
    await sleep(5_000);
  }
  throw new Error(`gave up waiting for ${what}${last ? `: ${last}` : ""}`);
}

async function run(argv: string[]): Promise<{ code: number; out: string }> {
  const r = await new Deno.Command(argv[0], {
    args: argv.slice(1),
    stdin: "null",
  }).output();
  const d = new TextDecoder();
  return { code: r.code, out: d.decode(r.stdout) + d.decode(r.stderr) };
}

/** Every labelled object of one kind; filtered again in case the API ignored the selector. */
async function listLabelled(kind: (typeof KINDS)[number]): Promise<Json[]> {
  const json = await call(
    "GET",
    `/${kind}?label_selector=${LABEL}&per_page=50`,
  );
  return (json[kind] as Json[]).filter((o) =>
    o.labels && Object.hasOwn(o.labels, LABEL)
  );
}

async function up(dir: string): Promise<void> {
  const runId = new Date().toISOString().replace(/\.\d+Z$/, "z").replace(
    /[-:]/g,
    "",
  )
    .toLowerCase();
  const key = join(dir, "id_ed25519");
  const kg = await run([
    "ssh-keygen",
    "-q",
    "-t",
    "ed25519",
    "-N",
    "",
    "-C",
    "demo",
    "-f",
    key,
  ]);
  if (kg.code !== 0) throw new Error(`ssh-keygen failed: ${kg.out}`);
  const publicKey = (await Deno.readTextFile(`${key}.pub`)).trim();
  const labels = { [LABEL]: runId };
  const keyId = (await call("POST", "/ssh_keys", {
    name: `${LABEL}-${runId}`,
    public_key: publicKey,
    labels,
  })).ssh_key.id;

  const types = (await call("GET", "/server_types?per_page=50"))
    .server_types as Json[];
  const offers = types
    .filter((t) => t.architecture === "x86" && !t.deprecated && !t.deprecation)
    .flatMap((t) =>
      (t.prices ?? []).map((p: Json) => ({
        type: t.name as string,
        location: p.location as string,
        hourly: Number(p.price_hourly.net),
      }))
    )
    .sort((a, b) => a.hourly - b.hourly || a.location.localeCompare(b.location))
    .slice(0, 6);
  let server: Json;
  const errors: string[] = [];
  for (const offer of offers) {
    try {
      server = (await call("POST", "/servers", {
        name: `${LABEL}-${runId}`,
        server_type: offer.type,
        location: offer.location,
        image: "ubuntu-24.04",
        ssh_keys: [keyId],
        labels,
        user_data: CLOUD_INIT,
      })).server;
      console.log(
        `created ${offer.type} in ${offer.location} (${offer.hourly} EUR/h)`,
      );
      break;
    } catch (err) {
      errors.push(`${offer.type}@${offer.location}: ${(err as Error).message}`);
    }
  }
  if (!server) throw new Error(`no server created:\n${errors.join("\n")}`);
  const ip: string = await waitFor("the server to run", 180_000, async () => {
    const s = (await call("GET", `/servers/${server.id}`)).server;
    return s.status === "running" ? s.public_net?.ipv4?.ip : undefined;
  });
  const ssh = [
    "ssh",
    "-i",
    key,
    "-o",
    "IdentitiesOnly=yes",
    "-o",
    "IdentityAgent=none",
    "-o",
    `UserKnownHostsFile=${join(dir, "known_hosts")}`,
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=10",
    `root@${ip}`,
  ];
  await waitFor("Docker on the server", 600_000, async () => {
    const r = await run([
      ...ssh,
      "test -f /var/lib/cloud/instance/boot-finished && docker compose version",
    ]);
    if (r.code !== 0) throw new Error(r.out.trim().split("\n").at(-1) ?? "");
    return true;
  });
  await Deno.writeTextFile(join(dir, "ip"), ip);
  console.log("server is up, Docker answers");
}

async function down(): Promise<void> {
  await waitFor("every labelled object to be deleted", 180_000, async () => {
    let left = 0;
    for (const kind of KINDS) {
      for (const o of await listLabelled(kind)) {
        left++;
        try {
          await call("DELETE", `/${kind}/${o.id}`);
          console.log(`deleted ${kind} ${o.name}`);
        } catch (err) {
          // A server that is still being created refuses the delete; the next round retries.
          console.log(`retrying ${kind} ${o.name}: ${(err as Error).message}`);
        }
      }
    }
    if (left === 0) return true;
  });
  for (const kind of KINDS) {
    console.log(
      `${kind} labelled ${LABEL} left: ${(await listLabelled(kind)).length}`,
    );
  }
}

if (import.meta.main) {
  const [cmd, dir] = Deno.args;
  try {
    if (cmd === "up" && dir) await up(dir);
    else if (cmd === "down") await down();
    else throw new Error("usage: vm.ts up <dir> | down");
  } catch (err) {
    console.error((err as Error).message);
    Deno.exit(1);
  }
}
