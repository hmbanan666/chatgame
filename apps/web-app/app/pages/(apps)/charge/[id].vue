<template>
  <ClientOnly>
    <div
      :class="`biome-${biome.toLowerCase()}`"
      class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent flex flex-col justify-end transition-colors duration-1000"
    >
      <ChargeBar
        :energy="energy"
        :rate-per-minute="ratePerMinute"
        :difficulty="difficulty"
        :messages-count="messagesCount"
        :modifiers="modifiers"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { ChargeModifier } from '#shared/types/charge'

definePageMeta({
  layout: 'game',
})

const { params } = useRoute('charge-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const energy = ref(0)
const ratePerMinute = ref(0)
const difficulty = ref(0)
const messagesCount = ref(0)
const modifiers = ref<ChargeModifier[]>([])
const biome = ref('GREEN')

async function update(id: string) {
  try {
    const data = await $fetch(`/api/charge/${id}`)
    if (!data) {
      return
    }

    energy.value = data.energy
    ratePerMinute.value = data.ratePerMinute
    difficulty.value = data.difficulty
    messagesCount.value = data.messagesCount
    modifiers.value = data.modifiers.slice(0, 8)
    biome.value = data.biome
  } catch {
    // Charge room not found or server error
  }
}

let syncInterval: NodeJS.Timeout

onMounted(() => {
  update(params.id as string)

  syncInterval = setInterval(() => {
    update(params.id as string)
  }, 3000)
})

onUnmounted(() => {
  clearInterval(syncInterval)
})
</script>
