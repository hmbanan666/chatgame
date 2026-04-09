<template>
  <div class="max-w-3xl mx-auto px-4 py-16 space-y-12">
    <!-- Hero -->
    <div class="text-center space-y-4">
      <h1 class="font-pixel text-3xl md:text-4xl font-bold">
        Ты стримишь на Twitch?
      </h1>
      <p class="text-lg text-white/50 max-w-xl mx-auto">
        У нас есть кое-что для тебя. Инструменты, которые сделают стрим интерактивнее.
      </p>
    </div>

    <!-- Features -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-[#1e1e24] border border-white/5 p-6 space-y-3">
        <Icon name="lucide:gamepad-2" class="size-8 text-site-accent" />
        <h3 class="font-bold text-lg">
          Игра на стриме
        </h3>
        <p class="text-sm text-white/40">
          Зрители пишут в чат — их персонажи рубят деревья, путешествуют с караваном, выполняют квесты. Всё в реальном времени.
        </p>
      </div>

      <div class="bg-[#1e1e24] border border-white/5 p-6 space-y-3">
        <Icon name="lucide:bell" class="size-8 text-site-accent" />
        <h3 class="font-bold text-lg">
          Алерты и виджеты
        </h3>
        <p class="text-sm text-white/40">
          Красивые уведомления о новых зрителях, донатах, левел-апах. Готовые ссылки для OBS — вставил и забыл.
        </p>
      </div>

      <div class="bg-[#1e1e24] border border-white/5 p-6 space-y-3">
        <Icon name="lucide:users" class="size-8 text-site-accent" />
        <h3 class="font-bold text-lg">
          CRM зрителей
        </h3>
        <p class="text-sm text-white/40">
          Кто смотрит, сколько времени, кто донатит. Заметки к каждому зрителю. Полная картина твоего комьюнити.
        </p>
      </div>

      <div class="bg-[#1e1e24] border border-white/5 p-6 space-y-3">
        <Icon name="lucide:bar-chart-3" class="size-8 text-site-accent" />
        <h3 class="font-bold text-lg">
          Аналитика стримов
        </h3>
        <p class="text-sm text-white/40">
          Статистика по каждому стриму: зрители, сообщения, донаты. Смотри тренды и расти.
        </p>
      </div>
    </div>

    <!-- Trial info -->
    <div class="bg-site-accent/5 border border-site-accent/20 p-6 space-y-3 text-center">
      <Icon name="lucide:gift" class="size-8 text-site-accent mx-auto" />
      <h3 class="font-bold text-lg">
        5 стримов бесплатно
      </h3>
      <p class="text-sm text-white/40">
        Подай заявку, попробуй все инструменты на 5 стримах. Потом — анлок за 100 монет (заработаешь их за это время).
      </p>
    </div>

    <!-- CTA -->
    <div class="bg-[#1e1e24] border border-site-accent/20 p-8 text-center space-y-6">
      <template v-if="!loggedIn">
        <h2 class="font-pixel text-xl font-bold">
          Начни с авторизации
        </h2>
        <p class="text-white/40">
          Войди через Twitch, а потом подай заявку на кабинет стримера
        </p>
        <UButton
          :to="authUrl"
          external
          size="xl"
          icon="simple-icons:twitch"
          class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! rounded-none! px-8!"
        >
          Войти через Twitch
        </UButton>
      </template>

      <template v-else-if="streamerStatus === 'approved'">
        <Icon name="lucide:check-circle" class="size-12 text-green-400 mx-auto" />
        <h2 class="font-pixel text-xl font-bold">
          Кабинет активен
        </h2>
        <UButton
          to="/cabinet"
          class="btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none! px-8!"
        >
          Перейти в кабинет
        </UButton>
      </template>

      <template v-else-if="streamerStatus === 'pending'">
        <Icon name="lucide:clock" class="size-12 text-site-highlight mx-auto" />
        <h2 class="font-pixel text-xl font-bold">
          Заявка на рассмотрении
        </h2>
        <p class="text-white/40">
          Мы проверим твой канал и подключим кабинет. Обычно это занимает до 24 часов.
        </p>
      </template>

      <template v-else-if="streamerStatus === 'rejected'">
        <Icon name="lucide:x-circle" class="size-12 text-red-400 mx-auto" />
        <h2 class="font-pixel text-xl font-bold">
          Заявка отклонена
        </h2>
        <p class="text-white/40">
          Можешь подать заявку повторно.
        </p>
        <UButton
          :loading="requesting"
          class="btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none! px-8!"
          @click="requestAccess"
        >
          Подать заявку повторно
        </UButton>
      </template>

      <template v-else>
        <h2 class="font-pixel text-xl font-bold">
          Хочу кабинет стримера
        </h2>
        <p class="text-white/40">
          Подай заявку — мы проверим твой канал и подключим инструменты
        </p>
        <UButton
          :loading="requesting"
          class="btn-pixel bg-site-accent! hover:bg-site-accent-bright! text-white! rounded-none! px-8!"
          @click="requestAccess"
        >
          Подать заявку (бесплатно)
        </UButton>
      </template>

      <p v-if="requestError" class="text-sm text-red-400">
        {{ requestError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Для стримеров' })

const { loggedIn, user } = useUserSession()
const { authUrl } = useAuthUrl()

const streamerStatus = ref<'none' | 'pending' | 'approved' | 'rejected'>('none')
const requesting = ref(false)
const requestError = ref('')

if (loggedIn.value && user.value?.id) {
  const { data: profile } = await useFetch(() => `/api/profile/${user.value!.id}`)
  if (profile.value) {
    if (profile.value.isStreamer) {
      streamerStatus.value = 'approved'
    } else if (profile.value.streamerRequestStatus === 'PENDING') {
      streamerStatus.value = 'pending'
    } else if (profile.value.streamerRequestStatus === 'REJECTED') {
      streamerStatus.value = 'rejected'
    }
  }
}

async function requestAccess() {
  requesting.value = true
  requestError.value = ''
  try {
    const res = await $fetch('/api/cabinet/request', { method: 'POST' })
    streamerStatus.value = res.status as 'pending' | 'approved'
  } catch {
    requestError.value = 'Ошибка при отправке заявки'
  } finally {
    requesting.value = false
  }
}
</script>
