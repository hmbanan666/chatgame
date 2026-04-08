export function useWidgetToken(token: string) {
  const roomId = ref('')
  const error = ref(false)

  const resolve = async () => {
    try {
      const data = await $fetch<{ roomId: string }>(`/api/widget/resolve/${token}`)
      roomId.value = data.roomId
    } catch {
      error.value = true
    }
  }

  return { roomId, error, resolve }
}
