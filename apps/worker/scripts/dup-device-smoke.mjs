// Reproduce: 2 browsers on 1 machine = same deviceId joins same room.
// Expected behavior: only 1 WS active per slot at a time.
import WebSocket from 'ws'

const BASE = process.env.BASE || 'http://127.0.0.1:8787'
const WS_BASE = BASE.replace(/^http/, 'ws')

const r = await fetch(`${BASE}/api/rooms`, { method: 'POST' })
const { code } = await r.json()
console.log('room:', code)

const SAME_DEVICE = 'shared-machine-id'
const opens = []
const messages = { browser1: [], browser2: [] }

function open(name, deviceId) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_BASE}/ws/${code}?nickname=${name}&deviceId=${deviceId}`)
    ws.on('open', () => {
      console.log(`[${name}] open`)
      resolve(ws)
    })
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString())
      messages[name].push(m.t)
      console.log(`[${name}] ←`, m.t, m.youAre || m.target || '')
    })
    ws.on('close', (code, reason) => {
      console.log(`[${name}] CLOSED code=${code} reason=${reason.toString().slice(0,30)}`)
    })
    ws.on('error', (e) => console.log(`[${name}] error: ${e.message}`))
  })
}

const b1 = await open('browser1', SAME_DEVICE)
await new Promise(r => setTimeout(r, 500))
console.log('---opening browser 2 with SAME deviceId---')
const b2 = await open('browser2', SAME_DEVICE)
await new Promise(r => setTimeout(r, 500))

console.log('\nb1 sending click test...')
b1.send(JSON.stringify({ t: 'ready' }))
await new Promise(r => setTimeout(r, 500))

console.log('\nb2 sending click test...')
b2.send(JSON.stringify({ t: 'ready' }))
await new Promise(r => setTimeout(r, 1000))

console.log('\n--- summary ---')
console.log('browser1 received:', messages.browser1.join(','))
console.log('browser2 received:', messages.browser2.join(','))
console.log('b1 readyState:', b1.readyState, '(1=open, 3=closed)')
console.log('b2 readyState:', b2.readyState)

b1.close()
b2.close()
process.exit(0)
