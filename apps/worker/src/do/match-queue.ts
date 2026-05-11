import { QUICK_MATCH_MODE } from '@find-number/shared'
import type { Env } from '../env'

type WaitingMeta = {
  deviceId: string
  nickname: string
  enqueuedAt: number
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const QUEUE_TIMEOUT_MS = 60_000

function generateRoomCode(len = 6): string {
  let code = ''
  const buf = new Uint8Array(len)
  crypto.getRandomValues(buf)
  for (let i = 0; i < len; i++) code += ROOM_ALPHABET[buf[i]! % ROOM_ALPHABET.length]
  return code
}

/**
 * Singleton DO. Each connecting WS is a waiting player.
 * When 2+ are waiting, pop them, mint a room code, init the GameRoom DO, notify both.
 */
export class MatchQueue implements DurableObject {
  private state: DurableObjectState
  private env: Env
  private waiting = new Map<WebSocket, WaitingMeta>()

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    for (const ws of this.state.getWebSockets()) {
      const meta = ws.deserializeAttachment() as WaitingMeta | null
      if (meta) this.waiting.set(ws, meta)
    }
  }

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 })
    }
    const url = new URL(req.url)
    const nickname = (url.searchParams.get('nickname') || 'Player').slice(0, 20)
    const deviceId = url.searchParams.get('deviceId') || crypto.randomUUID()

    // Reject duplicate enqueues from same device
    for (const m of this.waiting.values()) {
      if (m.deviceId === deviceId) {
        return new Response(JSON.stringify({ error: 'already queued' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        })
      }
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]

    const meta: WaitingMeta = { deviceId, nickname, enqueuedAt: Date.now() }
    this.state.acceptWebSocket(server)
    server.serializeAttachment(meta)
    this.waiting.set(server, meta)

    // Set timeout alarm if not already
    await this.state.storage.setAlarm(Date.now() + 5000)

    // Try matching immediately
    await this.tryMatch()

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.waiting.delete(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.waiting.delete(ws)
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer): Promise<void> {
    if (typeof msg !== 'string') return
    try {
      const parsed = JSON.parse(msg)
      if (parsed.t === 'cancel') {
        this.waiting.delete(ws)
        try {
          ws.close(1000, 'cancelled')
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }

  async alarm(): Promise<void> {
    const now = Date.now()
    // Timeout stale waits → fall back to bot match (per UX: don't leave user empty-handed)
    for (const [ws, m] of this.waiting) {
      if (now - m.enqueuedAt >= QUEUE_TIMEOUT_MS) {
        await this.fallBackToBot(ws)
        this.waiting.delete(ws)
      }
    }
    if (this.waiting.size > 0) {
      await this.state.storage.setAlarm(Date.now() + 5000)
    }
  }

  private async fallBackToBot(ws: WebSocket): Promise<void> {
    try {
      const code = generateRoomCode()
      const id = this.env.GAME_ROOM.idFromName(code)
      const stub = this.env.GAME_ROOM.get(id)
      await stub.fetch(
        new Request(`https://do/init-bot?code=${code}&mode=${QUICK_MATCH_MODE}`, { method: 'POST' }),
      )
      ws.send(JSON.stringify({ t: 'bot-match', code, slot: 'p1', opponent: '🤖 Bot' }))
      ws.close(1000, 'bot-match')
    } catch (err) {
      console.error('fallBackToBot failed', err)
      try {
        ws.send(JSON.stringify({ t: 'timeout' }))
        ws.close()
      } catch {
        /* ignore */
      }
    }
  }

  private async tryMatch(): Promise<void> {
    while (this.waiting.size >= 2) {
      const iter = this.waiting.entries()
      const a = iter.next().value
      const b = iter.next().value
      if (!a || !b) return
      const [wsA, metaA] = a
      const [wsB, metaB] = b

      const code = generateRoomCode()
      const id = this.env.GAME_ROOM.idFromName(code)
      const stub = this.env.GAME_ROOM.get(id)
      try {
        await stub.fetch(
          new Request(`https://do/init?code=${code}&mode=${QUICK_MATCH_MODE}`, { method: 'POST' }),
        )
      } catch (err) {
        console.error('match-queue init room failed', err)
        return
      }

      const send = (ws: WebSocket, slot: 'p1' | 'p2', other: WaitingMeta) => {
        try {
          ws.send(JSON.stringify({ t: 'matched', code, slot, opponent: other.nickname }))
          ws.close(1000, 'matched')
        } catch {
          /* ignore */
        }
      }
      send(wsA, 'p1', metaB)
      send(wsB, 'p2', metaA)
      this.waiting.delete(wsA)
      this.waiting.delete(wsB)
    }
  }
}
