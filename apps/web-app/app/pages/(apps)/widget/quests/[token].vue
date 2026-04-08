<template>
  <div v-if="error" class="w-full h-dvh flex items-center justify-center text-white/30">
    Недействительный токен виджета
  </div>
  <ClientOnly v-else-if="roomId">
    <div
      :class="`biome-${biome.toLowerCase()}`"
      class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent flex flex-col justify-end transition-colors duration-1000"
    >
      <BacklogList :items="items" class="flex-1 p-4" />

      <WagonDashboard
        :fuel="fuel"
        :max-fuel="maxFuel"
        :speed="speed"
        :is-stopped="isStopped"
        :effects="effects"
        :stats="stats"
        :viewer-count="viewerCount"
        :caravan="caravan"
        :progress="caravanProgress"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { CaravanState, WagonEffect, WagonSessionStats } from '#shared/types/charge'
import type { BacklogItem } from '~/components/BacklogList.vue'

definePageMeta({
  layout: 'game',
})

const route = useRoute()
const token = route.params.token as string

const { roomId, error, resolve } = useWidgetToken(token)
await resolve()

const items = ref<BacklogItem[]>([])
const fuel = ref(0)
const maxFuel = ref(100)
const speed = ref(1)
const isStopped = ref(false)
const effects = ref<WagonEffect[]>([])
const stats = ref<WagonSessionStats>({
  fuelAdded: 0,
  fuelStolen: 0,
  treesChopped: 0,
  donationsCount: 0,
  donationsTotal: 0,
  messagesCount: 0,
  peakViewers: 0,
  totalRedemptions: 0,
  couponsTaken: 0,
  streamStartedAt: new Date().toISOString(),
})
const viewerCount = ref(0)
const biome = ref('GREEN')
const caravan = ref<CaravanState | null>(null)
const caravanProgress = ref(0)

async function update() {
  if (!roomId.value) {
    return
  }

  try {
    const data = await $fetch<BacklogItem[]>(`/api/backlog/${roomId.value}`)
    if (data) {
      items.value = data
    }
  } catch {
    // skip
  }

  try {
    const data = await $fetch(`/api/charge/${roomId.value}`)
    if (data) {
      fuel.value = data.fuel
      maxFuel.value = data.maxFuel
      speed.value = data.speed
      isStopped.value = data.isStopped
      effects.value = data.effects
      stats.value = data.stats
      viewerCount.value = data.viewerCount
      biome.value = data.biome
      caravan.value = data.caravan ?? null
      caravanProgress.value = data.caravan?.distanceTotal > 0
        ? data.caravan.distanceTraveled / data.caravan.distanceTotal
        : 0
    }
  } catch {
    // skip
  }
}

let syncInterval: ReturnType<typeof setInterval>

onMounted(() => {
  if (roomId.value) {
    update()
    syncInterval = setInterval(update, 5000)
  }
})

onUnmounted(() => {
  clearInterval(syncInterval)
})
</script>
