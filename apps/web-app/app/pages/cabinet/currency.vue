<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <h1 class="font-pixel text-2xl font-bold">
      Эксклюзивная валюта
    </h1>

    <div v-if="pending" class="text-white/40">
      Загрузка...
    </div>

    <template v-else>
      <!-- Currency config -->
      <section class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          Настройка валюты
        </h2>
        <p class="text-white/40 text-sm">
          Создайте уникальную валюту для вашего канала. Зрители будут копить её во время стримов и разблокируют эксклюзивного персонажа.
        </p>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-white/50 text-sm">Название</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="бананы"
              maxlength="20"
              class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
          </div>
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
        </div>

        <div class="space-y-1">
          <label class="text-white/50 text-sm">Цена эксклюзивного персонажа ({{ form.emoji || '🎯' }} токенов)</label>
          <input
            v-model.number="form.characterPrice"
            type="number"
            min="10"
            max="1000"
            class="w-full bg-[#0f0f14] border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
          <p class="text-white/30 text-xs">
            Казуальный зритель (1 токен/стрим) — ~{{ form.characterPrice }} стримов. Активный (2 токена/стрим) — ~{{ Math.ceil(form.characterPrice / 2) }} стримов.
          </p>
        </div>

        <PixelButton :disabled="saving || !form.name || !form.emoji" @click="save">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </PixelButton>
      </section>

      <!-- Preview -->
      <section v-if="data?.currency" class="bg-[#1e1e24] border border-white/5 rounded-lg p-6 space-y-4">
        <h2 class="font-pixel text-lg font-bold">
          Предпросмотр
        </h2>
        <div class="bg-[#0f0f14] rounded-lg p-4 space-y-2">
          <p class="text-sm">
            Ваша валюта: <span class="font-bold text-teal-400">{{ data.currency.emoji }} {{ data.currency.name }}</span>
          </p>
          <p class="text-sm text-white/50">
            Для разблокировки эксклюзива нужно: {{ data.currency.characterPrice }} {{ data.currency.emoji }}
          </p>
        </div>
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
                Квест или донат
              </p>
              <p class="text-white/40">
                Бонус за активное участие
              </p>
            </div>
          </div>
          <div class="border-t border-white/5 pt-3 text-white/40">
            Максимум 2 токена за стрим. Токены не тратятся — только копятся!
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const { data, pending, refresh } = useFetch('/api/cabinet/currency')

const form = reactive({
  name: '',
  emoji: '',
  characterPrice: 100,
})

const saving = ref(false)

watch(data, (val) => {
  if (val?.currency) {
    form.name = val.currency.name
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
        name: form.name,
        emoji: form.emoji,
        characterPrice: form.characterPrice,
      },
    })
    await refresh()
  } finally {
    saving.value = false
  }
}
</script>
