export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/')
  }

  const { data: profile } = await useFetch(() => `/api/profile/${user.value?.id}`)

  if (!profile.value?.isStreamer) {
    return navigateTo('/for-streamers')
  }
})
