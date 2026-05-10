// 2-client quickmatch test: both connect, expect 'matched' with same code
import WebSocket from 'ws'

const BASE = (process.env.BASE || 'http://127.0.0.1:8787').replace(/^http/, 'ws')

function joinQueue(deviceId, nickname) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${BASE}/api/quickmatch?deviceId=${deviceId}&nickname=${nickname}`)
    ws.on('open', () => console.log(`[${nickname}] queued`))
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString())
      console.log(`[${nickname}] ←`, m)
      if (m.t === 'matched') {
        resolve(m)
        try { ws.close() } catch {}
      } else if (m.t === 'timeout') {
        reject(new Error('timeout'))
      }
    })
    ws.on('error', reject)
    setTimeout(() => reject(new Error('test timeout 10s')), 10000)
  })
}

const [a, b] = await Promise.all([
  joinQueue('dev-quick-a', 'Alice'),
  joinQueue('dev-quick-b', 'Bob'),
])

if (a.code !== b.code) {
  console.error('MISMATCH', a, b)
  process.exit(1)
}
if (a.slot === b.slot) {
  console.error('SAME SLOT', a, b)
  process.exit(1)
}
console.log(`PASS — both matched into ${a.code}, slots ${a.slot}/${b.slot}`)
process.exit(0)
