<template>
  <ClientOnly>
    <a
      v-if="isStreaming"
      href="https://twitch.tv/hmbanan666"
      target="_blank"
    >
      <div class="mt-18 p-4 min-h-16 w-full flex justify-center items-center bg-violet-600 hover:opacity-85 hover:py-6 duration-200">
        <p class="text-center text-white text-base md:text-lg">hmbanan666 сейчас стримит. Присоединяйся к движу. Не забудь забрать купон!</p>
      </div>
    </a>
  </ClientOnly>
</template>

<script setup lang="ts">
const { data: services } = await useFetch('/api/twitch/status')
const isStreaming = computed(() => services.value?.some((s) => s.service === 'HMBANAN666_TWITCH' && s.status === 'RUNNING'))
</script>
