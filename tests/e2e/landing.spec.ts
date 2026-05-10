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
  // After start, HUD shows the FIND target + remaining count
  await expect(page.getByText(/^Find$/i)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/\d+\s+left/i)).toBeVisible({ timeout: 5000 })
})
