import { test, expect } from '@playwright/test'
import { launchApp } from './helpers.js'

test('toggling transparent background in settings closes and reopens the display window', async () => {
  const { app, cleanup } = await launchApp()
  try {
    const operator = await app.firstWindow()
    await expect(operator.locator('strong')).toContainText('reStrike MCM')

    // Push to display 2 (single monitor in CI → windowed on primary).
    const [, ] = await Promise.all([
      app.waitForEvent('window', { timeout: 5000 }),
      operator.click('text=📺 Push to Display 2'),
    ])

    // Open Settings → flip transparent on → config:set auto-fires on change,
    // which triggers the display-window restart in the main process.
    await operator.click('text=⚙ Settings')
    await operator
      .getByRole('checkbox', { name: 'Transparent background output (for OBS/vMix capture)' })
      .click()

    // The display window should have been closed and re-opened — assert the
    // operator received the toast.
    await expect(operator.locator('text=Display window restarted')).toBeVisible({ timeout: 8000 })
  } finally {
    await app.close()
    await cleanup()
  }
})

test('display root DOM carries .transparent class after toggle', async () => {
  const { app, cleanup } = await launchApp()
  try {
    const operator = await app.firstWindow()

    // Open the display in opaque (default) mode. waitForEvent must be registered
    // before the click that opens the window, or the event may fire first.
    const [displayWin] = await Promise.all([
      app.waitForEvent('window', { timeout: 5000 }),
      operator.click('text=📺 Push to Display 2'),
    ])
    await expect(displayWin.locator('html.transparent')).toHaveCount(0)

    // Toggle transparent on. The display window will close and a new one open;
    // register the waitForEvent BEFORE the checkbox.check() that triggers it.
    await operator.click('text=⚙ Settings')
    const [newDisplay] = await Promise.all([
      app.waitForEvent('window', { timeout: 8000 }),
      operator
        .getByRole('checkbox', { name: 'Transparent background output (for OBS/vMix capture)' })
        .click(),
    ])
    await expect(newDisplay.locator('html.transparent')).toHaveCount(1)
  } finally {
    await app.close()
    await cleanup()
  }
})
