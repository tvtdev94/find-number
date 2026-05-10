# Phase 01: Setup Monorepo & Deploy Skeleton

## Context Links
- Brainstorm §4: [Final Architecture](../reports/brainstorm-260510-1509-find-number-game.md)

## Overview
- **Priority:** Critical (blocks all)
- **Status:** pending
- **Effort:** ~1 day
Bootstrap monorepo skeleton, CI-able, deploy hello-world to Cloudflare to validate pipeline.

## Key Insights
- pnpm workspaces nhẹ hơn Turborepo cho scope này
- Wrangler 3+ supports modular Worker + DO + D1 từ 1 config
- Vite + vite-plugin-pwa cho PWA out-of-box

## Requirements
- Monorepo build green
- `apps/web` chạy `pnpm dev` mở browser hello-world
- `apps/worker` chạy `wrangler dev` trả về `{ok: true}` từ `/health`
- `packages/shared` import được từ cả web + worker
- D1 database created, migration `0001_init.sql` apply OK

## Architecture

```
find-number/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── apps/
│   ├── web/                 # Vite + React + TS + R3F (skeleton)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   └── src/main.tsx
│   └── worker/              # CF Worker + Hono + DO + D1
│       ├── package.json
│       ├── wrangler.toml
│       ├── tsconfig.json
│       ├── migrations/0001_init.sql
│       └── src/index.ts
└── packages/
    └── shared/              # Protocol types
        ├── package.json
        ├── tsconfig.json
        └── src/index.ts
```

## Related Code Files
**Create:**
- `pnpm-workspace.yaml`
- `package.json` (root)
- `tsconfig.base.json`
- `apps/web/*` (Vite scaffold + R3F deps)
- `apps/worker/*` (Wrangler init + Hono)
- `packages/shared/src/index.ts` (export GAME_CONFIG constant)
- `apps/worker/migrations/0001_init.sql` (players + matches schema)
- `.gitignore`, `.editorconfig`, `.prettierrc`

## Implementation Steps

1. `pnpm init` at root, create `pnpm-workspace.yaml`:
   ```yaml
   packages: ['apps/*', 'packages/*']
   ```
2. Add `tsconfig.base.json` with strict mode, target ES2022, paths for `@shared/*`
3. Scaffold web: `pnpm create vite apps/web --template react-ts`
4. Install web deps: `react-three-fiber @react-three/drei three troika-three-text zustand tailwindcss vite-plugin-pwa`
5. Scaffold worker: `pnpm dlx wrangler init apps/worker --type=javascript --no-deploy`, convert to TS
6. Install worker deps: `hono`, `@cloudflare/workers-types`
7. Configure `wrangler.toml`:
   - `[[durable_objects.bindings]]` for `GAME_ROOM`, `MATCH_QUEUE`
   - `[[d1_databases]]` for `DB`
   - `[[kv_namespaces]]` for `SESSIONS`
8. Create D1 DB: `wrangler d1 create find-number-db`, paste binding ID
9. Write `migrations/0001_init.sql` with players + matches tables (per brainstorm §4 schema)
10. Apply migration: `wrangler d1 migrations apply find-number-db --local`
11. Create `packages/shared/src/index.ts` exporting `GAME_CONFIG = { ROUNDS: 10, RANGE: 100 }`
12. Worker `/health` endpoint via Hono returns `{ok: true, env: c.env}`
13. Web `App.tsx` calls `/health` in dev (proxy to wrangler 8787)
14. Add npm scripts: `dev`, `build`, `deploy` at root running `pnpm -r ...`
15. Run `pnpm dev` → both servers up → browser shows OK
16. Verify deploy dry-run: `wrangler deploy --dry-run`

## Todo List
- [ ] Init pnpm workspace + root config
- [ ] Scaffold `apps/web` (Vite + React + TS)
- [ ] Add R3F + Tailwind + PWA plugin to web
- [ ] Scaffold `apps/worker` (Wrangler + Hono)
- [ ] Configure `wrangler.toml` with DO + D1 + KV bindings
- [ ] Create D1 DB and apply initial migration
- [ ] Create `packages/shared` with GAME_CONFIG
- [ ] Wire `/health` endpoint and frontend fetch
- [ ] Verify `pnpm dev` works end-to-end
- [ ] Verify `wrangler deploy --dry-run` clean

## Success Criteria
- `pnpm dev` runs web + worker concurrently with no errors
- D1 schema applied, `wrangler d1 execute --command "SELECT name FROM sqlite_master"` lists tables
- Frontend logs `{ok: true}` from `/health`
- TypeScript: zero errors via `pnpm -r tsc --noEmit`

## Risk Assessment
- **Wrangler binding misconfig** — Mitigation: copy template from CF docs, verify with `wrangler types`
- **DO not migrating cleanly** — Mitigation: use `[[migrations]]` block in wrangler.toml from start

## Security Considerations
- `.env` files gitignored
- D1 binding IDs in `wrangler.toml` are non-secret but pin in repo

## Next Steps
- Phase 02: build 3D scene on top of `apps/web` skeleton
- Phase 04: extend worker with GameRoom DO
