import { GAME_CONFIG, type ClientMsg, type Player, type PlayerSlot, type ServerMsg } from '@find-number/shared'
import type { Env } from '../env'
import {
  ALL_NUMBERS,
  applyClick,
  decideMatchWinner,
  initialRoundState,
  nextRound,
  timeoutRound,
  type RoundState,
} from '../game/round-controller'
import { newLayoutSeed } from '../game/layout-seed'
import { RateLimiter } from '../game/anti-cheat'
import { insertMatch, newMatchId, upsertPlayer } from '../db/matches'
import { invalidateAll as invalidateLeaderboard } from '../cache/leaderboard-cache'

type ConnMeta = {
  slot: PlayerSlot
  deviceId: string
  nickname: string
  connected: boolean
  rate: RateLimiter
}

const ALARM_KIND_KEY = 'alarmKind'
type AlarmKind = 'roundTimeout' | 'reconnectGrace' | 'botClick'

type BotPlan = { round: number; willMiss: boolean }

// Bot reaction: 1000-2000ms typical, 20% miss → fair vs average human
const BOT_DELAY_MIN_MS = 1000
const BOT_DELAY_MAX_MS = 2000
const BOT_MISS_RATE = 0.2

export class GameRoom implements DurableObject {
  private state: DurableObjectState
  private env: Env
  private code: string = ''
  private round: RoundState
  private players: Map<PlayerSlot, ConnMeta> = new Map()
  private sockets: Map<WebSocket, PlayerSlot> = new Map()
  private ready: Set<PlayerSlot> = new Set()
  private startedAt: number = 0
  private disconnectAt: Map<PlayerSlot, number> = new Map()
  private botSlot: PlayerSlot | null = null
  private botPlan: BotPlan | null = null

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.round = initialRoundState(newLayoutSeed())

    // Restore hibernated WS sessions
    for (const ws of this.state.getWebSockets()) {
      const meta = ws.deserializeAttachment() as ConnMeta | null
      if (meta) {
        this.sockets.set(ws, meta.slot)
        this.players.set(meta.slot, meta)
      }
    }

