<template>
  <div class="space-y-2">
    <div class="text-white/40 text-xs uppercase tracking-wide">
      Теги
    </div>

    <!-- Currently attached -->
    <div v-if="selectedTags.length" class="flex flex-wrap gap-1.5">
      <CabinetTagChip
        v-for="tag in selectedTags"
        :key="tag.id"
        :tag="tag"
        removable
        @remove="toggle(tag.id)"
      />
    </div>
    <div v-else class="text-white/20 text-xs italic">
      Тегов ещё нет
    </div>

    <!-- Available to add -->
    <div v-if="availableTags.length" class="pt-1">
      <div class="text-white/30 text-xs mb-1">
        Добавить:
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in availableTags"
          :key="tag.id"
          type="button"
          class="cursor-pointer hover:scale-105 transition-transform"
          @click="toggle(tag.id)"
        >
          <CabinetTagChip :tag="tag" />
        </button>
      </div>
    </div>
    <div v-else-if="!tags.length" class="text-white/20 text-xs">
      Создайте теги в списке зрителей сверху
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tag {
  id: string
  name: string
  color: string
}

const props = defineProps<{
  modelValue: string[]
  tags: Tag[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tagIds: string[]]
}>()

const selectedTags = computed(() => props.tags.filter((t) => props.modelValue.includes(t.id)))
const availableTags = computed(() => props.tags.filter((t) => !props.modelValue.includes(t.id)))

function toggle(tagId: string) {
  const current = props.modelValue
  const next = current.includes(tagId)
    ? current.filter((id) => id !== tagId)
    : [...current, tagId]
  emit('update:modelValue', next)
}
</script>
