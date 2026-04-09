<template>
  <div class="w-full h-full bg-[#111116] overflow-hidden p-3 relative">
    <!-- Viewer Card — overlay top center -->
    <Transition name="card">
      <div
        v-if="activeViewerCard"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-[#1e1e26] border border-white/15 rounded-lg overflow-hidden shadow-2xl cursor-pointer"
        @click="dismissViewerCard"
      >
        <div class="h-0.5 bg-site-highlight/30">
          <div class="h-full bg-site-highlight card-progress" />
        </div>

        <div class="px-4 py-3 space-y-2.5">
          <div class="flex items-center gap-2">
            <span class="font-bold text-base" :style="{ color: nameColor(activeViewerCard.userName) }">
              {{ activeViewerCard.userName }}
            </span>
            <span class="bg-white/10 text-site-highlight text-sm font-bold px-2 py-0.5">
              {{ activeViewerCard.level }}
            </span>
            <span
              v-if="activeViewerCard.donationTotal > 0"
              class="bg-amber-500/15 text-amber-400 text-sm font-bold px-2 py-0.5"
            >{{ activeViewerCard.donationTotal }} ₽</span>
            <span class="text-white/30 text-sm ml-auto">{{ formatLastSeen(activeViewerCard.lastSeenAt) }}</span>
          </div>
          <div class="flex items-center gap-3 text-sm text-white/40">
            <span>{{ activeViewerCard.coins }} монет</span>
            <span class="text-white/15">·</span>
            <span>{{ activeViewerCard.coupons }} куп.</span>
            <span class="text-white/15">·</span>
            <span>{{ formatWatchTimeShort(activeViewerCard.watchTimeMin) }}</span>
            <span class="text-white/15">·</span>
            <span>{{ activeViewerCard.charactersCount }} перс.</span>
          </div>
          <div @click.stop>
            <input
              :value="activeViewerCard.note"
              type="text"
              placeholder="Заметка о зрителе..."
              class="w-full bg-white/5 border border-white/10 rounded-md text-site-text text-sm px-3 py-1.5 placeholder-white/20 focus:outline-none focus:border-site-highlight/50"
              @input="updateNote(activeViewerCard!.profileId, ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>
      </div>
    </Transition>

    <!-- Top bar — stream stats -->
    <div class="h-10 bg-[#1a1a20] border border-white/10 rounded-lg flex items-center gap-6 px-4 text-sm shrink-0 mb-2">
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full" :class="isLive ? 'bg-green-500 animate-pulse' : 'bg-white/20'" />
        <span class="font-pixel text-xs text-site-text">{{ isLive ? streamUptime : '—' }}</span>
      </div>
      <template v-if="isLive && stats">
        <div class="text-white/40 flex items-center gap-1" title="Зрителей">
          <Icon name="lucide:eye" class="size-3.5" /><span class="text-site-text font-bold">{{ stats.viewerCount }}</span>
        </div>
        <div class="text-white/40 flex items-center gap-1" title="Сообщений">
          <Icon name="lucide:message-square" class="size-3.5" /><span class="text-site-text font-bold">{{ stats.stats.messagesCount }}</span>
        </div>
        <div class="text-white/40 flex items-center gap-1" title="Топливо">
          <Icon name="lucide:fuel" class="size-3.5" /><span class="text-site-text font-bold">{{ Math.round(stats.fuel) }}/{{ stats.maxFuel }}</span>
        </div>
        <div class="text-white/40 flex items-center gap-1" title="Деревья">
          <Icon name="lucide:tree-pine" class="size-3.5" /><span class="text-site-text font-bold">{{ stats.stats.treesChopped }}</span>
        </div>
        <div class="text-white/40 flex items-center gap-1" title="Купоны">
          <Icon name="lucide:ticket" class="size-3.5" /><span class="text-site-text font-bold">{{ stats.stats.couponsTaken }}</span>
        </div>
        <div class="text-white/20 text-xs" title="Следующий купон">
          {{ couponCountdown }}
        </div>
        <div
          v-if="redemptionStats.totalCost > 0"
          class="text-white/40 flex items-center gap-1 ml-2"
          title="Баллы канала сожжено"
        >
          <Icon name="lucide:gift" class="size-3.5" /><span class="text-site-highlight font-bold">{{ redemptionStats.totalCost.toLocaleString() }}</span>
          <span class="text-white/20 text-xs">на {{ redemptionStats.count }}</span>
        </div>
      </template>
      <template v-else>
        <span class="text-white/30">Оффлайн</span>
      </template>
      <span v-if="isDemo" class="bg-amber-500/20 text-amber-400 text-xs font-bold px-1.5 py-0.5 ml-auto">DEMO</span>
    </div>

    <!-- Main area: 3 columns -->
    <div class="flex gap-2 h-[calc(100%-3.5rem)]">
      <!-- Left: player + stream info -->
      <div class="flex-1 flex flex-col gap-2 min-w-0">
        <!-- Twitch player embed -->
        <div class="bg-black border border-white/10 rounded-lg flex-1 min-h-0 overflow-hidden relative">
          <ClientOnly>
            <iframe
              v-if="!isDemo"
              :src="`https://player.twitch.tv/?channel=${channelName}&parent=${hostname}&muted=true`"
              class="w-full h-full"
              allowfullscreen
              frameborder="0"
            />
          </ClientOnly>
          <div v-if="isDemo" class="w-full h-full flex items-center justify-center text-white/20">
            <div class="text-center space-y-2">
              <Icon name="lucide:monitor-play" class="size-16 mx-auto" />
              <p class="text-sm">
                Превью стрима
              </p>
            </div>
          </div>
        </div>

        <!-- Stream info: clickable card → opens slideover -->
        <div
          class="shrink-0 bg-[#1a1a20] border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
          @click="streamInfoOpen = true"
        >
          <div class="flex items-center gap-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-site-text truncate">
                {{ streamInfo?.title || 'Название не задано' }}
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <Icon name="lucide:gamepad-2" class="size-3.5 text-white/30 shrink-0" />
                <span class="text-xs text-white/50 truncate">{{ streamInfo?.gameName || 'Без категории' }}</span>
                <div v-if="streamInfo?.tags?.length" class="flex gap-1 ml-1">
                  <span
                    v-for="tag in streamInfo.tags.slice(0, 3)"
                    :key="tag"
                    class="text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full"
                  >{{ tag }}</span>
                  <span v-if="streamInfo.tags.length > 3" class="text-[10px] text-white/30">+{{ streamInfo.tags.length - 3 }}</span>
                </div>
              </div>
            </div>
            <Icon name="lucide:pencil" class="size-4 text-white/30 shrink-0" />
          </div>
        </div>

        <CabinetStreamInfoSlideover
          v-model:open="streamInfoOpen"
          :initial="streamInfo"
          @saved="onStreamInfoSaved"
        />
      </div>

      <!-- Middle: events -->
      <div class="w-64 shrink-0 flex flex-col bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden">
        <div class="px-3 py-1.5 border-b border-white/10 text-xs font-bold text-site-text/80">
          События
        </div>
        <div ref="eventsContainer" class="flex-1 overflow-y-auto space-y-0.5 p-2">
          <div
            v-for="ev in events"
            :key="ev.id"
            class="px-2 py-1 text-sm border-l-2 rounded-sm"
            :class="eventColor(ev.type)"
          >
            <span class="text-white/40 text-xs mr-1">{{ ev.time }}</span>
            <span
              v-if="ev.data.userName"
              class="text-site-text font-bold text-xs cursor-pointer hover:underline mr-1"
              :style="{ color: nameColor(ev.data.userName) }"
              @click="openProfileModal(ev.data.twitchId || '', ev.data.userName)"
            >{{ ev.data.userName }}</span>
            <span class="text-site-text/70 text-xs">{{ formatEventText(ev) }}</span>
          </div>
          <div v-if="!events.length" class="text-white/30 text-xs text-center py-4">
            Ожидание событий...
          </div>
        </div>
      </div>

      <!-- Right: chat + input -->
      <div class="w-80 shrink-0 flex flex-col bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden relative">
        <div class="px-3 py-1.5 border-b border-white/10 text-xs font-bold text-site-text/80">
          Чат
        </div>
        <div
          ref="chatContainer"
          class="flex-1 overflow-y-auto space-y-0.5 p-2 relative"
          @scroll="onChatScroll"
        >
          <div
            v-for="msg in chatMessages"
            :key="msg.id"
            class="px-2 py-1 hover:bg-white/5 rounded-sm"
          >
            <template v-if="msg.isSystem">
              <p class="text-amber-400/80 text-xs italic break-words">
                {{ msg.text }}
              </p>
            </template>
            <template v-else>
              <!-- Reply context -->
              <div v-if="msg.replyTo" class="text-xs text-white/25 mb-0.5 flex items-center gap-1">
                <Icon name="lucide:corner-down-right" class="size-3" />
                <span :style="{ color: nameColor(msg.replyTo) }">{{ msg.replyTo }}</span>
              </div>
              <span class="text-white/20 text-xs mr-1">{{ msg.time }}</span>
              <span
                class="font-bold text-xs cursor-pointer hover:underline"
                :style="{ color: nameColor(msg.name) }"
                @click="openProfileModal(msg.twitchId, msg.name)"
              >{{ msg.name }}</span>
              <span class="text-white/40 text-xs ml-1">{{ msg.level }}</span>
              <p class="text-site-text/90 text-sm break-words">
                {{ msg.text }}
              </p>
            </template>
          </div>
          <div v-if="!chatMessages.length" class="text-white/30 text-xs text-center py-8">
            Ожидание сообщений...
          </div>
        </div>
        <button
          v-if="!chatAutoScroll"
          class="absolute bottom-12 left-1/2 -translate-x-1/2 bg-site-highlight text-white text-xs font-bold px-3 py-1 shadow-lg cursor-pointer hover:bg-site-highlight/80 z-10"
          @click="resumeChatAutoScroll"
        >
          Новые сообщения ↓
        </button>

        <!-- Chat input + actions -->
        <div class="border-t border-white/10 px-2 py-2 flex items-center gap-1.5">
          <UPopover :ui="{ content: 'p-0' }" @update:open="(v: boolean) => v && fetchRewards()">
            <button
              class="shrink-0 size-7 flex items-center justify-center text-white/30 hover:text-teal-400 transition-colors cursor-pointer rounded-md hover:bg-white/5"
              title="Награды канала"
            >
              <Icon name="lucide:gem" class="size-4" />
            </button>
            <template #content>
              <div class="w-72 max-h-80 overflow-y-auto p-2 space-y-0.5">
                <div class="text-xs font-bold text-white/50 px-2 py-1">
                  Награды канала
                </div>
                <button
                  v-for="reward in channelRewards"
                  :key="reward.id"
                  class="w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors text-left"
                  :class="reward.isWagonAction ? 'hover:bg-white/10 cursor-pointer' : 'opacity-50 cursor-default'"
                  :disabled="!reward.isWagonAction || actionLoading === reward.id"
                  @click="triggerWagonAction(reward.id)"
                >
                  <div
                    class="size-8 rounded shrink-0 flex items-center justify-center"
                    :style="{ backgroundColor: reward.backgroundColor || '#333' }"
                  >
                    <img
                      v-if="reward.imageUrl"
                      :src="reward.imageUrl"
                      class="size-6 object-contain"
                    >
                    <Icon
                      v-else
                      name="lucide:gem"
                      class="size-4 text-white/60"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-site-text truncate">
                      {{ reward.title }}
                    </div>
                    <div v-if="reward.prompt" class="text-xs text-white/30 truncate">
                      {{ reward.prompt }}
                    </div>
                  </div>
                  <span class="text-xs text-teal-400 font-bold shrink-0">{{ reward.cost.toLocaleString() }}</span>
                </button>
                <div v-if="!channelRewards.length" class="text-xs text-white/30 text-center py-4">
                  Нет наград
                </div>
              </div>
            </template>
          </UPopover>
          <div class="flex-1 relative">
            <input
              v-model="chatInput"
              type="text"
              :placeholder="chatAvailable ? 'Написать в чат...' : 'Бот не подключён'"
              class="w-full bg-[#0f0f14] border border-white/10 rounded-md text-sm text-white placeholder-white/20 px-3 py-1.5 focus:outline-none focus:border-teal-500/50 disabled:opacity-40"
              :disabled="chatSending || !chatAvailable"
              @keydown.enter="sendChatMessage"
            >
            <button
              v-if="chatInput.trim()"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
              :disabled="chatSending"
              @click="sendChatMessage"
            >
              <Icon name="lucide:send" class="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <Transition name="card">
      <div
        v-if="profileModal"
        class="absolute inset-0 z-50 flex items-center justify-center"
        @click="profileModal = null"
      >
        <div class="absolute inset-0 bg-black/60" />
        <div
          class="relative w-full max-w-sm bg-[#1e1e26] border border-white/15 rounded-lg shadow-2xl"
          @click.stop
        >
          <div class="px-5 py-4 space-y-4">
            <!-- Header -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg" :style="{ color: nameColor(profileModal.userName) }">
                  {{ profileModal.userName }}
                </span>
                <span class="bg-white/10 text-site-highlight text-sm font-bold px-2 py-0.5">
                  {{ profileModal.level }}
                </span>
              </div>
              <div class="text-right">
                <span class="text-white/30 text-sm">{{ formatLastSeen(profileModal.lastSeenAt) }}</span>
                <div class="text-white/20 text-xs">
                  с {{ new Date(profileModal.createdAt).toLocaleDateString('ru') }}
                </div>
              </div>
            </div>

            <!-- XP bar -->
            <div class="w-full bg-white/10 h-1.5">
              <div
                class="h-full bg-site-highlight"
                :style="{ width: `${Math.min(100, (profileModal.xp / profileModal.xpRequired) * 100)}%` }"
              />
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white/5 px-3 py-2">
                <div class="text-white/40 text-xs">
                  Монеты
                </div>
                <div class="text-site-text font-bold">
                  {{ profileModal.coins }}
                </div>
              </div>
              <div class="bg-white/5 px-3 py-2">
                <div class="text-white/40 text-xs">
                  Купоны
                </div>
                <div class="text-site-text font-bold">
                  {{ profileModal.coupons }}
                </div>
              </div>
              <div class="bg-white/5 px-3 py-2">
                <div class="text-white/40 text-xs">
                  Время просмотра
                </div>
                <div class="text-site-text font-bold">
                  {{ formatWatchTimeShort(profileModal.watchTimeMin) }}
                </div>
              </div>
              <div class="bg-white/5 px-3 py-2">
                <div class="text-white/40 text-xs">
                  Персонажи
                </div>
                <div class="text-site-text font-bold">
                  {{ profileModal.charactersCount }}
                </div>
              </div>
            </div>

            <!-- Donation -->
            <div
              v-if="profileModal.donationTotal > 0"
              class="bg-amber-500/10 border border-amber-500/20 px-3 py-2"
            >
              <span class="text-amber-400 font-bold">{{ profileModal.donationTotal }} ₽</span>
              <span class="text-white/40 ml-1">задонатил всего</span>
            </div>

            <!-- Note -->
            <input
              :value="profileModal.note"
              type="text"
              placeholder="Заметка о зрителе..."
              class="w-full bg-white/5 border border-white/10 text-site-text text-sm px-3 py-2 placeholder-white/20 focus:outline-none focus:border-site-highlight/50"
              @input="updateNote(profileModal!.profileId, ($event.target as HTMLInputElement).value); profileModal!.note = ($event.target as HTMLInputElement).value"
            >

            <!-- Actions -->
            <div class="flex gap-2">
              <UButton
                variant="soft"
                color="primary"
                class="flex-1"
                :loading="profileModalLoading === 'xp'"
                @click="rewardFromModal('xp', 5)"
              >
                +5 XP
              </UButton>
              <UButton
                variant="soft"
                color="warning"
                class="flex-1"
                :loading="profileModalLoading === 'coins'"
                :disabled="!isDemo && streamerCoins < 1"
                :title="!isDemo && streamerCoins < 1 ? 'Недостаточно монет' : ''"
                @click="rewardFromModal('coins', 1)"
              >
                +1 монета ({{ streamerCoins }})
              </UButton>
              <UButton
                variant="ghost"
                color="neutral"
                icon="simple-icons:twitch"
                @click="navigateTo(`https://twitch.tv/${profileModal!.userName}`, { external: true, open: { target: '_blank' } })"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { DashboardChatMessage, DashboardEvent, ViewerCardData } from '~/composables/useDashboardSimulator'
import { createId } from '@paralleldrive/cuid2'

definePageMeta({
  layout: 'cabinet',
  middleware: ['cabinet'],
})

const { user } = useUserSession()

const roomId = user.value?.twitchId || ''
const channelName = user.value?.userName || ''
const isDemo = useRoute().query.demo === '1'
const streamerCoins = ref(0)

if (user.value?.id && !isDemo) {
  const { data: myProfile } = await useFetch(() => `/api/profile/${user.value!.id}`)
  if (myProfile.value) {
    streamerCoins.value = myProfile.value.coins ?? 0
  }
}

if (!roomId) {
  throw createError({ statusCode: 404 })
}

const hostname = import.meta.client ? window.location.hostname : 'localhost'

const chatContainer = ref<HTMLElement>()
const eventsContainer = ref<HTMLElement>()

// Shared refs — filled by either demo simulator or live WS
const chatMessages = reactive<DashboardChatMessage[]>([])
const events = reactive<DashboardEvent[]>([])
const stats = ref<any>(null)

const isLive = computed(() => {
  return stats.value?.isLive === true
})

// Channel rewards
interface ChannelReward {
  id: string
  title: string
  cost: number
  prompt: string
  isEnabled: boolean
  backgroundColor: string
  imageUrl: string
  isWagonAction: boolean
}
const channelRewards = ref<ChannelReward[]>([])
const actionLoading = ref<string | null>(null)

async function fetchRewards() {
  if (isDemo) {
    channelRewards.value = [
      { id: 'demo-t1', title: 'Эффекты для сообщения', cost: 20, prompt: '', isEnabled: true, backgroundColor: '#9146ff', imageUrl: '', isWagonAction: false },
      { id: 'demo-t2', title: 'Гигантизировать смайлик', cost: 30, prompt: '', isEnabled: true, backgroundColor: '#9146ff', imageUrl: '', isWagonAction: false },
      { id: 'demo-t3', title: 'Торжество на экране', cost: 40, prompt: '', isEnabled: true, backgroundColor: '#e64ac8', imageUrl: '', isWagonAction: false },
      { id: 'demo-1', title: 'Сальто вагона', cost: 50, prompt: 'Вагон делает сальто', isEnabled: true, backgroundColor: '#1db8ab', imageUrl: '', isWagonAction: true },
      { id: 'demo-2', title: 'Заправить вагон', cost: 100, prompt: '+15 топлива', isEnabled: true, backgroundColor: '#1db8ab', imageUrl: '', isWagonAction: true },
      { id: 'demo-3', title: 'Украсть топливо', cost: 200, prompt: '-10 топлива', isEnabled: true, backgroundColor: '#e64a4a', imageUrl: '', isWagonAction: true },
      { id: 'demo-t4', title: 'Подсветить сообщение', cost: 300, prompt: '', isEnabled: true, backgroundColor: '#00c7ac', imageUrl: '', isWagonAction: false },
      { id: 'demo-4', title: 'Ускорение', cost: 400, prompt: 'x2 скорость на 2 мин', isEnabled: true, backgroundColor: '#e6c84a', imageUrl: '', isWagonAction: true },
      { id: 'demo-5', title: 'Сбросить эффекты', cost: 500, prompt: 'Убирает все эффекты', isEnabled: true, backgroundColor: '#1db8ab', imageUrl: '', isWagonAction: true },
      { id: 'demo-6', title: 'Саботаж', cost: 800, prompt: 'Стоп на 30 сек', isEnabled: true, backgroundColor: '#e64a4a', imageUrl: '', isWagonAction: true },
    ]
    return
  }
  try {
    channelRewards.value = await $fetch<ChannelReward[]>('/api/cabinet/rewards')
  } catch {
    // skip
  }
}

async function triggerWagonAction(rewardId: string) {
  if (actionLoading.value) {
    return
  }
  const reward = channelRewards.value.find((r) => r.id === rewardId)
  if (!reward?.isWagonAction) {
    return
  }
  actionLoading.value = rewardId
  try {
    await $fetch('/api/cabinet/wagon-action', {
      method: 'POST',
      body: { rewardId },
    })
  } catch {
    // skip
  } finally {
    actionLoading.value = null
  }
}

// Chat input
const chatInput = ref('')
const chatSending = ref(false)
const chatAvailable = computed(() => isDemo || isLive.value)

async function sendChatMessage() {
  const text = chatInput.value.trim()
  if (!text || chatSending.value) {
    return
  }
  if (isDemo && simulator) {
    simulator.chatMessages.push({
      id: createId(),
      twitchId: roomId,
      name: channelName,
      level: 0,
      text,
      time: nowTime(),
      isSystem: false,
      isFirstThisStream: false,
      loadingXp: false,
      loadingCoins: false,
    })
    chatInput.value = ''
    return
  }
  chatSending.value = true
  try {
    await $fetch('/api/cabinet/chat', {
      method: 'POST',
      body: { message: text },
    })
    chatInput.value = ''
  } catch {
    // skip
  } finally {
    chatSending.value = false
  }
}

// Stream info
const streamInfo = ref<{ title: string, gameName: string, gameId: string, tags: string[], language: string } | null>(null)
const streamInfoOpen = ref(false)

async function fetchStreamInfo() {
  try {
    const data = await $fetch<any>('/api/cabinet/stream-info')
    if (data) {
      streamInfo.value = data
    }
  } catch {
    // skip
  }
}

function onStreamInfoSaved() {
  fetchStreamInfo()
}

// Channel points / redemptions
const redemptionStats = reactive({ totalCost: 0, count: 0 })

async function fetchRedemptionStats() {
  try {
    const data = await $fetch<any>('/api/cabinet/redemptions')
    if (data) {
      redemptionStats.totalCost = data.totalCost ?? 0
      redemptionStats.count = data.count ?? 0
    }
  } catch {
    // skip
  }
}

// Auto-scroll with pause on manual scroll-up
const chatAutoScroll = ref(true)

function scrollToBottom(el: HTMLElement | undefined) {
  if (!el) {
    return
  }
  nextTick(() => {
    el.scrollTop = el.scrollHeight
  })
}

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 60
}

