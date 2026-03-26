<template>
  <!-- HERO SECTION -->
  <div
    v-element-visibility="[onVisibilityChangeGame, observerOptions]"
    class="relative w-full overflow-hidden"
  >
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

  <!-- HERO CTA (logged-out) -->
  <div v-if="!loggedIn" class="py-12 md:py-16 px-4 text-center">
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
      <p v-if="profileCount?.count" class="text-sm text-white/50">
        {{ profileCount.count }}+ игроков уже в игре
      </p>
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

  <div v-if="!loggedIn" class="pixel-divider" />

  <!-- HOW IT WORKS (logged-out) -->
  <div v-if="!loggedIn" class="py-16 px-4">
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

  <!-- PROFILE DASHBOARD (logged-in only, hero position) -->
  <div
    v-if="loggedIn"
    id="profile"
    v-element-visibility="[onVisibilityChangeProfile, observerOptions]"
    class="w-full py-10 bg-[#141418] border-y border-white/5"
  >
    <div class="max-w-3xl mx-auto px-4 space-y-6">
      <!-- Avatar + name + level -->
      <div class="flex flex-col items-center gap-3 text-center">
        <div class="size-20 rounded-none ring-4 ring-site-highlight bg-[#1e1e24] flex items-center justify-center overflow-hidden">
          <SpriteAnimation
            v-if="profile?.activeCharacter?.character.codename"
            :codename="profile.activeCharacter.character.codename"
            class="size-16"
          />
          <Icon
            v-else
            name="lucide:user"
            class="size-10 text-site-text/50"
          />
        </div>
        <div>
          <h2 class="font-pixel text-2xl md:text-3xl font-bold text-site-text">
            {{ profile?.userName }}
          </h2>
          <div class="flex flex-row gap-2 items-center justify-center mt-1">
            <span class="bg-site-highlight text-white px-3 py-0.5 rounded-none font-bold text-sm">
              Ур. {{ profile?.level }}
            </span>
            <span class="text-sm text-site-text/60">{{ formatWatchTime(profile?.watchTimeMin ?? 0) }} на стримах</span>
          </div>
        </div>
        <!-- XP bar -->
        <div v-if="xpProgress" class="w-full max-w-xs">
          <div class="w-full h-2.5 bg-[#1e1e24] rounded-none overflow-hidden">
            <div
              class="h-full bg-emerald-500 transition-all duration-500"
              :style="{ width: `${xpProgress.percent}%` }"
            />
          </div>
          <p class="text-xs text-site-text/60 mt-1">
            {{ profile?.xp }} / {{ xpProgress.required }} XP
          </p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-4 text-center">
        <!-- Active character -->
        <ActiveCard class="py-4 flex flex-col items-center justify-center gap-1 text-white">
          <SpriteAnimation
            v-if="profile?.activeCharacter?.character.codename"
            :codename="profile.activeCharacter.character.codename"
            class="size-16"
          />
          <p class="text-sm font-semibold">
            {{ profile?.activeCharacter?.character.nickname }}
          </p>
          <a href="#characters" class="text-xs text-emerald-500 hover:underline">Сменить</a>
        </ActiveCard>

        <!-- Coins -->
        <ActiveCard class="py-4 flex flex-col items-center justify-center gap-1 text-white">
          <Image src="/coin.png" class="size-16" />
          <p class="text-3xl font-bold">
            {{ profile?.coins }}
          </p>
          <p class="text-xs text-white/60">
            {{ pluralizationRu(profile?.coins ?? 0, ['Монета', 'Монеты', 'Монет']) }}
          </p>
        </ActiveCard>

        <!-- Coupons -->
        <ActiveCard class="py-4 flex flex-col items-center justify-center gap-1 text-white">
          <Image src="/coupon-small.png" class="size-16" />
          <p class="text-3xl font-bold">
            {{ profile?.coupons }}
          </p>
          <p class="text-xs text-white/60">
            {{ pluralizationRu(profile?.coupons ?? 0, ['Купон', 'Купона', 'Купонов']) }}
          </p>
        </ActiveCard>
      </div>

      <!-- Coupon exchange -->
      <button
        v-if="(profile?.coupons ?? 0) > 0"
        :disabled="isExchanging"
        class="btn-pixel w-full px-4 py-3 bg-emerald-500 text-white text-sm rounded-none cursor-pointer duration-200 flex items-center justify-center gap-2"
        @click="exchangeCoupon"
      >
        <span class="relative flex size-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-none bg-white opacity-75" />
          <span class="relative inline-flex rounded-none size-2 bg-white" />
        </span>
        <Image src="/coupon-small.png" class="size-5" />
        <span>Обменять купон на 2 монеты</span>
        <Image src="/coin.png" class="size-5" />
      </button>
    </div>
  </div>

  <!-- NUDGE BANNER (logged-in, has character to unlock) -->
  <div
    v-if="loggedIn && nextCharacterNudge"
    class="py-6 px-4"
  >
    <div class="max-w-2xl mx-auto flex items-center gap-4 p-4 border-2 border-[#8b5cf6]/30 bg-[#8b5cf6]/10">
      <SpriteAnimation
        :codename="nextCharacterNudge.character.codename"
        class="size-14 shrink-0"
      />
      <div class="flex-1 min-w-0">
        <p v-if="nextCharacterNudge.canAfford" class="text-white font-bold">
          У тебя хватает монет на {{ nextCharacterNudge.character.nickname }}!
        </p>
        <p v-else class="text-white font-bold">
          Ещё {{ nextCharacterNudge.deficit }} монет — и {{ nextCharacterNudge.character.nickname }} твой
        </p>
        <p class="text-sm text-white/50 mt-0.5">
          {{ nextCharacterNudge.character.price }} монет за персонажа
        </p>
      </div>
      <a
        v-if="nextCharacterNudge.canAfford"
        href="#characters"
        class="btn-pixel shrink-0 px-4 py-2 bg-emerald-500 text-white font-bold text-sm"
      >
        Открыть
      </a>
      <a
        v-else
        href="#shop"
        class="btn-pixel shrink-0 px-4 py-2 bg-[#6441a5] text-white font-bold text-sm"
      >
        Купить монеты
      </a>
    </div>
  </div>

  <div class="pixel-divider" />

  <div
    id="characters"
    v-element-visibility="[onVisibilityChangeCharacters, observerOptions]"
    class="px-4 py-12 text-center space-y-6"
  >
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="space-y-2">
        <h2 class="font-pixel text-2xl md:text-3xl font-bold text-amber-300">
          {{ loggedIn ? 'Твоя коллекция' : 'Твой персонаж ждёт' }}
        </h2>
        <p v-if="!loggedIn" class="text-white/50">
          {{ characters?.length ?? '' }} уникальных героев. Войди чтобы начать собирать.
        </p>
        <p v-else class="text-white/50">
          Разблокируй новых героев за Монеты и участие в событиях.
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ActiveCard
          v-for="char in characters"
          :key="char.id"
          class="relative px-2 py-3 flex flex-col items-center justify-between cursor-pointer"
          :class="[
            isCharacterOwned(char.id) ? 'border-emerald-500!' : '',
            !loggedIn && char.codename === 'twitchy' ? '' : (!isCharacterOwned(char.id) ? 'grayscale-50 hover:grayscale-0' : ''),
          ]"
          @click="
            () => {
              isCharacterOpened = true;
              selectedCharacterId = char.id;
            }
          "
        >
          <!-- Active star badge -->
          <div
            v-if="isActiveCharacter(char.id)"
            class="absolute -top-1.5 -right-1.5 z-10 size-7 bg-amber-400 rounded-none flex items-center justify-center border-2 border-[#2a2a30]"
          >
            <Icon name="lucide:star" class="size-4 text-white" />
          </div>

          <!-- Starter badge for Twitchy -->
          <div
            v-if="!loggedIn && char.codename === 'twitchy'"
            class="absolute -top-1.5 -left-1.5 z-10 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold"
          >
            Стартовый
          </div>

          <!-- Lock overlay for unowned -->
          <div
            v-if="!loggedIn && char.price > 0"
            class="absolute inset-0 z-10 flex items-center justify-center bg-[#18181b]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <span class="text-xs text-white font-bold px-2 py-1 bg-[#6441a5]">Войди</span>
          </div>
          <div
            v-else-if="loggedIn && !isCharacterOwned(char.id)"
            class="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          >
            <div class="size-10 rounded-none bg-[#18181b]/60 flex items-center justify-center">
              <Icon name="lucide:lock" class="size-5 text-white/80" />
            </div>
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
          <div v-if="isCharacterOwned(char.id)" class="w-full mt-1 px-2">
            <div class="flex justify-between text-xs text-white/60 mb-0.5">
              <span>Ур. {{ getCharacterEdition(char.id)?.level ?? 1 }}</span>
              <span>{{ formatWatchTime(getCharacterEdition(char.id)?.playTimeMin ?? 0) }}</span>
            </div>
            <div class="w-full h-1 bg-[#18181b]/15 rounded-none overflow-hidden">
              <div
                class="h-full bg-emerald-500"
                :style="{ width: `${getCharXpPercent(char.id)}%` }"
              />
            </div>
          </div>
          <div v-else class="w-full mt-1 px-2">
            <template v-if="loggedIn">
              <p v-if="char.price > 0" class="text-xs text-white/40 flex items-center justify-center gap-1 mb-0.5">
                <Image src="/coin.png" class="size-3" />
                {{ char.price }}
              </p>
              <p v-else class="text-xs text-white/40 mb-0.5">
                &nbsp;
              </p>
            </template>
            <p class="text-xs text-white/50 mb-0.5">
              &nbsp;
            </p>
            <div class="w-full h-1" />
          </div>
        </ActiveCard>
      </div>
      <!-- CTA after characters (logged-out) -->
      <div v-if="!loggedIn" class="pt-6 text-center">
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

  <!-- SHOP (logged-in: full shop, logged-out: teaser banner) -->
  <div v-if="!loggedIn" class="py-16 px-4 text-center">
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

  <div
    v-else
    id="shop"
    v-element-visibility="[onVisibilityChangeShop, observerOptions]"
    class="max-w-4xl my-16 px-4 mx-auto text-center space-y-6"
  >
    <div class="space-y-2">
      <p class="text-sm text-site-text/60 flex items-center justify-center gap-1">
        <Icon name="lucide:heart" class="size-4 text-red-500" />
        Поддержи проект
      </p>
      <h2 class="font-pixel text-2xl md:text-3xl font-bold text-site-highlight">
        Магазин
      </h2>
      <p>Отличный способ поддержки проекта. Спасибо!</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
      <div
        v-for="(product, index) in shopProducts"
        :key="product.id"
        class="relative transition-all duration-200 hover:-translate-y-1"
        :class="[
          recommendedProduct && product.id === recommendedProduct.id ? 'ring-2 ring-[#8b5cf6]' : '',
        ]"
      >
        <!-- Tier badge -->
        <div
          v-if="recommendedProduct && product.id === recommendedProduct.id"
          class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#6441a5] text-white text-xs font-bold whitespace-nowrap animate-pulse"
        >
          Подходит!
        </div>
        <div
          v-else-if="index === 2"
          class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#FBB954] text-[#2B2416] text-xs font-bold whitespace-nowrap"
        >
          Популярное
        </div>
        <div
          v-else-if="index >= 3"
          class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#A884F3] text-white text-xs font-bold whitespace-nowrap"
        >
          Выгодно
        </div>

        <!-- Card with tier-colored border -->
        <div
          class="border-2 border-b-4 overflow-hidden"
          :style="{ borderColor: shopTierColors[index], backgroundColor: shopTierBg[index] }"
        >
          <!-- Image area with tier bg -->
          <div class="relative h-28 flex items-center justify-center" :style="{ backgroundColor: `${shopTierColors[index]}20` }">
            <Image
              :src="`/shop-assets/${product.id}/512.png`"
              class="w-36 h-auto relative z-10"
            />
          </div>

          <!-- Content -->
          <div class="p-4 text-center">
            <div class="mb-3">
              <span class="font-pixel text-3xl font-bold" :style="{ color: shopTierColors[index] }">{{ product.coins }}</span>
              <p class="text-sm text-white/50 mt-0.5">
                Монет
              </p>
            </div>
            <p class="text-xs text-white/40 mb-3">
              {{ (product.price / product.coins).toFixed(1) }} ₽/монета
            </p>

            <div>
              <button
                :disabled="isLoading"
                class="btn-pixel px-4 py-3 w-full text-white font-bold rounded-none cursor-pointer flex flex-row justify-center items-center gap-2"
                :style="{ backgroundColor: shopTierColors[index] }"
                @click="buyProduct(product.id)"
              >
                <UIcon
                  v-if="isLoading"
                  name="i-lucide:loader-circle"
                  class="animate-spin"
                />
                <span v-else class="text-lg">{{ product.price }} ₽</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p>
      Можешь
      <NuxtLink
        to="/donate"
        class="text-site-accent-bright hover:opacity-85 duration-200"
      >
        поддержать стримера
      </NuxtLink>
      другими способами.
    </p>
  </div>

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

  <UModal
    v-model:open="isCharacterOpened"
    :close="{ color: 'neutral', variant: 'ghost', class: 'text-site-text! hover:bg-[#1e1e24]!' }"
    :ui="{ content: 'bg-[#18181b]! text-site-text ring-zinc-700! divide-zinc-700! rounded-none!', overlay: 'bg-[#18181b]/80! backdrop-blur-sm' }"
  >
    <template #header>
      <div class="flex items-center gap-4 flex-1">
        <SpriteAnimation
          v-if="selectedCharacter?.codename"
          :codename="selectedCharacter.codename"
          class="size-16"
        />
        <div>
          <p class="text-lg font-bold text-site-highlight">
            {{ selectedCharacter?.nickname }}
          </p>
          <p class="text-sm text-site-text-muted">
            {{ selectedCharacter?.name }}
          </p>
        </div>
      </div>
      <UButton
        icon="lucide:x"
        variant="ghost"
        class="bg-transparent! text-site-text-muted! hover:text-site-text! hover:bg-site-bg-alt!"
        @click="isCharacterOpened = false"
      />
    </template>
    <template #body>
      <p v-if="selectedCharacter?.description" class="text-base/5 text-site-text">
        {{ selectedCharacter.description }}
      </p>

      <div v-if="loggedIn && selectedCharacter" class="mt-4 space-y-2">
        <template v-if="isCharacterOwned(selectedCharacter.id)">
          <button
            v-if="!isActiveCharacter(selectedCharacter.id)"
            class="px-6 py-3 w-full bg-[#1e1e24] text-white text-base font-semibold rounded-none cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex items-center justify-center gap-2"
            @click="activateCharacter(selectedCharacter.id)"
          >
            <Icon name="lucide:star" class="size-5" />
            <span>Сделать активным</span>
          </button>
          <p v-else class="text-sm text-amber-400 font-semibold text-center">
            Активный персонаж
          </p>
        </template>
        <template v-else-if="selectedCharacter.price > 0">
          <button
            v-if="(profile?.coins ?? 0) >= selectedCharacter.price"
            :disabled="isBuyingCharacter"
            class="btn-pixel px-6 py-3 w-full bg-emerald-500 text-white text-base font-semibold rounded-none cursor-pointer flex items-center justify-center gap-2"
            @click="buyCharacter(selectedCharacter.id)"
          >
            <Image src="/coin.png" class="size-5" />
            <span>Купить за {{ selectedCharacter.price }} монет</span>
          </button>
          <div v-else class="space-y-2">
            <p class="text-sm text-white/50 text-center">
              Не хватает {{ selectedCharacter.price - (profile?.coins ?? 0) }} монет
            </p>
            <a
              href="#shop"
              class="btn-pixel px-6 py-3 w-full bg-[#6441a5] text-white text-base font-semibold rounded-none flex items-center justify-center gap-2"
              @click="isCharacterOpened = false"
            >
              <Image src="/coin.png" class="size-5" />
              <span>Купить монеты</span>
            </a>
          </div>
        </template>
      </div>
    </template>
  </UModal>

  <!-- Spacer for sticky CTA on mobile -->
  <div v-if="!loggedIn" class="h-16 md:hidden" />

  <!-- STICKY MOBILE CTA (logged-out only) -->
  <div
    v-if="!loggedIn"
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
import { getXpForLevel } from '#shared/utils/level'
import { vElementVisibility } from '@vueuse/components'

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

