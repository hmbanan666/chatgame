<template>
  <img :src="getFullUrl(src)" alt="">
</template>

<script setup lang="ts">
defineProps<{ src: string }>()

function getFullUrl(src: string) {
  return new URL(`chatgame-assets${src}`, 'https://storage.yandexcloud.net/').href
}
</script>
