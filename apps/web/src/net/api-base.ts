// API base resolution.
// - Dev: empty string → uses Vite proxy (/api → 8787)
// - Prod: set VITE_API_BASE at build time to the worker URL
//   e.g. https://find-number-worker.tvtdev94.workers.dev

const RAW_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export function apiUrl(path: string): string {
  return `${RAW_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export function wsUrl(path: string): string {
  if (RAW_BASE) {
    return RAW_BASE.replace(/^http/, 'ws') + (path.startsWith('/') ? path : `/${path}`)
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${path.startsWith('/') ? path : `/${path}`}`
}
