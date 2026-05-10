import { test, expect } from '@playwright/test'

test('two contexts join same room and see lobby', async ({ browser }) => {
  // Player A: create room
  const ctxA = await browser.newContext()
  const pageA = await ctxA.newPage()
  await pageA.goto('/')
  await pageA.getByPlaceholder('Enter your name').fill('Alice')
  await pageA.getByRole('button', { name: /Create Room/i }).click()
  await pageA.waitForURL(/\/r\/[A-Z0-9]{6}$/, { timeout: 10000 })
  const url = pageA.url()
  const code = url.split('/r/')[1]!
  expect(code).toMatch(/^[A-Z0-9]{6}$/)
  // Lobby renders with code visible
  await expect(pageA.getByText(code)).toBeVisible()

  // Player B: join via link
  const ctxB = await browser.newContext()
  const pageB = await ctxB.newPage()
  await pageB.goto('/')
  await pageB.getByPlaceholder('Enter your name').fill('Bob')
  await pageB.getByPlaceholder('ROOM CODE').fill(code)
  await pageB.getByRole('button', { name: 'Join' }).click()
  await pageB.waitForURL(`/r/${code}`)

  // Both lobbies should show 2 players
  await expect(pageA.getByText('Alice')).toBeVisible({ timeout: 8000 })
  await expect(pageA.getByText('Bob')).toBeVisible({ timeout: 8000 })
  await expect(pageB.getByText('Alice')).toBeVisible({ timeout: 8000 })
  await expect(pageB.getByText('Bob')).toBeVisible({ timeout: 8000 })

  await ctxA.close()
  await ctxB.close()
})

test('leaderboard route loads', async ({ page }) => {
  await page.goto('/leaderboard')
  await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
  // Tabs present
  await expect(page.getByRole('button', { name: 'Week' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
})
