export interface Env {
  GAME_ROOM: DurableObjectNamespace
  MATCH_QUEUE: DurableObjectNamespace
  DB: D1Database
  SESSIONS: KVNamespace
}
