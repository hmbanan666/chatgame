<template>
  <div class="space-y-1">
    <div class="flex items-center gap-1.5 text-xs text-white/40">
      <Icon :name="icon" class="size-3.5" />
      {{ label }}
    </div>
    <div class="text-xl font-bold">
      {{ value }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
}>()
</script>
