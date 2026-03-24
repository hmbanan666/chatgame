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

watch(stage, async () => {
  if (!stage.value) {
    return
  }

  try {
    game.value = new StreamJourneyGame({ roomId: params.id as string })
    await game.value.init({ width: stage.value.clientWidth })

    stage.value.appendChild(game.value.app.canvas)
  } catch (error) {
    console.error(error)
  }
})

onUnmounted(() => {
  game.value?.destroy()
})
</script>
