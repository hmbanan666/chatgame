<template>
  <!-- Desktop: live demo -->
  <ClientOnly>
    <div class="w-full relative hidden md:block">
      <div ref="demoStage" class="w-full h-75 bg-[#8FD3FF]" />
    </div>
  </ClientOnly>

  <!-- Mobile: static image -->
  <div class="py-8 w-full md:hidden" style="background-image: url('/img/background-green.webp')">
    <div class="my-0 mx-auto w-fit text-center">
      <img
        src="/img/wagon-full.png"
        class="w-auto max-h-64"
        alt=""
      >
    </div>
  </div>

  <div
    v-element-visibility="[onVisibilityChangeGame, observerOptions]"
    class="my-24 md:my-16 px-4 max-w-4xl mx-auto text-center"
  >
    <div class="mb-8 space-y-4">
      <h1 class="text-3xl md:text-3xl lg:text-4xl">
        Интерактивная онлайн-игра
      </h1>
      <p class="text-base md:text-lg lg:text-xl">
        Группа игроков сопровождает Машину из точки А в точку Б. По пути
        встречаются препятствия, от которых нужно избавляться. Все это
        транслируется на
        <a
          href="https://twitch.tv/hmbanan666"
          target="_blank"
          class="opacity-70 duration-200 hover:opacity-100 hover:text-site-accent-bright"
        >Twitch стриме</a>.
      </p>
    </div>

    <div class="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-center justify-center">
      <UButton
        v-if="isStreaming"
        to="https://twitch.tv/hmbanan666"
        target="_blank"
        size="xl"
        icon="simple-icons:twitch"
        trailing-icon="lucide:radio"
        class="bg-[#2E222F]! hover:bg-site-bg-alt! text-site-text! px-7! py-3.5! rounded-none!"
      >
        Смотреть стрим
      </UButton>
      <UButton
        v-else
        to="/playground"
        size="xl"
        icon="lucide:play"
        class="bg-[#2E222F]! hover:bg-site-bg-alt! text-site-text! px-7! py-3.5! rounded-none!"
      >
        Посмотреть демо
      </UButton>

      <UButton
        v-if="loggedIn"
        to="/#profile"
        size="xl"
        icon="lucide:user"
        class="bg-site-bg-alt! hover:bg-[#625565]! text-site-text! px-7! py-3.5! rounded-none!"
      >
        Мой профиль
      </UButton>
      <UButton
        v-else
        to="/api/auth/twitch"
        external
        size="xl"
        icon="simple-icons:twitch"
        class="bg-site-bg-alt! hover:bg-[#625565]! text-site-text! px-7! py-3.5! rounded-none!"
      >
        Войти
      </UButton>
    </div>
  </div>

  <div
    id="characters"
    v-element-visibility="[onVisibilityChangeCharacters, observerOptions]"
    class="my-24 md:my-30 px-4 py-12 text-center space-y-6 bg-[#2E222F]"
  >
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="space-y-2">
        <h2 class="text-2xl md:text-2xl lg:text-3xl">
          Персонажи из игры
        </h2>
        <p>
          Создаются вручную. Разблокируются за Монеты и за участие в событиях.
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <ActiveCard
          v-for="char in characters"
          :key="char.id"
          class="px-2 py-2 md:aspect-square flex flex-col items-center justify-center cursor-pointer"
          :class="isCharacterOwned(char.id) ? '' : 'grayscale-50'"
          @click="
            () => {
              isCharacterOpened = true;
              selectedCharacterId = char.id;
            }
          "
        >
          <Image
            :src="`/units/${char.codename}/128.png`"
            class="w-20 h-20 block group-hover:hidden"
          />
          <Image
            :src="`/units/${char.codename}/idle.gif`"
            class="w-20 h-20 hidden group-hover:block"
          />
          <p class="mt-2 text-site-bg-alt font-semibold flex items-center gap-1">
            {{ char.nickname }}
            <Icon
              v-if="isActiveCharacter(char.id)"
              name="lucide:star"
              class="size-4 text-[#0EAF9B]"
            />
          </p>
          <div v-if="isCharacterOwned(char.id)" class="w-full mt-1 px-2">
            <div class="flex justify-between text-xs text-site-bg-alt/60 mb-0.5">
              <span>Ур. {{ getCharacterEdition(char.id)?.level ?? 1 }}</span>
              <span>{{ formatWatchTime(getCharacterEdition(char.id)?.playTimeMin ?? 0) }}</span>
            </div>
            <div class="w-full h-1 bg-[#2E222F]/15 rounded-full overflow-hidden">
              <div
                class="h-full bg-[#0EAF9B]"
                :style="{ width: `${getCharXpPercent(char.id)}%` }"
              />
            </div>
          </div>
          <div v-else class="w-full mt-1 px-2">
            <p v-if="char.price > 0" class="text-xs text-site-bg-alt/60 flex items-center justify-center gap-1 mb-0.5">
              <Image src="/coin.png" class="size-3" />
              {{ char.price }}
            </p>
            <p v-else class="text-xs text-site-bg-alt/60 mb-0.5">
              &nbsp;
            </p>
            <div class="w-full h-1" />
          </div>
        </ActiveCard>
      </div>
    </div>
  </div>

  <div
    id="shop"
    v-element-visibility="[onVisibilityChangeShop, observerOptions]"
    class="max-w-4xl my-24 md:my-30 px-4 mx-auto text-center space-y-6"
  >
    <div class="space-y-2">
      <h2 class="text-2xl md:text-2xl lg:text-3xl">
        Магазин
      </h2>
      <p>Отличный способ поддержки проекта. Спасибо!</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <ActiveCard v-for="product in shopProducts" :key="product.id">
        <div class="w-full h-24 bg-site-accent/5">
          <Image
            :src="`/shop-assets/${product.id}/512.png`"
            class="w-40 h-auto absolute -top-14 right-0"
          />
        </div>

        <div class="p-4 flex flex-col justify-between">
          <div class="mb-4 text-xl font-semibold text-site-bg-alt">
            {{ product.coins }} Монет
          </div>

          <div>
            <button
              v-if="loggedIn"
              :disabled="isLoading"
              class="px-6 py-3 w-full bg-[#0EAF9B] border-b-4 border-[#0B8A8F] text-white text-xl tracking-wide rounded-none cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex flex-row justify-center items-center gap-3"
              @click="buyProduct(product.id)"
            >
              <UIcon
                v-if="isLoading"
                name="i-lucide:loader-circle"
                class="animate-spin"
              />
              <span v-else>{{ product.price }} ₽</span>
            </button>

            <LoginButton v-else />
          </div>
        </div>
      </ActiveCard>
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

  <ClientOnly>
    <div
      v-if="loggedIn"
      id="profile"
      v-element-visibility="[onVisibilityChangeProfile, observerOptions]"
      class="max-w-4xl my-24 md:my-30 px-4 mx-auto text-center space-y-6"
    >
      <div class="space-y-2">
        <h2 class="text-2xl md:text-2xl lg:text-3xl">
          {{ profile?.userName }}
        </h2>
        <div class="flex flex-row gap-3 justify-center items-center text-site-text">
          <span>Уровень <span class="text-site-accent-bright font-bold">{{ profile?.level }}</span></span>
          <span>·</span>
          <span>{{ formatWatchTime(profile?.watchTimeMin ?? 0) }} на стримах</span>
        </div>
        <div v-if="xpProgress" class="max-w-xs mx-auto">
          <div class="w-full h-1.5 bg-[#3E3546] rounded-full overflow-hidden">
            <div
              class="h-full bg-[#0EAF9B] transition-all duration-500"
              :style="{ width: `${xpProgress.percent}%` }"
            />
          </div>
          <p class="text-xs text-site-text/60 mt-1">
            {{ profile?.xp }} / {{ xpProgress.required }} XP
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActiveCard
          class="px-4 py-0 flex flex-row gap-0 items-center justify-center text-site-bg-alt"
        >
          <Image
            :src="`/units/${profile?.activeCharacter?.character.codename}/idle.gif`"
            class="size-24"
          />
          <div>
            <p>Активный персонаж</p>
            <p class="font-semibold text-lg text-[#2E222F]">
              {{ profile?.activeCharacter?.character.nickname }}
            </p>
          </div>
        </ActiveCard>

        <ActiveCard
          class="px-4 py-6 flex flex-row gap-8 items-center justify-center text-site-bg-alt"
        >
          <div class="flex flex-row gap-2 items-center justify-center">
            <Image src="/coin.png" class="size-12" />
            <div>
              <p class="font-semibold text-2xl leading-tight">
                {{ profile?.coins }}
              </p>
              <p class="text-sm leading-tight">
                {{
                  pluralizationRu(profile?.coins ?? 0, [
                    "Монета",
                    "Монеты",
                    "Монет",
                  ])
                }}
              </p>
            </div>
          </div>

          <div class="flex flex-row gap-2 items-center justify-center">
            <Image src="/coupon-small.png" class="size-12" />
            <div>
              <p class="font-semibold text-2xl leading-tight">
                {{ profile?.coupons }}
              </p>
              <p class="text-sm leading-tight">
                {{
                  pluralizationRu(profile?.coupons ?? 0, [
                    "Купон",
                    "Купона",
                    "Купонов",
                  ])
                }}
              </p>
            </div>
          </div>
        </ActiveCard>

        <button
          v-if="(profile?.coupons ?? 0) > 0"
          :disabled="isExchanging"
          class="col-span-1 md:col-span-2 px-4 py-3 bg-[#0EAF9B] border-b-4 border-[#0B8A8F] text-white text-base font-semibold rounded-none cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex items-center justify-center gap-2"
          @click="exchangeCoupon"
        >
          <Image src="/coupon-small.png" class="size-5" />
          <span>Обменять купон на 2 монеты</span>
          <Image src="/coin.png" class="size-5" />
        </button>
      </div>
    </div>
  </ClientOnly>

  <div class="my-24 px-4 py-12 mx-auto text-center space-y-6 bg-[#2E222F]">
    <h2 class="text-2xl md:text-2xl lg:text-3xl">
      Благодарности от hmbanan666
    </h2>
    <p class="thanks-block max-w-4xl mx-auto">
      Спасибо моим зрителям: <em>kungfux010</em> за активные тесты игры,
      <em>sava5621</em> за вкусные шавухи, <em>BezSovesty</em> за помощь на
      старте, <em>flack_zombi</em> за упорство в рубке деревьев,
      <em>player_mmcm</em> за первые тесты Дополнения, <em>a_hywax</em> за
      помощь с open source, <em>PeregonStream</em> и <em>siberiacancode</em> за
      крутые рейды. Спасибо <em>tozikab_</em>, <em>6alt1ca</em>,
      <em>derailon</em>, <em>sloghniy</em>, <em>MaN0ol</em>, <em>dO_Oy</em>,
      <em>VombatDrago</em>, <em>sleeplessness8</em>. <br>Вы все крутые!
    </p>
  </div>

  <UModal
    v-model:open="isCharacterOpened"
    :close="{ color: 'neutral', variant: 'ghost', class: 'text-site-text! hover:bg-[#3E3546]!' }"
    :ui="{ content: 'bg-[#2E222F]! text-site-text ring-[#3E3546]! divide-[#3E3546]! rounded-none!', overlay: 'bg-[#2E222F]/80! backdrop-blur-sm' }"
  >
    <template #header>
      <div class="flex items-center gap-4 flex-1">
        <Image
          v-if="selectedCharacter?.codename"
          :src="`/units/${selectedCharacter.codename}/idle.gif`"
          class="size-16 image-rendering-pixelated"
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
            class="px-6 py-3 w-full bg-[#625565] text-white text-base font-semibold rounded-none cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex items-center justify-center gap-2"
            @click="activateCharacter(selectedCharacter.id)"
          >
            <Icon name="lucide:star" class="size-5" />
            <span>Сделать активным</span>
          </button>
          <p v-else class="text-sm text-[#FBB954] font-semibold text-center">
            Активный персонаж
          </p>
        </template>
        <button
          v-else-if="selectedCharacter.price > 0"
          :disabled="isBuyingCharacter || (profile?.coins ?? 0) < selectedCharacter.price"
          class="px-6 py-3 w-full bg-[#0EAF9B] border-b-4 border-[#0B8A8F] text-white text-base font-semibold rounded-none cursor-pointer hover:opacity-85 active:scale-95 duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          @click="buyCharacter(selectedCharacter.id)"
        >
          <Image src="/coin.png" class="size-5" />
          <span>Купить за {{ selectedCharacter.price }} монет</span>
        </button>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { getXpForLevel } from '#shared/utils/level'
