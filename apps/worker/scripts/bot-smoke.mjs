// Test the bot match flow: 1 player vs bot, play full match
import WebSocket from 'ws'

const BASE = process.env.BASE || 'http://127.0.0.1:8787'
const WS_BASE = BASE.replace(/^http/, 'ws')

async function main() {
  // 1. Create a bot room
  const r = await fetch(`${BASE}/api/rooms/bot`, { method: 'POST' })
  const { code } = await r.json()
  console.log('bot room:', code)

  // 2. Join as P1
  const ws = new WebSocket(
    `${WS_BASE}/ws/${code}?nickname=Tester&deviceId=human-tester`,
  )

  let humanScore = 0
  let botScore = 0
  let rounds = 0

  await new Promise((resolve) => ws.on('open', resolve))
  console.log('[human] joined')

  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString())
    if (m.t === 'lobby') {
      const ready = m.players.map((p) => `${p.nickname}=${p.ready}`).join(', ')
      console.log(`[lobby] ${ready}`)
    } else if (m.t === 'roundStart') {
      rounds++
      console.log(`[round ${m.round}] target=${m.target} (botPlay starting)`)
      // Human reaction: random 800-2500ms (slower than bot baseline sometimes)
      const humanDelay = 800 + Math.random() * 1700
      const humanWillMiss = Math.random() < 0.3
      if (!humanWillMiss) {
        setTimeout(() => {
          ws.send(JSON.stringify({ t: 'click', number: m.target, clientTime: Date.now() }))
        }, humanDelay)
      }
    } else if (m.t === 'roundEnd') {
      humanScore = m.scores[0]
      botScore = m.scores[1]
      console.log(`  → winner=${m.winner ?? 'timeout'} scores=${humanScore}:${botScore}`)
    } else if (m.t === 'matchEnd') {
      console.log(`\nMATCH END: human=${m.finalScores[0]} bot=${m.finalScores[1]} winner=${m.winnerSlot}`)
      ws.close()
      process.exit(0)
    }
  })

  // Send ready (bot is already ready)
  setTimeout(() => ws.send(JSON.stringify({ t: 'ready' })), 200)

  setTimeout(() => {
    console.log('test timeout')
    process.exit(1)
  }, 60000)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
