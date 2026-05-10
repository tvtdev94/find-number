export type CreateRoomResp = { ok: true; code: string; roomId: string }
export type RoomStatus = { code: string; phase: string; playerCount: number; full: boolean }

export async function createRoom(): Promise<CreateRoomResp> {
  const r = await fetch('/api/rooms', { method: 'POST' })
  if (!r.ok) throw new Error(`createRoom failed: ${r.status}`)
  return r.json()
}

export async function getRoomStatus(code: string): Promise<RoomStatus> {
  const r = await fetch(`/api/rooms/${code.toUpperCase()}`)
  if (!r.ok) throw new Error(`getRoomStatus failed: ${r.status}`)
  return r.json()
}
