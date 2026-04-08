<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Аналитика
    </h1>

    <div v-if="pending" class="text-white/40">
      Загрузка...
    </div>

    <template v-else-if="data?.streams?.length">
      <!-- Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-[#1e1e24] border border-white/5 p-4 space-y-1">
          <div class="text-xs text-white/40">
            Всего стримов
          </div>
          <div class="text-2xl font-bold">
            {{ data.total }}
          </div>
        </div>
        <div class="bg-[#1e1e24] border border-white/5 p-4 space-y-1">
          <div class="text-xs text-white/40">
            Ср. зрители (пик)
          </div>
          <div class="text-2xl font-bold">
            {{ avgPeakViewers }}
          </div>
        </div>
        <div class="bg-[#1e1e24] border border-white/5 p-4 space-y-1">
          <div class="text-xs text-white/40">
            Всего донатов
          </div>
          <div class="text-2xl font-bold">
            {{ totalDonations }} ₽
          </div>
        </div>
        <div class="bg-[#1e1e24] border border-white/5 p-4 space-y-1">
          <div class="text-xs text-white/40">
            Всего сообщений
          </div>
          <div class="text-2xl font-bold">
            {{ totalMessages }}
          </div>
        </div>
      </div>

      <!-- Stream list -->
      <div class="space-y-3">
        <div
          v-for="stream in data.streams"
          :key="stream.id"
          class="bg-[#1e1e24] border border-white/5 p-4 cursor-pointer hover:border-white/10 transition-colors"
          @click="toggleExpand(stream.id)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="size-2.5 rounded-full"
                :class="stream.isLive ? 'bg-green-500 animate-pulse' : 'bg-white/20'"
              />
              <span class="font-semibold">{{ formatStreamDate(stream.createdAt) }}</span>
              <span v-if="stream.endedAt" class="text-sm text-white/30">
                {{ formatDuration(stream.createdAt, stream.endedAt) }}
              </span>
              <span v-else-if="stream.isLive" class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5">
                LIVE
              </span>
            </div>
            <div class="flex items-center gap-4 text-sm text-white/40">
              <span><Icon name="lucide:eye" class="size-3.5 inline" /> {{ stream.peakViewers }}</span>
              <span><Icon name="lucide:message-square" class="size-3.5 inline" /> {{ stream.messagesCount }}</span>
              <Icon
                name="lucide:chevron-down"
                class="size-4 transition-transform"
                :class="expanded.has(stream.id) ? 'rotate-180' : ''"
              />
            </div>
          </div>

          <div v-if="expanded.has(stream.id)" class="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <CabinetStatCard
              label="Пик зрителей"
              :value="stream.peakViewers"
              icon="lucide:eye"
            />
            <CabinetStatCard
              label="Сообщения"
              :value="stream.messagesCount"
              icon="lucide:message-square"
            />
            <CabinetStatCard
              label="Донаты"
              :value="`${stream.donationsTotal} ₽`"
              icon="lucide:heart"
            />
            <CabinetStatCard
              label="Топливо +"
              :value="stream.fuelAdded"
              icon="lucide:fuel"
            />
            <CabinetStatCard
              label="Топливо -"
              :value="stream.fuelStolen"
              icon="lucide:flame"
            />
            <CabinetStatCard
              label="Деревья"
              :value="stream.treesChopped"
              icon="lucide:tree-pine"
            />
            <CabinetStatCard
              label="Купоны"
              :value="stream.couponsTaken"
              icon="lucide:ticket"
            />
            <CabinetStatCard
              label="Реди"
              :value="stream.totalRedemptions"
              icon="lucide:gift"
            />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="data.totalPages > 1" class="flex items-center justify-center gap-2">
        <UButton
          :disabled="page <= 1"
          size="sm"
          variant="ghost"
          icon="lucide:chevron-left"
          class="text-white/60!"
          @click="page--"
        />
        <span class="text-sm text-white/40">{{ page }} / {{ data.totalPages }}</span>
        <UButton
          :disabled="page >= data.totalPages"
          size="sm"
          variant="ghost"
          icon="lucide:chevron-right"
          class="text-white/60!"
          @click="page++"
        />
      </div>
    </template>

    <div v-else class="text-center py-12 text-white/30">
      Стримов пока нет
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const page = ref(1)
const expanded = reactive(new Set<string>())

const { data, pending } = useFetch('/api/cabinet/streams', {
  query: computed(() => ({ page: page.value })),
  watch: [page],
})

const avgPeakViewers = computed(() => {
  if (!data.value?.streams?.length) {
    return 0
  }
  const sum = data.value.streams.reduce((s: number, st: any) => s + (st.peakViewers ?? 0), 0)
  return Math.round(sum / data.value.streams.length)
})

const totalDonations = computed(() => {
  if (!data.value?.streams?.length) {
    return 0
  }
  return data.value.streams.reduce((s: number, st: any) => s + (st.donationsTotal ?? 0), 0)
})

const totalMessages = computed(() => {
  if (!data.value?.streams?.length) {
    return 0
  }
  return data.value.streams.reduce((s: number, st: any) => s + (st.messagesCount ?? 0), 0)
})

function toggleExpand(id: string) {
  if (expanded.has(id)) {
    expanded.delete(id)
  } else {
    expanded.add(id)
  }
}

function formatStreamDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}ч ${m}м`
}
</script>
