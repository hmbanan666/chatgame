<template>
  <ClientOnly>
    <div class="relative w-dvw h-dvh overscroll-none overflow-hidden bg-transparent flex flex-col justify-end">
      <div class="w-full bg-orange-950">
        <!-- Progress bar -->
        <div class="relative h-1.5 bg-orange-900">
          <div
            class="absolute left-0 top-0 h-full bg-orange-300 transition-all duration-1000 ease-out"
            :style="{ width: `${Math.min(energy, 100)}%` }"
          >
            <div class="absolute inset-0 bg-orange-100 opacity-20 animate-pulse" />
          </div>
        </div>

        <!-- Stats row -->
        <div class="flex items-center justify-between px-3 py-1.5">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <Icon
                name="lucide:zap"
                class="!size-3.5"
                :class="ratePerMinute > 0 ? 'text-orange-200' : 'text-orange-500'"
              />
              <NumberFlow
                :value="energy / 100"
                :format="{ style: 'percent', maximumFractionDigits: 1 }"
                locales="en-US"
                class="text-sm font-bold"
                :class="chargeTextColor"
              />
            </div>

            <div
              class="flex items-center gap-1 text-xs transition-colors duration-300"
              :class="ratePerMinute < 0 ? 'text-orange-500' : 'text-orange-300'"
            >
              <NumberFlow
                :value="ratePerMinute / 100"
                locales="en-US"
                :format="{ style: 'percent', maximumFractionDigits: 2, signDisplay: 'always' }"
              />
              <span class="text-orange-500/60">
                /мин
              </span>
            </div>

            <div class="flex items-center gap-1 text-xs text-orange-300">
              <span class="text-orange-500/60">
                x
              </span>
              <NumberFlow
                :value="difficulty"
                locales="en-US"
                :format="{ style: 'decimal', maximumFractionDigits: 2 }"
              />
            </div>

            <div class="flex items-center gap-1 text-xs text-orange-100">
              <Icon name="lucide:message-square" class="!size-3 text-orange-500/60" />
              <NumberFlow :value="messagesCount" />
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <ModifierIcon
              v-for="modifier in modifiers"
              :key="modifier.id"
              :modifier="modifier"
            />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { ChargeModifier } from '#shared/types/charge'
import NumberFlow from '@number-flow/vue'

definePageMeta({
  layout: 'game',
})

const { params } = useRoute('charge-id')
if (!params.id) {
  throw createError({ statusCode: 404 })
}

const energy = ref(0)
const rate = ref(0)
const ratePerMinute = ref(0)
const difficulty = ref(0)
const messagesCount = ref(0)
const modifiers = ref<ChargeModifier[]>([])

async function update(id: string) {
  try {
    const data = await $fetch(`/api/charge/${id}`)
    if (!data) {
      return
    }

    energy.value = data.energy
    rate.value = data.rate
    ratePerMinute.value = data.ratePerMinute
    difficulty.value = data.difficulty
    messagesCount.value = data.messagesCount
    modifiers.value = data.modifiers.slice(0, 8)
  } catch {
    // Charge room not found or server error
  }
}

const chargeTextColor = computed(() => {
  if (energy.value > 80) {
    return 'text-orange-100'
  }
  if (energy.value > 60) {
    return 'text-orange-200'
  }
  if (energy.value > 30) {
    return 'text-orange-300'
  }
  if (energy.value > 10) {
    return 'text-orange-400'
  }
  return 'text-orange-500'
})

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
