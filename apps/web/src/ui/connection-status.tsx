import type { ConnState } from '../net/ws-client'

const labels: Record<ConnState, { text: string; color: string }> = {
  idle: { text: 'idle', color: 'bg-gray-500' },
  connecting: { text: 'connecting…', color: 'bg-yellow-500' },
  open: { text: 'online', color: 'bg-green-500' },
  reconnecting: { text: 'reconnecting…', color: 'bg-orange-500' },
  closed: { text: 'offline', color: 'bg-red-500' },
}

/** Tiny status dot bottom-right. Doesn't compete with HUD/grid. */
export function ConnectionStatus({ state }: { state: ConnState }) {
  const l = labels[state]
  return (
    <div
      className="pointer-events-none absolute right-2 z-10 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[10px] text-gray-300 ring-1 ring-white/10 backdrop-blur"
      style={{ bottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${l.color}`} />
      <span>{l.text}</span>
    </div>
  )
}
