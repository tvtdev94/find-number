import type { MatchMode } from '@find-number/shared'
import { apiUrl } from './api-base'

export type CreateRoomResp = { ok: true; code: string; roomId: string; mode: MatchMode }
export type RoomStatus = { code: string; phase: string; playerCount: number; full: boolean }

export async function createRoom(mode?: MatchMode): Promise<CreateRoomResp> {
  const r = await fetch(apiUrl('/api/rooms'), {
    method: 'POST',
    headers: mode ? { 'content-type': 'application/json' } : undefined,
    body: mode ? JSON.stringify({ mode }) : undefined,
  })
  if (!r.ok) throw new Error(`createRoom failed: ${r.status}`)
  return r.json()
}

export async function createBotRoom(mode?: MatchMode): Promise<{ code: string; mode: MatchMode }> {
  const r = await fetch(apiUrl('/api/rooms/bot'), {
    method: 'POST',
    headers: mode ? { 'content-type': 'application/json' } : undefined,
    body: mode ? JSON.stringify({ mode }) : undefined,
  })
  if (!r.ok) throw new Error(`createBotRoom failed: ${r.status}`)
  return r.json()
}

export async function getRoomStatus(code: string): Promise<RoomStatus> {
  const r = await fetch(apiUrl(`/api/rooms/${code.toUpperCase()}`))
  if (!r.ok) throw new Error(`getRoomStatus failed: ${r.status}`)
  return r.json()
}
