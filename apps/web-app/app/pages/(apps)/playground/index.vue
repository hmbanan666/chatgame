<template>
  <ClientOnly>
    <div :class="`biome-${currentBiome.toLowerCase()}`" class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-neutral-950 transition-colors duration-1000">
      <!-- Stream content placeholder — aurora -->
      <div class="absolute inset-0 z-0 overflow-hidden bg-neutral-950">
        <div class="absolute inset-0 aurora">
          <div class="aurora-band aurora-band-1" />
          <div class="aurora-band aurora-band-2" />
          <div class="aurora-band aurora-band-3" />
        </div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="flex flex-col items-center gap-3 text-neutral-500">
            <Icon name="lucide:monitor-play" class="!size-16" />
            <span class="text-sm">Контент стрима</span>
          </div>
        </div>
      </div>

      <!-- Sound unlock -->
      <div v-if="!soundUnlocked" class="absolute top-4 left-4 z-50">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-game-bg-alt text-game-text text-sm cursor-pointer hover:bg-game-muted transition-colors"
          @click="soundUnlocked = true"
        >
          <Icon name="lucide:volume-2" class="!size-4" />
          <span>Включить звук</span>
        </button>
      </div>

      <!-- Alerts overlay -->
      <AlertOverlay :alerts="alerts" />

      <!-- Game canvas: full width, bottom-aligned -->
      <div ref="stage" class="absolute left-0 right-0 bottom-0 h-75 w-full z-10" />

      <!-- Right panel: backlog + charge + webcam (1/5 width) -->
      <div class="absolute right-0 top-0 bottom-0 w-1/5 flex flex-col z-20">
        <BacklogList :items="backlogItems" class="flex-1 p-2 pb-4" />

        <ChargeBar
          :energy="energy"
          :rate-per-minute="ratePerMinute"
          :difficulty="difficulty"
          :messages-count="messagesCount"
          :modifiers="modifiers"
        />

        <!-- Webcam -->
        <div class="shrink-0 h-56 bg-neutral-950 flex items-center justify-center overflow-hidden relative">
          <div class="absolute inset-0 webcam-aurora">
            <div class="aurora-band aurora-band-webcam" />
          </div>
          <div class="flex flex-col items-center gap-3 z-10 text-neutral-500">
            <Icon name="lucide:video" class="!size-10" />
            <span class="text-xs">Вебкамера</span>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'game',
})

const soundUnlocked = ref(false)
const stage = ref<HTMLDivElement>()
const {
  energy,
  ratePerMinute,
  difficulty,
  messagesCount,
  modifiers,
  backlogItems,
  alerts,
  start,
  stop,
} = usePlaygroundSimulator()

const game = shallowRef<InstanceType<typeof import('~/utils/stream-journey/game').StreamJourneyGame>>()
const currentBiome = ref('GREEN')
let biomeInterval: ReturnType<typeof setInterval>

watch(stage, async () => {
  if (!stage.value) {
    return
  }

  const { StreamJourneyGame } = await import('~/utils/stream-journey/game')
  game.value = new StreamJourneyGame({ demo: true })
  await game.value.init({ width: stage.value.clientWidth })
  stage.value.appendChild(game.value.app.canvas as HTMLCanvasElement)

  biomeInterval = setInterval(() => {
    if (game.value) {
      currentBiome.value = game.value.currentBiome
    }
  }, 1000)

  start()
})

onUnmounted(() => {
  stop()
  clearInterval(biomeInterval)
  game.value?.destroy()
})
</script>

<style scoped>
.aurora {
  filter: blur(80px);
}

.aurora-band {
  position: absolute;
  width: 150%;
  height: 40%;
  left: -25%;
  border-radius: 50%;
  will-change: transform, opacity;
}

.aurora-band-1 {
  top: 10%;
  background: linear-gradient(90deg, transparent, #0e4429, #065f46, #0e4429, transparent);
  animation: aurora1 15s ease-in-out infinite;
}

.aurora-band-2 {
  top: 25%;
  background: linear-gradient(90deg, transparent, #1e3a5f, #164e63, #1e3a5f, transparent);
  animation: aurora2 20s ease-in-out infinite;
}

.aurora-band-3 {
  top: 15%;
  background: linear-gradient(90deg, transparent, #3b1f5e, #1e3a5f, #0e4429, transparent);
  animation: aurora3 25s ease-in-out infinite;
}

@keyframes aurora1 {
  0%, 100% { transform: translateX(-5%); opacity: 0.3; }
  50% { transform: translateX(5%); opacity: 0.5; }
}

@keyframes aurora2 {
  0%, 100% { transform: translateX(5%); opacity: 0.2; }
  50% { transform: translateX(-5%); opacity: 0.45; }
}

@keyframes aurora3 {
  0%, 100% { transform: translateX(0%); opacity: 0.15; }
  50% { transform: translateX(3%); opacity: 0.35; }
}

.webcam-aurora {
  filter: blur(40px);
}

.aurora-band-webcam {
  position: absolute;
  width: 200%;
  height: 60%;
  left: -50%;
  top: 20%;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, #0e4429, #1e3a5f, #3b1f5e, transparent);
  animation: aurora2 18s ease-in-out infinite;
}
</style>