const { loggedIn, user } = useUserSession()
const { onElementVisibility } = useNavigation()

const { data: twitchStatus } = await useFetch('/api/twitch/status')
const isStreaming = computed(() => twitchStatus.value?.some((s) => s.service === 'HMBANAN666_TWITCH' && s.status === 'RUNNING') ?? false)

function onVisibilityChangeGame(isVisible: boolean) {
  isVisible && onElementVisibility('game')
}

function onVisibilityChangeCharacters(isVisible: boolean) {
  isVisible && onElementVisibility('characters')
}

function onVisibilityChangeShop(isVisible: boolean) {
  isVisible && onElementVisibility('shop')
}

function onVisibilityChangeProfile(isVisible: boolean) {
  isVisible && onElementVisibility('profile')
}

const observerOptions = { rootMargin: '0px 0px -400px 0px' }

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

const isCharacterOpened = ref(false)
const selectedCharacterId = ref<string>()
const selectedCharacter = computed(() =>
  characters.value?.find(({ id }: { id: string }) => id === selectedCharacterId.value),
)

const { data: profile } = await useFetch(`/api/profile/${user.value?.id}`, {
  immediate: !!user.value?.id,
})

const xpProgress = computed(() => {
  if (!profile.value) {
    return null
  }
  const currentXp = profile.value.xp ?? 0
  const required = getXpForLevel((profile.value.level ?? 1) + 1)
  const prevRequired = getXpForLevel(profile.value.level ?? 1)
  const progress = currentXp - prevRequired
  const needed = required - prevRequired
  const percent = needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 0
  return { required, percent }
})

