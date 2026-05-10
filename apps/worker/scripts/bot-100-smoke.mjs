// Run a full 100-target match against bot. Track:
// - Whether claimed numbers stay in their grid slot across rounds
// - Whether connection survives to match end
import WebSocket from 'ws'

const BASE = (process.env.BASE || 'http://127.0.0.1:8787')
const WS_BASE = BASE.replace(/^http/, 'ws')

const r = await fetch(`${BASE}/api/rooms/bot`, { method: 'POST' })
const { code } = await r.json()
console.log('room:', code)

const ws = new WebSocket(`${WS_BASE}/ws/${code}?nickname=Tester&deviceId=test-${Date.now()}`)
await new Promise((res) => ws.on('open', res))

let prevNumbers = null
let positionViolations = 0
let claimedSoFar = new Set()
let lastRoundAt = Date.now()
let matchEnded = false

ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString())
  if (m.t === 'roundStart') {
    lastRoundAt = Date.now()
    if (prevNumbers) {
      // Check: each claimed number should be in same slot as prev
      for (const n of claimedSoFar) {
        const oldSlot = prevNumbers.indexOf(n)
        const newSlot = m.numbers.indexOf(n)
        if (oldSlot !== newSlot) {
          positionViolations++
          if (positionViolations <= 3) {
            console.log(`  ⚠ VIOLATION: number ${n} moved from slot ${oldSlot} → ${newSlot} at round ${m.round}`)
          }
        }
      }
    }
    prevNumbers = m.numbers
    if ((m.round) % 20 === 0) console.log(`  round ${m.round}/100 target=${m.target} claimed=${claimedSoFar.size}`)
    // Click instantly to make match fast
    ws.send(JSON.stringify({ t: 'click', number: m.target, clientTime: Date.now() }))
  } else if (m.t === 'roundEnd') {
    if (m.winner === 'p1') claimedSoFar.add(m.correctNumber)
    else if (m.winner === 'p2') claimedSoFar.add(m.correctNumber)
  } else if (m.t === 'matchEnd') {
    matchEnded = true
    console.log(`MATCH END: scores=${m.finalScores} winner=${m.winnerSlot}`)
    console.log(`Position violations: ${positionViolations}`)
    ws.close()
    process.exit(positionViolations > 0 ? 1 : 0)
  }
})

ws.on('close', () => {
  if (!matchEnded) {
    console.log(`\nDISCONNECT during match: claimed=${claimedSoFar.size}/100`)
    console.log(`Last round was ${Math.round((Date.now() - lastRoundAt)/1000)}s ago`)
    process.exit(2)
  }
})

ws.on('error', (e) => {
  console.error('ws error:', e.message)
  process.exit(3)
})

setTimeout(() => ws.send(JSON.stringify({ t: 'ready' })), 200)

// Safety
setTimeout(() => {
  console.log(`\nTEST TIMEOUT: claimed=${claimedSoFar.size}/100`)
  process.exit(4)
}, 300_000)
