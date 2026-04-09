export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/')
  }

  const { data: profile } = await useFetch(() => `/api/profile/${user.value?.id}`)

  if (!profile.value?.isStreamer) {
    return navigateTo('/for-streamers')
  }

  // Premium already paid — full access
  if (profile.value.streamerPremiumPaidAt) {
    return
  }

  // Allow upgrade page always
  if (to.path === '/cabinet/upgrade') {
    return
  }

  // Check trial status
  const { data: access } = await useFetch('/api/cabinet/access-status')
  if (access.value?.status === 'locked') {
    return navigateTo('/cabinet/upgrade')
  }
})
