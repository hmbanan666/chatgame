import type { UseTimeAgoMessages, UseTimeAgoUnitNamesDefault } from '@vueuse/core'

const DIGIT_RE = /\d/

export function useLocaleTimeAgo(date: Date) {
  const { t } = useI18n()

  const I18N_MESSAGES: UseTimeAgoMessages<UseTimeAgoUnitNamesDefault> = {
    justNow: t('common.timeAgo.just-now'),
    past: (n) => (DIGIT_RE.test(n) ? t('common.timeAgo.ago', [n]) : n),
    future: (n) => (DIGIT_RE.test(n) ? t('common.timeAgo.in', [n]) : n),
    month: (n, past) =>
      n === 1
        ? past
          ? t('common.timeAgo.last-month')
          : t('common.timeAgo.next-month')
        : `${n} ${t(`common.timeAgo.month`, n)}`,
    year: (n, past) =>
      n === 1
        ? past
          ? t('common.timeAgo.last-year')
          : t('common.timeAgo.next-year')
        : `${n} ${t(`common.timeAgo.year`, n)}`,
    day: (n, past) =>
      n === 1
        ? past
          ? t('common.timeAgo.yesterday')
          : t('common.timeAgo.tomorrow')
        : `${n} ${t(`common.timeAgo.day`, n)}`,
    week: (n, past) =>
      n === 1
        ? past
          ? t('common.timeAgo.last-week')
          : t('common.timeAgo.next-week')
        : `${n} ${t(`common.timeAgo.week`, n)}`,
    hour: (n) => `${n} ${t('common.timeAgo.hour', n)}`,
    minute: (n) => `${n} ${t('common.timeAgo.minute', n)}`,
    second: (n) => `${n} ${t(`common.timeAgo.second`, n)}`,
    invalid: '',
  }

  return useTimeAgo(date, {
    fullDateFormatter: (date: Date) => date.toLocaleDateString(),
    messages: I18N_MESSAGES,
  })
}
