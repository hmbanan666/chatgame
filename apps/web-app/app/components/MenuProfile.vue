<template>
  <div v-if="loggedIn" class="flex flex-row items-center gap-2">
    <NuxtLink
      to="/profile#shop"
      class="flex flex-row items-center gap-1 px-2 py-1 hover:opacity-80 duration-200"
    >
      <Image src="/coin.png" class="size-7" />
      <span class="text-[#30E1B9] text-lg font-semibold">{{ profile?.coins ?? 0 }}</span>
    </NuxtLink>

    <UPopover>
      <button class="size-11 overflow-hidden cursor-pointer duration-200 hover:opacity-85 hover:scale-105">
        <img
          :src="user?.imageUrl ?? '/icons/twitch/112.png'"
          class="size-full object-cover"
          alt=""
        >
      </button>

      <template #content>
        <div class="flex flex-col py-1 min-w-36">
          <NuxtLink
            to="/profile"
            class="px-4 py-2 text-sm text-white hover:bg-[#1e1e24] transition-colors duration-150 flex items-center gap-2"
          >
            <Icon name="lucide:user" class="size-4" />
            Мой профиль
          </NuxtLink>
          <NuxtLink
            v-if="profile?.isStreamer"
            to="/cabinet"
            class="px-4 py-2 text-sm text-white hover:bg-[#1e1e24] transition-colors duration-150 flex items-center gap-2"
          >
            <Icon name="lucide:layout-dashboard" class="size-4" />
            Кабинет
          </NuxtLink>
          <NuxtLink
            v-else
            to="/for-streamers"
            class="px-4 py-2 text-sm text-white hover:bg-[#1e1e24] transition-colors duration-150 flex items-center gap-2"
          >
            <Icon name="lucide:radio" class="size-4" />
            Для стримеров
          </NuxtLink>
          <button
            class="px-4 py-2 text-sm text-white hover:bg-[#1e1e24] transition-colors duration-150 flex items-center gap-2 cursor-pointer w-full text-left"
            @click="logout"
          >
            <Icon name="lucide:log-out" class="size-4" />
            Выйти
          </button>
        </div>
      </template>
    </UPopover>
  </div>
  <LoginButton v-else />
</template>

<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

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

async function logout() {
  await clear()
  await navigateTo('/')
}
</script>
