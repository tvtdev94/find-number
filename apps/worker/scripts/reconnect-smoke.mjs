// Reconnect bug repro: in bot match, drop WS mid-game, reconnect, verify game continues.
import WebSocket from 'ws'

const BASE = process.env.BASE || 'http://127.0.0.1:8787'
const WS_BASE = BASE.replace(/^http/, 'ws')

const r = await fetch(`${BASE}/api/rooms/bot`, { method: 'POST' })
const { code } = await r.json()
console.log('room:', code)

const DEVICE_ID = 'reconnect-tester'
let totalRounds = 0
let droppedAfterRound = 0
let resumedRounds = 0
let matchEnded = false

function connect() {
  const ws = new WebSocket(`${WS_BASE}/ws/${code}?nickname=Tester&deviceId=${DEVICE_ID}`)
  ws.on('open', () => console.log('  WS open'))
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString())
    if (m.t === 'roundStart') {
      totalRounds++
      if (droppedAfterRound > 0) {
        resumedRounds++
        if (resumedRounds === 1) console.log(`  ✓ first round AFTER reconnect: round=${m.round}`)
      }
      // Click target instantly to win
      ws.send(JSON.stringify({ t: 'click', number: m.target, clientTime: Date.now() }))

      // Drop WS after 5 successful rounds
      if (totalRounds === 5 && droppedAfterRound === 0) {
        droppedAfterRound = m.round
        console.log(`  💥 forcibly dropping WS after round ${m.round}`)
        ws.terminate()
        // Reconnect after 2s (within grace period)
        setTimeout(() => {
          console.log('  🔄 reconnecting...')
          connect()
        }, 2000)
        return
      }
    } else if (m.t === 'matchEnd') {
      matchEnded = true
      console.log(`MATCH END: scores=${m.finalScores} winner=${m.winnerSlot}`)
      console.log(`Total rounds played: ${totalRounds} (${resumedRounds} after reconnect)`)
      ws.close()
      process.exit(resumedRounds > 0 ? 0 : 1)
    } else if (m.t === 'snapshot') {
      console.log(`  📸 snapshot: phase=${m.phase} round=${m.round} target=${m.target}`)
    }
  })
  ws.on('close', () => {
    if (!matchEnded && droppedAfterRound > 0 && resumedRounds === 0) {
      // First close = our forced drop, expected
    }
  })
  // Send ready only on first connection
  if (totalRounds === 0) {
    setTimeout(() => ws.send(JSON.stringify({ t: 'ready' })), 200)
  }
  return ws
}

connect()

setTimeout(() => {
  console.log(`\nTEST TIMEOUT: total=${totalRounds} resumed=${resumedRounds}`)
  process.exit(2)
}, 60_000)
