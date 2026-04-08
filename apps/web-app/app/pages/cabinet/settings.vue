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
      <section class="bg-[#1e1e24] border border-white/5 p-6 space-y-4">
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
            <code class="text-xs text-white/40 bg-[#0f0f14] px-2 py-1">{{ overview.streamer.twitchChannelId }}</code>
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
        </div>
        <div v-else class="text-white/40">
          Не настроен
        </div>
      </section>

      <!-- Widget settings hint -->
      <section class="bg-[#1e1e24] border border-white/5 p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          Виджеты
        </h2>
        <p class="text-white/40 text-sm">
          Настройки виджетов (цвета, звуки, позиции) будут доступны в следующем обновлении.
        </p>
        <NuxtLink to="/cabinet/widgets" class="text-sm text-site-accent hover:underline">
          Посмотреть ссылки на виджеты
        </NuxtLink>
      </section>

      <!-- Danger zone -->
      <section class="bg-[#1e1e24] border border-red-500/20 p-6 space-y-4">
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
</script>
