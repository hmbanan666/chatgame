<template>
  <ClientOnly>
    <div
      :class="`biome-${biome.toLowerCase()}`"
      class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent transition-colors duration-1000"
    >
      <div class="flex flex-col justify-end gap-2 p-4 h-full">
        <BacklogList :items="items" class="flex-1" />
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { BacklogItem } from '~/components/BacklogList.vue'

definePageMeta({
  layout: 'game',
})

const { params } = useRoute('backlog-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const items = ref<BacklogItem[]>([])
const biome = ref('GREEN')

async function update(id: string) {
  try {
    const data = await $fetch<BacklogItem[]>(`/api/backlog/${id}`)
    if (data) {
      items.value = data
    }
  } catch {
    // Backlog not found or server error
  }

  try {
    const charge = await $fetch<{ biome: string }>(`/api/charge/${id}`)
    if (charge?.biome) {
      biome.value = charge.biome
    }
  } catch {
    // Charge not available
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
