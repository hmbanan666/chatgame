<template>
  <ClientOnly>
    <div class="relative w-dvw h-dvh overscroll-none overflow-hidden">
      <!-- <div class="absolute bottom-16 left-0 py-2 px-1.5 w-36 bg-orange-950 rounded-r-xl">
        <img
          src="/qr-website.png"
          alt="qr"
          class="relative"
        >
      </div> -->

      <div class="absolute top-0 bottom-0 right-18 w-2 bg-orange-900">
        <div
          class="absolute bottom-0 left-0 w-2 h-full bg-orange-300 transition-all duration-1000 ease-out overflow-visible"
          :style="{ height: `${Math.min(energy, 100)}%` }"
        >
          <div class="w-2 absolute inset-0 bg-orange-100 opacity-10 animate-pulse" />

          <div class="absolute -right-3 -top-1 w-8 h-6 z-10 px-2 py-0.5 bg-gradient-to-b from-orange-900 to-orange-950 border-b-2 border-orange-900 rounded-full" :class="{ '!from-orange-50 !to-orange-100': ratePerMinute > 0 }">
            <Icon name="lucide:zap" class="!size-4 text-orange-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div class="absolute top-0 bottom-0 right-0 w-18 bg-orange-950">
        <div class="py-4 flex flex-col gap-3 justify-between h-full w-full">
          <div class="flex flex-col flex-wrap items-center gap-2.5">
            <div class="flex flex-row items-center px-2.5 bg-gradient-to-b from-orange-200 to-orange-300 rounded-xl">
              <Icon :name="batteryIconName" class="!size-8 text-orange-950" />
            </div>

            <div :class="chargeTextColor">
              <NumberFlow
                :value="energy / 100"
                :format="{ style: 'percent', maximumFractionDigits: 1 }"
                locales="en-US"
                class="text-2xl font-bold"
              />
            </div>
          </div>

          <div class="flex flex-col justify-center items-center gap-4">
            <div class="z-20 flex flex-col items-end gap-2">
              <ModifierIcon
                v-for="modifier in modifiers"
                :key="modifier.id"
                :modifier="modifier"
              />
              <div v-if="modifiers.length <= 0" class="w-14 h-6 text-sm bg-orange-200 rounded-md opacity-10" />
              <div v-if="modifiers.length <= 1" class="w-14 h-6 text-sm bg-orange-200 rounded-md opacity-10" />
              <div v-if="modifiers.length <= 2" class="w-14 h-6 text-sm bg-orange-200 rounded-md opacity-10" />
              <div v-if="modifiers.length <= 3" class="w-14 h-6 text-sm bg-orange-200 rounded-md opacity-10" />
              <div v-if="modifiers.length <= 4" class="w-14 h-6 text-sm bg-orange-200 rounded-md opacity-10" />
            </div>

            <div
              class="flex flex-col items-center transition-colors duration-300"
              :class="[
                ratePerMinute < 0 ? 'text-orange-500' : 'text-orange-300',
              ]"
            >
              <NumberFlow
                :value="ratePerMinute / 100"
                locales="en-US"
                :format="{ style: 'percent', maximumFractionDigits: 2, signDisplay: 'always' }"
                class="text-lg"
              />
              <p class="text-xs text-center">
                в минуту
              </p>
            </div>
          </div>

          <div class="flex flex-col items-center justify-end gap-5">
            <div class="flex flex-col items-center transition-colors duration-300 text-orange-300">
              <div class="flex flex-row gap-0.25 items-end">
                <p class="text-sm/7 text-center">
                  x
                </p>
                <NumberFlow
                  :value="difficulty"
                  locales="en-US"
                  :format="{ style: 'decimal', maximumFractionDigits: 2 }"
                  class="text-xl/5"
                />
              </div>
              <p class="text-xs/2 scale-90 text-center">
                сложность
              </p>
            </div>

            <div class="flex flex-col items-center transition-colors duration-300 text-orange-100">
              <NumberFlow
                :value="messagesCount"
                class="text-xl/5"
              />
              <p class="text-xs/2 scale-90 text-center">
                {{ pluralizationRu(messagesCount, ['сообщение', 'сообщения', 'сообщений']) }}
              </p>
            </div>
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
  await navigateTo('/')
}

const energy = ref(0)
const rate = ref(0)
const ratePerMinute = ref(0)
const difficulty = ref(0)
const messagesCount = ref(0)
const modifiers = ref<ChargeModifier[]>([])

async function update(id: string) {
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

const batteryIconName = computed(() => {
  if (energy.value < 10) {
    return 'i-lucide-battery'
  }
  if (energy.value < 30) {
    return 'i-lucide-battery-low'
  }
  if (energy.value < 80) {
    return 'i-lucide-battery-medium'
  }
  return 'i-lucide-battery-full'
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
