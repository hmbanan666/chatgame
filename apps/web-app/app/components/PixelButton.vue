<template>
  <a
    v-if="to"
    :href="to"
    :target="external ? '_blank' : undefined"
    :class="classes"
    @click="handleClick"
  >
    <Icon
      v-if="loading"
      name="lucide:loader-2"
      class="size-5 animate-spin"
    />
    <Icon
      v-else-if="icon"
      :name="icon"
      class="size-5"
    />
    <slot />
  </a>
  <button
    v-else
    :disabled="disabled || loading"
    :class="classes"
  >
    <Icon
      v-if="loading"
      name="lucide:loader-2"
      class="size-5 animate-spin"
    />
    <Icon
      v-else-if="icon"
      :name="icon"
      class="size-5"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  color?: 'twitch' | 'accent' | 'neutral'
  icon?: string
  to?: string
  external?: boolean
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'accent',
})

const colorMap = {
  twitch: 'bg-[#6441a5] hover:bg-[#7B5BBF]',
  accent: 'bg-site-accent hover:bg-site-accent-bright',
  neutral: 'bg-white/10 hover:bg-white/20',
}

const classes = computed(() => [
  'btn-pixel inline-flex items-center justify-center gap-2 font-medium text-white transition-colors rounded-lg px-8 py-3 text-base',
  colorMap[props.color],
  props.disabled || props.loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
])

function handleClick(e: MouseEvent) {
  if (props.to && !props.external) {
    e.preventDefault()
    navigateTo(props.to)
  }
}
</script>
