---
title: Find-Number Game (3D Multiplayer)
date: 2026-05-10
status: pending
slug: find-number-game
blockedBy: []
blocks: []
---

# Plan: Find-Number Game

## Context
- Brainstorm: [../reports/brainstorm-260510-1509-find-number-game.md](../reports/brainstorm-260510-1509-find-number-game.md)
- Stack: Cloudflare Workers + DO + D1 / Vite + React + R3F / PWA
- Scope: Full MVP — link room, matchmaking, leaderboard week/month/year
- Mode: Race 1v1, best-of-10, no penalty, P1 red / P2 blue

## Goal
Ship playable 1v1 number-finding 3D game on mobile web with shareable room link, matchmaking, and time-windowed leaderboards.

## Phases

| # | Phase | Status | Depends |
|---|---|---|---|
| 01 | [Setup monorepo & deploy skeleton](phase-01-setup-monorepo.md) | pending | — |
| 02 | [3D Galaxy scene + 100 numbers](phase-02-3d-scene.md) | pending | 01 |
| 03 | [Local game logic + scoring](phase-03-game-logic-local.md) | pending | 02 |
| 04 | [GameRoom Durable Object + WS protocol](phase-04-backend-rooms-do.md) | pending | 01 |
| 05 | [Multiplayer integration (frontend ↔ DO)](phase-05-multiplayer-integration.md) | pending | 03, 04 |
| 06 | [Matchmaking queue](phase-06-matchmaking.md) | pending | 04 |
| 07 | [Leaderboard (week/month/year)](phase-07-leaderboard.md) | pending | 04 |
| 08 | [PWA + mobile polish + reconnect](phase-08-polish-pwa.md) | pending | 05, 06, 07 |
| 09 | [E2E tests + production deploy](phase-09-test-deploy.md) | pending | 08 |

## Key Dependencies
- pnpm 9+, Node 20+
- Cloudflare account (Workers paid plan optional, free works for MVP)
- Wrangler 3+
- Domain (optional) for prod

## Critical Decisions
- Monorepo via pnpm workspaces
- WebSocket via Durable Objects (not Socket.io)
- 3D via React Three Fiber + drei
- No auth — device fingerprint as identity

## Success Criteria
- 2 phones connect via shared link, play 10 rounds, see leaderboard
- 60fps target, <200ms p95 click latency
- All E2E tests pass
- Deployed to Cloudflare Pages + Worker
