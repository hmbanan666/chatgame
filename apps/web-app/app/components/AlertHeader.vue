<template>
  <div class="flex items-center gap-2 text-game-bright">
    <Icon
      :name="icon"
      class="!size-6"
      :class="iconClass"
    />
    <span class="text-base font-bold uppercase tracking-widest">{{ title }}</span>
  </div>
  <p class="text-3xl font-bold text-white">
    {{ userName }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  userName: string
  iconClass?: string
}>()
</script>
