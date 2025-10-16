import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
      ],
      dts: 'auto-imports.d.ts',
      dirs: ['./src/composables', './src/utils', './src/types'],
    }),
    Components({
      dts: true,
      dirs: ['./src/components'],
      types: [
        {
          from: 'vue-router',
          names: ['RouterLink', 'RouterView'],
        },
      ],
      resolvers: [
        IconsResolver({
          componentPrefix: 'i',
        }),
      ],
    }),
    Icons(),
    tailwindcss(),
  ],
  server: {
    port: 4300,
    host: 'app.local',
    https: {
      key: '../../.cert/localhost-key.pem',
      cert: '../../.cert/localhost.pem',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
