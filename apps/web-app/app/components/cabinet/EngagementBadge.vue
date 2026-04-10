<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
    :class="tierClass"
    :title="`Вовлечённость ${engagement.score}/100 — ${engagement.tierLabel}`"
  >
    <span>{{ tierEmoji }}</span>
    <span v-if="showLabel">{{ engagement.tierLabel }}</span>
    <span v-if="showScore" class="opacity-60 font-normal">{{ engagement.score }}</span>
  </span>
</template>

<script setup lang="ts">
import type { EngagementScore, EngagementTier } from '#shared/engagement/score'

const props = withDefaults(defineProps<{
  engagement: EngagementScore
  showLabel?: boolean
  showScore?: boolean
}>(), {
  showLabel: true,
  showScore: true,
})

const TIER_EMOJI: Record<EngagementTier, string> = {
  new: '🌱',
  familiar: '👋',
  active: '🔥',
  top: '⭐',
}

const TIER_CLASS: Record<EngagementTier, string> = {
  new: 'bg-white/5 text-white/40',
  familiar: 'bg-sky-500/10 text-sky-300',
  active: 'bg-orange-500/15 text-orange-300',
  top: 'bg-amber-400/20 text-amber-300',
}

const tierEmoji = computed(() => TIER_EMOJI[props.engagement.tier])
const tierClass = computed(() => TIER_CLASS[props.engagement.tier])
</script>
