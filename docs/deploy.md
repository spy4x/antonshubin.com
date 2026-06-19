# Deploy

```bash
deno task deploy
```

Decrypt env before deploy if needed:

```bash
deno task env:decrypt
```

## Env files

| File            | Git       | Use                  |
| --------------- | --------- | -------------------- |
| `.env`          | ignored   | local dev            |
| `.env.prod`     | ignored   | prod secrets         |
| `.env.prod.age` | committed | encrypted (SOPS+age) |
| `.env.example`  | committed | template             |

## Age key

```bash
age-keygen -o .age/key.txt
# copy public key from output → paste into .sops.yaml
```

## Verify

```bash
ssh homelab 'docker compose ps'
curl -I https://antonshubin.com
```
