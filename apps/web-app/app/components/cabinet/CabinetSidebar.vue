<template>
  <aside class="shrink-0 h-full border-r border-white/5 bg-[#0f0f14] flex flex-col transition-all duration-200" :class="expanded ? 'w-60' : 'w-16'">
    <div class="h-18 flex items-center border-b border-white/5 px-2">
      <button
        class="flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white transition-colors cursor-pointer w-full"
        :class="!expanded && 'justify-center px-0'"
        @click="expanded = !expanded"
      >
        <Icon :name="expanded ? 'lucide:panel-left-close' : 'lucide:panel-left-open'" class="size-5 shrink-0" />
        <span v-if="expanded" class="text-base font-semibold text-site-text truncate">
          {{ userName }}
        </span>
      </button>
    </div>

    <nav class="flex-1 py-4 flex flex-col gap-1 px-2">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 py-2.5 text-sm transition-colors duration-150 group rounded-lg"
        :class="[
          isActive(item.path) ? 'bg-teal-500/15 text-teal-400' : 'text-white/60 hover:text-white hover:bg-white/5',
          expanded ? 'px-3' : 'justify-center px-0',
        ]"
      >
        <Icon :name="item.icon" class="size-5 shrink-0" />
        <span v-if="expanded" class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="px-2 pb-4">
      <NuxtLink
        to="/profile"
        class="flex items-center gap-3 py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors duration-150"
        :class="expanded ? 'px-3' : 'justify-center px-0'"
      >
        <Icon name="lucide:arrow-left" class="size-5 shrink-0" />
        <span v-if="expanded" class="truncate">Назад</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const { user } = useUserSession()
const userName = computed(() => user.value?.userName ?? 'Кабинет')
const expanded = ref(!route.path.startsWith('/cabinet/live'))

watch(() => route.path, (path) => {
  expanded.value = !path.startsWith('/cabinet/live')
})

const navItems = computed(() => [
  { label: 'Кабинет', icon: 'lucide:home', path: '/cabinet' },
  { label: 'Live-панель', icon: 'lucide:monitor', path: '/cabinet/live' },
  { label: 'Зрители', icon: 'lucide:users', path: '/cabinet/viewers' },
  { label: 'Валюта', icon: 'lucide:gem', path: '/cabinet/currency' },
  { label: 'Аналитика', icon: 'lucide:bar-chart-3', path: '/cabinet/analytics' },
  { label: 'Виджеты', icon: 'lucide:layout', path: '/cabinet/widgets' },
  { label: 'Настройки', icon: 'lucide:settings', path: '/cabinet/settings' },
])

function isActive(path: string) {
  if (path === '/cabinet') {
    return route.path === '/cabinet'
  }
  return route.path.startsWith(path)
}
</script>
