<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-[#1e1e24] border border-white/10 p-8 text-center space-y-4">
      <template v-if="error">
        <Icon name="lucide:x-circle" class="size-12 text-red-400 mx-auto" />
        <h2 class="font-pixel text-xl font-bold">
          Ошибка подключения DonationAlerts
        </h2>
        <p class="text-white/40 text-sm">
          {{ error }}
        </p>
        <UButton
          to="/cabinet/settings"
          class="btn-pixel bg-white/10! hover:bg-white/20! text-white! rounded-none! px-6!"
        >
          Вернуться в настройки
        </UButton>
      </template>
      <template v-else>
        <Icon name="lucide:loader-2" class="size-12 text-site-accent mx-auto animate-spin" />
        <h2 class="font-pixel text-xl font-bold">
          Подключаем DonationAlerts...
        </h2>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Подключение DonationAlerts' })

const route = useRoute()
const error = ref('')

const code = route.query.code as string | undefined

onMounted(async () => {
  if (!code) {
    error.value = 'Не получен код авторизации от DonationAlerts'
    return
  }

  try {
    await $fetch('/api/cabinet/donationalerts-connect', {
      method: 'POST',
      body: { code },
    })
    await navigateTo('/cabinet/settings')
  } catch (err: any) {
    error.value = err?.data?.message || 'Не удалось подключить DonationAlerts'
  }
})
</script>
