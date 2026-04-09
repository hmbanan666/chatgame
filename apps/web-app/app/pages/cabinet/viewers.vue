<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="font-pixel text-2xl font-bold">
        Зрители
      </h1>
      <span v-if="data" class="text-sm text-white/40">
        Всего: {{ data.total }}
      </span>
    </div>

    <!-- Search & sort -->
    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="search"
        placeholder="Поиск по нику..."
        icon="lucide:search"
        class="flex-1"
        :ui="{ root: 'rounded-lg', base: 'rounded-lg' }"
      />
      <USelect
        v-model="sortBy"
        :items="sortOptions"
        :ui="{ base: 'rounded-lg' }"
      />
    </div>

    <!-- Table -->
    <div v-if="pending" class="text-white/40">
      Загрузка...
    </div>

    <div v-else-if="data?.viewers?.length" class="border border-white/5 rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#141418] text-white/40 text-xs uppercase">
          <tr>
            <th class="text-left px-4 py-3">
              Имя
            </th>
            <th class="text-center px-4 py-3 hidden sm:table-cell">
              Уровень
            </th>
            <th class="text-center px-4 py-3 hidden md:table-cell">
              Сообщения
            </th>
            <th class="text-center px-4 py-3 hidden md:table-cell">
              Время
            </th>
            <th class="text-right px-4 py-3">
              Последний визит
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="viewer in data.viewers"
            :key="viewer.id"
            class="border-t border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
            @click="selectedViewer = viewer"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <Icon name="lucide:user" class="size-6 text-white/20 shrink-0" />
                <span class="font-medium">{{ viewer.userName }}</span>
              </div>
            </td>
            <td class="text-center px-4 py-3 hidden sm:table-cell">
              <span class="bg-site-highlight/20 text-site-highlight px-2 py-0.5 text-xs font-bold rounded">
                {{ viewer.level }}
              </span>
            </td>
            <td class="text-center px-4 py-3 hidden md:table-cell text-white/60">
              {{ viewer.messagesCount }}
            </td>
            <td class="text-center px-4 py-3 hidden md:table-cell text-white/60">
              {{ formatWatchTime(viewer.watchTimeMin) }}
            </td>
            <td class="text-right px-4 py-3 text-white/40 text-xs">
              {{ formatDate(viewer.lastSeenAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-12 text-white/30">
      Зрители не найдены
    </div>

    <!-- Pagination -->
    <div v-if="data && data.totalPages > 1" class="flex items-center justify-center gap-2">
      <UButton
        :disabled="page <= 1"
        size="sm"
        variant="ghost"
        icon="lucide:chevron-left"
        class="text-white/60!"
        @click="page--"
      />
      <span class="text-sm text-white/40">{{ page }} / {{ data.totalPages }}</span>
      <UButton
        :disabled="page >= data.totalPages"
        size="sm"
        variant="ghost"
        icon="lucide:chevron-right"
        class="text-white/60!"
        @click="page++"
      />
    </div>

    <!-- Viewer slide-over -->
    <USlideover
      v-if="selectedViewer"
      v-model:open="slideoverOpen"
      :title="selectedViewer.userName"
    >
      <template #body>
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="size-16 bg-[#141418] flex items-center justify-center shrink-0 rounded-lg">
              <Icon name="lucide:user" class="size-8 text-white/30" />
            </div>
            <div>
              <h2 class="text-xl font-bold">
                {{ selectedViewer.userName }}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="bg-site-highlight/20 text-site-highlight px-2 py-0.5 text-xs font-bold rounded">
                  Ур. {{ selectedViewer.level }}
                </span>
                <span class="text-xs text-white/40">{{ formatWatchTime(selectedViewer.watchTimeMin) }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-[#141418] p-3 space-y-1 rounded-lg">
              <div class="text-white/40 text-xs">
                Сообщения
              </div>
              <div class="font-bold">
                {{ selectedViewer.messagesCount }}
              </div>
            </div>
            <div class="bg-[#141418] p-3 space-y-1 rounded-lg">
              <div class="text-white/40 text-xs">
                Время у тебя
              </div>
              <div class="font-bold">
                {{ formatWatchTime(selectedViewer.watchTimeMin) }}
              </div>
            </div>
            <div class="bg-[#141418] p-3 space-y-1 rounded-lg">
              <div class="text-white/40 text-xs">
                Первый визит
              </div>
              <div class="font-bold text-xs">
                {{ formatDate(selectedViewer.createdAt) }}
              </div>
            </div>
            <div class="bg-[#141418] p-3 space-y-1 rounded-lg">
              <div class="text-white/40 text-xs">
                Уровень (общий)
              </div>
              <div class="font-bold text-site-highlight">
                {{ selectedViewer.level }}
              </div>
            </div>
            <div class="bg-[#141418] p-3 space-y-1 rounded-lg">
              <div class="text-white/40 text-xs">
                Монеты
              </div>
              <div class="font-bold">
                {{ selectedViewer.coins }}
              </div>
            </div>
            <div class="bg-[#141418] p-3 space-y-1 rounded-lg">
              <div class="text-white/40 text-xs">
                Купоны
              </div>
              <div class="font-bold">
                {{ selectedViewer.coupons }}
              </div>
            </div>
          </div>

          <!-- Note -->
          <div class="space-y-2">
            <div class="text-white/40 text-xs">
              Заметка
            </div>
            <textarea
              v-model="viewerNote"
              placeholder="Заметка о зрителе..."
              class="w-full bg-[#141418] border border-white/10 rounded-lg text-sm text-white placeholder-white/20 px-3 py-2 resize-none focus:border-teal-500/50 focus:outline-none"
              rows="3"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <PixelButton
          :disabled="noteSaving"
          class="w-full!"
          @click="saveNoteNow"
        >
          {{ noteSaving ? 'Сохранение...' : 'Сохранить' }}
        </PixelButton>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const search = ref('')
const sortBy = ref('lastSeenAt')
const sortOptions = [
  { label: 'Последний визит', value: 'lastSeenAt' },
  { label: 'Сообщения', value: 'messagesCount' },
  { label: 'Время просмотра', value: 'watchTimeMin' },
]
const page = ref(1)

const debouncedSearch = refDebounced(search, 400)

const { data, pending } = useFetch('/api/cabinet/viewers', {
  query: computed(() => ({
    search: debouncedSearch.value || undefined,
    sortBy: sortBy.value,
    page: page.value,
  })),
  watch: [debouncedSearch, sortBy, page],
})

const selectedViewer = ref<any>(null)
const slideoverOpen = ref(false)
const viewerNote = ref('')
const noteSaving = ref(false)

watch(selectedViewer, async (v) => {
  if (v) {
    slideoverOpen.value = true
    // Load note for this viewer
    viewerNote.value = ''
    try {
      const data = await $fetch<any>('/api/dashboard/viewer', {
        query: { twitchId: v.twitchId },
      })
      viewerNote.value = data?.note ?? ''
    } catch {
      // skip
    }
  }
})

async function saveNoteNow() {
  if (!selectedViewer.value) {
    return
  }
  noteSaving.value = true
  try {
    await $fetch('/api/dashboard/note', {
      method: 'POST',
      body: { profileId: selectedViewer.value.profileId, text: viewerNote.value },
    })
  } catch {
    // skip
  } finally {
    noteSaving.value = false
  }
}

watch(slideoverOpen, (open) => {
  if (!open) {
    selectedViewer.value = null
  }
})

function formatWatchTime(min: number) {
  if (min < 60) {
    return `${min}м`
  }
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`
}

function formatDate(dateStr: string) {
  if (!dateStr) {
    return ''
  }
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) {
    return 'только что'
  }
  if (mins < 60) {
    return `${mins} мин назад`
  }
  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return `${hours}ч назад`
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}д назад`
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>
