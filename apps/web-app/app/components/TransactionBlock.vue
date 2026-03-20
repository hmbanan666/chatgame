<template>
  <div class="item">
    <div class="name">
      <NuxtLink :to="localePath(`/p/${transaction.profile.userName}`)">
        {{ transaction.profile.userName }}
      </NuxtLink>
    </div>
    <div class="type">
      {{ formatType(transaction.type, transaction.amount) }}
    </div>

    <time>{{ useLocaleTimeAgo(new Date(transaction.createdAt)) }}</time>
  </div>
</template>

<script setup lang="ts">
import type { TransactionWithProfile } from '@chat-game/types'

defineProps<{
  transaction: TransactionWithProfile
}>()
const localePath = useLocalePath()

function formatType(type: TransactionWithProfile['type'], amount: number) {
  switch (type) {
    case 'COIN_FROM_LVL_UP':
      return 'Получил(а) +1 Монету за новый уровень Персонажа'
    case 'CHARACTER_UNLOCK':
      return 'Разблокировал(а) нового Персонажа'
    case 'COINS_FROM_COUPON':
      return 'Получил(а) 2 монеты за Купон'
    case 'POINTS_FROM_LEVEL_UP':
      return 'Получил(а) 5 очков "Коллекционера" за новый уровень Персонажа'
    case 'POINTS_FROM_CHARACTER_UNLOCK':
      return `Получил(а) ${amount} очков "Коллекционера" за разблокировку Персонажа`
  }
}
</script>

<style scoped>
  .item {
    padding: 0.5em;
    background-color: var(--brown-2);
    color: var(--brown-11);
    border-radius: 0.5em;
    border: 0.15em solid var(--brown-4);

    .name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.15em;

      a {
        color: var(--brown-11);
        transition: 0.2s all;

        &:hover {
          text-decoration: none;
        }
      }
    }

    .type {
      font-size: 0.8rem;
      margin-bottom: 0.25em;
    }

    time {
      font-size: 0.8rem;
      color: var(--brown-9)
    }
  }
</style>
