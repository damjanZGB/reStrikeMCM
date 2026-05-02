import { test, expect, _electron as electron } from '@playwright/test'
import { resolve } from 'node:path'

test('app launches and operator window shows session UI', async () => {
  const app = await electron.launch({
    args: [resolve(__dirname, '../../out/main/main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  })
  const window = await app.firstWindow()
  await expect(window.locator('strong')).toContainText('reStrike MCM')
  await expect(window.locator('.session-label')).toBeVisible()
  await app.close()
})

test('add ceremony button creates a new ceremony in queue', async () => {
  const app = await electron.launch({ args: [resolve(__dirname, '../../out/main/main.js')] })
  const window = await app.firstWindow()
  await window.click('text=+ Add ceremony')
  await expect(window.locator('.queue-item')).toHaveCount(1)
  await app.close()
})