function onChatScroll() {
  if (!chatContainer.value) {
    return
  }
  chatAutoScroll.value = isNearBottom(chatContainer.value)
}

function resumeChatAutoScroll() {
  chatAutoScroll.value = true
  scrollToBottom(chatContainer.value)
}

watch(() => chatMessages.length, () => {
  if (chatAutoScroll.value) {
    scrollToBottom(chatContainer.value)
  }
})
watch(() => events.length, () => scrollToBottom(eventsContainer.value))

// Name colors — deterministic per username
const NAME_COLORS = [
  '#e6794a', '#e6c84a', '#7de64a', '#4ae6c8',
  '#4a9ee6', '#7d4ae6', '#e64ac8', '#e64a6e',
  '#d4a0ff', '#ff9b9b', '#9bffd4', '#ffdb70',
  '#70d4ff', '#ff70a8', '#a8ff70', '#ffab57',
]

function nowTime(): string {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function nameColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length]!
}

// Stream uptime
const streamUptime = ref('0:00')
const demoStartedAt = Date.now()

function updateStreamUptime() {
  let startedAt: number
  if (isDemo) {
    startedAt = demoStartedAt
  } else {
    const raw = stats.value?.stats?.streamStartedAt
    if (!raw) {
      streamUptime.value = '—'
      return
    }
    startedAt = new Date(raw).getTime()
  }
  const diff = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  streamUptime.value = h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`
}

// Chat activity tracking
const chatActivity = reactive<Map<string, { messages: number, questDone: boolean }>>(new Map())

function trackChatActivity(name: string) {
  const entry = chatActivity.get(name)
  if (entry) {
    entry.messages++
  } else {
    chatActivity.set(name, { messages: 1, questDone: false })
  }
}

function markQuestDone(name: string) {
  const entry = chatActivity.get(name)
  if (entry) {
    entry.questDone = true
  } else {
    chatActivity.set(name, { messages: 0, questDone: true })
  }
}

// Viewer card
const viewerCardQueue = reactive<ViewerCardData[]>([])
const activeViewerCard = ref<ViewerCardData | null>(null)
let viewerCardTimer: ReturnType<typeof setTimeout> | null = null

function showNextViewerCard() {
  if (viewerCardQueue.length === 0) {
    activeViewerCard.value = null
    return
  }
  activeViewerCard.value = viewerCardQueue.shift()!
  viewerCardTimer = setTimeout(dismissViewerCard, 15000)
}

function dismissViewerCard() {
  if (viewerCardTimer) {
    clearTimeout(viewerCardTimer)
    viewerCardTimer = null
  }
  activeViewerCard.value = null
  setTimeout(showNextViewerCard, 300)
}

async function fetchViewerCard(twitchId: string) {
  if (isDemo && simulator) {
    const card = simulator.generateFakeViewerCard(twitchId.replace('fake-', ''))
    viewerCardQueue.push(card)
    if (!activeViewerCard.value) {
      showNextViewerCard()
    }
    return
  }

  try {
    const data = await $fetch<ViewerCardData>(`/api/dashboard/viewer`, {
      query: { twitchId },
    })
    viewerCardQueue.push(data)
    if (!activeViewerCard.value) {
      showNextViewerCard()
    }
  } catch {
    // skip
  }
}

let noteDebounce: ReturnType<typeof setTimeout> | null = null

function updateNote(profileId: string, text: string) {
  if (activeViewerCard.value) {
    activeViewerCard.value.note = text
  }
  if (isDemo) {
    return
  }
  if (noteDebounce) {
    clearTimeout(noteDebounce)
  }
  noteDebounce = setTimeout(async () => {
    try {
      await $fetch('/api/dashboard/note', {
        method: 'POST',
        body: { profileId, text },
      })
    } catch {
      // skip
    }
  }, 1000)
}

function formatLastSeen(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) {
    return 'только что'
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} мин назад`
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} ч назад`
  }
  const days = Math.floor(diff / 86400)
  if (days === 1) {
    return 'вчера'
  }
  return `${days} дн назад`
}

function formatWatchTimeShort(min: number): string {
  if (min < 60) {
    return `${min} мин`
  }
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`
}

