<template>
  <div class="hidden relative">
    <button class="select-lang" @click="handleListClick">
      <div class="icon">
        <Icon name="lucide:globe" class="!w-6 !h-6" />
      </div>
      <span>{{ $t('shortName') }}</span>
    </button>

    <div v-if="isOpened" class="dropdown-menu">
      <button
        v-for="chooseLocale in locales"
        :key="chooseLocale.code"
        @click="() => handleLocaleSwitch(chooseLocale.code)"
      >
        {{ chooseLocale.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locales, setLocale } = useI18n()
const isOpened = ref(false)
function handleListClick() {
  isOpened.value = !isOpened.value
}

function handleLocaleSwitch(code: 'ru' | 'en') {
  isOpened.value = false
  setLocale(code)
}
</script>

<style scoped>
  .select-lang {
    padding: 0.25em 0 0.25em;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.25em;
    font-weight: 600;
    cursor: pointer;
    border: 0;
    transition: color 0.2s;

    &:hover {
      color: var(--color-bg-accent-2)
    }

    .icon {
      pointer-events: none;
      height: 24px;
    }
  }
</style>
