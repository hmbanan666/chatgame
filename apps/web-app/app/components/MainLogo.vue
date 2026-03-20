<template>
  <div class="-mt-5 -mb-1 -ml-3 -mr-2 w-22 h-22 overflow-hidden duration-200 group">
    <Image :src="`/units/${randomChar}/128.png`" class="w-22 h-22 hidden group-hover:block" />
    <Image :src="`/units/${randomChar}/idle.gif`" class="w-22 h-22 block group-hover:hidden" />
  </div>
</template>

<script setup lang="ts">
const characters = [
  'shape',
  'gentleman',
  'banana',
  'burger',
  'catchy',
  'marshmallow',
  'twitchy',
  'wooly',
  'pup',
  'telegramo',
  'santa',
]
const randomChar = computed(() => characters[Math.floor(Math.random() * characters.length)])
</script>
