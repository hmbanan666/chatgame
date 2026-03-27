<template>
  <div
    class="image-rendering-pixelated sprite-idle"
    :style="{
      'background-image': `url(/static/units/${codename}/idle.png)`,
    }"
  />
</template>

<script setup lang="ts">
defineProps<{ codename: string }>()
</script>

<style>
.sprite-idle {
  background-size: 400% 100%;
  animation: sprite-idle-4 1.2s steps(1) infinite;
}

@keyframes sprite-idle-4 {
  0%    { background-position-x: 0; }
  25%   { background-position-x: -100%; }
  50%   { background-position-x: -200%; }
  75%   { background-position-x: -300%; }
}
</style>
