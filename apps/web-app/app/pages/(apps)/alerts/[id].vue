<template>
  <ClientOnly>
    <div
      :class="`biome-${biome.toLowerCase()}`"
      class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent transition-colors duration-1000"
    >
      <AlertOverlay :alerts="alerts" />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { EventMessage } from '@chat-game/types'

definePageMeta({
  layout: 'game',
})

const { params } = useRoute('alerts-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const alerts = reactive<EventMessage[]>([])
const biome = ref('GREEN')

let eventSource: EventSource | null = null
let biomeInterval: ReturnType<typeof setInterval>

onMounted(() => {
  eventSource = new EventSource(`/api/alerts/${params.id}/sse`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as EventMessage
      alerts.push(data)
    } catch {
      // Invalid event
    }
  }

  eventSource.onerror = () => {
    eventSource?.close()
    setTimeout(() => {
      eventSource = new EventSource(`/api/alerts/${params.id}/sse`)
    }, 5000)
  }

  const updateBiome = async () => {
    try {
      const charge = await $fetch<{ biome: string }>(`/api/charge/${params.id}`)
      if (charge?.biome) {
        biome.value = charge.biome
      }
    } catch {
      // Charge not available
    }
  }

  updateBiome()
  biomeInterval = setInterval(updateBiome, 5000)
})

onUnmounted(() => {
  eventSource?.close()
  clearInterval(biomeInterval)
})
</script>
