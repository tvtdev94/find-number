import type { ConnState } from '../net/ws-client'

const labels: Record<ConnState, { text: string; color: string }> = {
  idle: { text: 'idle', color: 'bg-gray-500' },
  connecting: { text: 'connecting…', color: 'bg-yellow-500' },
  open: { text: 'online', color: 'bg-green-500' },
  reconnecting: { text: 'reconnecting…', color: 'bg-orange-500' },
  closed: { text: 'offline', color: 'bg-red-500' },
}

export function ConnectionStatus({ state }: { state: ConnState }) {
  const l = labels[state]
  return (
    <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs ring-1 ring-white/10 backdrop-blur">
      <span className={`inline-block h-2 w-2 rounded-full ${l.color}`} />
      <span className="text-gray-200">{l.text}</span>
    </div>
  )
}
