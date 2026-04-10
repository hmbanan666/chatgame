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
            <span class="text-white/50">Статус</span>
            <div class="flex items-center gap-2">
              <span
                class="size-2 rounded-full"
                :class="overview.twitchStatus === 'RUNNING' ? 'bg-green-500' : 'bg-white/20'"
              />
              <span class="text-sm">{{ overview.twitchStatus === 'RUNNING' ? 'В эфире' : 'Ожидает стрим' }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white/50">Канал</span>
            <span class="font-semibold">{{ overview.streamer.twitchChannelName }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white/50">Channel ID</span>
            <code class="text-xs text-white/40 bg-[#0f0f14] px-2 py-1 rounded">{{ overview.streamer.twitchChannelId }}</code>
          </div>
          <PixelButton
            v-if="reconnectUrl"
            :to="reconnectUrl"
            external
            color="twitch"
            icon="lucide:refresh-cw"
          >
            Переподключить Twitch
          </PixelButton>
        </div>
        <div v-else class="text-white/40">
          Не настроен
        </div>
      </section>

      <!-- DonationAlerts -->
      <section class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          DonationAlerts
        </h2>
        <p class="text-white/40 text-sm">
          После подключения донаты зрителей будут заправлять вагон топливом, начислять монеты донатеру и показывать алерт на стриме.
        </p>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-white/50">Статус</span>
            <div class="flex items-center gap-2">
              <span
                class="size-2 rounded-full"
                :class="overview.streamer?.donationAlertsUserId ? 'bg-green-500' : 'bg-white/20'"
              />
              <span class="text-sm">{{ overview.streamer?.donationAlertsUserId ? 'Подключён' : 'Не подключён' }}</span>
            </div>
          </div>

          <div v-if="overview.streamer?.donationAlertsUserId" class="flex items-center justify-between">
            <span class="text-white/50">DA User ID</span>
            <code class="text-xs text-white/40 bg-[#0f0f14] px-2 py-1 rounded">{{ overview.streamer.donationAlertsUserId }}</code>
          </div>
        </div>

        <div class="flex items-center gap-4 pt-1">
          <PixelButton
            v-if="daAuthUrl"
            :to="daAuthUrl"
            external
            color="accent"
            :icon="overview.streamer?.donationAlertsUserId ? 'lucide:refresh-cw' : 'lucide:link'"
          >
            {{ overview.streamer?.donationAlertsUserId ? 'Переподключить' : 'Подключить' }}
          </PixelButton>
          <button
            v-if="overview.streamer?.donationAlertsUserId"
            type="button"
            :disabled="disconnectPending"
            class="text-xs text-white/30 hover:text-white/60 underline underline-offset-2 disabled:opacity-50"
            @click="disconnectDa"
          >
            {{ disconnectPending ? 'отключаем...' : 'отключить' }}
          </button>
        </div>

        <p v-if="!overview.streamer?.donationAlertsUserId" class="text-xs text-white/30">
          Нет аккаунта на DonationAlerts?
          <a
            href="https://www.donationalerts.com/"
            target="_blank"
            rel="noopener"
            class="text-white/50 hover:text-white underline underline-offset-2"
          >
            Зарегистрируйтесь
          </a>
          — это бесплатно, займёт пару минут. Потом вернитесь сюда и нажмите «Подключить».
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

const { data: overview, pending, refresh: refreshOverview } = useFetch('/api/cabinet/overview')
const { data: authData } = useFetch('/api/cabinet/auth-url')
const reconnectUrl = computed(() => authData.value?.url ?? null)

const { data: daAuthData } = useFetch('/api/cabinet/donationalerts-auth-url')
const daAuthUrl = computed(() => daAuthData.value?.url ?? null)

const disconnectPending = ref(false)
async function disconnectDa() {
  disconnectPending.value = true
  try {
    await $fetch('/api/cabinet/donationalerts-disconnect', { method: 'POST' })
    await refreshOverview()
  } finally {
    disconnectPending.value = false
  }
}
</script>
