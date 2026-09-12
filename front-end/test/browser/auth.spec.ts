import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill('browser-auth-test@example.com')
  await page.locator('input[name="password"]').fill('browser-test-password')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test('HTTP proxy cookies restore on reload, rotate across tabs, and logout reaches every tab', async ({ page, context }) => {
  await login(page)
  const cookies = await context.cookies()
  const refresh = cookies.find(cookie => cookie.name === 'crm_refresh')!
  expect(refresh.httpOnly).toBe(true)
  expect(refresh.secure).toBe(false)
  expect(refresh.path).toBe('/api/auth')
  expect(await page.evaluate(() => localStorage.getItem('clientflow.authToken'))).toBeNull()
  expect(await page.evaluate(() => document.cookie)).not.toContain('crm_refresh')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  expect((await context.cookies()).find(cookie => cookie.name === 'crm_refresh')!.value).not.toBe(refresh.value)

  const second = await context.newPage()
  await second.goto('/companies')
  await expect(second.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  // Both tabs restore concurrently; the IndexedDB lease must serialize cookie rotation.
  await Promise.all([page.reload(), second.reload()])
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  await expect(second.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()

  // Exercise real expiry and the Axios interceptor against the actual backend.
  await page.waitForTimeout(2100)
  const renewed = page.waitForResponse(response => response.url().endsWith('/api/auth/refresh') && response.status() === 200)
  const retried = page.waitForResponse(response => response.url().includes('/api/companies') && response.status() === 200)
  await page.getByRole('link', { name: 'Companies', exact: true }).click()
  await Promise.all([renewed, retried])
  await expect(page).toHaveURL(/\/companies$/)
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(second).toHaveURL(/\/login$/)
  expect((await context.cookies()).some(cookie => cookie.name === 'crm_refresh')).toBe(false)
})

test('temporary restoration failure offers retry instead of requiring login', async ({ page }) => {
  await login(page)
  await page.route('**/api/auth/refresh', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Cannot restore your session')
  await expect(page).not.toHaveURL(/\/login$/)
  await page.unroute('**/api/auth/refresh')
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
})

test('failed logout remains retryable and keeps the session visible', async ({ page }) => {
  await login(page)
  await page.route('**/api/auth/logout', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Could not confirm sign-out')
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.unroute('**/api/auth/logout')
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
})
