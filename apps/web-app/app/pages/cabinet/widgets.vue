<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Виджеты
    </h1>
    <p class="text-white/40 text-sm">
      Скопируй ссылку и добавь как Источник Браузера в OBS или другую программу
    </p>

    <div v-if="!widgetToken" class="text-white/40">
      Загрузка...
    </div>

    <ClientOnly v-else>
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

const { data: tokenData } = await useFetch('/api/cabinet/widget-token')
const widgetToken = computed(() => tokenData.value?.token ?? '')

const baseUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin
  }
  return ''
})

const widgets = computed(() => {
  const t = widgetToken.value
  if (!t) {
    return []
  }

  return [
    {
      name: 'Игра',
      description: 'Основной игровой оверлей с караваном, деревьями и персонажами',
      icon: 'lucide:gamepad-2',
      url: `${baseUrl.value}/widget/game/${t}`,
      size: '1920 x 1080',
    },
    {
      name: 'Алерты',
      description: 'Уведомления о новых зрителях, донатах, уровнях и квестах',
      icon: 'lucide:bell',
      url: `${baseUrl.value}/widget/alerts/${t}`,
      size: '800 x 600',
    },
    {
      name: 'Квесты + караван',
      description: 'Задачи зрителей и прогресс каравана',
      icon: 'lucide:list-todo',
      url: `${baseUrl.value}/widget/quests/${t}`,
      size: '400 x 800',
    },
  ]
})
</script>
