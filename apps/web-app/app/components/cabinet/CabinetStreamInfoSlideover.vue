<template>
  <USlideover
    v-model:open="open"
    title="Изменить данные"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Title -->
        <div class="space-y-1.5">
          <label class="block text-sm font-bold text-site-text">Название</label>
          <UTextarea
            v-model="title"
            :maxlength="140"
            :rows="3"
            placeholder="Название стрима..."
            autoresize
            :ui="{ root: 'w-full' }"
          />
          <div class="text-xs text-white/30 text-right">
            {{ title.length }}/140
          </div>
        </div>

        <!-- Category -->
        <div class="space-y-1.5">
          <label class="block text-sm font-bold text-site-text">Категория</label>

          <!-- Selected category card -->
          <div
            v-if="selectedCategory && !categorySearchOpen"
            class="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-md"
          >
            <img
              v-if="selectedCategory.boxArtUrl"
              :src="selectedCategory.boxArtUrl"
              :alt="selectedCategory.name"
              class="w-10 h-14 object-cover rounded"
            >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold text-site-text truncate">
                {{ selectedCategory.name }}
              </div>
            </div>
            <UButton
              icon="lucide:x"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="clearCategory"
            />
          </div>

          <!-- Category search -->
          <div v-else class="relative">
            <UInput
              v-model="categoryQuery"
              placeholder="Поиск категории..."
              icon="lucide:search"
              @focus="categorySearchOpen = true"
            />
            <!-- Results dropdown -->
            <div
              v-if="categorySearchOpen && categoryResults.length > 0"
              class="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1e1e26] border border-white/15 shadow-2xl rounded-md max-h-72 overflow-y-auto"
            >
              <button
                v-for="cat in categoryResults"
                :key="cat.id"
                class="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left cursor-pointer"
                @click="selectCategory(cat)"
              >
                <img
                  v-if="cat.boxArtUrl"
                  :src="cat.boxArtUrl"
                  :alt="cat.name"
                  class="w-8 h-11 object-cover rounded shrink-0"
                >
                <div class="min-w-0">
                  <div class="text-sm text-site-text truncate">
                    {{ cat.name }}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="space-y-1.5">
          <label class="block text-sm font-bold text-site-text">Теги</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <span
              v-for="(tag, i) in tags"
              :key="i"
              class="inline-flex items-center gap-1 bg-white/10 text-site-text text-xs px-2 py-1 rounded-full"
            >
              {{ tag }}
              <button class="text-white/40 hover:text-white cursor-pointer" @click="removeTag(i)">
                <Icon name="lucide:x" class="size-3" />
              </button>
            </span>
          </div>
          <div v-if="tags.length < 10" class="flex gap-2">
            <UInput
              v-model="tagInput"
              placeholder="Новый тег..."
              size="sm"
              class="flex-1"
              :maxlength="25"
              @keydown.enter.prevent="addTag"
            />
            <UButton
              size="sm"
              variant="soft"
              @click="addTag"
            >
              Добавить
            </UButton>
          </div>
          <div class="text-xs text-white/30">
            {{ tags.length }}/10 тегов. Макс. 25 символов.
          </div>
        </div>

        <!-- Language (read-only info) -->
        <div v-if="language" class="space-y-1.5">
          <label class="block text-sm font-bold text-site-text">Язык трансляции</label>
          <div class="text-sm text-white/60">
            {{ languageLabel }}
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        block
        size="lg"
        :loading="saving"
        @click="save"
      >
        Готово
      </UButton>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
interface Category {
  id: string
  name: string
  boxArtUrl: string
}

interface StreamInfo {
  title: string
  gameName: string
  gameId: string
  tags: string[]
  language: string
}

const props = defineProps<{
  initial?: StreamInfo | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const title = ref('')
const selectedCategory = ref<Category | null>(null)
const tags = ref<string[]>([])
const language = ref('')
const saving = ref(false)

// Category search
const categoryQuery = ref('')
const categoryResults = ref<Category[]>([])
const categorySearchOpen = ref(false)
let searchDebounce: ReturnType<typeof setTimeout> | null = null

const tagInput = ref('')

const LANGUAGES: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
}

const languageLabel = computed(() => LANGUAGES[language.value] ?? language.value)

// Populate from initial data when opened
watch(open, (val) => {
  if (val && props.initial) {
    title.value = props.initial.title ?? ''
    tags.value = [...(props.initial.tags ?? [])]
    language.value = props.initial.language ?? ''
    if (props.initial.gameName) {
      selectedCategory.value = {
        id: props.initial.gameId,
        name: props.initial.gameName,
        boxArtUrl: '',
      }
    } else {
      selectedCategory.value = null
    }
    categoryQuery.value = ''
    categoryResults.value = []
    categorySearchOpen.value = false
    tagInput.value = ''
  }
})

// Debounced category search
watch(categoryQuery, (q) => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
  const trimmed = q.trim()
  if (!trimmed) {
    categoryResults.value = []
    return
  }
  searchDebounce = setTimeout(async () => {
    try {
      categoryResults.value = await $fetch<Category[]>('/api/cabinet/categories', {
        query: { q: trimmed },
      })
    } catch {
      categoryResults.value = []
    }
  }, 300)
})

function selectCategory(cat: Category) {
  selectedCategory.value = cat
  categorySearchOpen.value = false
  categoryQuery.value = ''
  categoryResults.value = []
}

function clearCategory() {
  selectedCategory.value = null
  categorySearchOpen.value = true
  categoryQuery.value = ''
}

function addTag() {
  const val = tagInput.value.trim().replace(/\s+/g, '').slice(0, 25)
  if (!val || tags.value.length >= 10 || tags.value.includes(val)) {
    return
  }
  tags.value.push(val)
  tagInput.value = ''
}

function removeTag(idx: number) {
  tags.value.splice(idx, 1)
}

async function save() {
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      title: title.value,
      tags: tags.value,
    }
    if (selectedCategory.value) {
      body.gameId = selectedCategory.value.id
    }
    await $fetch('/api/cabinet/stream-info', {
      method: 'POST',
      body,
    })
    emit('saved')
    open.value = false
  } catch {
    // skip
  } finally {
    saving.value = false
  }
}

// Close category search on click outside
function onClickOutside() {
  categorySearchOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