const nextCharacterNudge = computed(() => {
  if (!profile.value || !characters.value) {
    return null
  }
  const coins = profile.value.coins ?? 0
  const unowned = characters.value
    .filter((c: { id: string, price: number }) => c.price > 0 && !isCharacterOwned(c.id))
    .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
  if (!unowned.length) {
    return null
  }
  const closest = unowned[0]!
  const deficit = closest.price - coins
  if (deficit <= 0) {
    return { character: closest, deficit: 0, canAfford: true }
  }
  return { character: closest, deficit, canAfford: false }
})

const recommendedProduct = computed(() => {
  if (!nextCharacterNudge.value || nextCharacterNudge.value.canAfford) {
    return null
  }
  const deficit = nextCharacterNudge.value.deficit
  return shopProducts.find((p) => p.coins >= deficit) ?? shopProducts.at(-1)
})

function formatWatchTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} ч`
  }
  return `${hours} ч ${mins} мин`
}

const shopTierColors = ['#1EBC73', '#4D9BE6', '#A884F3', '#FBB954', '#E6904E']
const shopTierBg = ['#162B23', '#161E2B', '#1E162B', '#2B2416', '#2B1C16']

const shopProducts = [
  {
    id: 'jehj4mxo0g6fp1eopf3jg641',
    price: 110,
    coins: 10,
  },
  {
    id: 'w0895g3t9q75ys2maod0zd1a',
    price: 450,
    coins: 60,
  },
  {
    id: 'nar1acws8c3s4w3cxs6i8qdn',
    price: 1250,
    coins: 180,
  },
  {
    id: 'tp5w874gchf6hjfca9vory2r',
    price: 2150,
    coins: 330,
  },
  {
    id: 'izh5v4vxztqi55gquts9ukn2',
    price: 3900,
    coins: 650,
  },
]

const isLoading = ref(false)
const isExchanging = ref(false)
const isBuyingCharacter = ref(false)

function isCharacterOwned(characterId: string): boolean {
  return profile.value?.characterEditions?.some(
    (e: { characterId: string }) => e.characterId === characterId,
  ) ?? false
}

function getCharacterEdition(characterId: string) {
  return profile.value?.characterEditions?.find(
    (e: { characterId: string }) => e.characterId === characterId,
  )
}

function getCharXpPercent(characterId: string): number {
  const edition = getCharacterEdition(characterId)
  if (!edition) {
    return 0
  }
  const currentXp = edition.xp ?? 0
  const level = edition.level ?? 1
  const prevRequired = getXpForLevel(level)
  const nextRequired = getXpForLevel(level + 1)
  const needed = nextRequired - prevRequired
  if (needed <= 0) {
    return 0
  }
  return Math.min(100, Math.round(((currentXp - prevRequired) / needed) * 100))
}

function isActiveCharacter(characterId: string): boolean {
  const edition = getCharacterEdition(characterId)
  return !!edition && edition.id === profile.value?.activeEditionId
}

async function activateCharacter(characterId: string) {
  const edition = getCharacterEdition(characterId)
  if (!profile.value || !edition) {
    return
  }
  try {
    await $fetch(`/api/profile/${profile.value.id}/character/activate`, {
      method: 'POST',
      body: { editionId: edition.id },
    })
    refreshNuxtData()
  } catch (e) {
    console.error(e)
  }
}

async function buyCharacter(characterId: string) {
  if (!profile.value) {
    return
  }
  try {
    isBuyingCharacter.value = true
    await $fetch(`/api/profile/${profile.value.id}/character/unlock`, {
      method: 'POST',
      body: { characterId },
    })
    refreshNuxtData()
  } catch (e) {
    console.error(e)
  } finally {
    isBuyingCharacter.value = false
  }
}

async function exchangeCoupon() {
  try {
    isExchanging.value = true
    await $fetch('/api/coupon', {
      method: 'POST',
      body: { type: 'COINS' },
    })
    refreshNuxtData()
  } catch (e) {
    console.error(e)
  } finally {
    isExchanging.value = false
  }
}

async function buyProduct(productId: string) {
  try {
    isLoading.value = true
    const data = await $fetch('/api/payment', {
      method: 'POST',
      body: { productId },
    })
    if (data?.result) {
      await navigateTo(data.result, { external: true })
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}
</script>
