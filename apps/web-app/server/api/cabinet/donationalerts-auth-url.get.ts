import { DA_SCOPES } from '~~/server/utils/donationalerts/da.auth'

export default defineEventHandler(() => {
  const { donationAlertsClientId, public: publicEnv } = useRuntimeConfig()

  const params = new URLSearchParams({
    client_id: donationAlertsClientId,
    redirect_uri: publicEnv.donationAlertsRedirectUrl,
    response_type: 'code',
    scope: DA_SCOPES.join(' '),
  })

  return {
    url: `https://www.donationalerts.com/oauth/authorize?${params}`,
  }
})
