// Quick screenshot helper for the new UI.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'tests/visual/shots'
mkdirSync(OUT, { recursive: true })

const VIEWPORTS = {
  mobile: { width: 390, height: 844 }, // iPhone 14 Pro
  desktop: { width: 1280, height: 800 },
}

async function shot(page, name, viewport) {
  await page.setViewportSize(viewport)
  await page.waitForTimeout(400)
  const file = join(OUT, `${name}-${viewport.width}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('saved', file)
}

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()

// 1. Landing
await page.goto('http://127.0.0.1:5173/')
await page.getByPlaceholder('Tên của bạn').fill('Tester')
for (const v of Object.values(VIEWPORTS)) await shot(page, 'landing', v)

// 2. Practice — playing state
await page.getByRole('button', { name: /^Practice$/i }).click()
await page.waitForURL('**/practice')
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Start Match' }).click()
await page.waitForTimeout(1500) // first round starts after 600ms
for (const v of Object.values(VIEWPORTS)) await shot(page, 'practice-playing', v)

// 3. Click target a few times to see found state
const target1 = await page.locator('button[aria-label*="(target)"]').first()
const targetText = await target1.innerText().catch(() => null)
if (targetText) {
  await target1.click()
  await page.waitForTimeout(1500)
  for (const v of Object.values(VIEWPORTS)) await shot(page, 'practice-after-hit', v)
}

// 4. Leaderboard
await page.goto('http://127.0.0.1:5173/leaderboard')
await page.waitForTimeout(500)
for (const v of Object.values(VIEWPORTS)) await shot(page, 'leaderboard', v)

// 5. Lobby — create room flow
const ctxLobby = await browser.newContext()
const pageLobby = await ctxLobby.newPage()
await pageLobby.goto('http://127.0.0.1:5173/')
await pageLobby.getByPlaceholder('Tên của bạn').fill('Alice')
await pageLobby.getByRole('button', { name: /Create Room/i }).click()
await pageLobby.waitForURL(/\/r\/[A-Z0-9]{6}/, { timeout: 8000 })
await pageLobby.waitForTimeout(800)
for (const v of Object.values(VIEWPORTS)) await shot(pageLobby, 'lobby', v)

await browser.close()
console.log('done — screenshots in', OUT)
