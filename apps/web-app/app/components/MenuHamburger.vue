<template>
  <button
    class="burger grow basis-0 ml-auto"
    :class="{ open: isMobileMenuOpened }"
    @click="closeMenu"
  >
    <svg width="32" height="24">
      <line
        id="top"
        x1="0"
        y1="2"
        x2="32"
        y2="2"
      />
      <line
        id="middle"
        x1="0"
        y1="12"
        x2="32"
        y2="12"
      />
      <line
        id="bottom"
        x1="0"
        y1="22"
        x2="32"
        y2="22"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
const { isMobileMenuOpened } = useApp()

function closeMenu() {
  isMobileMenuOpened.value = !isMobileMenuOpened.value
}
</script>

<style scoped>
.burger {
  position: relative;
  width: 48px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

svg {
  min-height: 24px;
  transition: transform 0.2s ease-in-out;
}

svg line {
  stroke: currentColor;
  stroke-width: 3;
  transition: transform 0.2s ease-in-out;
}

button {
  z-index: 10;
}

.open svg {
  color: var(--color-border);
}

.open #top {
  transform: translate(6px, 0px) rotate(45deg);
}

.open #middle {
  opacity: 0;
}

.open #bottom {
  transform: translate(-12px, 9px) rotate(-45deg);
}
</style>
