import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
    '@nuxt/ui',
  ],
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png',
        },
      ],
    },
  },
  routeRules: {
    '/': {
      static: true,
    },
    '/donate': {
      static: true,
    },
    '/static/**': {
      cors: true,
    },
    '/widget/**': {
      ssr: false,
      cors: true,
    },
    '/api/**': {
      cors: true,
    },
  },
  devtools: { enabled: true },
  // devServer: {
  //   port: 4300,
  //   host: 'app.local',
  //   https: {
  //     key: '../../.cert/localhost-key.pem',
  //     cert: '../../.cert/localhost.pem',
  //   },
  // },
  fonts: {
    provider: 'google',
    families: [
      {
        name: 'Roboto Serif',
        provider: 'google',
      },
    ],
  },
  icon: {
    clientBundle: {
      scan: {
        globInclude: ['app/**/*.{vue,ts}'],
        globExclude: ['node_modules', 'dist', 'build', 'coverage', 'test', 'tests', '.*'],
      },
    },
  },
  ui: {
    fonts: true,
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },
  css: ['~/assets/css/styles.css'],
  runtimeConfig: {
    databaseUrl: '',
    twitchChannelId: '',
    twitchOauthCode: '',
    yookassaShopId: '',
    yookassaApiKey: '',
    oauthTwitchClientId: '',
    oauthTwitchClientSecret: '',
    donationAlertsClientId: '',
    donationAlertsClientSecret: '',
    public: {
      signInRedirectUrl: '',
      streamerRedirectUrl: '',
      websocketUrl: '',
    },
  },
  i18n: {
    locales: [
      { code: 'ru', name: 'Русский', file: 'ru-RU.json' },
      { code: 'en', name: 'English', file: 'en-EN.json' },
    ],
    defaultLocale: 'ru',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      alwaysRedirect: true,
    },
  },
  nitro: {
    experimental: {
      websocket: true,
      tasks: true,
    },
    scheduledTasks: {
      '*/2 * * * *': ['payment:status'],
      '0 * * * *': ['game:cleanup'],
    },
  },
  compatibilityDate: '2024-08-18',
})
