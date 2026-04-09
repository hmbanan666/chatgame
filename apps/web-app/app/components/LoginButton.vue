<template>
  <PixelButton
    :to="loginUrl"
    external
    color="twitch"
    icon="simple-icons:twitch"
  >
    Войти
  </PixelButton>
</template>

<script setup lang="ts">
const { authUrl: loginUrl } = useAuthUrl()
</script>
