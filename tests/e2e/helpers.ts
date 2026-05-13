import { _electron as electron, type ElectronApplication } from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MAIN_JS = join(__dirname, '../../out/main/main.js')

/**
 * Launch the Electron app for an e2e test with a fresh, isolated user data
 * directory so tests don't see the developer's accumulated sessions/config.
 *
 * Electron honours the `--user-data-dir=PATH` command-line switch; passing it
 * before the entry script swaps `app.getPath('userData')` to our temp dir.
 *
 * Returns the app plus a `cleanup()` the caller must invoke after `app.close()`
 * to remove the temp dir. Typical use:
 *
 *   const { app, cleanup } = await launchApp()
 *   try { ...test body... } finally { await app.close(); await cleanup() }
 */
export async function launchApp(): Promise<{ app: ElectronApplication; cleanup: () => Promise<void> }> {
  const userData = await mkdtemp(join(tmpdir(), 'mcm-e2e-'))
  const app = await electron.launch({
    args: [`--user-data-dir=${userData}`, MAIN_JS],
    env: { ...process.env, NODE_ENV: 'test' },
  })
  const cleanup = () => rm(userData, { recursive: true, force: true })
  return { app, cleanup }
}
