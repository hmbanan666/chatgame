<template>
  <ClientOnly>
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

const { params } = useRoute('stream-journey-id')

const stage = ref<HTMLElement>()
const game = shallowRef<StreamJourneyGame>()
let biomeInterval: ReturnType<typeof setInterval>
let lastBiome = ''

watch(stage, async () => {
  if (!stage.value) {
    return
  }

  try {
    game.value = new StreamJourneyGame({ eventsUrl: `/api/stream-journey/${params.id}/sse` })
    await game.value.init({ width: stage.value.clientWidth })

    stage.value.appendChild(game.value.app.canvas)

    biomeInterval = setInterval(() => {
      if (!game.value) {
        return
      }
      const biome = game.value.currentBiome
      if (biome !== lastBiome) {
        lastBiome = biome
        $fetch(`/api/charge/${params.id}/biome`, {
          method: 'POST',
          body: { biome },
        }).catch(() => {})
      }
    }, 2000)
  } catch (error) {
    console.error(error)
  }
})

onUnmounted(() => {
  clearInterval(biomeInterval)
  game.value?.destroy()
})
</script>
