import { test, expect } from '@playwright/test'
import { launchApp } from './helpers.js'

test('app launches and operator window shows session UI', async () => {
  const { app, cleanup } = await launchApp()
  try {
    const window = await app.firstWindow()
    await expect(window.locator('strong')).toContainText('reStrike MCM')
    await expect(window.locator('.session-label')).toBeVisible()
  } finally {
    await app.close()
    await cleanup()
  }
})

test('add ceremony button creates a new ceremony in queue', async () => {
  const { app, cleanup } = await launchApp()
  try {
    const window = await app.firstWindow()
    await window.click('text=+ Add ceremony')
    await expect(window.locator('.queue-item')).toHaveCount(1)
  } finally {
    await app.close()
    await cleanup()
  }
})
