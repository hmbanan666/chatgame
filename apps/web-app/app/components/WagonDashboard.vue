<template>
  <div class="w-full bg-game-bg-alt">
    <!-- Route + fuel in one row -->
    <div class="relative h-7 bg-game-secondary-1">
      <!-- Progress fill -->
      <div
        v-if="caravan && !caravan.isPaused"
        class="absolute left-0 top-0 h-full bg-game-bright/20 transition-all duration-1000"
        :style="{ width: `${caravanPercent}%` }"
      />
      <!-- Content -->
      <div class="absolute inset-0 flex items-center px-2 gap-2 text-xs">
        <template v-if="caravan">
          <template v-if="caravan.isPaused">
            <Icon name="lucide:map-pin" class="size-3! text-game-bright" />
            <span class="font-bold text-game-bright">{{ caravan.fromVillage }}</span>
          </template>
          <template v-else>
            <span v-if="currentChunk" class="text-game-text/60">{{ currentChunk }}</span>
            <span v-if="currentChunk" class="text-game-muted">·</span>
            <span class="text-game-text">{{ caravan.fromVillage }}</span>
            <span class="text-game-muted">→</span>
            <span class="font-bold text-game-bright">{{ caravan.toVillage }}</span>
          </template>
        </template>
        <div class="ml-auto flex items-center gap-2">
          <!-- Effects -->
          <template v-for="i in maxSlots" :key="i">
            <WagonEffectBadge
              v-if="effects[i - 1]"
              :effect="effects[i - 1]!"
            />
          </template>
          <!-- Fuel -->
          <div class="flex items-center gap-1">
            <Icon name="lucide:fuel" class="size-3! text-game-text" />
            <AnimatedNumber
              :value="fuel"
              class="font-bold text-game-text"
            />
          </div>
        </div>
      </div>
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
  progress?: number
  currentChunk?: string
  maxSlots?: number
}>(), {
  caravan: null,
  progress: 0,
  currentChunk: '',
  maxSlots: 2,
})

const caravanPercent = computed(() => {
  return Math.min(100, props.progress * 100)
})
</script>
