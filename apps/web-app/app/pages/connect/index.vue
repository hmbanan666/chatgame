<template>
  <div v-if="loggedIn" class="block">
    <div v-if="isMerged">
      <h2>Успех! Учетные записи объединены.</h2>
    </div>
    <div v-else>
      <h2>Вы объединяете учетные записи ChatGame и Telegram</h2>
      <p>Это действие нельзя будет отменить.</p>

      <div class="images-block">
        <img
          :src="user?.imageUrl ?? '/icons/twitch/112.png'"
          alt=""
          class="image"
        >
        <div>
          <Icon name="simple-icons:telegram" class="tg-icon" />
        </div>
      </div>

      <div class="button-block">
        <button class="submit-button" @click="handleMerge(user?.id)">
          Объединить
        </button>
      </div>
    </div>
  </div>
  <div v-else class="block">
    Сначала вам нужно войти на сайт
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const { data } = await useFetch('/api/auth/me')
const isMerged = computed(() => (data.value?.profile as any)?.telegramProfileId)

const route = useRoute()

onMounted(() => {
  if (route.query?.id) {
    localStorage.setItem('telegramId', route.query.id.toString())
  }
})

async function handleMerge(profileId?: string) {
  if (!profileId) {
    return
  }

  const { data } = await useFetch<{ ok: boolean }>(`/api/profile/${profileId}/telegram/merge` as string, {
    method: 'POST',
    body: JSON.stringify({
      telegramId: localStorage.getItem('telegramId'),
    }),
  })
  if (data.value?.ok) {
    location.reload()
  }
}
</script>

<style scoped>
  .block {
    margin-top: 32px;
    font-size: 24px;
    text-align: center;

    .images-block {
      margin-top: 20px;
      display: flex;
      align-items: start;
      justify-content: center;
      gap: 12px;
    }

    .image {
      width: 64px;
      height: 64px;
      border-radius: 50%;
    }
  }

  .tg-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #0088cc;
    color: white;
    padding: 15px 15px 12px 10px;
    overflow: visible;
    line-height: 0;
  }

  .button-block {
    width: fit-content;
    margin: 20px auto 0;
  }

  .submit-button {
    display: block;
    width: 100%;
    padding: 0.75em 1em;
    background-color: var(--green-9);
    color: var(--bronze-3);
    font-family: inherit;
    font-size: 1rem;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
    margin-top: 0.5em;

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      cursor: not-allowed;
      background-color: var(--gray-9);
    }
  }
</style>
