<template>
  <div class="min-w-32 flex flex-row justify-end">
    <a
      v-if="loggedIn"
      href="/#profile"
      class="profile-avatar cursor-pointer"
    >
      <img :src="user?.imageUrl ?? '/icons/twitch/112.png'" alt="">
    </a>
    <LoginButton v-else />
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user } = useUserSession()

onMounted(() => {
  if (!loggedIn.value) {
    const redirectTo = useRoute().path
    localStorage.setItem('redirectTo', redirectTo)
  }
})
</script>

<style scoped>
.profile-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    animation-name: skewRandom;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    animation-direction: alternate-reverse;
    transform-origin: 50% 50%;
    scale: 1.1;
    opacity: 0.9;
  }

  img {
    width: 100%;
    height: auto;
    border-radius: 50%;
  }
}

@keyframes skewRandom {
  0% {
    transform: skewX(0);
  }
  50% {
    transform: skewX(-3deg);
  }
  75% {
    transform: skewX(3deg);
  }
  100% {
    transform: skewX(0);
  }
}
</style>
