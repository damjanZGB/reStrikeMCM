import { ipcMain } from 'electron'
import { join } from 'node:path'
import { resolveAnthemFor, resolveFlagFor, readMp3Duration, loadConfig } from '@restrike-mcm/core'
import type { Ceremony, PlayoutInstruction } from '@restrike-mcm/shared'
import { ASSETS_ROOT, CONFIG_PATH, DEFAULT_CONFIG_PATH } from '../paths.js'
import { getDisplayWindow, getOperatorWindow } from '../windows.js'

async function buildPlayoutInstruction(ceremony: Ceremony): Promise<PlayoutInstruction> {
  const config = await loadConfig(CONFIG_PATH, DEFAULT_CONFIG_PATH)
  const gold = ceremony.athletes.find(a => a.rank === 'gold')!
  const silver = ceremony.athletes.find(a => a.rank === 'silver')!
  const bronze1 = ceremony.athletes.find(a => a.rank === 'bronze1')!
  const bronze2 = ceremony.athletes.find(a => a.rank === 'bronze2')

  const goldAnthem  = gold.anthemOverride  ?? await resolveAnthemFor(gold.noc, ASSETS_ROOT)
  const goldFlag    = gold.flagOverride    ?? await resolveFlagFor(gold.noc, ASSETS_ROOT)
  const silverFlag  = silver.flagOverride  ?? await resolveFlagFor(silver.noc, ASSETS_ROOT)
  const bronze1Flag = bronze1.flagOverride ?? await resolveFlagFor(bronze1.noc, ASSETS_ROOT)
  const bronze2Flag = bronze2 ? (bronze2.flagOverride ?? await resolveFlagFor(bronze2.noc, ASSETS_ROOT)) : undefined

  if (!goldAnthem) throw new Error(`No anthem resolved for gold (${gold.noc})`)
  if (!goldFlag || !silverFlag || !bronze1Flag) throw new Error('Missing flag for gold/silver/bronze1')
  if (bronze2 && !bronze2Flag) throw new Error('Missing flag for bronze2')

  const anthemDurationMs = await readMp3Duration(goldAnthem)
  const backgroundPath = ceremony.display.backgroundOverride
    ?? join(ASSETS_ROOT, 'backgrounds', config.defaultBackground)

  return {
    ceremony,
    resolvedAssets: {
      anthemPath: goldAnthem,
      flagPaths: { gold: goldFlag, silver: silverFlag, bronze1: bronze1Flag, ...(bronze2Flag ? { bronze2: bronze2Flag } : {}) },
      backgroundPath,
    },
    anthemDurationMs,
    config: {
      rankLabels: config.rankLabels,
      ceremonyTitleText: config.ceremonyTitleText,
      audio: config.audio,
      podium: config.podium,
    },
  }
}

export function registerCeremonyChannels() {
  ipcMain.handle('ceremony:play', async (_e, ceremony: Ceremony) => {
    const display = getDisplayWindow()
    if (!display) throw new Error('Display window is not active. Push to Display 2 first.')
    const instruction = await buildPlayoutInstruction(ceremony)
    display.webContents.send('ceremony:play', instruction)
  })
  ipcMain.handle('ceremony:stop', () => { getDisplayWindow()?.webContents.send('ceremony:stop') })
  ipcMain.on('ceremony:phase-change', (_e, payload) => { getOperatorWindow()?.webContents.send('ceremony:phase-change', payload) })
}
