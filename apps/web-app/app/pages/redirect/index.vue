<template>
  Redirecting...
</template>

<script setup lang="ts">
onMounted(() => {
  location.href = localStorage.getItem('redirectTo') ? decodeURIComponent(localStorage.getItem('redirectTo') ?? '/') : '/'
})
</script>
