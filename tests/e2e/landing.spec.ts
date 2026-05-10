import { test, expect } from '@playwright/test'

test('landing renders + nickname required', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Find Number' })).toBeVisible()
  await page.getByRole('button', { name: /Create Room/i }).click()
  await expect(page.getByText(/Nickname cần/)).toBeVisible()
})

test('practice mode start + reset', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('Tên của bạn').fill('Tester')
  await page.getByRole('button', { name: /^Practice$/i }).click()
  await expect(page).toHaveURL(/\/practice$/)
  // StartLobby visible
  await expect(page.getByRole('heading', { name: /Practice Mode/i })).toBeVisible()
  await page.getByRole('button', { name: /Start Match/i }).click()
  // After start, HUD should show round counter eventually
  await expect(page.getByText(/Round\s+1\s*\/\s*10/)).toBeVisible({ timeout: 5000 })
})
