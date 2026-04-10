<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <!-- "Все" chip -->
      <button
        type="button"
        class="text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer"
        :class="filter == null ? 'bg-white/20 text-white border-white/20' : 'bg-transparent text-white/50 border-white/10 hover:text-white hover:border-white/20'"
        @click="$emit('update:filter', null)"
      >
        Все
      </button>

      <!-- Tag chips -->
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="group relative"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer"
          :class="[
            filter === tag.id
              ? `${tagClasses(tag.color).bg} ${tagClasses(tag.color).text} ${tagClasses(tag.color).border} ring-1 ring-white/20`
              : `${tagClasses(tag.color).bg} ${tagClasses(tag.color).text} ${tagClasses(tag.color).border} opacity-70 hover:opacity-100`,
          ]"
          @click="$emit('update:filter', filter === tag.id ? null : tag.id)"
        >
          <span class="size-1.5 rounded-full" :class="[tagClasses(tag.color).dot]" />
          {{ tag.name }}
        </button>
        <!-- Edit/delete mini actions on hover -->
        <div class="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5">
          <button
            type="button"
            class="size-4 rounded-full bg-[#0a0a10] border border-white/20 flex items-center justify-center text-[9px] text-white/70 hover:text-white cursor-pointer"
            title="Переименовать"
            @click.stop="startEdit(tag)"
          >
            ✎
          </button>
          <button
            type="button"
            class="size-4 rounded-full bg-[#0a0a10] border border-red-400/30 flex items-center justify-center text-[9px] text-red-300 hover:text-red-200 cursor-pointer"
            title="Удалить"
            @click.stop="deleteTag(tag)"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Create new tag -->
      <button
        v-if="!formOpen"
        type="button"
        class="text-xs px-3 py-1 rounded-full border border-dashed border-white/15 text-white/40 hover:text-white hover:border-white/30 cursor-pointer"
        @click="openCreate"
      >
        + тег
      </button>
    </div>

    <!-- Inline create/edit form -->
    <div
      v-if="formOpen"
      class="bg-[#1a1a20] border border-white/10 rounded-lg p-3 space-y-2 max-w-md"
    >
      <div class="flex items-center gap-2">
        <input
          ref="nameInput"
          v-model="formName"
          :placeholder="editingId ? 'Новое имя' : 'Название тега'"
          class="flex-1 bg-[#0f0f14] border border-white/10 rounded px-2 py-1 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25"
          maxlength="32"
          @keydown.enter="submit"
          @keydown.esc="cancel"
        >
        <button
          type="button"
          class="text-xs text-white/40 hover:text-white cursor-pointer px-2"
          @click="cancel"
        >
          Отмена
        </button>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          v-for="c in TAG_COLORS"
          :key="c"
          type="button"
          class="size-6 rounded-full border-2 transition-transform cursor-pointer"
          :class="[
            tagClasses(c).bg,
            tagClasses(c).border,
            formColor === c ? 'scale-110 ring-2 ring-white/40' : 'opacity-70 hover:opacity-100',
          ]"
          :title="c"
          @click="formColor = c"
        />
      </div>
      <div class="flex items-center justify-end">
        <PixelButton
          :disabled="!formName.trim() || submitting"
          :loading="submitting"
          color="accent"
          class="text-xs! px-4! py-1.5!"
          @click="submit"
        >
          {{ editingId ? 'Сохранить' : 'Создать' }}
        </PixelButton>
      </div>
      <p v-if="formError" class="text-red-400 text-xs">
        {{ formError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TagColor } from '#shared/tags/colors'
import { TAG_COLORS, tagColorClasses } from '#shared/tags/colors'

interface Tag {
  id: string
  name: string
  color: string
}

const props = defineProps<{
  tags: Tag[]
  filter: string | null
}>()

const emit = defineEmits<{
  'update:filter': [tagId: string | null]
  'tagsChanged': []
}>()

const formOpen = ref(false)
const editingId = ref<string | null>(null)
const formName = ref('')
const formColor = ref<TagColor>('gray')
const formError = ref('')
const submitting = ref(false)
const nameInput = ref<HTMLInputElement>()

function tagClasses(color: string) {
  return tagColorClasses(color)
}

function openCreate() {
  editingId.value = null
  formName.value = ''
  formColor.value = 'gray'
  formError.value = ''
  formOpen.value = true
  nextTick(() => nameInput.value?.focus())
}

function startEdit(tag: Tag) {
  editingId.value = tag.id
  formName.value = tag.name
  formColor.value = (tag.color as TagColor)
  formError.value = ''
  formOpen.value = true
  nextTick(() => nameInput.value?.focus())
}

function cancel() {
  formOpen.value = false
  editingId.value = null
  formError.value = ''
}

async function submit() {
  const name = formName.value.trim()
  if (!name || submitting.value) {
    return
  }
  submitting.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await $fetch(`/api/cabinet/tags/${editingId.value}`, {
        method: 'PATCH',
        body: { name, color: formColor.value },
      })
    } else {
      await $fetch('/api/cabinet/tags', {
        method: 'POST',
        body: { name, color: formColor.value },
      })
    }
    emit('tagsChanged')
    cancel()
  } catch (err: any) {
    const msg = err?.data?.message
    if (msg === 'TAG_NAME_TAKEN') {
      formError.value = 'Тег с таким именем уже есть'
    } else if (msg === 'TAG_LIMIT_REACHED') {
      formError.value = 'Достигнут лимит тегов'
    } else {
      formError.value = 'Не удалось сохранить тег'
    }
  } finally {
    submitting.value = false
  }
}

async function deleteTag(tag: Tag) {
  try {
    await $fetch(`/api/cabinet/tags/${tag.id}`, { method: 'DELETE' })
    if (props.filter === tag.id) {
      emit('update:filter', null)
    }
    emit('tagsChanged')
  } catch {
    // swallow
  }
}
</script>
