<template>
  <ClientOnly>
    <div
      :class="`biome-${biome.toLowerCase()}`"
      class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent flex flex-col justify-end transition-colors duration-1000"
    >
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

definePageMeta({
  layout: 'game',
})

const { params } = useRoute('charge-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

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

async function update(id: string) {
  try {
    const data = await $fetch(`/api/charge/${id}`)
    if (!data) {
      return
    }

    fuel.value = data.fuel
    maxFuel.value = data.maxFuel
    speed.value = data.speed
    isStopped.value = data.isStopped
    effects.value = data.effects
    stats.value = data.stats
    viewerCount.value = data.viewerCount
    biome.value = data.biome
    caravan.value = data.caravan ?? null
    if (data.caravan && data.caravan.distanceTotal > 0) {
      caravanProgress.value = data.caravan.distanceTraveled / data.caravan.distanceTotal
    } else {
      caravanProgress.value = 0
    }
  } catch {
    // Session not found or server error
  }
}

let syncInterval: NodeJS.Timeout

onMounted(() => {
  update(params.id as string)

  syncInterval = setInterval(() => {
    update(params.id as string)
  }, 3000)
})

onUnmounted(() => {
  clearInterval(syncInterval)
})
</script>
