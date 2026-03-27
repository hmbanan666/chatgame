export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (loggedIn.value && to.path === '/') {
    return navigateTo('/profile')
  }
})
