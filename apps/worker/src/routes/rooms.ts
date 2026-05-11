import { Hono } from 'hono'
import { DEFAULT_MATCH_MODE, GAME_CONFIG, isMatchMode, type MatchMode } from '@find-number/shared'
import type { Env } from '../env'

export const roomsRoute = new Hono<{ Bindings: Env }>()

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

function generateRoomCode(): string {
  let code = ''
  const buf = new Uint8Array(GAME_CONFIG.ROOM_CODE_LENGTH)
  crypto.getRandomValues(buf)
  for (let i = 0; i < GAME_CONFIG.ROOM_CODE_LENGTH; i++) {
    code += ROOM_ALPHABET[buf[i]! % ROOM_ALPHABET.length]
  }
  return code
}

async function readMode(c: { req: { json: () => Promise<unknown> } }): Promise<MatchMode> {
  try {
    const body = (await c.req.json()) as { mode?: unknown } | null
    if (body && isMatchMode(body.mode)) return body.mode
  } catch {
    /* no body / not JSON */
  }
  return DEFAULT_MATCH_MODE
}

roomsRoute.post('/', async (c) => {
  const mode = await readMode(c)
  const code = generateRoomCode()
  const id = c.env.GAME_ROOM.idFromName(code)
  const stub = c.env.GAME_ROOM.get(id)
  await stub.fetch(new Request(`https://do/init?code=${code}&mode=${mode}`, { method: 'POST' }))
  return c.json({ ok: true, code, mode, roomId: id.toString() })
})

// Create a room pre-filled with a bot opponent (for "Play vs bot now" UX)
roomsRoute.post('/bot', async (c) => {
  const mode = await readMode(c)
  const code = generateRoomCode()
  const id = c.env.GAME_ROOM.idFromName(code)
  const stub = c.env.GAME_ROOM.get(id)
  await stub.fetch(new Request(`https://do/init-bot?code=${code}&mode=${mode}`, { method: 'POST' }))
  return c.json({ ok: true, code, mode, bot: true })
})

roomsRoute.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const id = c.env.GAME_ROOM.idFromName(code)
  const stub = c.env.GAME_ROOM.get(id)
  const res = await stub.fetch(new Request(`https://do/status`))
  return new Response(res.body, { status: res.status, headers: res.headers })
})
