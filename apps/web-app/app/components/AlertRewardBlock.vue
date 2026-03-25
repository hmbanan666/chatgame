<template>
  <div class="relative flex flex-col items-center gap-2 px-12 py-6 mt-3 w-full animate-reward-pop">
    <div class="absolute inset-0 bg-game-bright/10 animate-reward-glow" />
    <div class="absolute inset-0 border-2 border-game-bright/50" />
    <div class="absolute -inset-1 border border-game-bright/20" />
    <span v-if="label" class="relative text-xs font-bold uppercase tracking-[0.3em] text-game-accent">{{ label }}</span>
    <div class="relative flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>
