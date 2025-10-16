<template>
  <div
    v-element-visibility="[onVisibilityChangeGame, observerOptions]"
    class="my-24 md:my-30 px-4 max-w-4xl mx-auto text-center"
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
          class="opacity-70 duration-200 hover:opacity-100 hover:text-emerald-600"
        >Twitch стриме</a>.
      </p>
    </div>

    <div
      class="max-w-sm mx-auto flex flex-col md:flex-row gap-4 items-center justify-center"
    >
      <a
        href="https://github.com/hmbanan666/chatgame"
        target="_blank"
        class="px-8 py-3 md:py-4 w-fit bg-orange-900/75 border-b-6 border-orange-900/75 text-white text-lg md:text-xl font-semibold tracking-wide rounded-lg cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex flex-row justify-center items-center gap-3"
      >
        <Icon name="simple-icons:github" size="32" />
        <p>GitHub</p>
        <div class="flex flex-row items-center gap-1">
          <Icon name="lucide:star" class="size-5" />
          <p>27</p>
        </div>
      </a>
    </div>
  </div>

  <div class="my-2 py-8 w-full" style="background-image: url('/img/background-green.webp')">
    <div class="my-0 mx-auto w-fit text-center">
      <img
        src="/img/wagon-full.png"
        class="w-auto max-h-64"
        alt=""
      >
    </div>
  </div>

  <div
    id="characters"
    v-element-visibility="[onVisibilityChangeCharacters, observerOptions]"
    class="max-w-4xl my-24 md:my-30 px-4 mx-auto text-center space-y-6"
  >
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
        <p class="mt-2 text-orange-900/85 font-semibold">
          {{ char.nickname }}
        </p>
      </ActiveCard>
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
        <div class="w-full h-24 bg-orange-500/5">
          <Image
            :src="`/shop-assets/${product.id}/512.png`"
            class="w-40 h-auto absolute -top-14 right-0"
          />
        </div>

        <div class="p-4 flex flex-col justify-between">
          <div class="mb-4 text-xl font-semibold">
            {{ product.coins }} Монет
          </div>

          <div>
            <button
              v-if="loggedIn"
              :disabled="isLoading"
              class="px-6 py-3 w-full bg-teal-500 border-b-4 border-teal-600 text-white text-xl tracking-wide rounded-lg cursor-pointer hover:opacity-85 active:scale-95 duration-200 flex flex-row justify-center items-center gap-3"
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
        class="text-emerald-600 hover:opacity-85 duration-200"
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
        <div class="flex flex-row gap-2 justify-center items-center">
          Игровой профиль с
          <div class="flex flex-row gap-1 items-center">
            <span class="text-green-700 text-lg">{{
              new Intl.NumberFormat().format(profile?.points ?? 0)
            }}</span>
            <Image src="/woodland-small.png" class="h-6 w-6" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <ActiveCard
          class="px-4 py-0 flex flex-row gap-0 items-center justify-center"
        >
          <Image
            :src="`/units/${profile?.activeCharacter?.character.codename}/idle.gif`"
            class="h-24 w-24"
          />
          <div>
            <p>Активный персонаж</p>
            <p class="font-semibold text-lg text-orange-900/85">
              {{ profile?.activeCharacter?.character.nickname }}
            </p>
          </div>
        </ActiveCard>

        <ActiveCard
          class="px-4 py-6 flex flex-row gap-8 items-center justify-center"
        >
          <div class="flex flex-row gap-2 items-center justify-center">
            <Image src="/coin.png" class="h-12 w-12" />
            <div>
              <p class="font-semibold text-2xl leading-tight">
                {{ profile?.coins }}
              </p>
              <p class="text-sm leading-tight">
                {{
                  pluralizationRu(profile?.coins ?? 0, [
                    "Монета",
                    "Монет",
                    "Монет",
                  ])
                }}
              </p>
            </div>
          </div>

          <div class="flex flex-row gap-2 items-center justify-center">
            <Image src="/coupon-small.png" class="h-12 w-12" />
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
      </div>
    </div>
  </ClientOnly>

  <div class="max-w-4xl my-24 px-4 mx-auto text-center space-y-6">
    <h2 class="text-2xl md:text-2xl lg:text-3xl">
      Благодарности от hmbanan666
    </h2>
    <p class="thanks-block">
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
    :title="`&laquo;${selectedCharacter?.nickname}&raquo; ${selectedCharacter?.name}`"
  >
    <template #body>
      <p v-if="selectedCharacter?.description" class="text-base/5">
        {{ selectedCharacter.description }}
      </p>
    </template>
  </UModal>
</template>

<script setup lang="ts">
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

const { data: characters } = await useFetch('/api/character')

const isCharacterOpened = ref(false)
const selectedCharacterId = ref<string>()
const selectedCharacter = computed(() =>
  characters.value?.find(({ id }) => id === selectedCharacterId.value),
)

const { data: profile } = await useFetch(`/api/profile/${user.value?.id}`)

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
    color: var(--color-orange-800);
    opacity: 0.75;
  }
}
</style>
