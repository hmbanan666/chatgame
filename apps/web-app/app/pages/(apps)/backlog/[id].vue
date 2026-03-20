<template>
  <ClientOnly>
    <div class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent">
      <div class="flex flex-col gap-2 p-4 h-full overflow-y-auto">
        <TransitionGroup name="list">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex flex-col gap-1 p-3 bg-orange-950/80 rounded-lg border border-orange-800/50"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-orange-200">{{ item.authorName }}</span>
              <span v-if="item.amount" class="text-xs text-orange-400">{{ item.amount }} ₽</span>
            </div>
            <p class="text-sm text-orange-100">
              {{ item.text }}
            </p>
          </div>
        </TransitionGroup>

        <div v-if="items.length === 0" class="flex items-center justify-center h-full">
          <p class="text-orange-500/50 text-sm">
            Пока пусто
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
  transform: translateY(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
