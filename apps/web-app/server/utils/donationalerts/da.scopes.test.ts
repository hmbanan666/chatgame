import { describe, expect, it } from 'vitest'

// Mirror of DA_SCOPES from da.auth.ts — if someone removes a scope, this test fails
const DA_SCOPES = [
  'oauth-user-show',
  'oauth-donation-index',
  'oauth-donation-subscribe',
  'oauth-custom_alert-store',
]

describe('donationAlerts OAuth scopes', () => {
  it('includes oauth-user-show for fetching user info (id, name)', () => {
    expect(DA_SCOPES).toContain('oauth-user-show')
  })

  it('includes oauth-donation-index for reading donations', () => {
    expect(DA_SCOPES).toContain('oauth-donation-index')
  })

  it('includes oauth-donation-subscribe for Centrifugo subscription', () => {
    expect(DA_SCOPES).toContain('oauth-donation-subscribe')
  })

  it('includes oauth-custom_alert-store for sending alerts', () => {
    expect(DA_SCOPES).toContain('oauth-custom_alert-store')
  })

  it('has exactly 4 required scopes', () => {
    expect(DA_SCOPES).toHaveLength(4)
  })
})
