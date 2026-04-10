<template>
  <ClientOnly>
    <a
      v-if="liveStreamer"
      :href="`https://twitch.tv/${liveStreamer.channelName}`"
      target="_blank"
    >
      <div class="mt-18 p-4 min-h-16 w-full flex justify-center items-center bg-violet-600 hover:opacity-85 hover:py-6 duration-200">
        <p class="text-center text-white text-base md:text-lg">
          {{ liveStreamer.channelName }} сейчас стримит. Присоединяйся к движу. Не забудь забрать купон!
        </p>
      </div>
    </a>
  </ClientOnly>
</template>

<script setup lang="ts">
const { data: services } = await useFetch('/api/twitch/status')
const liveStreamer = computed(() => services.value?.find((s) => s.status === 'RUNNING') ?? null)
</script>
