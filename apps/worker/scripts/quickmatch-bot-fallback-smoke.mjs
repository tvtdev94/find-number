// Single user joins quickmatch, waits → server should fall back to bot
// (Since QUEUE_TIMEOUT_MS = 60s, this test takes ~65s)
import WebSocket from 'ws'

const BASE = (process.env.BASE || 'http://127.0.0.1:8787').replace(/^http/, 'ws')

const ws = new WebSocket(`${BASE}/api/quickmatch?deviceId=lone-tester&nickname=Lonely`)
ws.on('open', () => console.log('queued'))
ws.on('message', (raw) => {
  const m = JSON.parse(raw.toString())
  console.log('←', m)
  if (m.t === 'bot-match') {
    console.log('PASS — fallback to bot, code =', m.code)
    process.exit(0)
  } else if (m.t === 'timeout') {
    console.log('FAIL — got plain timeout, expected bot-match')
    process.exit(1)
  }
})
ws.on('error', (e) => { console.error(e); process.exit(1) })
setTimeout(() => { console.log('test timeout'); process.exit(1) }, 75000)
