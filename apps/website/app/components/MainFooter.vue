<template>
  <footer>
    <ul>
      <li v-for="link in links" :key="link.url">
        <NuxtLink :to="localePath(link.url)" :target="link.isOnNewTab ? '_blank' : ''">
          {{ link.title }}
        </NuxtLink>
      </li>
    </ul>

    <div class="mt-4 space-y-2 text-amber-900 text-center">
      <p class="text-base">
        Создается с ❤️ и с 🔥 в глазах
      </p>
      <p class="text-sm">
        &copy; 2024 - 2025, ИП Косарев Н.Н.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

const links = [
  {
    title: 'GitHub',
    url: 'https://github.com/hmbanan666/chatgame',
    isOnNewTab: true,
  },
  {
    title: 'Twitch',
    url: 'https://twitch.tv/hmbanan666',
    isOnNewTab: true,
  },
  {
    title: 'Bluesky',
    url: 'https://bsky.app/profile/kosarev.space',
    isOnNewTab: true,
  },
  {
    title: 'TenChat',
    url: 'https://tenchat.ru/hmbanan666',
    isOnNewTab: true,
  },
  {
    title: 'Оферта',
    url: '/docs/offer',
  },
]
</script>

<style scoped>
  footer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1em;
    margin-top: 4em;
    margin-bottom: 2em;

    @media (min-width: 480px) {
      & {
        padding: 0.5em 0;
      }
    }
  }

  a {
    font-weight: 600;
    color: inherit;
    transition: 0.2s all;

    &:hover {
      color: var(--color-emerald-600);
      text-decoration: none;
    }
  }

  ul {
    position: relative;
    padding: 0;
    margin: 0 0 0.8em;
    display: flex;
    gap: 0.75em;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    list-style: none;

    @media screen and (min-width: 620px) {
      flex-direction: row;
      gap: 1.5em;
    }
  }

  li {
    position: relative;
  }
</style>
