<template>
  <div class="flex flex-row justify-start items-center gap-1 w-14 h-6 px-1" :class="getEffectColor(modifier.code)">
    <Icon :name="getEffectIcon(modifier.code)" class="size-4! shrink-0 opacity-50" />

    <NumberFlow
      :value="remaining"
      :format="{ style: 'decimal', maximumFractionDigits: 0 }"
      locales="en-US"
      class="text-sm font-semibold"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChargeModifier } from '#shared/types/charge'
import NumberFlow from '@number-flow/vue'

const { modifier } = defineProps<{
  modifier: ChargeModifier
}>()

const remaining = ref(calcRemaining())

function calcRemaining() {
  return Math.max(0, Math.ceil((modifier.expiredAt - Date.now()) / 1000))
}

const interval = setInterval(() => {
  remaining.value = calcRemaining()
}, 500)

onUnmounted(() => {
  clearInterval(interval)
})

function getEffectColor(code: string) {
  if (code.startsWith('positive')) {
    return 'bg-game-bright text-game-bg'
  }
  if (code.startsWith('negative')) {
    return 'bg-game-accent text-game-bg'
  }
  return 'bg-game-bright text-game-bg'
}

function getEffectIcon(code: string) {
  if (code.startsWith('positive')) {
    return 'lucide:arrow-up'
  }
  if (code.startsWith('negative')) {
    return 'lucide:arrow-down'
  }
  return 'lucide:arrow-right'
}
</script>
