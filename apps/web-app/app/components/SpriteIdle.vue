<template>
  <div
    class="image-rendering-pixelated"
    :style="{
      'background-image': `url(/static/units/${codename}/idle.png)`,
      'background-size': `${frames * 100}% 100%`,
      'animation': `sprite-idle-${frames} ${frames * 0.3}s steps(1) infinite`,
    }"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ codename: string }>()

const frames = ref(4)

function detectFrames(codename: string) {
  const img = new Image()
  img.src = `/static/units/${codename}/idle.png`
  img.onload = () => {
    const h = img.naturalHeight
    if (h > 0) {
      frames.value = Math.round(img.naturalWidth / h)
      ensureKeyframes(frames.value)
    }
  }
}

onMounted(() => detectFrames(props.codename))
watch(() => props.codename, detectFrames)

function ensureKeyframes(n: number) {
  const id = `sprite-idle-${n}`
  if (document.getElementById(id)) {
    return
  }
  let css = `@keyframes ${id} {\n`
  for (let i = 0; i < n; i++) {
    const pct = ((i / n) * 100).toFixed(4)
    css += `  ${pct}% { background-position-x: -${i * 100}%; }\n`
  }
  css += `}\n`
  const style = document.createElement('style')
  style.id = id
  style.textContent = css
  document.head.appendChild(style)
}
</script>
