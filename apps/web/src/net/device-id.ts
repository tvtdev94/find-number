import FingerprintJS from '@fingerprintjs/fingerprintjs'

const STABLE_KEY = 'fn:deviceId' // localStorage — persists across tabs/refreshes
const TAB_KEY = 'fn:tabId' // sessionStorage — per-tab, survives refresh

let cached: string | null = null
let stablePending: Promise<string> | null = null

function randomId(): string {
  // 16 hex chars — enough entropy for anonymous identity
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function getStableId(): Promise<string> {
  const stored = localStorage.getItem(STABLE_KEY)
  if (stored) return stored
  if (stablePending) return stablePending
  stablePending = (async () => {
    let id: string
    try {
      const fp = await FingerprintJS.load()
      const r = await fp.get()
      id = `${r.visitorId.slice(0, 16)}-${randomId().slice(0, 8)}`
    } catch {
      id = randomId()
    }
    localStorage.setItem(STABLE_KEY, id)
    return id
  })()
  return stablePending
}

function getTabId(): string {
  let sid = sessionStorage.getItem(TAB_KEY)
  if (!sid) {
    sid = randomId()
    sessionStorage.setItem(TAB_KEY, sid)
  }
  return sid
}

/**
 * Composite identity: `<stableDevice>-<tabSession>`.
 * - localStorage stable id → persists across tabs/refresh, so leaderboard
 *   stats stay tied to the user.
 * - sessionStorage tab id → fresh per browser tab, so opening 2 tabs on the
 *   same machine creates 2 distinct WS players (testing + family sharing).
 *   sessionStorage survives F5 reloads in the same tab → reconnect still works.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached
  const stable = await getStableId()
  const tab = getTabId()
  cached = `${stable}.${tab}`
  return cached
}

export function getCachedDeviceId(): string | null {
  return cached
}