// Coupon countdown
const couponCountdown = ref('—')
let couponTickId: ReturnType<typeof setInterval>

function updateCouponCountdown() {
  if (isDemo) {
    // Demo: fake 45-min cycle
    const elapsed = (Date.now() / 1000) % (45 * 60)
    const remaining = 45 * 60 - elapsed
    const min = Math.floor(remaining / 60)
    const sec = Math.floor(remaining % 60)
    couponCountdown.value = `${min}:${sec.toString().padStart(2, '0')}`
    return
  }

  const nextAt = stats.value?.nextCouponAt
  if (!nextAt) {
    couponCountdown.value = '—'
    return
  }
  const diff = Math.max(0, Math.floor((new Date(nextAt).getTime() - Date.now()) / 1000))
  if (diff === 0) {
    couponCountdown.value = 'скоро...'
    return
  }
  const min = Math.floor(diff / 60)
  const sec = diff % 60
  couponCountdown.value = `${min}:${sec.toString().padStart(2, '0')}`
}

// --- DEMO MODE ---
const simulator = isDemo ? useDashboardSimulator() : null

function initDemo() {
  if (!simulator) {
    return
  }
  // Sync simulator reactive data into our local refs
  let lastProcessedIdx = 0
  watch(() => simulator.chatMessages.length, () => {
    // Process new messages since last check
    for (let i = lastProcessedIdx; i < simulator.chatMessages.length; i++) {
      const msg = simulator.chatMessages[i]!
      if (!msg.isSystem) {
        trackChatActivity(msg.name)
        if (msg.isFirstThisStream) {
          fetchViewerCard(msg.twitchId)
        }
      }
    }
    lastProcessedIdx = simulator.chatMessages.length
    chatMessages.splice(0, chatMessages.length, ...simulator.chatMessages)
  })
  watch(() => simulator.events.length, () => {
    const newEv = simulator.events.at(-1)
    if (newEv?.type === 'QUEST_COMPLETE' && newEv.data.userName) {
      markQuestDone(newEv.data.userName)
    }
    events.splice(0, events.length, ...simulator.events)
  })
  watch(() => simulator.stats.value, (v) => {
    stats.value = v
  }, { immediate: true, deep: true })

  // Fake stream info for demo
  streamInfo.value = {
    title: 'GeoGuessr с чатом — угадываем страны!',
    gameName: 'GeoGuessr',
    gameId: '518203',
    tags: ['Русский', 'opensource', 'chatgame'],
    language: 'ru',
  }

  simulator.start()
}

