<template>
  <NuxtLink to="/#characters" class="-mt-5 -mb-1 -ml-3 -mr-2 w-22 h-22 overflow-hidden duration-200 group block">
    <Image :src="`/units/${char}/128.png`" class="w-22 h-22 block group-hover:hidden" />
    <SpriteAnimation :codename="char!" class="w-22 h-22 hidden group-hover:block" />
  </NuxtLink>
</template>

<script setup lang="ts">
const characters = [
  'shape', 'gentleman', 'banana', 'burger', 'catchy',
  'marshmallow', 'twitchy', 'wooly', 'pup', 'telegramo', 'santa',
]

const index = useState('logo-char', () => Math.floor(Math.random() * characters.length))
const char = computed(() => characters[index.value])
</script>
