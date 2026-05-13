import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'

// `electron/` is not a pnpm workspace member (see pnpm-workspace.yaml).
// Map `@restrike-mcm/*` imports to source paths so electron-vite can bundle
// the main + preload entries without relying on node_modules symlinks.
const mcmAliases = {
  '@restrike-mcm/shared':  resolve('packages/shared/src/index.ts'),
  '@restrike-mcm/core':    resolve('packages/core/src/index.ts'),
  '@restrike-mcm/playout': resolve('packages/playout/src/index.ts'),
}

export default defineConfig({
  main: {
    // chokidar is bundled (not externalized) so its transitive readdirp is inlined —
    // pnpm's symlink layout otherwise loses transitive deps when packed into asar.
    plugins: [externalizeDepsPlugin({ exclude: ['chokidar'] })],
    resolve: { alias: mcmAliases },
    build: { outDir: 'out/main', rollupOptions: { input: { main: resolve('electron/main.ts') } } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: mcmAliases },
    build: { outDir: 'out/preload', rollupOptions: { input: { preload: resolve('electron/preload.ts') } } },
  },
  renderer: {
    root: '.',
    resolve: { alias: mcmAliases },
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: { operator: resolve('apps/operator/index.html'), display: resolve('apps/display/index.html') } },
    },
  },
})
