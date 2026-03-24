<template>
  <ClientOnly>
    <div class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent">
      <div class="flex flex-col justify-end gap-2 p-4 h-full overflow-y-auto scrollbar-hide">
        <!-- Items grow from bottom up -->
        <TransitionGroup name="list">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex flex-col gap-1 p-3 rounded-lg border"
            :class="cardClass(item)"
          >
            <!-- Donation card -->
            <template v-if="item.source === 'donation'">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <Icon name="lucide:heart" class="!size-3 text-orange-400" />
                  <span class="text-sm font-bold text-orange-200">{{ item.authorName }}</span>
                </div>
                <span v-if="item.amount" class="text-xs font-medium text-orange-400">{{ item.amount }} ₽</span>
              </div>
              <p class="text-base text-orange-100">
                {{ item.text }}
              </p>
            </template>

            <!-- Quest card -->
            <template v-else-if="item.source === 'quest'">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <Icon name="lucide:target" class="!size-3 text-violet-400" />
                  <span class="text-sm font-bold text-violet-200">{{ item.authorName }}</span>
                </div>
                <span v-if="item.questReward" class="text-xs font-medium text-amber-400">+{{ item.questReward }} 🪙</span>
              </div>
              <p class="text-base text-violet-100">
                {{ item.text }}
              </p>
              <div v-if="item.questGoal" class="flex items-center gap-2 mt-1">
                <div class="flex-1 h-1.5 rounded-full bg-violet-900/50 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="item.status === 'done' ? 'bg-green-400' : 'bg-violet-400'"
                    :style="{ width: `${Math.min((item.questProgress / item.questGoal) * 100, 100)}%` }"
                  />
                </div>
                <span class="text-xs text-violet-300 tabular-nums">{{ item.questProgress }}/{{ item.questGoal }}</span>
              </div>
            </template>
          </div>
        </TransitionGroup>

        <!-- CTA -->
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-950 border border-orange-800/50 shrink-0">
          <Icon name="lucide:sparkles" class="!size-4 text-orange-400 shrink-0" />
          <p class="text-sm text-orange-300">
            Пиши в чат — получай квест. Донат с идеей — появится здесь.
          </p>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'game',
})

interface BacklogItem {
  id: string
  text: string
  authorName: string
  source: 'donation' | 'quest'
  status: string
  amount: number | null
  questProgress: number
  questGoal: number | null
  questReward: number | null
  createdAt: string
}

const { params } = useRoute('backlog-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const items = ref<BacklogItem[]>([])

function cardClass(item: BacklogItem) {
  if (item.source === 'quest') {
    if (item.status === 'done') {
      return 'bg-green-950 border-green-500/60'
    }
    return 'bg-violet-950 border-violet-500/60'
  }
  return 'bg-orange-950 border-orange-500/60'
}

async function update(id: string) {
  try {
    const data = await $fetch<BacklogItem[]>(`/api/backlog/${id}`)
    if (data) {
      items.value = data
    }
  } catch {
    // Backlog not found or server error
  }
}

let syncInterval: NodeJS.Timeout

onMounted(() => {
  update(params.id as string)

  syncInterval = setInterval(() => {
    update(params.id as string)
  }, 5000)
})

onUnmounted(() => {
  clearInterval(syncInterval)
})
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
