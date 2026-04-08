<template>
  <a
    class="px-5 py-3 text-white bg-[#6441a5] border-b-4 border-[#4C2D8A] rounded-none duration-200 hover:bg-[#7B5BBF] flex flex-row gap-x-2 items-center"
    :href="loginUrl"
  >
    <Icon name="simple-icons:twitch" class="size-6!" />
    <p class="leading-tight">Войти</p>
  </a>
</template>

<script setup lang="ts">
const { authUrl: loginUrl } = useAuthUrl()
</script>
