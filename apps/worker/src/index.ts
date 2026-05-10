import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './env'
import { roomsRoute } from './routes/rooms'
import { quickmatchRoute } from './routes/quickmatch'
import { leaderboardRoute } from './routes/leaderboard'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) =>
  c.json({ ok: true, service: 'find-number-worker', time: Date.now() }),
)

app.route('/api/rooms', roomsRoute)
app.route('/api/quickmatch', quickmatchRoute)
app.route('/api/leaderboard', leaderboardRoute)

// WebSocket upgrade for room connections.
// /ws/:code?nickname=X&deviceId=Y
app.get('/ws/:code', async (c) => {
  const upgrade = c.req.header('Upgrade')
  if (upgrade !== 'websocket') {
    return c.text('Expected websocket', 426)
  }
  const code = c.req.param('code').toUpperCase()
  const id = c.env.GAME_ROOM.idFromName(code)
  const stub = c.env.GAME_ROOM.get(id)
  // Forward upgrade with original query
  const url = new URL(c.req.url)
  const targetUrl = `https://do/ws?${url.searchParams.toString()}&code=${code}`
  return stub.fetch(
    new Request(targetUrl, { method: 'GET', headers: c.req.raw.headers }),
  )
})

export default app

export { GameRoom } from './do/game-room'
export { MatchQueue } from './do/match-queue'
