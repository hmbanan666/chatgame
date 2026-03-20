<template>
  <div class="flex flex-row justify-start items-center gap-1 w-14 h-6 px-1 rounded-md" :class="getEffectColor(modifier.code)">
    <Icon :name="getEffectIcon(modifier.code)" class="!size-4 shrink-0 opacity-50" />

    <NumberFlow
      :value="remaining"
      :format="{ style: 'decimal', maximumFractionDigits: 1 }"
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

const { start, remaining } = useCountdown(Math.round(Math.abs(modifier.expiredAt - Date.now()) / 1000))

onMounted(() => {
  start()
})

function getEffectColor(code: string) {
  if (code.startsWith('positive')) {
    return 'bg-orange-200'
  }
  if (code.startsWith('negative')) {
    return 'bg-rose-300'
  }
  return 'bg-orange-200'
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
