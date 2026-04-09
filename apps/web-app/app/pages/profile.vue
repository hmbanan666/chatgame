<template>
  <div v-if="!loggedIn" class="py-20 text-center">
    <p class="text-white/60 mb-4">
      Войди чтобы увидеть профиль
    </p>
    <UButton
      :to="authUrl"
      external
      size="xl"
      icon="simple-icons:twitch"
      class="btn-pixel bg-[#6441a5]! hover:bg-[#7B5BBF]! text-white! shadow-[0_0_30px_rgba(139,92,246,0.4)]! px-10! py-4! rounded-lg!"
    >
      Войти через Twitch
    </UButton>
  </div>

  <template v-else>
    <!-- PROFILE DASHBOARD -->
    <div
      id="profile"
      class="w-full py-10 bg-[#141418] border-y border-white/5"
    >
      <div class="max-w-3xl mx-auto px-4 space-y-6">
        <!-- Avatar + name + level -->
        <div class="flex flex-col items-center gap-3 text-center">
          <div class="size-20 rounded-lg ring-2 ring-white/10 bg-[#1e1e24] flex items-center justify-center overflow-hidden">
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
            <h2 class="text-2xl md:text-3xl font-bold text-site-text">
              {{ profile?.userName }}
            </h2>
            <div class="flex flex-row gap-2 items-center justify-center mt-1">
              <span class="bg-site-highlight text-black px-3 py-0.5 rounded-lg font-bold text-sm">
                Ур. {{ profile?.level }}
              </span>
              <span class="text-sm text-site-text/60">{{ formatWatchTime(profile?.watchTimeMin ?? 0) }} на стримах</span>
            </div>
          </div>
          <!-- XP bar -->
          <div v-if="xpProgress" class="w-full max-w-xs">
            <div class="w-full h-2.5 bg-[#1e1e24] rounded-lg overflow-hidden">
              <div
                class="h-full bg-white transition-all duration-500"
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
            <a href="#characters" class="text-xs text-teal-400 hover:underline">Сменить</a>
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
        <div v-if="(profile?.coupons ?? 0) > 0" class="flex justify-center">
          <PixelButton
            :disabled="isExchanging"
            :loading="isExchanging"
            color="neutral"
            class="text-sm!"
            @click="exchangeCoupon"
          >
            <Image src="/coupon-small.png" class="size-5" />
            Обменять купон на 2 монеты
            <Image src="/coin.png" class="size-5" />
          </PixelButton>
        </div>
      </div>
    </div>

    <!-- NUDGE BANNER -->
    <div
      v-if="nextCharacterNudge"
      class="py-6 px-4"
    >
      <div class="max-w-2xl mx-auto flex items-center gap-4 p-4 border-2 border-violet-500/30 bg-violet-500/10 rounded-lg">
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
        <PixelButton
          v-if="nextCharacterNudge.canAfford"
          to="#characters"
          color="accent"
          class="shrink-0! text-sm! px-4! py-2!"
        >
          Открыть
        </PixelButton>
        <PixelButton
          v-else
          to="#shop"
          color="twitch"
          class="shrink-0! text-sm! px-4! py-2!"
        >
          Купить монеты
        </PixelButton>
      </div>
    </div>

    <div class="pixel-divider" />

    <!-- CHARACTERS COLLECTION -->
    <div
      id="characters"
      class="px-4 py-12 text-center space-y-6"
    >
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="space-y-2">
          <h2 class="font-pixel text-2xl md:text-3xl font-bold text-amber-300">
            Твоя коллекция
          </h2>
          <p class="text-white/50">
            Разблокируй новых героев за Монеты и участие в событиях.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ActiveCard
            v-for="char in characters"
            :key="char.id"
            class="relative px-2 py-3 flex flex-col items-center justify-between cursor-pointer"
            :class="[
              isCharacterOwned(char.id) ? 'border-white/30!' : '',
              !isCharacterOwned(char.id) ? 'grayscale-50 hover:grayscale-0' : '',
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
              class="absolute -top-1.5 -right-1.5 z-10 size-7 bg-amber-400 rounded-lg flex items-center justify-center border-2 border-[#2a2a30]"
            >
              <Icon name="lucide:star" class="size-4 text-white" />
            </div>

            <!-- Lock overlay for unowned -->
            <div
              v-if="!isCharacterOwned(char.id)"
              class="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            >
              <div class="size-10 rounded-lg bg-[#18181b]/60 flex items-center justify-center">
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
              <div class="w-full h-1 bg-[#18181b]/15 rounded-lg overflow-hidden">
                <div
                  class="h-full bg-white"
                  :style="{ width: `${getCharXpPercent(char.id)}%` }"
                />
              </div>
            </div>
            <div v-else class="w-full mt-1 px-2">
              <p v-if="char.price > 0" class="text-xs text-white/40 flex items-center justify-center gap-1 mb-0.5">
                <Image src="/coin.png" class="size-3" />
                {{ char.price }}
              </p>
              <p v-else class="text-xs text-white/40 mb-0.5">
                &nbsp;
              </p>
              <p class="text-xs text-white/50 mb-0.5">
                &nbsp;
              </p>
              <div class="w-full h-1" />
            </div>
          </ActiveCard>
        </div>
      </div>
    </div>

    <!-- SHOP -->
    <div
      id="shop"
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
          v-for="(product, index) in (shopProducts ?? [])"
          :key="product.id"
          class="relative transition-all duration-200 hover:-translate-y-1"
          :class="[
            recommendedProduct && product.id === recommendedProduct.id ? 'ring-2 ring-[#14b8a6]' : '',
          ]"
        >
          <!-- Tier badge -->
          <div
            v-if="recommendedProduct && product.id === recommendedProduct.id"
            class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#6441a5] text-white text-xs font-bold whitespace-nowrap rounded-md animate-pulse"
          >
            Подходит!
          </div>
          <div
            v-else-if="index === 2"
            class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#2a2a2e] text-white text-xs font-bold whitespace-nowrap rounded-md border border-white/10"
          >
            Популярное
          </div>
          <div
            v-else-if="index >= 3"
            class="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#2a2a2e] text-white text-xs font-bold whitespace-nowrap rounded-md border border-white/10"
          >
            Выгодно
          </div>

          <!-- Card with tier-colored border -->
          <div
            class="border-2 border-b-4 overflow-hidden rounded-lg"
            :style="{ borderColor: shopTierColors[index], backgroundColor: shopTierBg[index] }"
          >
            <!-- Image area with tier bg -->
            <div class="relative h-28 flex items-center justify-center" :style="{ backgroundColor: `${shopTierColors[index]}20` }">
              <Image
                :src="`/shop-assets/${product.id}/512.png`"
                class="w-36 h-auto relative z-10"
              />
              <SpriteIdle
                v-if="getProductCharacterCodename(product)"
                :codename="getProductCharacterCodename(product)!"
                class="absolute -bottom-2 -right-2 z-20 w-20 h-20"
              />
            </div>

            <!-- Content -->
            <div class="p-4 text-center">
              <div class="mb-1">
                <span class="font-pixel text-3xl font-bold" :style="{ color: shopTierColors[index] }">{{ product.coins }}</span>
                <p class="text-sm text-white/50 mt-0.5">
                  Монет
                </p>
              </div>
              <p class="text-xs font-bold text-white mb-1 h-4">
                <span v-if="product.bonusCoins > 0">+ {{ product.bonusCoins }} бонусом</span>
              </p>
              <p class="text-xs font-bold text-white mb-1 h-4">
                <span v-if="getProductCharacterNickname(product)">+ {{ getProductCharacterNickname(product) }}</span>
              </p>
              <p class="text-xs text-white/40 mb-3">
                {{ (product.price / (product.coins + product.bonusCoins)).toFixed(1) }} ₽/монета
              </p>

              <div>
                <button
                  :disabled="isLoading"
                  class="btn-pixel px-4 py-3 w-full text-white font-bold rounded-lg cursor-pointer flex flex-row justify-center items-center gap-2"
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
          class="text-teal-400 hover:opacity-85 duration-200"
        >
          поддержать стримера
        </NuxtLink>
        другими способами.
      </p>
    </div>

    <!-- CHARACTER MODAL -->
    <UModal
      v-model:open="isCharacterOpened"
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

        <div v-if="selectedCharacter" class="mt-4 space-y-2">
          <template v-if="isCharacterOwned(selectedCharacter.id)">
            <button
              v-if="!isActiveCharacter(selectedCharacter.id)"
              class="px-6 py-3 w-full bg-[#1e1e24] text-white text-base font-semibold rounded-lg cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex items-center justify-center gap-2"
              @click="activateCharacter(selectedCharacter.id)"
            >
              <Icon name="lucide:star" class="size-5" />
              <span>Сделать активным</span>
            </button>
            <p v-else class="text-sm text-amber-400 font-semibold text-center">
              Активный персонаж
            </p>
          </template>
          <template v-else-if="selectedCharacter.unlockedBy === 'STREAMER_CURRENCY' && selectedCharacter.streamerId && streamerCurrency">
            <button
              v-if="streamerCurrencyBalance >= streamerCurrency.characterPrice"
              :disabled="isBuyingCharacter"
              class="btn-pixel px-6 py-3 w-full bg-amber-500 text-white text-base font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-2"
              @click="buyCharacter(selectedCharacter.id)"
            >
              <span>Разблокировать {{ streamerCurrency.emoji }}</span>
            </button>
            <div v-else class="space-y-2">
              <p class="text-sm text-white/50 text-center">
                Нужно {{ streamerCurrency.characterPrice }} {{ streamerCurrency.emoji }} — у тебя {{ streamerCurrencyBalance }}
              </p>
              <p class="text-xs text-white/30 text-center">
                Смотри стримы и копи {{ streamerCurrency.name }}!
              </p>
            </div>
          </template>
          <template v-else-if="selectedCharacter.price > 0">
            <button
              v-if="(profile?.coins ?? 0) >= selectedCharacter.price"
              :disabled="isBuyingCharacter"
              class="btn-pixel px-6 py-3 w-full bg-teal-500 text-white text-base font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-2"
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
                class="btn-pixel px-6 py-3 w-full bg-[#6441a5] text-white text-base font-semibold rounded-lg flex items-center justify-center gap-2"
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
  </template>
