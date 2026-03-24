<template>
  <div class="w-full bg-game-bg-alt">
    <!-- Progress bar -->
    <div class="relative h-2 bg-game-bg">
      <div
        class="absolute left-0 top-0 h-full bg-game-secondary-3 transition-all duration-1000 ease-out"
        :style="{ width: `${Math.min(energy, 100)}%` }"
      />
    </div>

    <!-- Stats -->
    <div class="flex items-center justify-between px-2 py-1">
      <div class="flex items-center gap-1">
        <Icon
          name="lucide:zap"
          class="size-3!"
          :class="ratePerMinute > 0 ? 'text-game-text' : 'text-game-accent'"
        />
        <NumberFlow
          :value="energy / 100"
          :format="{ style: 'percent', maximumFractionDigits: 1 }"
          locales="en-US"
          class="text-sm font-bold text-game-text"
        />
        <span
          class="text-xs font-medium"
          :class="ratePerMinute < 0 ? 'text-game-accent' : 'text-game-text'"
        >
          <NumberFlow
            :value="ratePerMinute / 100"
            locales="en-US"
            :format="{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'always' }"
          />
        </span>
      </div>
      <div class="flex items-center gap-1">
        <template v-for="i in maxSlots" :key="i">
          <ModifierIcon
            v-if="modifiers[i - 1]"
            :modifier="modifiers[i - 1]"
          />
          <div
            v-else
            class="w-14 h-6 bg-game-muted/30"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChargeModifier } from '#shared/types/charge'
import NumberFlow from '@number-flow/vue'

withDefaults(defineProps<{
  energy: number
  ratePerMinute: number
  difficulty: number
  messagesCount: number
  modifiers: ChargeModifier[]
  maxSlots?: number
}>(), {
  maxSlots: 3,
})
</script>
