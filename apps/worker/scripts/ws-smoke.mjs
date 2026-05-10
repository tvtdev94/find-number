// 2-client smoke: create room, both join, both ready, play out a few rounds.
import WebSocket from 'ws'

const BASE = process.env.BASE || 'http://127.0.0.1:8787'
const WS_BASE = BASE.replace(/^http/, 'ws')

async function main() {
  const r = await fetch(`${BASE}/api/rooms`, { method: 'POST' })
  const { code } = await r.json()
  console.log('room code:', code)

  const seenStartByP1 = []
  const seenStartByP2 = []

  const open = (slot, deviceId, nickname) =>
    new Promise((resolve, reject) => {
      const url = `${WS_BASE}/ws/${code}?nickname=${nickname}&deviceId=${deviceId}`
      const ws = new WebSocket(url)
      ws.on('open', () => {
        console.log(`[${slot}] open`)
        resolve(ws)
      })
      ws.on('error', reject)
    })

  const p1 = await open('p1', 'dev-aaa', 'Alice')
  const p2 = await open('p2', 'dev-bbb', 'Bob')

  const wireUp = (label, ws, sink) => {
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString())
      if (msg.t === 'roundStart') {
        console.log(`[${label}] roundStart r${msg.round} target=${msg.target}`)
        sink.push(msg)
      } else if (msg.t === 'roundEnd') {
        console.log(`[${label}] roundEnd winner=${msg.winner} scores=${msg.scores}`)
      } else if (msg.t === 'matchEnd') {
        console.log(`[${label}] matchEnd winner=${msg.winnerSlot} final=${msg.finalScores}`)
      } else if (msg.t === 'lobby') {
        console.log(`[${label}] lobby players=${msg.players.length} ready=${msg.players.map((p) => p.ready)}`)
      } else {
        console.log(`[${label}] msg`, msg.t)
      }
    })
  }
  wireUp('p1', p1, seenStartByP1)
  wireUp('p2', p2, seenStartByP2)

  // brief delay so both lobby msgs arrive
  await new Promise((r) => setTimeout(r, 300))
  p1.send(JSON.stringify({ t: 'ready' }))
  p2.send(JSON.stringify({ t: 'ready' }))

  // P1 hits target instantly each round; P2 hits half a second later (loses)
  const racer = (label, ws, sink, delay) => {
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString())
      if (m.t === 'roundStart') {
        setTimeout(() => {
          ws.send(
            JSON.stringify({ t: 'click', number: m.target, clientTime: Date.now() }),
          )
        }, delay)
      }
    })
  }
  racer('p1', p1, seenStartByP1, 5)
  racer('p2', p2, seenStartByP2, 500)

  // Wait long enough for 10 rounds
  await new Promise((r) => setTimeout(r, 25000))
  p1.close()
  p2.close()
  console.log('done')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
