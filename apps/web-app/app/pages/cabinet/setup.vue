<template>
  <div class="p-6 max-w-2xl mx-auto space-y-8">
    <div class="text-center space-y-2">
      <h1 class="font-pixel text-2xl font-bold">
        Настройка подключения
      </h1>
      <p class="text-white/40">
        Пошаговая настройка бота и игровых механик для твоего канала
      </p>
    </div>

    <!-- Steps indicator -->
    <div class="flex items-center justify-center gap-2">
      <div
        v-for="s in totalSteps"
        :key="s"
        class="size-3 transition-colors"
        :class="s <= step ? 'bg-site-accent' : 'bg-white/10'"
      />
    </div>

    <!-- Step 1: Account -->
    <div v-if="step === 1" class="bg-[#1e1e24] border border-white/5 p-6 space-y-6">
      <div class="flex items-center gap-3">
        <div class="size-10 bg-site-accent/20 flex items-center justify-center">
          <Icon name="lucide:check-circle" class="size-6 text-green-400" />
        </div>
        <div>
          <h2 class="font-bold text-lg">
            Twitch аккаунт подключён
          </h2>
          <p class="text-sm text-white/40">
            Ты авторизован через Twitch. Аккаунт связан с профилем.
          </p>
        </div>
      </div>
      <UButton class="w-full btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none!" @click="step++">
        Далее
      </UButton>
    </div>

    <!-- Step 2: Bot permissions -->
    <div v-if="step === 2" class="bg-[#1e1e24] border border-white/5 p-6 space-y-6">
      <div class="flex items-center gap-3">
        <div class="size-10 bg-site-accent/20 flex items-center justify-center">
          <Icon name="lucide:shield" class="size-6 text-site-accent" />
        </div>
        <div>
          <h2 class="font-bold text-lg">
            Права бота
          </h2>
          <p class="text-sm text-white/40">
            Бот читает чат, отправляет сообщения, управляет наградами канала и получает уведомления о событиях.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-white/60">
          Необходимые разрешения:
        </h3>
        <div class="space-y-2">
          <div
            v-for="perm in permissions"
            :key="perm.scope"
            class="flex items-start gap-3 text-sm"
          >
            <Icon name="lucide:check" class="size-4 text-green-400 mt-0.5 shrink-0" />
            <div>
              <span class="text-white/80">{{ perm.label }}</span>
              <span class="text-white/30 ml-1">({{ perm.scope }})</span>
            </div>
          </div>
        </div>
      </div>

      <p class="text-xs text-white/30">
        Токен бота настраивается администратором. Если ты видишь эту страницу — обратись к разработчику для подключения.
      </p>

      <div class="flex gap-3">
        <UButton
          variant="ghost"
          class="text-white/40! rounded-none!"
          @click="step--"
        >
          Назад
        </UButton>
        <UButton class="flex-1 btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none!" @click="step++">
          Далее
        </UButton>
      </div>
    </div>

    <!-- Step 3: Check connection -->
    <div v-if="step === 3" class="bg-[#1e1e24] border border-white/5 p-6 space-y-6">
      <div class="flex items-center gap-3">
        <div class="size-10 bg-site-accent/20 flex items-center justify-center">
          <Icon name="lucide:plug-zap" class="size-6 text-site-accent" />
        </div>
        <div>
          <h2 class="font-bold text-lg">
            Проверка подключения
          </h2>
          <p class="text-sm text-white/40">
            Текущий статус сервисов
          </p>
        </div>
      </div>

      <div v-if="statusPending" class="text-white/40">
        Проверяем...
      </div>
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-[#0f0f14]">
          <span>Twitch бот</span>
          <div class="flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              :class="statusData?.twitchStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'"
            />
            <span class="text-sm">{{ statusData?.twitchStatus === 'CONNECTED' ? 'OK' : 'Не подключён' }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between p-3 bg-[#0f0f14]">
          <span>Streamer в базе</span>
          <div class="flex items-center gap-2">
            <span
              class="size-2.5 rounded-full"
              :class="statusData?.connected ? 'bg-green-500' : 'bg-red-500'"
            />
            <span class="text-sm">{{ statusData?.connected ? 'OK' : 'Не найден' }}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <UButton
          variant="ghost"
          class="text-white/40! rounded-none!"
          @click="step--"
        >
          Назад
        </UButton>
        <UButton class="flex-1 btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none!" @click="step++">
          Далее
        </UButton>
      </div>
    </div>

    <!-- Step 4: Done -->
    <div v-if="step === 4" class="bg-[#1e1e24] border border-white/5 p-6 text-center space-y-6">
      <Icon name="lucide:party-popper" class="size-16 text-site-highlight mx-auto" />
      <h2 class="font-pixel text-xl font-bold">
        Готово!
      </h2>
      <p class="text-white/40">
        Кабинет настроен. Добавь виджеты в OBS и начинай стрим.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UButton to="/cabinet/widgets" class="btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none!">
          Виджеты для OBS
        </UButton>
        <UButton
          to="/cabinet"
          variant="ghost"
          class="text-white/60! rounded-none!"
        >
          В кабинет
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const step = ref(1)
const totalSteps = 4

const permissions = [
  { scope: 'chat:write', label: 'Отправка сообщений в чат' },
  { scope: 'channel:manage:redemptions', label: 'Управление наградами канала' },
  { scope: 'channel:manage:announcements', label: 'Анонсы в чате' },
  { scope: 'moderator:read:followers', label: 'Чтение подписчиков' },
]

const { data: statusData, pending: statusPending } = useFetch('/api/cabinet/overview', {
  lazy: true,
})
</script>
