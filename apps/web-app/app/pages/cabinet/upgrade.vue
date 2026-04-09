<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-[#1e1e24] border border-site-accent/20 p-8 text-center space-y-6">
      <Icon name="lucide:lock" class="size-16 text-site-accent mx-auto" />

      <h1 class="font-pixel text-2xl font-bold">
        Триал закончился
      </h1>

      <p class="text-white/50">
        Ты провёл {{ access?.streamsUsed ?? 0 }} стримов с chatgame.
        Разблокируй полный доступ к кабинету навсегда.
      </p>

      <div class="bg-white/5 border border-white/10 p-4 space-y-2">
        <div class="flex items-center justify-center gap-2 text-lg">
          <Icon name="lucide:coins" class="size-5 text-site-highlight" />
          <span class="font-bold">{{ access?.coins ?? 0 }}</span>
          <span class="text-white/40">монет на балансе</span>
        </div>
        <div class="text-sm text-white/30">
          Нужно {{ access?.unlockCost ?? 100 }} монет
        </div>
      </div>

      <UButton
        v-if="(access?.coins ?? 0) >= (access?.unlockCost ?? 100)"
        :loading="unlocking"
        size="xl"
        class="btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none! px-8! w-full!"
        @click="unlockPremium"
      >
        Разблокировать за {{ access?.unlockCost }} монет
      </UButton>

      <div v-else class="space-y-3">
        <p class="text-sm text-site-highlight">
          Не хватает {{ (access?.unlockCost ?? 100) - (access?.coins ?? 0) }} монет
        </p>
        <UButton
          to="/profile#shop"
          class="btn-pixel bg-white/10! hover:bg-white/20! text-white! rounded-none! px-6!"
        >
          Перейти в магазин
        </UButton>
      </div>

      <p v-if="error" class="text-sm text-red-400">
        {{ error }}
      </p>

      <p class="text-xs text-white/20">
        Базовая игра на стриме продолжает работать. Зрители не теряют прогресс.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

useHead({ title: 'Разблокировать кабинет' })

const unlocking = ref(false)
const error = ref('')

const { data: access } = await useFetch('/api/cabinet/access-status')

// If already premium, redirect to cabinet
if (access.value?.status === 'premium') {
  navigateTo('/cabinet')
}

async function unlockPremium() {
  unlocking.value = true
  error.value = ''
  try {
    await $fetch('/api/cabinet/unlock-premium', { method: 'POST' })
    clearNuxtData()
    navigateTo('/cabinet')
  } catch (err: any) {
    if (err?.data?.message === 'NOT_ENOUGH_COINS') {
      error.value = 'Недостаточно монет'
    } else {
      error.value = 'Ошибка при разблокировке'
    }
  } finally {
    unlocking.value = false
  }
}
</script>
