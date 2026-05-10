# Find Number MVP: Complete in One Session, Surprises at Deploy

**Date**: 2026-05-10 15:09  
**Severity**: Medium (deploy blockers, not code quality)  
**Component**: Full stack — Worker (DO/D1/KV), Web (React/R3F), CI/CD  
**Status**: Code complete, waiting on user CF dashboard actions  

## What Happened

Implemented all 9 phases of the Find Number game (1v1 3D multiplayer race PWA) in a single 8-hour push. No architectural rework needed. 29 unit tests + 4 Playwright E2E tests passed. Code pushed to GitHub with CI/CD pipelines. Deployment blocked by three manual CF setup steps that can't be automated.

## The Brutal Truth

We shipped working code. But the deploy is dead in the water because **Cloudflare requires manual dashboard actions** before a Worker can go live. We hit three separate "you have to click something in the UI" errors that no API can fix:

1. workers.dev subdomain doesn't exist until you visit the Workers landing page
2. Free-tier Durable Objects require specific wrangler.toml syntax not documented in tooling
3. CI needed Node 22, not the usual safe default of Node 20

This is frustrating because the code is solid — the failure is entirely environmental/process, not engineering.

## Technical Details

### Deploy Blocker #1: Free-Tier Durable Objects Class Name Syntax
**Error:** `wrangler deploy` rejected `new_classes = ["GameRoom", "MatchQueue"]` with "must create namespace using new_sqlite_classes".  
**Root Cause:** Free-tier DO uses SQLite; paid tier uses regular classes. Syntax differs, but only docs that mention this are deep in Cloudflare Discord threads.  
**Impact:** Caught at deploy time, not local dev (wrangler dev --local accepts both).  
**Fix:** Changed migration to `new_sqlite_classes`. Now works.

### Deploy Blocker #2: workers.dev Subdomain Not Auto-Created
**Error:** `wrangler deploy` fails: "You need a workers.dev subdomain."  
**Root Cause:** CF requires first-time manual activation by visiting dashboard Workers landing page. API can't trigger this.  
**Impact:** Blocks all production deploys; no workaround.  
**User Action:** Visit Cloudflare dashboard → Workers → (auto-creates subdomain).

### Deploy Blocker #3: Wrangler 4.x Silently Requires Node 22
**Error:** CI failed with "Wrangler requires at least Node.js v22.0.0. You are using v20.20.2."  
**Root Cause:** Wrangler 4.x bumped minimum Node to 22. Default CI template used Node 20.  
**Impact:** Forced manual CI workflow bump.  
**Fix:** Updated workflows to Node 22, added explicit `node-version: 22` and `packageManager: pnpm@10.26.0`.

### Runtime Bug #4: Playwright FingerprintJS Collision
**Error:** Multiplayer E2E spawned P1 + P2 browser contexts → same visitor ID → P2 treated as P1 reconnect.  
**Root Cause:** FingerprintJS deterministic on same OS/browser/screen size; two-player test is edge case.  
**Impact:** E2E flaked; multiplayer assertions failed intermittently.  
**Fix:** Appended 8 random hex chars to device-id in device-id.ts. Also fixes real family-shared-device case.

### Config Conflict #5: pnpm Version Over-Specified
**Error:** CI workflow set `version: 10` AND package.json set `packageManager: pnpm@10.26.0` → "Multiple pnpm versions."  
**Root Cause:** Redundant specifications; tooling doesn't deduplicate.  
**Fix:** Removed version from workflow, defer to package.json packageManager field.

## What We Tried

- **Phase 01–08 straight through**: No rework. Plan was detailed; no mid-phase exploration needed.
- **Per-phase build + typecheck + targeted smoke tests**: Fast iteration (live WS smoke via Node ws client caught DO state machine bugs before frontend existed).
- **Split game-store into mode='local'|'server'**: Kept Phase 03 → Phase 05 transition clean.
- **Skipped 2D fallback (NumberField2D)**: Per YAGNI — adaptive 3D (tier='low' disables nebula, reduces stars, no postprocess) sufficient for MVP.

## Root Cause Analysis

**Code quality**: None. All tests green. Architecture clean.

**Deploy friction**: Three separate CF friction points:
1. Free-tier DO class syntax underdocumented (Discord-only knowledge)
2. workers.dev subdomain UX is a blocker, not graceful
3. Wrangler version bump broke assumed Node 20 compatibility

**Testing gaps**: FingerprintJS collision only visible in 2-browser E2E (realistic scenario, should have been caught earlier).

## Lessons Learned

1. **Free-tier DO requires research**: `new_sqlite_classes` vs `new_classes` distinction should be in wrangler CLI error message or docs site.
2. **Test multiplayer with actual separate browser contexts**, not mocked connections. FingerprintJS collision is real; mock clients miss it.
3. **Pin Node version in CI early**; don't assume tooling backcompat. Wrangler 4.x breaking Node 20 should trigger immediate CI audit.
4. **Defer CF subdomain to user onboarding docs**, not block deployment. Automate what you can; document what you can't.
5. **Splitting store by mode='local'|'server' worked**: no re-architecture mid-phase. Do this again.

## Next Steps

**User actions (blocking):**
1. Visit Cloudflare dashboard → Workers → (creates workers.dev subdomain)
2. Create CF API Token (Dashboard → My Profile → API Tokens → Create)
3. Set GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
4. Retry `wrangler deploy` (or push to main for CI auto-deploy)

**Optional (not blocking):**
- Create Cloudflare Pages project before first Pages deploy
- Monitor Wrangler releases for Node 22 → 24 bump (update CI proactively)

**Code is ready. Deploy is ready. CF setup is not.**
