<template>
  Redirecting...
</template>

<script setup lang="ts">
onMounted(() => {
  const stored = localStorage.getItem('redirectTo')
  const target = stored ? decodeURIComponent(stored) : '/profile'
  location.href = target === '/' ? '/profile' : target
})
</script>
