<template>
  <div
    class="flex flex-col gap-1 p-3"
    :class="cardClass"
  >
    <template v-if="source === 'donation'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <Icon name="lucide:heart" class="size-3! text-game-accent" />
          <span class="text-sm font-bold text-game-text">{{ authorName }}</span>
        </div>
        <span v-if="amount" class="text-xs font-medium text-game-bright">{{ amount }} ₽</span>
      </div>
      <p class="text-base text-white">
        {{ text }}
      </p>
    </template>
    <template v-else-if="source === 'quest'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <Icon name="lucide:target" class="size-3! text-game-secondary-3" />
          <span class="text-sm font-bold text-game-secondary-5">{{ authorName }}</span>
        </div>
        <span v-if="questReward" class="flex items-center gap-0.5 text-xs font-medium text-game-bright">+{{ questReward }} <Image src="/coin.png" class="size-4" /></span>
      </div>
      <p class="text-base text-game-secondary-5">
        {{ text }}
      </p>
      <div v-if="questGoal" class="flex items-center gap-2 mt-1">
        <div class="flex-1 h-1.5 rounded-none bg-game-secondary-1/50 overflow-hidden">
          <div
            class="h-full rounded-none transition-all duration-500"
            :class="status === 'done' ? 'bg-game-secondary-4' : 'bg-game-secondary-3'"
            :style="{ width: `${Math.min(((questProgress ?? 0) / questGoal) * 100, 100)}%` }"
          />
        </div>
        <span class="text-xs text-game-secondary-3 tabular-nums">{{ questProgress }}/{{ questGoal }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  source: 'donation' | 'quest'
  text: string
  authorName: string
  status: string
  amount?: number | null
  questProgress?: number
  questGoal?: number | null
  questReward?: number | null
}>()

const cardClass = computed(() => {
  if (props.source === 'quest') {
    if (props.status === 'done') {
      return 'bg-game-secondary-1'
    }
    return 'bg-game-secondary-1'
  }
  return 'bg-game-bg-alt'
})
</script>
