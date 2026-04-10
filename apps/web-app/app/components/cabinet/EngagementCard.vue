<template>
  <div class="bg-[#141418] rounded-lg p-4 space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-white/40 text-xs uppercase tracking-wide">
        Вовлечённость
      </div>
      <CabinetEngagementBadge :engagement="engagement" />
    </div>

    <div class="flex items-baseline gap-2">
      <span class="text-3xl font-bold text-white">{{ engagement.score }}</span>
      <span class="text-white/30 text-sm">/ 100</span>
    </div>

    <div class="space-y-2 pt-1">
      <div
        v-for="row in rows"
        :key="row.label"
        class="space-y-1"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="text-white/50">{{ row.label }}</span>
          <span class="text-white/70 font-mono">{{ row.value }} / {{ row.max }}</span>
        </div>
        <div class="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            class="h-full bg-site-highlight transition-all"
            :style="{ width: `${Math.min(100, (row.value / row.max) * 100)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EngagementScore } from '#shared/engagement/score'

const props = defineProps<{
  engagement: EngagementScore
}>()

const rows = computed(() => [
  { label: 'Время на стриме', value: props.engagement.breakdown.watch, max: 40 },
  { label: 'Сообщения в чате', value: props.engagement.breakdown.chat, max: 30 },
  { label: 'Лояльность', value: props.engagement.breakdown.loyalty, max: 20 },
  { label: 'Свежесть', value: props.engagement.breakdown.recency, max: 10 },
])
</script>
