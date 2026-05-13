import { test, expect, _electron as electron } from '@playwright/test'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

test('toggling transparent background in settings closes and reopens the display window', async () => {
  const app = await electron.launch({
    args: [resolve(__dirname, '../../out/main/main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  })
  const operator = await app.firstWindow()
  await expect(operator.locator('strong')).toContainText('reStrike MCM')

  // Push to display 2 (single monitor in CI → windowed on primary).
  await operator.click('text=📺 Push to Display 2')

  // Wait until the display window registers.
  await app.waitForEvent('window', { timeout: 5000 })

  // Open Settings → flip transparent on → settings auto-saves on change.
  await operator.click('text=⚙ Settings')
  await operator.locator('text=Transparent background output').locator('..').locator('input[type=checkbox]').check()

  // The display window should have been closed and re-opened — assert the
  // operator received the toast.
  await expect(operator.locator('text=Display window restarted')).toBeVisible({ timeout: 5000 })

  await app.close()
})

test('display root DOM carries .transparent class after toggle', async () => {
  const app = await electron.launch({
    args: [resolve(__dirname, '../../out/main/main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  })
  const operator = await app.firstWindow()
  await operator.click('text=📺 Push to Display 2')
  const displayWin = await app.waitForEvent('window', { timeout: 5000 })

  // Default: no transparent class
  await expect(displayWin.locator('html.transparent')).toHaveCount(0)

  // Toggle on
  await operator.click('text=⚙ Settings')
  await operator.locator('text=Transparent background output').locator('..').locator('input[type=checkbox]').check()
  await operator.click('text=✕')  // close settings

  // After restart, the new display window should carry the .transparent class.
  const newDisplay = await app.waitForEvent('window', { timeout: 8000 })
  await expect(newDisplay.locator('html.transparent')).toHaveCount(1)

  await app.close()
})
