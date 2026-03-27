<template>
  <!-- HERO SECTION -->
  <div class="relative w-full overflow-hidden">
    <!-- Desktop: live demo at natural height -->
    <ClientOnly>
      <div class="w-full relative hidden md:block">
        <div ref="demoStage" class="w-full h-75 bg-[#0f0f14]" />
      </div>
    </ClientOnly>

    <!-- Mobile: static image -->
    <div class="relative w-full md:hidden" style="background-image: url('/img/background-green.webp'); background-size: cover; background-position: center;">
      <div class="py-8 flex justify-center">
        <img
          src="/img/wagon-full.png"
          class="w-auto max-h-64"
          alt=""
        >
      </div>
    </div>
  </div>

  <!-- HERO CTA -->
  <div class="py-12 md:py-16 px-4 text-center">
    <!-- Live indicator -->
    <div v-if="isStreaming" class="mb-4 flex items-center justify-center gap-2 text-emerald-400">
      <span class="relative flex size-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span class="relative inline-flex rounded-full size-3 bg-emerald-400" />
      </span>
      <span class="font-bold text-sm uppercase tracking-wider">Стрим идёт прямо сейчас</span>
    </div>

    <div class="mb-8 space-y-4 max-w-2xl mx-auto">
      <h1 class="font-pixel text-3xl md:text-5xl lg:text-6xl font-bold text-amber-300 leading-tight [text-shadow:_3px_3px_0_#0f0f14,_-1px_-1px_0_#0f0f14,_1px_-1px_0_#0f0f14,_-1px_1px_0_#0f0f14] drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
        Чат-игра на стриме
      </h1>
      <p class="text-lg md:text-xl text-white/80">
        Пиши в чат — управляй персонажем. Руби деревья, зарабатывай монеты, собирай героев.
      </p>
      <NuxtLink
        v-if="profileCount?.count"
        to="/top"
        class="text-sm text-white/50 hover:text-[#a78bfa] transition-colors duration-200"
      >
        {{ profileCount.count }}+ игроков уже в игре
      </NuxtLink>
    </div>

    <UButton
      to="/api/auth/twitch"
      external
      size="xl"
      icon="simple-icons:twitch"
      class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! shadow-[0_0_30px_rgba(139,92,246,0.4)]! px-12! py-5! rounded-none! font-pixel text-lg!"
    >
      Войти через Twitch
    </UButton>
    <p class="mt-3 text-xs text-white/30">
      Безопасный вход через Twitch. Мы не получаем пароль.
    </p>
  </div>

  <div class="pixel-divider" />

  <!-- HOW IT WORKS -->
  <div class="py-16 px-4">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-pixel text-2xl md:text-3xl font-bold text-amber-300 text-center mb-10">
        Как это работает
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="space-y-3">
          <div class="size-18 mx-auto bg-[#1e1e24] border-2 border-white/10 flex items-center justify-center">
            <Icon name="simple-icons:twitch" class="size-10 text-[#a78bfa]" />
          </div>
          <h3 class="text-lg font-bold text-white">
            Войди через Twitch
          </h3>
          <p class="text-sm text-white/50">
            Один клик — и ты в игре. Никаких регистраций.
          </p>
        </div>
        <div class="space-y-3">
          <div class="size-18 mx-auto bg-[#1e1e24] border-2 border-white/10 flex items-center justify-center">
            <Image src="/units/twitchy/head.png" class="size-12" />
          </div>
          <h3 class="text-lg font-bold text-white">
            Получи персонажа
          </h3>
          <p class="text-sm text-white/50">
            Твичи — стартовый герой. Ещё {{ (characters?.length ?? 1) - 1 }} можно разблокировать.
          </p>
        </div>
        <div class="space-y-3">
          <div class="size-18 mx-auto bg-[#1e1e24] border-2 border-white/10 flex items-center justify-center">
            <Image src="/coin.png" class="size-12" />
          </div>
          <h3 class="text-lg font-bold text-white">
            Играй и зарабатывай
          </h3>
          <p class="text-sm text-white/50">
            Руби деревья, копи монеты, открывай новых героев.
          </p>
        </div>
      </div>
      <div class="mt-10 text-center">
        <UButton
          to="/api/auth/twitch"
          external
          size="xl"
          icon="simple-icons:twitch"
          class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! shadow-[0_0_30px_rgba(139,92,246,0.4)]! px-10! py-4! rounded-none!"
        >
          Начать играть
        </UButton>
      </div>
    </div>
  </div>

  <div class="pixel-divider" />

  <!-- CHARACTERS PREVIEW -->
  <div id="characters" class="px-4 py-12 text-center space-y-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="space-y-2">
        <h2 class="font-pixel text-2xl md:text-3xl font-bold text-amber-300">
          Твой персонаж ждёт
        </h2>
        <p class="text-white/50">
          {{ characters?.length ?? '' }} уникальных героев. Войди чтобы начать собирать.
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ActiveCard
          v-for="char in characters"
          :key="char.id"
          class="relative px-2 py-3 flex flex-col items-center justify-between cursor-pointer"
          :class="[
            char.codename === 'twitchy' ? '' : 'grayscale-50 hover:grayscale-0',
          ]"
        >
          <!-- Starter badge for Twitchy -->
          <div
            v-if="char.codename === 'twitchy'"
            class="absolute -top-1.5 -left-1.5 z-10 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold"
          >
            Стартовый
          </div>

          <!-- Lock overlay -->
          <div
            v-if="char.price > 0"
            class="absolute inset-0 z-10 flex items-center justify-center bg-[#18181b]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <span class="text-xs text-white font-bold px-2 py-1 bg-[#6441a5]">Войди</span>
          </div>

          <div class="flex-1 flex flex-col items-center justify-center">
            <Image
              :src="`/units/${char.codename}/128.png`"
              class="w-20 h-20 block group-hover:hidden"
            />
            <SpriteAnimation
              :codename="char.codename"
              class="w-20 h-20 hidden group-hover:block"
            />
            <p class="mt-2 text-white font-semibold flex items-center gap-1">
              {{ char.nickname }}
            </p>
          </div>
          <div class="w-full mt-1 px-2">
            <p class="text-xs text-white/50 mb-0.5">
              &nbsp;
            </p>
            <div class="w-full h-1" />
          </div>
        </ActiveCard>
      </div>

      <div class="pt-6 text-center">
        <p class="text-white/50 mb-4">
          Войди через Twitch чтобы собирать персонажей
        </p>
        <UButton
          to="/api/auth/twitch"
          external
          size="xl"
          icon="simple-icons:twitch"
          class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! shadow-[0_0_30px_rgba(139,92,246,0.4)]! px-10! py-4! rounded-none!"
        >
          Войти и начать
        </UButton>
      </div>
    </div>
  </div>

  <!-- SHOP TEASER -->
  <div id="shop" class="py-16 px-4 text-center">
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-center gap-3">
        <Image src="/coin.png" class="size-12" />
        <div class="text-left">
          <h2 class="font-pixel text-xl md:text-2xl font-bold text-amber-300">
            Монеты открывают персонажей
          </h2>
          <p class="text-white/50 text-sm">
            Покупай монеты, разблокируй уникальных героев, поддержи проект
          </p>
        </div>
      </div>
      <UButton
        to="/api/auth/twitch"
        external
        size="xl"
        icon="simple-icons:twitch"
        class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! shadow-[0_0_30px_rgba(139,92,246,0.4)]! px-10! py-4! rounded-none!"
      >
        Войти чтобы увидеть магазин
      </UButton>
    </div>
  </div>

  <!-- TOP VIEWERS -->
  <div v-if="topViewers?.length" class="px-4 py-16 text-center space-y-6">
    <h2 class="font-pixel text-2xl md:text-3xl font-bold text-amber-300">
      Топ зрителей
    </h2>
    <p class="text-white/50">
      Самые активные игроки сообщества
    </p>
    <div class="max-w-md mx-auto space-y-1">
      <div
        v-for="(viewer, index) in topViewers"
        :key="viewer.id"
        class="flex items-center gap-3 px-4 py-3 bg-[#1e1e24]/60"
      >
        <span
          class="w-7 h-7 shrink-0 flex items-center justify-center text-xs font-bold"
          :class="index === 0 ? 'bg-amber-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-transparent text-white/40'"
        >
          {{ index + 1 }}
        </span>
        <div class="size-9 shrink-0 bg-[#141418] flex items-center justify-center overflow-hidden">
          <SpriteIdle
            v-if="getTopViewerCodename(viewer)"
            :codename="getTopViewerCodename(viewer)!"
            class="size-7"
          />
          <Icon
            v-else
            name="lucide:user"
            class="size-5 text-white/40"
          />
        </div>
        <p class="flex-1 text-white font-semibold text-sm text-left truncate">
          {{ viewer.userName }}
        </p>
        <span class="text-xs text-white/50 shrink-0">Ур. {{ viewer.level }}</span>
      </div>
    </div>
    <NuxtLink
      to="/top"
      class="btn-pixel inline-block px-6 py-3 bg-[#1e1e24] text-white text-sm font-semibold hover:bg-[#2a2a30] transition-colors duration-200"
    >
      Весь топ
    </NuxtLink>
  </div>

  <div class="pixel-divider" />

  <!-- THANKS / COMMUNITY -->
  <div class="px-4 py-16 mx-auto text-center space-y-6">
    <h2 class="font-pixel text-2xl md:text-3xl font-bold text-site-highlight">
      Благодарности
    </h2>
    <p class="max-w-4xl mx-auto text-site-text/80">
      Спасибо моим зрителям за поддержку проекта! Вы все крутые!
    </p>
    <div class="max-w-4xl mx-auto flex flex-wrap justify-center gap-2">
      <span
        v-for="name in thanksNames"
        :key="name"
        class="px-3 py-1.5 bg-[#2D2640] text-[#a78bfa] font-pixel text-sm border border-[#8b5cf6]/20 hover:bg-[#8b5cf6] hover:text-white transition-colors duration-200"
      >
        {{ name }}
      </span>
    </div>
  </div>

  <!-- Spacer for sticky CTA on mobile -->
  <div class="h-16 md:hidden" />

  <!-- STICKY MOBILE CTA (logged-out only) -->
  <div
    class="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3 bg-[#18181b]/95 backdrop-blur-sm border-t border-[#2a2a30]"
  >
    <UButton
      to="/api/auth/twitch"
      external
      block
      size="lg"
      icon="simple-icons:twitch"
      class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! shadow-[0_0_30px_rgba(139,92,246,0.4)]! py-3! rounded-none! font-bold!"
    >
      Войти через Twitch
    </UButton>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Чат-игра на стриме',
  meta: [
    {
      name: 'description',
      content:
        'Пиши в чат — управляй персонажем. Руби деревья, зарабатывай монеты, собирай героев. Бесплатная чат-игра на Twitch.',
    },
  ],
})