    // Restore bot from storage (in case DO restarted between requests)
    this.state.blockConcurrencyWhile(async () => {
      const stored = (await this.state.storage.get('botSlot')) as PlayerSlot | null
      const code = (await this.state.storage.get('code')) as string | undefined
      if (code) this.code = code
      if (stored && !this.players.has(stored)) {
        this.botSlot = stored
        this.players.set(stored, {
          slot: stored,
          deviceId: `bot:${this.code || 'restored'}`,
          nickname: '🤖 Bot',
          connected: true,
          rate: new RateLimiter(),
        })
        this.ready.add(stored)
      } else if (stored) {
        this.botSlot = stored
        this.ready.add(stored)
      }
    })
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/init' && req.method === 'POST') {
      this.code = url.searchParams.get('code') ?? ''
      await this.state.storage.put('code', this.code)
      return new Response('ok')
    }

    if (url.pathname === '/init-bot' && req.method === 'POST') {
      this.code = url.searchParams.get('code') ?? ''
      await this.state.storage.put('code', this.code)
      // Pre-fill P2 slot as bot, auto-ready
      const botSlot: PlayerSlot = 'p2'
      this.botSlot = botSlot
      await this.state.storage.put('botSlot', botSlot)
      this.players.set(botSlot, {
        slot: botSlot,
        deviceId: `bot:${this.code}`,
        nickname: '🤖 Bot',
        connected: true,
        rate: new RateLimiter(),
      })
      this.ready.add(botSlot)
      return new Response('ok')
    }

    if (url.pathname === '/status') {
      const stored = (await this.state.storage.get('code')) as string | undefined
      this.code = this.code || stored || ''
      return Response.json({
        code: this.code,
        phase: this.round.phase,
        playerCount: this.players.size,
        full: this.players.size >= 2,
      })
    }

    if (url.pathname === '/ws') {
      const upgrade = req.headers.get('Upgrade')
      if (upgrade !== 'websocket') return new Response('Expected websocket', { status: 426 })
      return this.handleUpgrade(req)
    }

    return new Response('Not found', { status: 404 })
  }

  private async handleUpgrade(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const nickname = (url.searchParams.get('nickname') || 'Player').slice(0, 20)
    const deviceId = url.searchParams.get('deviceId') || crypto.randomUUID()
    const stored = (await this.state.storage.get('code')) as string | undefined
    this.code = this.code || stored || ''

    // Reconnect: same deviceId already in players
    let slot: PlayerSlot | null = null
    for (const [s, m] of this.players) {
      if (m.deviceId === deviceId) {
        slot = s
        break
      }
    }
    if (!slot) {
      if (!this.players.has('p1')) slot = 'p1'
      else if (!this.players.has('p2')) slot = 'p2'
      else {
        return new Response(JSON.stringify({ error: 'room full' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        })
      }
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    const meta: ConnMeta = {
      slot,
      deviceId,
      nickname,
      connected: true,
      rate: new RateLimiter(),
    }
    this.players.set(slot, meta)
    this.sockets.set(server, slot)
    this.disconnectAt.delete(slot)

    this.state.acceptWebSocket(server)
    server.serializeAttachment(meta)

    // Reconnect notification + snapshot
    if (this.round.phase !== 'lobby') {
      this.broadcast({ t: 'opponentReconnected' }, slot)
      this.sendSnapshot(server, slot)
    }
    this.broadcastLobby()
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return
    let msg: ClientMsg
    try {
      msg = JSON.parse(message) as ClientMsg
    } catch {
      return
    }
    const slot = this.sockets.get(ws)
    if (!slot) return
    const meta = this.players.get(slot)
    if (!meta) return

    switch (msg.t) {
      case 'ping':
        this.sendTo(ws, { t: 'pong' })
        return
      case 'ready':
        this.ready.add(slot)
        this.broadcastLobby()
        if (this.players.size === 2 && this.ready.size === 2) {
          this.startedAt = Date.now()
          this.advanceRound()
        }
        return
      case 'click': {
        if (!meta.rate.allow()) return
        if (typeof msg.number !== 'number') return
        const { state, hit } = applyClick(this.round, msg.number, slot)
        if (hit) {
          this.round = state
          this.broadcast({
            t: 'roundEnd',
            round: state.round,
            winner: slot,
            correctNumber: msg.number,
            scores: state.scores,
            found: state.found,
          })
          // schedule next round after brief pause
          await this.scheduleAlarm(1200, 'roundTimeout')
        }
        return
      }
      case 'rematch': {
        this.ready.add(slot)
        if (this.players.size === 2 && this.ready.size === 2) {
          this.round = initialRoundState(newLayoutSeed())
          this.ready.clear()
          this.startedAt = Date.now()
          this.advanceRound()
        }
        return
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const slot = this.sockets.get(ws)
    if (!slot) return
    this.sockets.delete(ws)
    const meta = this.players.get(slot)
    if (meta) meta.connected = false
    this.disconnectAt.set(slot, Date.now())
    this.broadcast({ t: 'opponentLeft' }, slot)
    // Grace period before forfeit
    await this.scheduleAlarm(GAME_CONFIG.RECONNECT_GRACE_MS, 'reconnectGrace')
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    return this.webSocketClose(ws)
  }

  async alarm(): Promise<void> {
    const kind = (await this.state.storage.get(ALARM_KIND_KEY)) as AlarmKind | undefined

    if (kind === 'reconnectGrace') {
      // Forfeit any player still disconnected past grace
      const now = Date.now()
      for (const [slot, t] of this.disconnectAt) {
        if (now - t >= GAME_CONFIG.RECONNECT_GRACE_MS - 100) {
          // Award win to the other slot if mid-match
          if (this.round.phase === 'playing' || this.round.phase === 'roundEnd') {
            const other: PlayerSlot = slot === 'p1' ? 'p2' : 'p1'
            const finalScores: [number, number] =
              other === 'p1' ? [GAME_CONFIG.ROUNDS, this.round.scores[1]] : [this.round.scores[0], GAME_CONFIG.ROUNDS]
            this.round = { ...this.round, phase: 'matchEnd', scores: finalScores }
            await this.finishMatch(other)
          }
        }
      }
    }

    if (kind === 'botClick') {
      const plan = this.botPlan
      if (
        plan &&
        plan.round === this.round.round &&
        this.round.phase === 'playing' &&
        this.botSlot &&
        this.round.target != null
      ) {
        if (!plan.willMiss) {
          const { state, hit } = applyClick(this.round, this.round.target, this.botSlot)
          if (hit) {
            this.round = state
            this.broadcast({
              t: 'roundEnd',
              round: state.round,
              winner: this.botSlot,
              correctNumber: this.round.target,
              scores: state.scores,
              found: state.found,
            })
            // scheduleAlarm sets ALARM_KIND_KEY itself — don't delete after.
            await this.scheduleAlarm(1200, 'roundTimeout')
            return
          }
        }
        // Bot missed — wait for human or full round timeout
        await this.scheduleAlarm(GAME_CONFIG.ROUND_TIMEOUT_MS, 'roundTimeout')
        return
      }
    }

    if (kind === 'roundTimeout') {
      if (this.round.phase === 'playing') {
        this.round = timeoutRound(this.round)
        this.broadcast({
          t: 'roundEnd',
          round: this.round.round,
          winner: null,
          correctNumber: null,
          scores: this.round.scores,
          found: this.round.found,
        })
      }
      this.advanceRound()
    }
    // Note: don't delete ALARM_KIND_KEY here — advanceRound/scheduleAlarm
    // already set the next kind. Deleting would race with that put.
  }

  // ───── helpers ─────

  private advanceRound() {
    this.round = nextRound(this.round, Date.now())
    if (this.round.phase === 'matchEnd') {
      const winner = decideMatchWinner(this.round.scores)
      this.broadcast({ t: 'matchEnd', finalScores: this.round.scores, winnerSlot: winner })
      this.finishMatch(winner)
      return
    }
    this.broadcast({
      t: 'roundStart',
      round: this.round.round,
      target: this.round.target!,
      layoutSeed: this.round.layoutSeed,
      numbers: this.round.numbers,
      roundEndsAt: this.round.roundEndsAt!,
    })

    // If bot in room, schedule bot click instead of waiting for round timeout.
    // Bot click handler will reschedule round timeout if it misses.
    if (this.botSlot) {
      this.botPlan = {
        round: this.round.round,
        willMiss: Math.random() < BOT_MISS_RATE,
      }
      const delay = BOT_DELAY_MIN_MS + Math.random() * (BOT_DELAY_MAX_MS - BOT_DELAY_MIN_MS)
      void this.scheduleAlarm(delay, 'botClick')
    } else {
      void this.scheduleAlarm(GAME_CONFIG.ROUND_TIMEOUT_MS + 200, 'roundTimeout')
    }
  }

  private async finishMatch(winner: PlayerSlot | null) {
    // Don't write bot matches to D1 — keep leaderboard human-only
    if (this.botSlot) return
    const p1 = this.players.get('p1')
    const p2 = this.players.get('p2')
    if (!p1 || !p2) return
    const now = Date.now()
    try {
      await Promise.all([
        upsertPlayer(this.env, p1.deviceId, p1.nickname, now),
        upsertPlayer(this.env, p2.deviceId, p2.nickname, now),
      ])
      const winnerId = winner === 'p1' ? p1.deviceId : winner === 'p2' ? p2.deviceId : null
      await insertMatch(this.env, {
        id: newMatchId(),
        p1Id: p1.deviceId,
        p2Id: p2.deviceId,
        p1Nickname: p1.nickname,
        p2Nickname: p2.nickname,
        p1Score: this.round.scores[0],
        p2Score: this.round.scores[1],
        winnerId,
        endedAt: now,
        durationMs: now - this.startedAt,
      })
      await invalidateLeaderboard(this.env)
    } catch (err) {
      console.error('finishMatch DB error', err)
    }
  }

  private async scheduleAlarm(delayMs: number, kind: AlarmKind) {
    await this.state.storage.put(ALARM_KIND_KEY, kind)
    await this.state.storage.setAlarm(Date.now() + delayMs)
  }

  private buildPlayers(): Player[] {
    const out: Player[] = []
    for (const [slot, m] of this.players) {
      out.push({
        deviceId: m.deviceId,
        nickname: m.nickname,
        slot,
        ready: this.ready.has(slot),
        connected: m.connected,
      })
    }
    return out
  }

  private broadcastLobby() {
    const players = this.buildPlayers()
    for (const ws of this.sockets.keys()) {
      const slot = this.sockets.get(ws)!
      this.sendTo(ws, { t: 'lobby', players, youAre: slot })
    }
  }

  private broadcast(msg: ServerMsg, exceptSlot?: PlayerSlot) {
    for (const [ws, slot] of this.sockets) {
      if (exceptSlot && slot === exceptSlot) continue
      this.sendTo(ws, msg)
    }
  }

  private sendTo(ws: WebSocket, msg: ServerMsg) {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      // ignore — closed socket
    }
  }

  private sendSnapshot(ws: WebSocket, slot: PlayerSlot) {
    const players = this.buildPlayers()
    this.sendTo(ws, {
      t: 'snapshot',
      phase: this.round.phase === 'matchEnd' ? 'matchEnd' : this.round.phase === 'lobby' ? 'lobby' : 'playing',
      round: this.round.round,
      target: this.round.target,
      layoutSeed: this.round.layoutSeed,
      numbers: this.round.numbers,
      scores: this.round.scores,
      found: this.round.found,
      players,
      youAre: slot,
      roundEndsAt: this.round.roundEndsAt,
    })
  }
}