// --- LIVE MODE ---
let ws: WebSocket | null = null
let statsInterval: ReturnType<typeof setInterval>
let pingInterval: ReturnType<typeof setInterval> | null = null
let lastMessageId: string | null = null
const seenMessageIds = new Set<string>()

function connectWs() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${protocol}://${location.host}/api/websocket`)

  ws.onopen = () => {
    ws?.send(JSON.stringify({
      id: createId(),
      type: 'CONNECT_DASHBOARD',
      data: { roomId, lastMessageId },
    }))
    if (pingInterval) {
      clearInterval(pingInterval)
    }
    pingInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)
  }

  ws.onmessage = (msgEvent) => {
    try {
      if (msgEvent.data === 'pong') {
        return
      }
      const data = JSON.parse(msgEvent.data)

      // Track last message id for reconnect replay + dedup
      if (data._msgId) {
        if (seenMessageIds.has(data._msgId)) {
          return
        }
        seenMessageIds.add(data._msgId)
        lastMessageId = data._msgId
        // Keep set bounded
        if (seenMessageIds.size > 500) {
          const arr = [...seenMessageIds]
          for (let i = 0; i < 200; i++) {
            seenMessageIds.delete(arr[i]!)
          }
        }
      }

      if (data.event === 'newPlayerMessage') {
        const player = data.data.player
        const isFirst = data.data.isFirstThisStream === true
        trackChatActivity(player.name)
        if (isFirst) {
          fetchViewerCard(player.id)
        }
        chatMessages.push({
          id: createId(),
          twitchId: player.id,
          name: player.name,
          level: player.level ?? 0,
          text: data.data.text,
          time: nowTime(),
          isSystem: false,
          isFirstThisStream: isFirst,
          loadingXp: false,
          loadingCoins: false,
          replyTo: data.data.replyTo,
        })
        if (chatMessages.length > 200) {
          chatMessages.splice(0, chatMessages.length - 200)
        }
        return
      }

      // System message (bot announcements)
      if (data.event === 'systemMessage') {
        chatMessages.push({
          id: createId(),
          twitchId: '',
          name: 'BOT',
          level: 0,
          text: data.data.text,
          time: nowTime(),
          isSystem: true,
          isFirstThisStream: false,
          loadingXp: false,
          loadingCoins: false,
        })
        if (chatMessages.length > 200) {
          chatMessages.splice(0, chatMessages.length - 200)
        }
        return
      }

      if (data.type) {
        if (data.type === 'QUEST_COMPLETE' && data.data?.userName) {
          markQuestDone(data.data.userName)
        }
        const now = new Date()
        events.push({
          id: data.id ?? createId(),
          type: data.type,
          time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          data: data.data ?? {},
        })
        if (events.length > 200) {
          events.splice(0, events.length - 200)
        }
      }
    } catch {
      // skip
    }
  }

  ws.onclose = () => {
    ws = null
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
    setTimeout(connectWs, 5000)
  }
}