</template>

<script setup lang="ts">
import { getXpForLevel } from '#shared/utils/level'

useHead({
  title: 'Мой профиль',
})

const { loggedIn, user } = useUserSession()
const { authUrl } = useAuthUrl()

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
  return shopProducts.value?.find((p) => p.coins + p.bonusCoins >= deficit) ?? shopProducts.value?.at(-1) ?? null
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

const { data: shopProducts } = await useFetch('/api/shop')

function getProductCharacterCodename(product: { items?: { type: string, entityId: string | null }[] }) {
  const charItem = product.items?.find((i) => i.type === 'CHARACTER')
  if (!charItem?.entityId) {
    return null
  }
  const char = characters.value?.find((c: { id: string }) => c.id === charItem.entityId)
  return (char as { codename?: string })?.codename ?? null
}

function getProductCharacterNickname(product: { items?: { type: string, entityId: string | null }[] }) {
  const charItem = product.items?.find((i) => i.type === 'CHARACTER')
  if (!charItem?.entityId) {
    return null
  }
  const char = characters.value?.find((c: { id: string }) => c.id === charItem.entityId)
  return (char as { nickname?: string })?.nickname ?? null
}

const isLoading = ref(false)
const isExchanging = ref(false)
const isBuyingCharacter = ref(false)

// Streamer currency for exclusive characters
const streamerCurrency = ref<{ name: string, emoji: string, characterPrice: number } | null>(null)
const streamerCurrencyBalance = ref(0)

watch(selectedCharacter, async (char) => {
  if (char?.unlockedBy === 'STREAMER_CURRENCY' && char.streamerId) {
    try {
      const data = await $fetch(`/api/streamer/${char.streamerId}/currency`)
      streamerCurrency.value = data.currency
      streamerCurrencyBalance.value = data.balance
    } catch {
      streamerCurrency.value = null
      streamerCurrencyBalance.value = 0
    }
  } else {
    streamerCurrency.value = null
    streamerCurrencyBalance.value = 0
  }
})

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
