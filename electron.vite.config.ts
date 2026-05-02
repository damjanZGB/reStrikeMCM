import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    // chokidar is bundled (not externalized) so its transitive readdirp is inlined —
    // pnpm's symlink layout otherwise loses transitive deps when packed into asar.
    plugins: [externalizeDepsPlugin({ exclude: ['chokidar'] })],
    build: { outDir: 'out/main', rollupOptions: { input: { main: resolve('electron/main.ts') } } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { outDir: 'out/preload', rollupOptions: { input: { preload: resolve('electron/preload.ts') } } },
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: { operator: resolve('apps/operator/index.html'), display: resolve('apps/display/index.html') } },
    },
  },
})
