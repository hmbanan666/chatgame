<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Обзор
    </h1>

    <div v-if="pending" class="text-white/40">
      Загрузка...
    </div>

    <template v-else-if="data">
      <!-- Connection status -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[#1e1e24] border border-white/5 rounded-lg p-4 space-y-2">
          <div class="flex items-center gap-2 text-sm text-white/50">
            <Icon name="simple-icons:twitch" class="size-4" />
            Twitch бот
          </div>
          <div class="flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              :class="data.twitchStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'"
            />
            <span class="text-lg font-semibold">{{ data.twitchStatus === 'CONNECTED' ? 'Подключён' : 'Отключён' }}</span>
          </div>
        </div>

        <div class="bg-[#1e1e24] border border-white/5 rounded-lg p-4 space-y-2">
          <div class="flex items-center gap-2 text-sm text-white/50">
            <Icon name="lucide:radio" class="size-4" />
            Стрим
          </div>
          <div class="flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              :class="data.stream?.isLive ? 'bg-green-500 animate-pulse' : 'bg-white/20'"
            />
            <span class="text-lg font-semibold">{{ data.stream?.isLive ? 'В эфире' : 'Оффлайн' }}</span>
          </div>
        </div>

        <NuxtLink to="/cabinet/currency" class="bg-[#1e1e24] border border-white/5 hover:border-amber-500/30 rounded-lg p-4 space-y-2 transition-colors block">
          <div class="flex items-center gap-2 text-sm text-white/50">
            <Icon name="lucide:gem" class="size-4" />
            Эксклюзивная валюта
          </div>
          <div v-if="currency?.currency" class="flex items-center gap-2">
            <span class="text-lg font-semibold">{{ currency.currency.emoji }} {{ currency.currency.name }}</span>
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-sm text-amber-400">Настроить →</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Streamer coins -->
      <div v-if="earnings" class="bg-[#1e1e24] border border-white/5 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-sm text-white/50">
            Ваши монеты
          </div>
          <div class="flex items-center gap-2">
            <Image src="/coin.png" class="size-5" />
            <span class="text-lg font-bold text-teal-400">
              {{ earnings.coins }}
            </span>
          </div>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-sm text-white/40">Заработано за неделю</span>
            <span class="text-sm">{{ earnings.weeklyEarned }} / {{ earnings.weeklyLimit }}</span>
          </div>
          <div class="w-full h-2 bg-[#141418] rounded-full overflow-hidden">
            <div
              class="h-full bg-white transition-all duration-500 rounded-full"
              :style="{ width: `${Math.min(100, (earnings.weeklyEarned / earnings.weeklyLimit) * 100)}%` }"
            />
          </div>
          <p class="text-xs text-white/30">
            Монеты начисляются за активность зрителей. Лимит {{ earnings.weeklyLimit }} в неделю. Сброс {{ formatDaysLeft(earnings.weekResetsAt) }}.
          </p>
        </div>
      </div>

      <!-- Live stream stats -->
      <div v-if="data.stream" class="bg-[#1e1e24] border border-white/5 p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold text-site-highlight">
          Текущий стрим
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CabinetStatCard
            label="Зрители (пик)"
            :value="data.stream.peakViewers"
            icon="lucide:eye"
          />
          <CabinetStatCard
            label="Сообщения"
            :value="data.stream.messagesCount"
            icon="lucide:message-square"
          />
          <CabinetStatCard
            label="Донаты"
            :value="`${data.stream.donationsTotal} ₽`"
            icon="lucide:heart"
          />
          <CabinetStatCard
            label="Топливо"
            :value="data.stream.fuel"
            icon="lucide:fuel"
          />
          <CabinetStatCard
            label="Деревья"
            :value="data.stream.treesChopped"
            icon="lucide:tree-pine"
          />
          <!-- Coupons removed -->
        </div>
      </div>

      <!-- Not connected -->
      <div v-if="!data.connected" class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 text-center space-y-4">
        <Icon name="lucide:plug-zap" class="size-12 text-white/20 mx-auto" />
        <p class="text-white/40 text-sm">
          Twitch-бот не подключён. Переподключите Twitch в настройках.
        </p>
        <NuxtLink to="/cabinet/settings" class="text-sm text-teal-400 hover:underline">
          Настройки
        </NuxtLink>
      </div>

      <!-- Quick links -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink to="/cabinet/viewers" class="bg-[#1e1e24] border border-white/5 hover:border-teal-500/30 rounded-lg p-4 flex items-center gap-4 transition-colors group">
          <Icon name="lucide:users" class="size-8 text-white/30 group-hover:text-teal-400 transition-colors shrink-0" />
          <div>
            <div class="font-semibold">
              Зрители
            </div>
            <div class="text-xs text-white/40 leading-tight">
              CRM, заметки, статистика
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/cabinet/widgets" class="bg-[#1e1e24] border border-white/5 hover:border-teal-500/30 rounded-lg p-4 flex items-center gap-4 transition-colors group">
          <Icon name="lucide:layout" class="size-8 text-white/30 group-hover:text-teal-400 transition-colors shrink-0" />
          <div>
            <div class="font-semibold">
              Виджеты
            </div>
            <div class="text-xs text-white/40 leading-tight">
              Ссылки для OBS
            </div>
          </div>
        </NuxtLink>
        <NuxtLink to="/cabinet/live?demo=1" class="bg-[#1e1e24] border border-white/5 hover:border-teal-500/30 rounded-lg p-4 flex items-center gap-4 transition-colors group">
          <Icon name="lucide:play-circle" class="size-8 text-white/30 group-hover:text-teal-400 transition-colors shrink-0" />
          <div>
            <div class="font-semibold">
              Демо Live-панели
            </div>
            <div class="text-xs text-white/40 leading-tight">
              Тестовые данные для знакомства
            </div>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const { data, pending } = useFetch('/api/cabinet/overview')
const { data: earnings } = useFetch('/api/cabinet/earnings')
const { data: currency } = useFetch('/api/cabinet/currency')

function formatDaysLeft(dateStr: string | Date) {
  const ms = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000))
  if (days <= 0) {
    return 'скоро'
  }
  if (days === 1) {
    return 'через 1 день'
  }
  if (days < 5) {
    return `через ${days} дня`
  }
  return `через ${days} дней`
}
</script>
