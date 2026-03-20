<template>
  <nav class="hidden md:flex">
    <ul class="text-lg">
      <li
        v-for="link in links"
        :key="link.path"
        :class="{ active: visibleBlock === link.block }"
      >
        <NuxtLink :to="link.path">
          {{ link.name }}
        </NuxtLink>
      </li>

      <li v-if="loggedIn" :class="{ active: visibleBlock === 'profile' }">
        <NuxtLink to="/#profile">
          Мой профиль
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const { visibleBlock } = useNavigation()
const { loggedIn } = useUserSession()

const links = [
  {
    name: 'Игра',
    path: '/',
    block: 'game',
  },
  {
    name: 'Персонажи',
    path: '/#characters',
    block: 'characters',
  },
  {
    name: 'Монеты',
    path: '/#shop',
    block: 'shop',
  },
]
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
      color: var(--color-emerald-600);
    }
  }

  .active a {
    color: var(--color-emerald-600);
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
