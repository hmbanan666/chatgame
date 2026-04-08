<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Виджеты
    </h1>
    <p class="text-white/40 text-sm">
      Скопируй ссылку и добавь как Источник Браузера в OBS
    </p>

    <ClientOnly>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CabinetWidgetCard
          v-for="widget in widgets"
          :key="widget.name"
          :name="widget.name"
          :description="widget.description"
          :icon="widget.icon"
          :url="widget.url"
          :recommended-size="widget.size"
        />
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const { user } = useUserSession()

const baseUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin
  }
  return ''
})

const roomId = computed(() => user.value?.twitchId ?? '')

const widgets = computed(() => [
  {
    name: 'Игра (караван)',
    description: 'Основной игровой оверлей с караваном, деревьями и персонажами',
    icon: 'lucide:gamepad-2',
    url: `${baseUrl.value}/charge/${roomId.value}`,
    size: '1920 x 1080',
  },
  {
    name: 'Алерты',
    description: 'Уведомления о новых зрителях, донатах, уровнях и квестах',
    icon: 'lucide:bell',
    url: `${baseUrl.value}/alerts/${roomId.value}`,
    size: '800 x 600',
  },
  {
    name: 'Бэклог',
    description: 'Список задач и фич, предложенных зрителями через донаты',
    icon: 'lucide:list-todo',
    url: `${baseUrl.value}/backlog/${roomId.value}`,
    size: '400 x 800',
  },
  {
    name: 'Stream Journey',
    description: 'Карта путешествия стрима с прогрессом каравана',
    icon: 'lucide:map',
    url: `${baseUrl.value}/stream-journey/${roomId.value}`,
    size: '1920 x 1080',
  },
])
</script>
