# Phase 09: E2E Tests + Production Deploy

## Context Links
- All prior phases

## Overview
- **Priority:** High
- **Status:** pending
- **Effort:** ~1 day
End-to-end tests with Playwright (2-browser game), unit tests for game logic, deploy to Cloudflare Pages + Worker.

## Requirements
- Playwright E2E: full match flow, link share, quickmatch, reconnect, leaderboard
- Vitest unit: scoring, layout seed, time windows, anti-cheat
- Worker integration test with `unstable_dev` (Wrangler)
- CF deploy: Worker + Pages + D1 prod migration
- Custom domain (optional)

## Architecture

```
find-number/
├── tests/
│   ├── e2e/
│   │   ├── play-match.spec.ts
│   │   ├── reconnect.spec.ts
│   │   └── leaderboard.spec.ts
│   └── unit/
│       ├── scoring.test.ts
│       ├── layout-seed.test.ts
│       └── leaderboard-queries.test.ts
├── playwright.config.ts
└── .github/workflows/ci.yml
```

## Related Code Files
**Create:**
- `playwright.config.ts`
- `tests/e2e/play-match.spec.ts`
- `tests/e2e/reconnect.spec.ts`
- `tests/e2e/leaderboard.spec.ts`
- `tests/unit/*.test.ts`
- `.github/workflows/ci.yml`
- `apps/worker/src/__tests__/game-room.test.ts`

## Implementation Steps

1. Install: `playwright`, `vitest`, `@cloudflare/vitest-pool-workers`
2. `playwright.config.ts`: 2 projects (chromium-desktop, chromium-mobile-pixel5)
3. `play-match.spec.ts`: 2 browser contexts → create room → join via link → play 10 rounds → verify result
4. `reconnect.spec.ts`: kill WS mid-round → expect reconnect modal → reconnect → resume
5. `leaderboard.spec.ts`: seed matches via API → verify leaderboard tabs
6. Vitest unit tests for pure functions
7. Worker integration test with `unstable_dev`
8. GitHub Actions CI: install → lint → test → build
9. Production deploy:
   - `wrangler d1 migrations apply find-number-db --remote`
   - `wrangler deploy` (Worker)
   - Build web → `wrangler pages deploy apps/web/dist`
10. Configure custom domain in CF dashboard (optional)
11. Smoke test prod URL

## Todo List
- [ ] Install Playwright + Vitest
- [ ] Configure Playwright (desktop + mobile)
- [ ] Write play-match E2E
- [ ] Write reconnect E2E
- [ ] Write leaderboard E2E
- [ ] Write unit tests (scoring, seed, queries)
- [ ] Worker integration test
- [ ] GitHub Actions CI workflow
- [ ] Apply prod D1 migrations
- [ ] Deploy Worker
- [ ] Deploy Pages
- [ ] Smoke test prod
- [ ] (Optional) Custom domain

## Success Criteria
- All E2E tests green in CI
- All unit tests green
- Production URL playable end-to-end on phone
- Lighthouse mobile ≥ 80
- Zero console errors in prod

## Risk Assessment
- **CF DO + Pages cross-origin** — Mitigation: same origin via Worker route, or CORS config
- **D1 prod migration data loss** — Mitigation: dry-run + backup before
- **Playwright flake on WS** — Mitigation: explicit waits on event, no sleeps

## Security Considerations
- Secrets via `wrangler secret put`, not in repo
- HTTPS forced
- Restrict D1 access to Worker only

## Next Steps
- Post-MVP: friends list, tournaments, sounds, native apps (see brainstorm §7)
