<template>
  <img :src="`/static${src}`" alt="">
</template>

<script setup lang="ts">
defineProps<{ src: string }>()
</script>
