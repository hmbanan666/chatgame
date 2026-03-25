<template>
  <Transition name="alert">
    <div
      v-if="currentAlert"
      :key="currentAlert.id"
      class="absolute inset-x-0 top-0 flex justify-center pt-8 z-30 pointer-events-none"
    >
      <div class="relative flex flex-col items-center overflow-visible">
        <!-- Particles (full overlay, behind nothing) -->
        <div v-if="particles.length" class="fixed inset-0 z-40 pointer-events-none">
          <div
            v-for="p in particles"
            :key="p.id"
            :data-particle="p.id"
            class="absolute rounded-full"
            :class="p.color"
            :style="p.style"
          />
        </div>

        <!-- Glow behind character -->
        <div class="absolute -top-8 left-1/2 w-72 h-72 rounded-full blur-[80px] alert-glow" />

        <!-- Character sprite (floating above card) -->
        <img
          :src="`/static/stream-journey/assets/units/${currentAlert.data.codename}/idle.gif`"
          class="relative z-10 h-48 w-48 image-rendering-pixelated animate-alert-bounce"
        >

        <!-- Card body -->
        <div class="relative -mt-6 flex flex-col items-center gap-3 px-16 py-8 pb-10 bg-game-bg-alt min-w-[36rem]">
          <!-- Shimmer line -->
          <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-game-bright to-transparent animate-shimmer" />

          <template v-if="currentAlert.type === 'QUEST_COMPLETE'">
            <AlertHeader
              icon="lucide:trophy"
              title="Квест выполнен"
              :user-name="currentAlert.data.userName"
            />
            <p class="text-base text-game-text">
              {{ currentAlert.data.questText }}
            </p>

            <AlertRewardBlock label="Награда">
              <span class="text-5xl font-black text-game-bright">+{{ currentAlert.data.reward }} {{ pluralizationRu(currentAlert.data.reward, ['монета', 'монеты', 'монет']) }}</span>
              <Image src="/coin.png" class="h-12 w-12 image-rendering-pixelated" />
            </AlertRewardBlock>

            <div class="flex items-center justify-center gap-3 mt-3">
              <span class="text-base text-game-text">
                У тебя <span class="font-black text-game-bright">{{ currentAlert.data.totalCoins }}</span> монет
              </span>
              <span class="text-game-muted">·</span>
              <span class="text-base font-bold text-game-secondary-5">Трать на chatgame.space</span>
            </div>
          </template>

          <template v-else-if="currentAlert.type === 'DONATION'">
            <AlertHeader
              icon="lucide:heart"
              title="Донат"
              :user-name="currentAlert.data.userName"
              icon-class="animate-pulse"
            />

            <AlertRewardBlock>
              <span class="text-5xl font-black text-game-bright">
                {{ currentAlert.data.amount }} {{ currencySymbol(currentAlert.data.currency) }}
              </span>
            </AlertRewardBlock>

            <p v-if="currentAlert.data.message" class="text-lg text-white text-center max-w-md mt-3">
              {{ currentAlert.data.message }}
            </p>

            <p class="text-base text-game-secondary-5 mt-2">
              Спасибо за поддержку!
            </p>
          </template>

          <template v-else-if="currentAlert.type === 'LEVEL_UP'">
            <AlertHeader
              icon="lucide:arrow-up-circle"
              title="Новый уровень"
              :user-name="currentAlert.data.userName"
            />

            <AlertRewardBlock label="Награда">
              <span class="text-5xl font-black text-game-bright">+{{ currentAlert.data.reward }} {{ pluralizationRu(currentAlert.data.reward, ['монета', 'монеты', 'монет']) }}</span>
              <Image src="/coin.png" class="h-12 w-12 image-rendering-pixelated" />
            </AlertRewardBlock>

            <div class="flex items-center gap-2 mt-3">
              <span class="text-base text-game-text">Теперь уровень</span>
              <span class="text-lg font-black text-game-bright">{{ currentAlert.data.level }}</span>
              <span class="text-game-muted">·</span>
              <span class="text-base font-bold text-game-secondary-5">Трать монеты на chatgame.space</span>
            </div>
          </template>

          <template v-else-if="currentAlert.type === 'COUPON_TAKEN'">
            <AlertHeader
              icon="lucide:ticket"
              title="Купон получен"
              :user-name="currentAlert.data.userName"
            />

            <AlertRewardBlock label="Награда">
              <span class="text-5xl font-black text-game-bright">+1 купон</span>
              <Image src="/coupon-small.png" class="h-12 w-12 image-rendering-pixelated" />
            </AlertRewardBlock>

            <div class="flex items-center justify-center gap-3 mt-3">
              <span class="text-base text-game-text">
                У тебя <span class="font-black text-game-bright">{{ currentAlert.data.totalCoupons }}</span> купонов
              </span>
              <span class="text-game-muted">·</span>
              <span class="text-base font-bold text-game-secondary-5">Меняй на chatgame.space</span>
            </div>
          </template>

          <template v-else-if="currentAlert.type === 'NEW_VIEWER'">
            <AlertHeader
              icon="lucide:user-plus"
              title="Новый зритель"
              :user-name="currentAlert.data.userName"
            />

            <p class="text-base text-game-text mt-2">
              Добро пожаловать в игру!
            </p>
          </template>

          <template v-else-if="currentAlert.type === 'WAGON_ACTION'">
            <AlertHeader
              :icon="getActionIcon(currentAlert.data.action)"
              :title="currentAlert.data.actionTitle"
              :user-name="currentAlert.data.userName"
            />

            <p class="text-base text-game-text mt-2">
              {{ currentAlert.data.actionDescription }}
            </p>
          </template>

          <!-- Bottom shimmer -->
          <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-game-bright to-transparent animate-shimmer-reverse" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { EventMessage } from '@chat-game/types'
