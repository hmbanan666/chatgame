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

      <!-- Top-left controls -->
      <div class="absolute top-4 left-4 z-50 flex flex-col gap-2">
        <!-- Sound unlock -->
        <button
          v-if="!soundUnlocked"
          class="flex items-center gap-2 px-4 py-2 bg-game-bg-alt text-game-text text-sm cursor-pointer hover:bg-game-muted transition-colors"
          @click="soundUnlocked = true"
        >
          <Icon name="lucide:volume-2" class="!size-4" />
          <span>Включить звук</span>
        </button>

        <!-- Alert triggers -->
        <div class="relative">
          <button
            class="flex items-center gap-2 px-4 py-2 w-full bg-game-bg-alt text-game-text text-sm cursor-pointer hover:bg-game-muted transition-colors"
            @click="alertMenuOpen = !alertMenuOpen"
          >
            <Icon name="lucide:zap" class="!size-4" />
            <span>Вызвать Алерт</span>
          </button>
          <div v-if="alertMenuOpen" class="absolute top-full left-0 right-0 mt-1 flex flex-col gap-1">
            <button
              v-for="btn in alertButtons"
              :key="btn.type"
              class="px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors text-left"
              :class="btn.class"
              @click="triggerAlert(btn.type); alertMenuOpen = false"
            >
              {{ btn.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Alerts overlay -->
      <AlertOverlay :alerts="alerts" />

      <!-- Game canvas: full width, bottom-aligned -->
      <div ref="stage" class="absolute left-0 right-0 bottom-0 h-75 w-full z-10" />

      <!-- Right panel: backlog + charge + webcam (1/5 width) -->
      <div class="absolute right-0 top-0 bottom-0 w-84 flex flex-col z-20">
        <BacklogList :items="backlogItems" class="flex-1 p-2 pb-4" />

        <WagonDashboard
          :fuel="fuel"
          :max-fuel="maxFuel"
          :speed="speed"
          :is-stopped="isStopped"
          :effects="effects"
          :stats="stats"
          :viewer-count="viewerCount"
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
import type { EventMessage } from '@chatgame/types'
import { getRandInteger } from '#shared/utils/random'

definePageMeta({
  layout: 'game',
})

const NAMES = ['kungfux010', 'sava5621', 'BezSovesty', 'pixel_ninja', 'stream_queen']
const CODENAMES = ['twitchy', 'banana', 'burger', 'gentleman', 'marshmallow', 'pup', 'shape']

function pick<T>(arr: T[]): T {
  return arr[getRandInteger(0, arr.length - 1)]!
}

let alertId = 0

const alertButtons = [
  { type: 'NEW_VIEWER', label: 'Новый зритель', class: 'bg-sky-600 hover:bg-sky-500 text-white' },
  { type: 'NEW_FOLLOWER', label: 'Новый фолловер', class: 'bg-pink-600 hover:bg-pink-500 text-white' },
  { type: 'QUEST_COMPLETE', label: 'Квест', class: 'bg-amber-600 hover:bg-amber-500 text-white' },
  { type: 'LEVEL_UP', label: 'Уровень', class: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
  { type: 'COUPON_TAKEN', label: 'Купон', class: 'bg-violet-600 hover:bg-violet-500 text-white' },
  { type: 'DONATION', label: 'Донат', class: 'bg-red-600 hover:bg-red-500 text-white' },
  { type: 'RAID', label: 'Рейд', class: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
  { type: 'PURCHASE', label: 'Покупка', class: 'bg-teal-600 hover:bg-teal-500 text-white' },
  { type: 'WAGON_FLIP', label: 'Сальто', class: 'bg-orange-600 hover:bg-orange-500 text-white' },
  { type: 'WAGON_REFUEL', label: 'Заправка', class: 'bg-orange-600 hover:bg-orange-500 text-white' },
  { type: 'WAGON_STEAL', label: 'Кража', class: 'bg-orange-600 hover:bg-orange-500 text-white' },
  { type: 'WAGON_SPEED', label: 'Ускорение', class: 'bg-orange-600 hover:bg-orange-500 text-white' },
  { type: 'WAGON_SABOTAGE', label: 'Саботаж', class: 'bg-orange-600 hover:bg-orange-500 text-white' },
  { type: 'WAGON_RESET', label: 'Сброс', class: 'bg-orange-600 hover:bg-orange-500 text-white' },
]

const soundUnlocked = ref(false)
const alertMenuOpen = ref(false)
const stage = ref<HTMLDivElement>()
const {
  fuel,
  maxFuel,
  speed,
  isStopped,
  effects,
  stats,
  viewerCount,
  backlogItems,
  alerts,
  start,
  stop,
} = usePlaygroundSimulator()

function triggerAlert(type: string) {
  const id = `manual-${++alertId}`
  const userName = pick(NAMES)
  const codename = pick(CODENAMES)

  const generators: Record<string, () => EventMessage> = {
    NEW_VIEWER: () => ({ id, type: 'NEW_VIEWER', data: { userName, codename } }),
    NEW_FOLLOWER: () => ({ id, type: 'NEW_FOLLOWER', data: { userName } }),
    QUEST_COMPLETE: () => ({ id, type: 'QUEST_COMPLETE', data: { userName, codename, questText: 'Срубить 10 деревьев', reward: getRandInteger(1, 3), xpReward: pick([3, 5, 10]), totalCoins: getRandInteger(10, 200) } }),
    LEVEL_UP: () => ({ id, type: 'LEVEL_UP', data: { userName, codename, level: getRandInteger(2, 20), reward: 1 } }),
    COUPON_TAKEN: () => ({ id, type: 'COUPON_TAKEN', data: { userName, codename, totalCoupons: getRandInteger(1, 10) } }),
    DONATION: () => {
      const amount = getRandInteger(50, 500)
      return { id, type: 'DONATION', data: { userName, codename, amount, currency: 'RUB', message: 'Крутой стрим!', xpEarned: Math.max(1, Math.floor(amount / 5)) } }
    },
    RAID: () => {
      const v = getRandInteger(5, 300)
      return { id, type: 'RAID', data: { userName: pick(NAMES), viewers: v, xpEarned: v * 2 } }
    },
    PURCHASE: () => {
      const price = pick([100, 200, 500, 1000, 2000])
      return { id, type: 'PURCHASE', data: { userName, coins: price, price, xpEarned: Math.max(1, Math.floor(price / 5)) } }
    },
    WAGON_FLIP: () => ({ id, type: 'WAGON_ACTION', data: { userName, codename, action: 'FLIP', actionTitle: 'Сальто вагона', actionDescription: 'Сальто!', xpEarned: getRandInteger(1, 5) } }),
    WAGON_REFUEL: () => ({ id, type: 'WAGON_ACTION', data: { userName, codename, action: 'REFUEL', actionTitle: 'Заправить вагон', actionDescription: 'Заправил вагон!', xpEarned: getRandInteger(1, 10) } }),
    WAGON_STEAL: () => ({ id, type: 'WAGON_ACTION', data: { userName, codename, action: 'STEAL_FUEL', actionTitle: 'Украсть топливо', actionDescription: 'Украл топливо!', xpEarned: getRandInteger(1, 10) } }),
    WAGON_SPEED: () => ({ id, type: 'WAGON_ACTION', data: { userName, codename, action: 'SPEED_BOOST', actionTitle: 'Ускорение', actionDescription: 'Ускорил вагон!', xpEarned: getRandInteger(1, 15) } }),
    WAGON_SABOTAGE: () => ({ id, type: 'WAGON_ACTION', data: { userName, codename, action: 'SABOTAGE', actionTitle: 'Саботаж', actionDescription: 'Саботировал вагон!', xpEarned: getRandInteger(1, 20) } }),
    WAGON_RESET: () => ({ id, type: 'WAGON_ACTION', data: { userName, codename, action: 'RESET_EFFECTS', actionTitle: 'Сбросить эффекты', actionDescription: 'Сбросил все эффекты!', xpEarned: getRandInteger(1, 10) } }),
  }

  const generator = generators[type]
  if (generator) {
    const alert = generator()
    alerts.value.push(alert)

    // Trigger game effects for wagon actions
    if (alert.type === 'WAGON_ACTION' && alert.data.action === 'FLIP') {
      const wagon = game.value?.wagonService?.wagon
      if (wagon && !wagon.destroyed) {
        wagon.startFlip()
      }
    }
  }
}

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
