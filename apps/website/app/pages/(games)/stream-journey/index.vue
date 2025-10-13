<template>
  <ClientOnly>
    <div class="game-block">
      <div id="game-canvas" ref="stage" />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { StreamJourneyGame } from '@chatgame/stream-journey'

definePageMeta({
  layout: 'game',
})

// const route = useRoute()
// const id = route.query.id?.toString() ?? ''

const stage = ref<HTMLElement>()
const game = ref<StreamJourneyGame>()

onMounted(async () => {
  try {
    game.value = new StreamJourneyGame({ eventsUrl: '' })
    await game.value.init()

    if (stage.value) {
      stage.value.appendChild(game.value.app.canvas)
    }
  } catch (error) {
    console.error(error)
    // Show user-friendly error message?
  }
})

onUnmounted(() => {
  game.value?.destroy()
})
</script>

<style scoped>
  .game-block {
    width: 100vw;
    height: 350px;
    overflow: hidden;
    position: relative;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans;
  }

  #game-canvas {
    width: 100%;
    height: 250px;
    bottom: 40px;
    position: absolute;
    overflow: hidden;
  }
</style>