async function fetchStats() {
  try {
    stats.value = await $fetch(`/api/charge/${roomId}`)
  } catch {
    stats.value = null
  }
}

function initLive() {
  connectWs()
  fetchStats()
  fetchStreamInfo()
  fetchRedemptionStats()
  fetchRewards()
  statsInterval = setInterval(fetchStats, 3000)
}

// Profile modal
const profileModal = ref<ViewerCardData | null>(null)
const profileModalLoading = ref<'xp' | 'coins' | null>(null)

async function openProfileModal(twitchId: string, _name: string) {
  if (isDemo && simulator) {
    profileModal.value = simulator.generateFakeViewerCard(twitchId.replace('fake-', ''))
    return
  }

  try {
    profileModal.value = await $fetch<ViewerCardData>('/api/dashboard/viewer', {
      query: { twitchId },
    })
  } catch {
    // skip
  }
}

async function rewardFromModal(type: 'xp' | 'coins', amount: number) {
  if (!profileModal.value) {
    return
  }
  const twitchId = profileModal.value.twitchId

  if (isDemo) {
    profileModalLoading.value = type
    setTimeout(() => {
      profileModalLoading.value = null
    }, 500)
    return
  }

  profileModalLoading.value = type
  try {
    await $fetch('/api/dashboard/reward', {
      method: 'POST',
      body: { twitchId, type, amount, roomId },
    })
    if (type === 'coins') {
      streamerCoins.value -= amount
    }
  } catch {
    // silently fail
  } finally {
    profileModalLoading.value = null
  }
}

