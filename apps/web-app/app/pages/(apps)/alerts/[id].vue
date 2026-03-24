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
import { createId } from '@paralleldrive/cuid2'

definePageMeta({
  layout: 'game',
})

const { params } = useRoute('alerts-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const alerts = reactive<EventMessage[]>([])
const biome = ref('GREEN')

let ws: WebSocket | null = null

function connectWs() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${protocol}://${location.host}/api/websocket`)

  ws.onopen = () => {
    ws?.send(JSON.stringify({
      id: createId(),
      type: 'CONNECT_ALERTS',
      data: { roomId: params.id },
    }))
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'BIOME_CHANGED') {
        biome.value = data.data.biome
      } else if (data.type) {
        alerts.push(data as EventMessage)
      }
    } catch {
      // Invalid message
    }
  }

  ws.onclose = () => {
    ws = null
    setTimeout(connectWs, 5000)
  }
}

onMounted(() => {
  connectWs()
})

onUnmounted(() => {
  ws?.close()
})
</script>
