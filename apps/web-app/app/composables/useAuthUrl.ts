export function useAuthUrl() {
  const url = import.meta.dev ? '/api/auth/dev-login' : '/api/auth/twitch'
  return { authUrl: url }
}
