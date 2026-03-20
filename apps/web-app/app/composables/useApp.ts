function _useApp() {
  const route = useRoute()

  const isMobileMenuOpened = ref(false)
  const isFeedOpened = ref(false)

  watch(
    () => route.fullPath,
    () => {
      isMobileMenuOpened.value = false
      isFeedOpened.value = false
    },
  )

  return {
    isMobileMenuOpened,
    isFeedOpened,
  }
}

export const useApp = createSharedComposable(_useApp)
