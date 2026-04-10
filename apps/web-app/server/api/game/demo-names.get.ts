export default defineEventHandler(async () => {
  const rows = await db.streamerViewer.findRecentNamesAcrossStreamers(20)
  return rows.map((r) => r.name).filter((n): n is string => !!n)
})
