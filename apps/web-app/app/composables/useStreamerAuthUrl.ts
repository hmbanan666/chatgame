export function useStreamerAuthUrl() {
  const { data } = useFetch('/api/cabinet/auth-url')
  const streamerAuthUrl = computed(() => data.value?.url ?? '#')
  return { streamerAuthUrl }
}
