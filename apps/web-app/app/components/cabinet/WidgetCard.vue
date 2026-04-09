<template>
  <div class="bg-[#1e1e24] border border-white/5 rounded-lg p-5 space-y-4">
    <div class="flex items-center gap-3">
      <Icon :name="icon" class="size-6 text-teal-400 shrink-0" />
      <div>
        <div class="font-semibold">
          {{ name }}
        </div>
        <div class="text-xs text-white/40">
          {{ description }}
        </div>
      </div>
    </div>

    <div v-if="revealed" class="bg-[#0f0f14] rounded-md p-3 flex items-center gap-2">
      <code class="flex-1 text-xs text-white/60 truncate">{{ url }}</code>
      <button
        class="shrink-0 text-white/40 hover:text-teal-400 transition-colors cursor-pointer"
        :title="copied ? 'Скопировано!' : 'Копировать'"
        @click="copy()"
      >
        <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
      </button>
    </div>
    <button
      v-else
      class="w-full bg-[#0f0f14] rounded-md p-3 flex items-center justify-center gap-2 text-white/30 hover:text-white/50 transition-colors cursor-pointer"
      @click="revealed = true"
    >
      <Icon name="lucide:eye-off" class="size-4" />
      <span class="text-xs">Показать ссылку</span>
    </button>

    <div class="flex items-center justify-between text-xs text-white/30">
      <span>Рекомендуемый: {{ recommendedSize }}</span>
      <button
        v-if="revealed"
        class="text-teal-400 hover:text-teal-400-bright transition-colors cursor-pointer"
        @click="open()"
      >
        Открыть <Icon name="lucide:external-link" class="size-3 inline" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  description: string
  icon: string
  url: string
  recommendedSize: string
}>()

const revealed = ref(false)
const { copy, copied } = useClipboard({ source: computed(() => props.url) })

function open() {
  window.open(props.url, '_blank')
}
</script>
