<template>
  <div class="w-full bg-game-bg-alt">
    <!-- Fuel bar -->
    <div class="relative h-6 bg-game-secondary-1">
      <div
        class="absolute left-0 top-0 h-full transition-all duration-1000 ease-out"
        :class="isStopped ? 'bg-game-accent' : 'bg-game-secondary-2'"
        :style="{ width: `${fuelPercent}%` }"
      />
      <div class="absolute inset-0 flex items-center px-2 gap-1">
        <Icon name="lucide:fuel" class="size-3! text-game-text" />
        <AnimatedNumber
          :value="fuel"
          class="text-sm font-bold text-game-text"
        />
        <span class="text-xs text-game-text/60">/{{ maxFuel }}</span>
      </div>
    </div>

    <!-- Stats row -->
    <div class="flex items-center justify-between px-2 py-1 gap-2">
      <!-- Left: stream stats -->
      <div class="flex items-center gap-2 text-sm text-game-text">
        <div class="flex items-center gap-1">
          <Icon name="lucide:eye" class="size-3! text-game-bright" />
          <span>{{ viewerCount }}</span>
        </div>

        <div class="flex items-center gap-1">
          <Icon name="lucide:message-square" class="size-3! text-game-bright" />
          <span>{{ stats.messagesCount }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:tree-pine" class="size-3! text-game-bright" />
          <span>{{ stats.treesChopped }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:fuel" class="size-3! text-game-secondary-4" />
          <span class="text-game-secondary-4">+{{ stats.fuelAdded }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Icon name="lucide:flame" class="size-3! text-game-accent" />
          <span class="text-game-accent">-{{ stats.fuelStolen }}</span>
        </div>
      </div>

      <!-- Right: active effects -->
      <div class="flex items-center gap-1">
        <template v-for="i in maxSlots" :key="i">
          <WagonEffectBadge
            v-if="effects[i - 1]"
            :effect="effects[i - 1]!"
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
import type { WagonEffect, WagonSessionStats } from '#shared/types/charge'

const props = withDefaults(defineProps<{
  fuel: number
  maxFuel: number
  speed: number
  isStopped: boolean
  effects: WagonEffect[]
  stats: WagonSessionStats
  viewerCount: number
  maxSlots?: number
}>(), {
  maxSlots: 2,
})

const fuelPercent = computed(() => {
  if (props.maxFuel <= 0) {
    return 0
  }
  return Math.min(100, (props.fuel / props.maxFuel) * 100)
})
</script>
