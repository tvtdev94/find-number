import { Hono } from 'hono'
import { GAME_CONFIG } from '@find-number/shared'
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

roomsRoute.post('/', async (c) => {
  const code = generateRoomCode()
  const id = c.env.GAME_ROOM.idFromName(code)
  const stub = c.env.GAME_ROOM.get(id)
  // Initialize the DO
  await stub.fetch(new Request(`https://do/init?code=${code}`, { method: 'POST' }))
  return c.json({ ok: true, code, roomId: id.toString() })
})

roomsRoute.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase()
  const id = c.env.GAME_ROOM.idFromName(code)
  const stub = c.env.GAME_ROOM.get(id)
  const res = await stub.fetch(new Request(`https://do/status`))
  return new Response(res.body, { status: res.status, headers: res.headers })
})
