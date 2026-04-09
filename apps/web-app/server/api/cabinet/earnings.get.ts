const WEEKLY_LIMIT = 200
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const profile = await db.profile.find(session.user.id)
  if (!profile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const now = Date.now()
  let weeklyEarned = profile.streamerCoinsEarnedWeekly
  const resetAt = profile.streamerWeekResetAt

  // Check if week has passed
  if (!resetAt || now - resetAt.getTime() >= WEEK_MS) {
    weeklyEarned = 0
  }

  const weekResetsAt = resetAt && now - resetAt.getTime() < WEEK_MS
    ? new Date(resetAt.getTime() + WEEK_MS)
    : new Date(now + WEEK_MS)

  return {
    weeklyEarned,
    weeklyLimit: WEEKLY_LIMIT,
    weekResetsAt,
    coins: profile.coins,
  }
})
