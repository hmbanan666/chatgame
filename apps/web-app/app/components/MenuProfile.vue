<template>
  <div v-if="loggedIn" class="flex flex-row items-center gap-2">
    <a
      href="/#shop"
      class="flex flex-row items-center gap-1 px-2 py-1 hover:opacity-80 duration-200"
    >
      <Image src="/coin.png" class="size-7" />
      <span class="text-[#30E1B9] text-lg font-semibold">{{ profile?.coins ?? 0 }}</span>
    </a>

    <a
      href="/#profile"
      class="size-11 overflow-hidden cursor-pointer duration-200 hover:opacity-85 hover:scale-105"
    >
      <img
        :src="user?.imageUrl ?? '/icons/twitch/112.png'"
        class="size-full object-cover"
        alt=""
      >
    </a>
  </div>
  <LoginButton v-else />
</template>

<script setup lang="ts">
const { loggedIn, user } = useUserSession()

const { data: profile } = useFetch(() => `/api/profile/${user.value?.id}`, {
  watch: false,
  immediate: loggedIn.value && !!user.value?.id,
})

onMounted(() => {
  if (!loggedIn.value) {
    const redirectTo = useRoute().path
    localStorage.setItem('redirectTo', redirectTo)
  }
})
</script>
