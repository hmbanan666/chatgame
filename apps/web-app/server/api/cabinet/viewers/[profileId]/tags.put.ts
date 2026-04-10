export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const streamerProfile = await db.profile.find(session.user.id)
  if (!streamerProfile?.isStreamer) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const viewerProfileId = getRouterParam(event, 'profileId')
  if (!viewerProfileId) {
    throw createError({ statusCode: 400, message: 'Missing profileId' })
  }

  const body = await readBody(event)
  const tagIds = Array.isArray(body?.tagIds) ? body.tagIds.filter((x: unknown) => typeof x === 'string') : null
  if (!tagIds) {
    throw createError({ statusCode: 400, message: 'Invalid tagIds' })
  }

  // Resolve the streamer_viewer row
  const viewer = await db.streamerViewer.findByStreamerAndProfile(streamerProfile.id, viewerProfileId)
  if (!viewer) {
    throw createError({ statusCode: 404, message: 'Viewer not found for this streamer' })
  }

  // Validate that all tagIds belong to this streamer
  if (tagIds.length > 0) {
    const ownedTags = await db.streamerTag.findByStreamer(streamerProfile.id)
    const ownedIds = new Set(ownedTags.map((t) => t.id))
    const allValid = tagIds.every((id: string) => ownedIds.has(id))
    if (!allValid) {
      throw createError({ statusCode: 400, message: 'Some tags do not belong to this streamer' })
    }
  }

  await db.streamerViewerTag.setTagsForViewer(viewer.id, tagIds)

  return { ok: true, tagIds }
})
