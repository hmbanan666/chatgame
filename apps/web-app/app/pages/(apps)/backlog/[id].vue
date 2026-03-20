<template>
  <ClientOnly>
    <div class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent">
      <div class="flex flex-col justify-end gap-2 p-4 h-full overflow-y-auto scrollbar-hide">
        <!-- Items grow from bottom up -->
        <TransitionGroup name="list">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex flex-col gap-1 p-3 bg-orange-950 rounded-lg border border-orange-800/50"
            :class="{ 'border-orange-500/60': item.source === 'donation' }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <Icon
                  v-if="item.source === 'donation'"
                  name="lucide:heart"
                  class="!size-3 text-orange-400"
                />
                <span class="text-sm font-bold text-orange-200">{{ item.authorName }}</span>
              </div>
              <span v-if="item.amount" class="text-xs font-medium text-orange-400">{{ item.amount }} ₽</span>
            </div>
            <p class="text-base text-orange-100">
              {{ item.text }}
            </p>
          </div>
        </TransitionGroup>

        <!-- CTA -->
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-950 border border-orange-800/50 shrink-0">
          <Icon name="lucide:sparkles" class="!size-4 text-orange-400 shrink-0" />
          <p class="text-sm text-orange-400">
            Отправь донат с идеей — она появится здесь
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
  source: string
  status: string
  amount: number | null
  createdAt: string
}

const { params } = useRoute('backlog-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const items = ref<BacklogItem[]>([])

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
