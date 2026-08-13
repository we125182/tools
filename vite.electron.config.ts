import { resolve } from 'node:path'

import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'electron-dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        main: resolve('electron/main.ts'),
        preload: resolve('electron/preload.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', 'node:path'],
      output: {
        entryFileNames: '[name].cjs',
      },
    },
  },
})