const { data: twitchStatus } = await useFetch('/api/twitch/status')
const isStreaming = computed(() => twitchStatus.value?.some((s) => s.service === 'HMBANAN666_TWITCH' && s.status === 'RUNNING') ?? false)

const demoStage = ref<HTMLElement>()
const demoGame = shallowRef<any>()

watch(demoStage, async (el) => {
  if (!el) {
    return
  }

  try {
    const width = el.clientWidth
    if (!width) {
      return
    }

    const [{ StreamJourneyGame }, demoNames] = await Promise.all([
      import('~/utils/stream-journey/game'),
      $fetch('/api/game/demo-names').catch(() => [] as string[]),
    ])
    if (!demoStage.value) {
      return
    }
    demoGame.value = new StreamJourneyGame({ demo: true, demoNames })
    await demoGame.value.init({ width })
    if (!demoStage.value) {
      return
    }
    demoStage.value.appendChild(demoGame.value.app.canvas)
  } catch (error) {
    console.error(error)
  }
})

onUnmounted(() => {
  demoGame.value?.destroy()
})

const thanksNames = [
  'kungfux010', 'sava5621', 'BezSovesty', 'flack_zombi',
  'player_mmcm', 'a_hywax', 'PeregonStream', 'siberiacancode',
  'tozikab_', '6alt1ca', 'derailon', 'sloghniy',
  'MaN0ol', 'dO_Oy', 'VombatDrago', 'sleeplessness8',
]

const { data: profileCount } = await useFetch('/api/stats/count')
const { data: characters } = await useFetch('/api/character')
const { data: topViewers } = await useFetch('/api/top', { query: { sort: 'level', limit: 5 } })

function getTopViewerCodename(viewer: NonNullable<typeof topViewers.value>[number]): string | null {
  const edition = viewer.characterEditions?.find(
    (e: { id: string }) => e.id === viewer.activeEditionId,
  )
  return (edition as { character?: { codename?: string } })?.character?.codename ?? null
}
</script>
