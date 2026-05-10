import { Hono } from 'hono'
import type { Env } from '../env'

export const quickmatchRoute = new Hono<{ Bindings: Env }>()

// WS upgrade: forward to singleton MatchQueue DO
quickmatchRoute.get('/', async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') {
    return c.text('Expected websocket', 426)
  }
  const id = c.env.MATCH_QUEUE.idFromName('global')
  const stub = c.env.MATCH_QUEUE.get(id)
  const url = new URL(c.req.url)
  const targetUrl = `https://do/queue?${url.searchParams.toString()}`
  return stub.fetch(
    new Request(targetUrl, { method: 'GET', headers: c.req.raw.headers }),
  )
})
