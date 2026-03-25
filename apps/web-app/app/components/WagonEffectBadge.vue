<template>
  <div class="flex flex-row justify-start items-center gap-1 w-14 h-6 px-1" :class="effectColor">
    <Icon :name="effectIcon" class="size-3! shrink-0 opacity-50" />

    <NumberFlow
      :value="remaining"
      :format="{ style: 'decimal', maximumFractionDigits: 0 }"
      locales="en-US"
      class="text-sm font-semibold"
    />
  </div>
</template>

<script setup lang="ts">
import type { WagonEffect } from '#shared/types/charge'
import NumberFlow from '@number-flow/vue'

const { effect } = defineProps<{
  effect: WagonEffect
}>()

const remaining = ref(calcRemaining())

function calcRemaining() {
  return Math.max(0, Math.ceil((effect.expiredAt - Date.now()) / 1000))
}

const interval = setInterval(() => {
  remaining.value = calcRemaining()
}, 500)

onUnmounted(() => {
  clearInterval(interval)
})

const EFFECT_STYLES: Record<string, { color: string, icon: string }> = {
  SPEED_BOOST: { color: 'bg-game-bright text-game-bg', icon: 'lucide:zap' },
  SABOTAGE: { color: 'bg-game-accent text-game-bg', icon: 'lucide:octagon-x' },
}

const effectColor = computed(() => EFFECT_STYLES[effect.action]?.color ?? 'bg-game-muted text-game-bg')
const effectIcon = computed(() => EFFECT_STYLES[effect.action]?.icon ?? 'lucide:circle')
</script>