import { pluralizationRu } from '#shared/utils/pluralize'
import { useAlertSound } from '~/composables/useAlertSound'

const props = defineProps<{
  alerts: EventMessage[]
}>()

const { play: playSound } = useAlertSound()

const currentAlert = ref<EventMessage | null>(null)
const particles = ref<{ id: number, color: string, style: string }[]>([])
let particleId = 0
let processing = false
let lastProcessedIndex = 0

const ACTION_ICONS: Record<string, string> = {
  REFUEL: 'lucide:fuel',
  STEAL_FUEL: 'lucide:flame',
  SPEED_BOOST: 'lucide:zap',
  SABOTAGE: 'lucide:octagon-x',
  RESET_EFFECTS: 'lucide:refresh-cw',
}

function getActionIcon(action: string): string {
  return ACTION_ICONS[action] ?? 'lucide:circle'
}

function currencySymbol(currency: string): string {
  if (currency === 'RUB') {
    return '₽'
  }
  if (currency === 'USD') {
    return '$'
  }
  if (currency === 'EUR') {
    return '€'
  }
  return currency
}

function spawnBurst(originX: number, originY: number, burstDelay: number) {
  const colors = ['bg-game-secondary-3', 'bg-game-secondary-4', 'bg-game-secondary-5', 'bg-game-bright', 'bg-game-text']
  const count = 12 + Math.floor(Math.random() * 8)

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const distance = 80 + Math.random() * 200
    const endX = originX + (Math.cos(angle) * distance * 100) / window.innerWidth
    const endY = originY + (Math.sin(angle) * distance * 100) / window.innerHeight
    const size = 3 + Math.random() * 7
    const duration = 0.6 + Math.random() * 0.5
    const id = ++particleId

    particles.value.push({
      id,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      style: `left: ${originX}%; top: ${originY}%; width: ${size}px; height: ${size}px; transition: all ${duration}s ease-out; opacity: 1;`,
    })

    setTimeout(() => {
      const el = document.querySelector(`[data-particle="${id}"]`) as HTMLElement
      if (el) {
        el.style.left = `${endX}%`
        el.style.top = `${endY}%`
        el.style.opacity = '0'
        el.style.transform = 'scale(0)'
      }
    }, burstDelay + 20)
  }
}

