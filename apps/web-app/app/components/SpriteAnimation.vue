<template>
  <div
    ref="el"
    class="image-rendering-pixelated"
    :style="spriteStyle"
  />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  codename: string
  animation?: 'moving' | 'idle'
}>(), {
  animation: 'moving',
})

const el = ref<HTMLElement>()
const frames = ref(props.animation === 'moving' ? 8 : 4)

const spriteStyle = computed(() => ({
  'background-image': `url(/static/units/${props.codename}/${props.animation}.png)`,
  'background-size': `${frames.value * 100}% 100%`,
  'animation': `sprite-step-${frames.value} ${frames.value * (props.animation === 'idle' ? 350 : 200)}ms steps(1) infinite`,
}))

onMounted(() => {
  const img = new Image()
  img.onload = () => {
    const frameSize = img.height
    if (frameSize > 0) {
      frames.value = Math.round(img.width / frameSize)
    }
  }
  img.src = `/static/units/${props.codename}/${props.animation}.png`
})
</script>

<style>
/* Generated step animations for 4-8 frames */
@keyframes sprite-step-4 {
  0%   { background-position-x: 0; }
  25%  { background-position-x: -100%; }
  50%  { background-position-x: -200%; }
  75%  { background-position-x: -300%; }
}

@keyframes sprite-step-5 {
  0%   { background-position-x: 0; }
  20%  { background-position-x: -100%; }
  40%  { background-position-x: -200%; }
  60%  { background-position-x: -300%; }
  80%  { background-position-x: -400%; }
}

@keyframes sprite-step-6 {
  0%      { background-position-x: 0; }
  16.67%  { background-position-x: -100%; }
  33.33%  { background-position-x: -200%; }
  50%     { background-position-x: -300%; }
  66.67%  { background-position-x: -400%; }
  83.33%  { background-position-x: -500%; }
}

@keyframes sprite-step-7 {
  0%      { background-position-x: 0; }
  14.29%  { background-position-x: -100%; }
  28.57%  { background-position-x: -200%; }
  42.86%  { background-position-x: -300%; }
  57.14%  { background-position-x: -400%; }
  71.43%  { background-position-x: -500%; }
  85.71%  { background-position-x: -600%; }
}

@keyframes sprite-step-8 {
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
