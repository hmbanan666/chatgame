<template>
  <span
    class="inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap border"
    :class="[sizeClass, colorClass.bg, colorClass.text, colorClass.border]"
  >
    <span class="size-1.5 rounded-full" :class="[colorClass.dot]" />
    <span>{{ tag.name }}</span>
    <button
      v-if="removable"
      type="button"
      class="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
      @click.stop="$emit('remove')"
    >
      ×
    </button>
  </span>
</template>

<script setup lang="ts">
import { tagColorClasses } from '#shared/tags/colors'

interface TagLike {
  id: string
  name: string
  color: string
}

const props = withDefaults(defineProps<{
  tag: TagLike
  removable?: boolean
  size?: 'xs' | 'sm'
}>(), {
  removable: false,
  size: 'sm',
})

defineEmits<{
  remove: []
}>()

const colorClass = computed(() => tagColorClasses(props.tag.color))
const sizeClass = computed(() => props.size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5')
</script>
