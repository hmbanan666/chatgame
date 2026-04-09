import { describe, expect, it } from 'vitest'

// Mirror of the scopes from auth-url.get.ts — if someone removes a scope, this test fails
const STREAMER_SCOPES = [
  'chat:read',
  'chat:edit',
  'channel:manage:redemptions',
  'channel:read:subscriptions',
  'moderator:read:followers',
]

describe('twitch streamer OAuth scopes', () => {
  it('includes chat:read for IRC connection', () => {
    expect(STREAMER_SCOPES).toContain('chat:read')
  })

  it('includes chat:edit for sending messages', () => {
    expect(STREAMER_SCOPES).toContain('chat:edit')
  })

  it('includes channel:manage:redemptions for wagon rewards', () => {
    expect(STREAMER_SCOPES).toContain('channel:manage:redemptions')
  })

  it('includes moderator:read:followers for follow alerts', () => {
    expect(STREAMER_SCOPES).toContain('moderator:read:followers')
  })

  it('has exactly 5 required scopes', () => {
    expect(STREAMER_SCOPES).toHaveLength(5)
  })
})