const ALERT_CONFIG = {
  DONATION: { bursts: 16, burstDelay: 120, duration: 20000 },
  QUEST_COMPLETE: { bursts: 6, burstDelay: 200, duration: 15000 },
  LEVEL_UP: { bursts: 8, burstDelay: 180, duration: 12000 },
  COUPON_TAKEN: { bursts: 3, burstDelay: 250, duration: 10000 },
  NEW_VIEWER: { bursts: 4, burstDelay: 200, duration: 8000 },
  WAGON_ACTION: { bursts: 5, burstDelay: 180, duration: 8000 },
} as const

function spawnParticles(burstCount: number, burstDelay: number) {
  particles.value = []

  const spots = [
    { x: 42, y: 18 },
    { x: 58, y: 18 },
    { x: 38, y: 30 },
    { x: 62, y: 30 },
    { x: 45, y: 12 },
    { x: 55, y: 12 },
    { x: 40, y: 24 },
    { x: 60, y: 24 },
    { x: 35, y: 20 },
    { x: 65, y: 20 },
  ]

  for (let i = 0; i < burstCount; i++) {
    const spot = spots[i % spots.length]!
    const delay = i * burstDelay + Math.random() * 100
    setTimeout(() => {
      spawnBurst(spot.x, spot.y, 0)
    }, delay)
  }

  setTimeout(() => {
    particles.value = []
  }, burstCount * burstDelay + 2000)
}

function showNext() {
  if (lastProcessedIndex >= props.alerts.length) {
    currentAlert.value = null
    processing = false
    return
  }

  processing = true
  const alert = props.alerts[lastProcessedIndex]!
  lastProcessedIndex++
  currentAlert.value = alert

  const config = ALERT_CONFIG[alert.type as keyof typeof ALERT_CONFIG]
  if (config) {
    spawnParticles(config.bursts, config.burstDelay)
  }

  playSound(alert.type)

  const duration = config?.duration ?? 15000
  setTimeout(() => {
    currentAlert.value = null
    setTimeout(showNext, 500)
  }, duration)
}

watch(() => props.alerts.length, () => {
  if (!processing && props.alerts.length > lastProcessedIndex) {
    showNext()
  }
})
</script>

<style scoped>
.alert-enter-active {
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.alert-leave-active {
  transition: all 0.5s ease-in;
}

.alert-enter-from {
  opacity: 0;
  transform: translateY(-60px) scale(0.8);
}

.alert-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

.alert-glow {
  background: radial-gradient(circle, var(--color-game-bright) 0%, transparent 70%);
  opacity: 0.3;
  animation: glow-pulse 2s ease-in-out infinite;
}

.animate-alert-bounce {
  animation: char-bounce 1s ease-out;
}

@keyframes char-bounce {
  0% { transform: translateY(-40px) scale(0.5); opacity: 0; }
  50% { transform: translateY(10px) scale(1.05); opacity: 1; }
  70% { transform: translateY(-5px) scale(0.98); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.7; transform: translateX(-50%) scale(1.15); }
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}

.animate-shimmer-reverse {
  animation: shimmer 2s ease-in-out infinite 1s;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

@keyframes reward-glow {
  0%, 100% { border-color: rgb(from var(--color-game-bright) r g b / 0.3); box-shadow: 0 0 10px rgb(from var(--color-game-bright) r g b / 0.1); }
  50% { border-color: rgb(from var(--color-game-bright) r g b / 0.7); box-shadow: 0 0 20px rgb(from var(--color-game-bright) r g b / 0.3); }
}

.animate-reward-glow {
  animation: reward-glow 1.5s ease-in-out infinite;
}

.animate-reward-pop {
  animation: reward-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

@keyframes reward-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
