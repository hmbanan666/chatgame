const logger = useLogger('game:cleanup')

export default defineTask({
  meta: {
    name: 'game:cleanup',
    description: 'Expire old backlog quests',
  },
  async run() {
    try {
      await db.backlogItem.expireStaleQuests()
      logger.info('Stale quests expired')
    } catch (err) {
      logger.error('Cleanup failed', err)
    }

    return { result: true }
  },
})
