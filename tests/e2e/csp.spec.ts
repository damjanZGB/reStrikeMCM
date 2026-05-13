import { test, expect } from '@playwright/test'
import { launchApp } from './helpers.js'

/**
 * CSP smoke test: launches the app, opens the display, captures all console
 * errors and `securitypolicyviolation` events, then asserts none of them are
 * CSP-related. Catches regressions where a renderer adds a resource type the
 * policy doesn't allow (e.g. a new fetch target, inline script, eval).
 */
test('no CSP violations or errors during launch + display open', async () => {
  const { app, cleanup } = await launchApp()
  const violations: string[] = []
  try {
    const operator = await app.firstWindow()
    operator.on('console', msg => {
      if (msg.type() === 'error') violations.push(`[operator console] ${msg.text()}`)
    })
    operator.on('pageerror', err => violations.push(`[operator pageerror] ${err.message}`))
    await operator.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', e => {
        // Forward to Playwright via console — captured by the listener above.
        // eslint-disable-next-line no-console
        console.error(`[CSP] ${e.violatedDirective} blocked ${e.blockedURI}`)
      })
    })

    await expect(operator.locator('strong')).toContainText('reStrike MCM')

    const [displayWin] = await Promise.all([
      app.waitForEvent('window', { timeout: 5000 }),
      operator.click('text=📺 Push to Display 2'),
    ])
    displayWin.on('console', msg => {
      if (msg.type() === 'error') violations.push(`[display console] ${msg.text()}`)
    })
    displayWin.on('pageerror', err => violations.push(`[display pageerror] ${err.message}`))

    // Wait a moment for the display to fully load and any CSP failures to surface.
    await displayWin.waitForLoadState('domcontentloaded')
    await operator.waitForTimeout(500)

    // Filter out errors unrelated to CSP that we don't fix in this spec (e.g.
    // missing assets in test env, third-party deprecation warnings).
    const cspViolations = violations.filter(v =>
      /\b(csp|content security policy|content-security-policy|refused to|violated directive)\b/i.test(v),
    )
    expect(cspViolations, `Found CSP violations:\n${cspViolations.join('\n')}`).toEqual([])
  } finally {
    await app.close()
    await cleanup()
  }
})
