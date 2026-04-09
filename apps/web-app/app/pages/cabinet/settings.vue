<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Настройки
    </h1>

    <div v-if="pending" class="text-white/40">
      Загрузка...
    </div>

    <template v-else-if="overview">
      <!-- Streamer info -->
      <section class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          Twitch аккаунт
        </h2>
        <div v-if="overview.streamer" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-white/50">Канал</span>
            <span class="font-semibold">{{ overview.streamer.twitchChannelName }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white/50">Channel ID</span>
            <code class="text-xs text-white/40 bg-[#0f0f14] px-2 py-1 rounded">{{ overview.streamer.twitchChannelId }}</code>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white/50">Бот</span>
            <div class="flex items-center gap-2">
              <span
                class="size-2 rounded-full"
                :class="overview.twitchStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'"
              />
              <span class="text-sm">{{ overview.twitchStatus === 'CONNECTED' ? 'Подключён' : 'Отключён' }}</span>
            </div>
          </div>
          <a
            v-if="reconnectUrl"
            :href="reconnectUrl"
            class="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#6441a5] hover:bg-[#7b5cbf] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Icon name="lucide:refresh-cw" class="size-4" />
            Переподключить Twitch
          </a>
        </div>
        <div v-else class="text-white/40">
          Не настроен
        </div>
      </section>

      <!-- Danger zone -->
      <section class="bg-[#1e1e24] border border-red-500/20 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold text-red-400">
          Опасная зона
        </h2>
        <p class="text-white/40 text-sm">
          Отключение бота остановит все игровые механики на канале.
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const { data: overview, pending } = useFetch('/api/cabinet/overview')
const { data: authData } = useFetch('/api/cabinet/auth-url')
const reconnectUrl = computed(() => authData.value?.url ?? null)
</script>
