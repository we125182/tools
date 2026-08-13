import { copyFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function githubPagesFallback() {
  return {
    name: 'github-pages-fallback',
    closeBundle() {
      copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron'
  const base = isElectron ? './' : process.env.BASE_PATH ?? '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`

  return {
    base: normalizedBase,
    plugins: [
      tailwindcss(),
      ...(!isElectron ? [
        VitePWA({
          registerType: 'autoUpdate',
          manifest: {
            name: 'JSON Tools',
            short_name: 'JSON Tools',
            lang: 'zh-CN',
            description: 'JSON 校验、格式化、树形浏览和请求日志查看工具。',
            theme_color: '#0f766e',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: normalizedBase,
            scope: normalizedBase,
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
        }),
        githubPagesFallback(),
      ] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