import { vElementVisibility } from '@vueuse/components'

useHead({
  title: 'Интерактивная онлайн-игра',
  meta: [
    {
      name: 'description',
      content:
        'Группа игроков сопровождает Машину из точки А в точку Б. По пути встречаются препятствия, от которых нужно избавляться.',
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

watch(demoStage, async () => {
  if (!demoStage.value) {
    return
  }

  try {
    const [{ StreamJourneyGame }, demoNames] = await Promise.all([
      import('~/utils/stream-journey/game'),
      $fetch('/api/game/demo-names').catch(() => [] as string[]),
    ])
    demoGame.value = new StreamJourneyGame({ demo: true, demoNames })
    await demoGame.value.init({ width: demoStage.value.clientWidth })
    demoStage.value.appendChild(demoGame.value.app.canvas)
  } catch (error) {
    console.error(error)
  }
})

onUnmounted(() => {
  demoGame.value?.destroy()
})

const { data: characters } = await useFetch('/api/character')

const isCharacterOpened = ref(false)
const selectedCharacterId = ref<string>()
const selectedCharacter = computed(() =>
  characters.value?.find(({ id }: { id: string }) => id === selectedCharacterId.value),
)

const { data: profile } = await useFetch(`/api/profile/${user.value?.id}`)

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

<style scoped>
.thanks-block {
  em {
    font-style: normal;
    font-weight: 600;
    color: var(--color-site-accent-bright);
    opacity: 0.75;
  }
}
</style>
