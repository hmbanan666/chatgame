<template>
  <div class="w-full bg-game-bg-alt">
    <!-- Row 1: Caravan route -->
    <div class="relative h-6 bg-game-secondary-1">
      <!-- Caravan progress -->
      <div
        v-if="caravan && !caravan.isPaused"
        class="absolute left-0 top-0 h-full bg-game-bright/25 transition-all duration-1000"
        :style="{ width: `${caravanPercent}%` }"
      />
      <!-- Content -->
      <div class="absolute inset-0 flex items-center px-2 gap-1.5 text-xs">
        <template v-if="caravan">
          <template v-if="caravan.isPaused">
            <Icon name="lucide:map-pin" class="size-3! text-game-bright" />
            <span class="font-bold text-game-bright">{{ caravan.fromVillage }}</span>
          </template>
          <template v-else>
            <Icon
              v-if="caravan.cargoIcon"
              :name="caravan.cargoIcon"
              class="size-3! text-game-text"
            />
            <span class="text-game-text">{{ caravan.fromVillage }}</span>
            <span class="text-game-muted">→</span>
            <span class="font-bold text-game-bright">{{ caravan.toVillage }}</span>
          </template>
        </template>
        <div class="ml-auto flex items-center gap-1.5">
          <Icon name="lucide:fuel" class="size-3! text-game-text" />
          <AnimatedNumber
            :value="fuel"
            class="font-bold text-game-text"
          />
          <span class="text-game-muted">/{{ maxFuel }}</span>
          <template v-for="i in maxSlots" :key="i">
            <WagonEffectBadge
              v-if="effects[i - 1]"
              :effect="effects[i - 1]!"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Row 2: Stats -->
    <div class="flex items-center px-2 py-0.5 gap-2.5 text-[11px] text-game-text">
      <div class="flex items-center gap-0.5">
        <Icon name="lucide:eye" class="size-2.5! text-game-bright" />
        <span>{{ viewerCount }}</span>
      </div>
      <div class="flex items-center gap-0.5">
        <Icon name="lucide:message-square" class="size-2.5! text-game-bright" />
        <span>{{ stats.messagesCount }}</span>
      </div>
      <div class="flex items-center gap-0.5">
        <Icon name="lucide:tree-pine" class="size-2.5! text-game-bright" />
        <span>{{ stats.treesChopped }}</span>
      </div>
      <span class="text-game-secondary-4 font-bold">+{{ Math.round(stats.fuelAdded) }}</span>
      <span class="text-game-accent font-bold">-{{ Math.round(stats.fuelStolen) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CaravanState, WagonEffect, WagonSessionStats } from '#shared/types/charge'

const props = withDefaults(defineProps<{
  fuel: number
  maxFuel: number
  speed: number
  isStopped: boolean
  effects: WagonEffect[]
  stats: WagonSessionStats
  viewerCount: number
  caravan?: CaravanState | null
  maxSlots?: number
}>(), {
  caravan: null,
  maxSlots: 2,
})

const caravanPercent = computed(() => {
  if (!props.caravan || props.caravan.distanceTotal <= 0) {
    return 0
  }
  return Math.min(100, (props.caravan.distanceTraveled / props.caravan.distanceTotal) * 100)
})
</script>
