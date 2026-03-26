<template>
  <div
    class="image-rendering-pixelated sprite-moving"
    :style="{
      'background-image': `url(/static/units/${codename}/moving.png)`,
    }"
  />
</template>

<script setup lang="ts">
defineProps<{ codename: string }>()
</script>

<style>
.sprite-moving {
  background-size: 800% 100%;
  animation: sprite-moving-8 1s steps(1) infinite;
}

@keyframes sprite-moving-8 {
  0%      { background-position-x: 0; }
  12.5%   { background-position-x: -100%; }
  25%     { background-position-x: -200%; }
  37.5%   { background-position-x: -300%; }
  50%     { background-position-x: -400%; }
  62.5%   { background-position-x: -500%; }
  75%     { background-position-x: -600%; }
  87.5%   { background-position-x: -700%; }
}
</style>
