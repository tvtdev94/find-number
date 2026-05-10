import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'tests/visual/shots/prod'
mkdirSync(OUT, { recursive: true })
const VP = { width: 390, height: 844 }

const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
await page.setViewportSize(VP)

await page.goto('https://find-number.pages.dev/')
await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, 'prod-landing.png') })

await page.getByPlaceholder('Enter your name').fill('LiveTest')
await page.getByRole('button', { name: /Practice offline/i }).click()
await page.waitForURL('**/practice')
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Start Match' }).click()
await page.waitForTimeout(2000)
await page.screenshot({ path: join(OUT, 'prod-practice.png') })

await page.goto('https://find-number.pages.dev/leaderboard')
await page.waitForTimeout(1500)
await page.screenshot({ path: join(OUT, 'prod-leaderboard.png') })

await browser.close()
console.log('done — shots in', OUT)
