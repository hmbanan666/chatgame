<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Эксклюзивная валюта
    </h1>

    <div v-if="pending" class="text-white/40">
      Загрузка...
    </div>

    <template v-else>
      <!-- Currency status -->
      <section class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <template v-if="data?.currency">
          <div class="flex items-center gap-4">
            <span class="text-5xl">{{ data.currency.emoji }}</span>
            <div class="flex-1">
              <h2 class="font-pixel text-xl font-bold">
                {{ data.currency.name }}
              </h2>
              <p class="text-sm text-white/40 mt-1">
                Зрители копят {{ pluralForms[2] }} на стримах и разблокируют эксклюзивного персонажа.
                {{ data.currency.emoji }} не тратятся — растут как рейтинг лояльности.
              </p>
            </div>
          </div>

          <div class="bg-[#0f0f14] rounded-lg p-4 flex items-center justify-between">
            <div>
              <p class="text-white/40 text-sm">
                Для разблокировки эксклюзива нужно
              </p>
              <p class="text-2xl font-bold mt-1">
                {{ data.currency.characterPrice }} {{ data.currency.emoji }}
              </p>
            </div>
            <div class="text-right text-xs text-white/30">
              <p>Казуал — ~{{ data.currency.characterPrice }} стримов</p>
              <p>Активный — ~{{ Math.ceil(data.currency.characterPrice / 2) }} стримов</p>
            </div>
          </div>

          <button
            class="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition-colors cursor-pointer"
            @click="editOpen = true"
          >
            Изменить настройки
          </button>
        </template>

        <template v-else>
          <div class="text-center py-8 space-y-4">
            <Icon name="lucide:gem" class="size-12 text-amber-400 mx-auto" />
            <h2 class="font-pixel text-lg font-bold">
              Валюта не настроена
            </h2>
            <p class="text-white/40 text-sm max-w-md mx-auto">
              Создайте уникальную валюту для вашего канала. Зрители будут копить её во время стримов и разблокируют эксклюзивного персонажа.
            </p>
            <PixelButton @click="editOpen = true">
              Создать валюту
            </PixelButton>
          </div>
        </template>
      </section>

      <!-- Mechanics -->
      <section class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          Как зрители зарабатывают
        </h2>
        <div class="space-y-3 text-sm">
          <div class="flex items-start gap-3">
            <span class="text-teal-400 font-bold shrink-0">+1</span>
            <div>
              <p class="font-semibold">
                Просмотр 45+ минут
              </p>
              <p class="text-white/40">
                Автоматически, без команды в чате
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-teal-400 font-bold shrink-0">+1</span>
            <div>
              <p class="font-semibold">
                Выполнен квест
              </p>
              <p class="text-white/40">
                Один раз за стрим
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-teal-400 font-bold shrink-0">+N</span>
            <div>
              <p class="font-semibold">
                Донат
              </p>
              <p class="text-white/40">
                +1 за каждые 100 ₽ (без лимита)
              </p>
            </div>
          </div>
          <div class="border-t border-white/5 pt-3 text-white/40">
            {{ data?.currency?.emoji ?? '🎯' }} не тратятся — только копятся!
          </div>
        </div>
      </section>

      <!-- Leaderboard -->
      <section v-if="data?.leaderboard?.length" class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          Топ зрителей
        </h2>
        <div class="space-y-2">
          <div
            v-for="(entry, i) in data.leaderboard"
            :key="entry.profileId"
            class="flex items-center justify-between bg-[#0f0f14] rounded-lg px-4 py-2"
          >
            <div class="flex items-center gap-3">
              <span class="text-white/30 font-mono text-sm w-6">{{ i + 1 }}</span>
              <span class="font-semibold">{{ entry.userName }}</span>
            </div>
            <span class="text-teal-400 font-bold">{{ entry.balance }} {{ data.currency?.emoji }}</span>
          </div>
        </div>
      </section>
    </template>

    <!-- Edit slideover -->
    <USlideover v-model:open="editOpen" :title="data?.currency ? 'Изменить валюту' : 'Создать валюту'">
      <template #body>
        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-white/50 text-sm">Эмодзи</label>
            <input
              v-model="form.emoji"
              type="text"
              placeholder="🍌"
              maxlength="4"
              class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <label class="text-white/50 text-sm">1 ...</label>
              <input
                v-model="form.name1"
                type="text"
                placeholder="Банан"
                maxlength="20"
                class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
            </div>
            <div class="space-y-1">
              <label class="text-white/50 text-sm">2 ...</label>
              <input
                v-model="form.name2"
                type="text"
                placeholder="Банана"
                maxlength="20"
                class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
            </div>
            <div class="space-y-1">
              <label class="text-white/50 text-sm">5 ...</label>
              <input
                v-model="form.name5"
                type="text"
                placeholder="Бананов"
                maxlength="20"
                class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-white/50 text-sm">Цена эксклюзивного персонажа ({{ form.emoji || '🎯' }})</label>
            <input
              v-model.number="form.characterPrice"
              type="number"
              min="10"
              max="1000"
              class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
            <p class="text-white/30 text-xs">
              Казуал (+1/стрим) — ~{{ form.characterPrice }} стримов. Активный (+2/стрим) — ~{{ Math.ceil(form.characterPrice / 2) }} стримов.
            </p>
          </div>

          <!-- Preview -->
          <div v-if="form.name1 && form.emoji" class="bg-[#0f0f14] rounded-lg p-4 space-y-1 text-sm">
            <p class="text-white/40">
              Предпросмотр:
            </p>
            <p>
              +1 {{ form.emoji }} {{ form.name1 }} · +2 {{ form.emoji }} {{ form.name2 }} · +100 {{ form.emoji }} {{ form.name5 }}
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <PixelButton
          :disabled="saving || !form.name1 || !form.name2 || !form.name5 || !form.emoji"
          class="w-full!"
          @click="save"
        >
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
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

const { data, pending, refresh } = useFetch('/api/cabinet/currency')

const editOpen = ref(false)

const form = reactive({
  name1: '',
  name2: '',
  name5: '',
  emoji: '',
  characterPrice: 100,
})

const saving = ref(false)

const pluralForms = computed(() => {
  if (!data.value?.currency) {
    return ['', '', '']
  }
  const plural = data.value.currency.namePlural?.split(',') ?? []
  return [
    plural[0] ?? data.value.currency.name,
    plural[1] ?? data.value.currency.name,
    plural[2] ?? data.value.currency.name,
  ]
})

watch(data, (val) => {
  if (val?.currency) {
    const plural = val.currency.namePlural?.split(',') ?? []
    form.name1 = plural[0] ?? val.currency.name
    form.name2 = plural[1] ?? val.currency.name
    form.name5 = plural[2] ?? val.currency.name
    form.emoji = val.currency.emoji
    form.characterPrice = val.currency.characterPrice
  }
}, { immediate: true })

async function save() {
  saving.value = true
  try {
    await $fetch('/api/cabinet/currency', {
      method: 'POST',
      body: {
        name: form.name1,
        namePlural: `${form.name1},${form.name2},${form.name5}`,
        emoji: form.emoji,
        characterPrice: form.characterPrice,
      },
    })
    await refresh()
    editOpen.value = false
  } finally {
    saving.value = false
  }
}
</script>
