import { test, expect } from '@playwright/test'

test('landing renders + nickname required', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Find Number' })).toBeVisible()
  await page.getByRole('button', { name: /Create Room/i }).click()
  await expect(page.getByText(/Nickname needs at least 2/)).toBeVisible()
})

test('practice mode start + reset', async ({ page }) => {
  await page.goto('/')
  await page.getByPlaceholder('Enter your name').fill('Tester')
  await page.getByRole('button', { name: /Practice offline/i }).click()
  await expect(page).toHaveURL(/\/practice$/)
  // StartLobby visible
  await expect(page.getByRole('heading', { name: 'Find Number' })).toBeVisible()
  await page.getByRole('button', { name: 'Start Match' }).click()
  // After start, HUD should show round counter eventually
  await expect(page.getByText(/Round\s+1\s*\/\s*10/)).toBeVisible({ timeout: 5000 })
})
