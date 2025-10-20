<template>
  <ClientOnly>
    <div class="w-dvw h-dvh overflow-hidden">
      <div
        id="game-canvas"
        ref="stage"
        class="absolute inset-0 w-full h-full overflow-hidden"
      />

      <div class="absolute inset-0 w-full h-full overflow-hidden">
        <div class="absolute top-0 left-0 right-0">
          <div class="px-4 py-1 h-10 w-full text-amber-100 bg-amber-950 border-b-4 border-amber-200">
            Последние события: 1а авлыад лвдал вдлалвыд авлдлвыдла лыл аыв
          </div>

          <div class="p-4 flex justify-between">
            <div class="p-4 h-fit bg-violet-200 rounded-lg">
              <div>Счет зрителей</div>
              <div class="text-2xl">
                23 монеты
              </div>
            </div>

            <div class="flex flex-col gap-2 justify-center items-center">
              <div class="p-4 h-fit w-fit bg-amber-100 rounded-lg text-3xl text-center">
                05:04
              </div>

              <div class="p-4 h-fit bg-amber-100 rounded-lg text-xl text-center">
                Фаза 2: Действия зрителя
              </div>
            </div>

            <div class="p-4 h-fit bg-amber-100 rounded-lg">
              <div>Счет стримера</div>
              <div class="text-2xl text-right">
                16 монет
              </div>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0">
          <div class="p-4 h-82 flex gap-2 items-end bg-amber-950 border-t-4 border-amber-200">
            <div class="aspect-[2/3] h-86 p-4 w-auto bg-amber-100 rounded-2xl">
              <h3>Правила игры</h3>
            </div>

            <div class="p-4 flex gap-4 h-full w-full">
              <GameCard />
              <GameCard />
              <GameCard />
              <GameCard />
              <GameCard />
              <GameCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { BaseGame } from '@chat-game/game'

definePageMeta({
  layout: 'game',
})

// const route = useRoute()
// const id = route.query.id?.toString() ?? ''
// const eventsUrl = computed(() => `/api/charge/${id}/sse`)

const stage = ref<HTMLElement>()

const game = new BaseGame()

onMounted(async () => {
  await game.init()
  stage.value?.appendChild(game.app.canvas)
})

onUnmounted(() => {
  // Detach the canvas and fully destroy the PIXI Application
  if (stage.value?.contains(game.app.canvas)) {
    stage.value.removeChild(game.app.canvas)
  }

  game.destroy()
})
</script>
