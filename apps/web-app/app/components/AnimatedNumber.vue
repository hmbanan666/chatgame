<template>
  <span class="inline-flex overflow-hidden" :style="{ height: '1em', lineHeight: '1em' }">
    <span
      v-for="(digit, i) in digits"
      :key="i"
      class="inline-block"
      :style="{
        transform: `translateY(${-digit * 1}em)`,
        transition: `transform ${duration}ms cubic-bezier(0.33, 1, 0.68, 1)`,
      }"
    >
      <span
        v-for="n in 10"
        :key="n"
        class="block text-center"
        :style="{ height: '1em' }"
      >
        {{ n - 1 }}
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
const { value, duration = 500 } = defineProps<{
  value: number
  duration?: number
}>()

const digits = computed(() => {
  return String(Math.max(0, Math.round(value)))
    .split('')
    .map(Number)
})
</script>
