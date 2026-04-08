<template>
  <div v-if="error" class="w-full h-svh flex items-center justify-center text-white/30">
    Недействительный токен виджета
  </div>
  <ClientOnly v-else-if="roomId">
    <div class="relative w-full h-svh">
      <div ref="stage" class="absolute left-0 right-0 bottom-0 h-75 w-full" />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { StreamJourneyGame } from '~/utils/stream-journey/game'

definePageMeta({
  layout: 'game',
})

const route = useRoute()
const token = route.params.token as string

const { roomId, error, resolve } = useWidgetToken(token)
await resolve()

const stage = ref<HTMLElement>()
const game = shallowRef<StreamJourneyGame>()

watch(stage, async () => {
  if (!stage.value || !roomId.value) {
    return
  }

  try {
    game.value = new StreamJourneyGame({ roomId: roomId.value })
    await game.value.init({ width: stage.value.clientWidth })
    stage.value.appendChild(game.value.app.canvas)
  } catch (err) {
    console.error(err)
  }
})

onUnmounted(() => {
  game.value?.destroy()
})
</script>
