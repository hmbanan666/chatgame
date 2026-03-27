<template>
  <nav class="hidden md:flex">
    <ul class="text-lg">
      <li
        v-for="link in currentLinks"
        :key="link.path"
        :class="{ active: route.path === link.path }"
      >
        <NuxtLink :to="link.path">
          {{ link.name }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()
const route = useRoute()

const guestLinks = [
  { name: 'Игра', path: '/' },
  { name: 'Персонажи', path: '/#characters' },
  { name: 'Монеты', path: '/#shop' },
  { name: 'Топ', path: '/top' },
  { name: 'Донат', path: '/donate' },
]

const authLinks = [
  { name: 'Мой профиль', path: '/profile' },
  { name: 'Персонажи', path: '/profile#characters' },
  { name: 'Монеты', path: '/profile#shop' },
  { name: 'Топ', path: '/top' },
  { name: 'Донат', path: '/donate' },
]

const currentLinks = computed(() => loggedIn.value ? authLinks : guestLinks)
</script>

<style scoped>
nav {
  a {
    display: flex;
    height: 100%;
    align-items: center;
    color: inherit;
    font-weight: 600;
    letter-spacing: 0;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--color-site-accent-bright);
    }
  }

  .active a {
    color: var(--color-site-accent-bright);
  }
}

ul {
  position: relative;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.4em;
  list-style: none;
}

li {
  position: relative;
  display: flex;
  gap: 0.2em;
  height: 100%;
}
</style>