// Event formatting
function formatEventText(ev: DashboardEvent): string {
  const d = ev.data
  switch (ev.type) {
    case 'NEW_VIEWER': return 'новый зритель'
    case 'LEVEL_UP': return `уровень ${d.level}`
    case 'QUEST_COMPLETE': return `квест (+${d.reward} coins, +${d.xpReward} xp)`
    case 'COUPON_TAKEN': return `купон (всего: ${d.totalCoupons})`
    case 'DONATION': return `донат ${d.amount} ${d.currency}`
    case 'NEW_FOLLOWER': return 'новый фолловер'
    case 'RAID': return `рейд (${d.viewers} зрителей)`
    case 'WAGON_ACTION': return `${d.actionTitle}`
    case 'STREAMER_REWARD': return `награда +${d.amount} coins`
    case 'CARAVAN_ARRIVED': return `Караван прибыл в ${d.toVillage}! ${d.activeViewers} чел. +${d.xpReward} XP`
    case 'PURCHASE': return `покупка (${d.coins} coins)`
    default: return `${ev.type}`
  }
}

function eventColor(type: string): string {
  switch (type) {
    case 'DONATION': return 'border-amber-500/60 bg-amber-500/5'
    case 'RAID': return 'border-teal-500/60 bg-teal-500/5'
    case 'CARAVAN_ARRIVED': return 'border-teal-500/60 bg-teal-500/5'
    default: return 'border-white/15 bg-white/[0.02]'
  }
}

onMounted(() => {
  if (isDemo) {
    initDemo()
  } else {
    initLive()
  }
  updateCouponCountdown()
  updateStreamUptime()
  couponTickId = setInterval(() => {
    updateCouponCountdown()
    updateStreamUptime()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(couponTickId)
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
  ws?.close()
  clearInterval(statsInterval)
})
</script>

<style scoped>
.card-enter-active {
  transition: all 0.3s ease-out;
}

.card-leave-active {
  transition: all 0.2s ease-in;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.card-progress {
  animation: card-countdown 15s linear forwards;
}

@keyframes card-countdown {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
