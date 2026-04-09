<template>
  <div class="max-w-3xl mx-auto px-4 py-12 space-y-8">
    <div class="text-center space-y-2">
      <h1 class="font-pixel text-3xl md:text-4xl font-bold text-amber-300">
        Топ зрителей
      </h1>
      <p class="text-white/50">
        Лучшие игроки нашего сообщества
      </p>
    </div>

    <!-- Sort tabs -->
    <div class="flex justify-center gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer rounded-lg"
        :class="sortBy === tab.value
          ? 'bg-[#6441a5] text-white'
          : 'bg-[#1e1e24] text-white/60 hover:text-white'"
        @click="sortBy = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Podium (top 3) -->
    <div v-if="viewers && viewers.length >= 3" class="flex items-end justify-center gap-4 pt-4">
      <div
        v-for="(idx, i) in [1, 0, 2]"
        :key="idx"
        class="flex flex-col items-center gap-2"
        :class="i === 1 ? 'order-2' : i === 0 ? 'order-1' : 'order-3'"
      >
        <div
          class="relative flex items-center justify-center overflow-hidden"
          :class="idx === 0
            ? 'size-20 ring-4 ring-amber-400 bg-[#1e1e24] rounded-lg'
            : 'size-16 ring-2 ring-white/20 bg-[#1e1e24] rounded-lg'"
        >
          <SpriteIdle
            v-if="getActiveCodename(viewers[idx]!)"
            :codename="getActiveCodename(viewers[idx]!)!"
            :class="idx === 0 ? 'size-16' : 'size-12'"
          />
          <Icon
            v-else
            name="lucide:user"
            :class="idx === 0 ? 'size-10' : 'size-8'"
            class="text-white/40"
          />
        </div>
        <div
          class="size-6 -mt-3 flex items-center justify-center text-xs font-bold z-10 rounded-md"
          :class="idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : 'bg-amber-700 text-white'"
        >
          {{ idx + 1 }}
        </div>
        <div class="text-center">
          <p class="text-white font-semibold text-sm truncate max-w-24">
            {{ viewers[idx]!.userName }}
          </p>
          <p class="text-xs text-white/50">
            {{ getStatText(viewers[idx]!) }}
          </p>
        </div>
      </div>
    </div>

    <!-- List (4+) -->
    <div v-if="viewers && viewers.length > 3" class="space-y-1">
      <div
        v-for="(viewer, index) in viewers.slice(3)"
        :key="viewer.id"
        class="flex items-center gap-3 px-4 py-3 bg-[#1e1e24]/60 hover:bg-[#1e1e24] transition-colors duration-150 rounded-lg"
      >
        <span class="w-8 text-center text-sm font-bold text-white/40">
          {{ index + 4 }}
        </span>
        <div class="size-10 shrink-0 bg-[#141418] rounded-md flex items-center justify-center overflow-hidden">
          <SpriteIdle
            v-if="getActiveCodename(viewer)"
            :codename="getActiveCodename(viewer)!"
            class="size-8"
          />
          <Icon
            v-else
            name="lucide:user"
            class="size-5 text-white/40"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-semibold text-sm truncate">
            {{ viewer.userName }}
          </p>
          <p class="text-xs text-white/40">
            Ур. {{ viewer.level }}
          </p>
        </div>
        <p class="text-sm font-bold text-white/70 shrink-0">
          {{ getStatText(viewer) }}
        </p>
      </div>
    </div>

    <div v-if="!viewers?.length" class="text-center py-16 text-white/40">
      Пока нет данных
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Топ зрителей',
})

const tabs = [
  { label: 'Уровень', value: 'level' as const },
  { label: 'Монеты', value: 'coins' as const },
  { label: 'Купоны', value: 'coupons' as const },
  { label: 'Время на стримах', value: 'watchTimeMin' as const },
]

const sortBy = ref<'level' | 'coins' | 'coupons' | 'watchTimeMin'>('level')

const { data: viewers } = await useFetch('/api/top', {
  query: { sort: sortBy },
  watch: [sortBy],
})

type Viewer = NonNullable<typeof viewers.value>[number]

function getActiveCodename(viewer: Viewer): string | null {
  const edition = viewer.characterEditions?.find(
    (e: { id: string }) => e.id === viewer.activeEditionId,
  )
  return (edition as { character?: { codename?: string } })?.character?.codename ?? null
}

function formatWatchTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} ч`
  }
  return `${hours} ч ${mins} мин`
}

function getStatText(viewer: Viewer): string {
  if (sortBy.value === 'coins') {
    return `${viewer.coins} ${pluralizationRu(viewer.coins, ['монета', 'монеты', 'монет'])}`
  }
  if (sortBy.value === 'coupons') {
    return `${viewer.coupons} ${pluralizationRu(viewer.coupons, ['купон', 'купона', 'купонов'])}`
  }
  if (sortBy.value === 'watchTimeMin') {
    return formatWatchTime(viewer.watchTimeMin)
  }
  return `Ур. ${viewer.level}`
}
</script>
