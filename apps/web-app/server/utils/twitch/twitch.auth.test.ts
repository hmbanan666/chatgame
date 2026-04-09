import { describe, expect, it } from 'vitest'

// Token expiration logic extracted from twitch.auth.ts reloadTwitchToken
function isTokenExpired(obtainmentTimestamp: string, expiresIn: number, bufferMs = 5 * 60_000): boolean {
  const obtainedAt = Number(obtainmentTimestamp)
  const expiresAt = obtainedAt + (expiresIn * 1000)
  return Date.now() >= expiresAt - bufferMs
}

describe('twitch token expiration check', () => {
  it('considers fresh token as valid', () => {
    const now = Date.now()
    expect(isTokenExpired(now.toString(), 14400)).toBe(false)
  })

  it('considers token expired when past expiresIn', () => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000)
    expect(isTokenExpired(twoHoursAgo.toString(), 3600)).toBe(true)
  })

  it('considers token expired within 5 min buffer', () => {
    // Token obtained 55 min ago, expires in 3600s (1h)
    // 55 min = 3300s elapsed, 300s remaining = within 5min buffer
    const fiftyFiveMinAgo = Date.now() - (55 * 60 * 1000)
    expect(isTokenExpired(fiftyFiveMinAgo.toString(), 3600)).toBe(true)
  })

  it('considers token valid just outside buffer', () => {
    // Token obtained 50 min ago, expires in 3600s (1h)
    // 50 min = 3000s elapsed, 600s remaining = outside 5min buffer
    const fiftyMinAgo = Date.now() - (50 * 60 * 1000)
    expect(isTokenExpired(fiftyMinAgo.toString(), 3600)).toBe(false)
  })

  it('handles custom buffer', () => {
    const now = Date.now()
    // Token just obtained, expires in 60s, buffer 120s → expired (within buffer)
    expect(isTokenExpired(now.toString(), 60, 120_000)).toBe(true)
  })
})
