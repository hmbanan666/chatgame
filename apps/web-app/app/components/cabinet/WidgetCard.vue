<template>
  <div class="bg-[#1e1e24] border border-white/5 p-5 space-y-4">
    <div class="flex items-center gap-3">
      <Icon :name="icon" class="size-6 text-site-accent" />
      <div>
        <div class="font-semibold">
          {{ name }}
        </div>
        <div class="text-xs text-white/40">
          {{ description }}
        </div>
      </div>
    </div>

    <div class="bg-[#0f0f14] p-3 flex items-center gap-2">
      <code class="flex-1 text-xs text-white/60 truncate">{{ url }}</code>
      <button
        class="shrink-0 text-white/40 hover:text-site-accent transition-colors cursor-pointer"
        :title="copied ? 'Скопировано!' : 'Копировать'"
        @click="copy()"
      >
        <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
      </button>
    </div>

    <div class="flex items-center justify-between text-xs text-white/30">
      <span>Рекомендуемый размер: {{ recommendedSize }}</span>
      <a
        :href="url"
        target="_blank"
        class="text-site-accent hover:text-site-accent-bright transition-colors"
      >
        Открыть <Icon name="lucide:external-link" class="size-3 inline" />
      </a>
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

const { copy, copied } = useClipboard({ source: computed(() => props.url) })
</script>
