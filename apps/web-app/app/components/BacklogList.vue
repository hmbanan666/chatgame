<template>
  <div class="flex flex-col justify-end gap-2 overflow-y-auto scrollbar-hide" :class="$attrs.class">
    <TransitionGroup name="backlog-list">
      <BacklogCard
        v-for="item in items"
        :key="item.id"
        :source="item.source"
        :text="item.text"
        :author-name="item.authorName"
        :status="item.status"
        :amount="item.amount"
        :quest-progress="item.questProgress"
        :quest-goal="item.questGoal"
        :quest-reward="item.questReward"
      />
    </TransitionGroup>

    <!-- CTA -->
    <div class="flex items-center gap-2 px-3 py-2 bg-game-bg-alt/80 shrink-0">
      <Icon name="lucide:sparkles" class="size-4! text-game-bright shrink-0" />
      <p class="text-sm text-white">
        Пиши в чат — получай квест. Донат с идеей — появится здесь.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface BacklogItem {
  id: string
  text: string
  authorName: string
  source: 'donation' | 'quest'
  status: string
  amount: number | null
  questProgress: number
  questGoal: number | null
  questReward: number | null
}

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  items: BacklogItem[]
}>()
</script>

<style scoped>
.backlog-list-move,
.backlog-list-enter-active,
.backlog-list-leave-active {
  transition: all 0.4s ease;
}

.backlog-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.backlog-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.backlog-list-leave-active {
  position: absolute;
  width: 100%;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
