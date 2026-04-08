<template>
  <div v-if="error" class="w-full h-dvh flex items-center justify-center text-white/30">
    Недействительный токен виджета
  </div>
  <ClientOnly v-else-if="roomId">
    <div
      :class="`biome-${biome.toLowerCase()}`"
      class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent transition-colors duration-1000"
    >
      <AlertOverlay :alerts="alerts" />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { EventMessage } from '@chatgame/types'
import { createId } from '@paralleldrive/cuid2'

definePageMeta({
  layout: 'game',
})

const route = useRoute()
const token = route.params.token as string

const { roomId, error, resolve } = useWidgetToken(token)
await resolve()

const alerts = reactive<EventMessage[]>([])
const biome = ref('GREEN')

let ws: WebSocket | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null

function connectWs() {
  if (!roomId.value) {
    return
  }

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${protocol}://${location.host}/api/websocket`)

  ws.onopen = () => {
    ws?.send(JSON.stringify({
      id: createId(),
      type: 'CONNECT_ALERTS',
      data: { roomId: roomId.value },
    }))
    if (pingInterval) {
      clearInterval(pingInterval)
    }
    pingInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)
  }

  ws.onmessage = (event) => {
    try {
      if (event.data === 'pong') {
        return
      }
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
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
    setTimeout(connectWs, 5000)
  }
}

onMounted(() => {
  if (roomId.value) {
    connectWs()
  }
})

onUnmounted(() => {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
  ws?.close()
})
</script>
