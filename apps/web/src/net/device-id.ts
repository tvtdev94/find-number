import FingerprintJS from '@fingerprintjs/fingerprintjs'

const KEY = 'fn:deviceId'

let cached: string | null = null
let pending: Promise<string> | null = null

function randomId(): string {
  // 16 hex chars — enough entropy for anonymous identity
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached
  const stored = localStorage.getItem(KEY)
  if (stored) {
    cached = stored
    return stored
  }
  if (pending) return pending
  pending = (async () => {
    let id: string
    try {
      const fp = await FingerprintJS.load()
      const r = await fp.get()
      // Combine fingerprint with random suffix so multiple browser profiles
      // on same device get distinct IDs (matters for testing + family sharing).
      id = `${r.visitorId.slice(0, 16)}-${randomId().slice(0, 8)}`
    } catch {
      id = randomId()
    }
    localStorage.setItem(KEY, id)
    cached = id
    return id
  })()
  return pending
}

export function getCachedDeviceId(): string | null {
  return cached ?? localStorage.getItem(KEY)
}
