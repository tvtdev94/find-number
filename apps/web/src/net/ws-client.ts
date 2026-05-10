import type { ClientMsg, ServerMsg } from '@find-number/shared'

export type ConnState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed'

type Listener = (msg: ServerMsg) => void
type StateListener = (s: ConnState) => void

export type WsOptions = {
  url: string
  reconnect?: boolean
  maxBackoffMs?: number
}

export class GameSocket {
  private ws: WebSocket | null = null
  private url: string
  private listeners = new Set<Listener>()
  private stateListeners = new Set<StateListener>()
  private state: ConnState = 'idle'
  private reconnect: boolean
  private maxBackoff: number
  private attempt = 0
  private closedByUser = false

  constructor(opts: WsOptions) {
    this.url = opts.url
    this.reconnect = opts.reconnect ?? true
    this.maxBackoff = opts.maxBackoffMs ?? 8000
  }

  connect() {
    this.closedByUser = false
    this.open()
  }

  close() {
    this.closedByUser = true
    this.setState('closed')
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        /* ignore */
      }
      this.ws = null
    }
  }

  send(msg: ClientMsg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  onMessage(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  onState(fn: StateListener): () => void {
    this.stateListeners.add(fn)
    fn(this.state)
    return () => this.stateListeners.delete(fn)
  }

  getState(): ConnState {
    return this.state
  }

  private open() {
    this.setState(this.attempt === 0 ? 'connecting' : 'reconnecting')
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.addEventListener('open', () => {
      this.attempt = 0
      this.setState('open')
    })
    ws.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerMsg
        for (const l of this.listeners) l(msg)
      } catch {
        /* ignore */
      }
    })
    ws.addEventListener('close', () => {
      this.ws = null
      if (this.closedByUser || !this.reconnect) {
        this.setState('closed')
        return
      }
      const backoff = Math.min(this.maxBackoff, 1000 * 2 ** this.attempt)
      this.attempt++
      this.setState('reconnecting')
      setTimeout(() => {
        if (!this.closedByUser) this.open()
      }, backoff)
    })
    ws.addEventListener('error', () => {
      // Will trigger close handler
    })
  }

  private setState(s: ConnState) {
    if (s === this.state) return
    this.state = s
    for (const l of this.stateListeners) l(s)
  }
}

export function buildWsUrl(roomCode: string, nickname: string, deviceId: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  const params = new URLSearchParams({ nickname, deviceId })
  return `${proto}//${host}/ws/${roomCode}?${params.toString()}`
}
