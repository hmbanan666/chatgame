/**
 * Preset palette for streamer viewer tags. Users pick one of these by
 * name when creating a tag — the server stores the name string, the
 * client looks up the Tailwind class bundle here when rendering chips.
 *
 * Keep this list, name enum, and DB default ('gray') in sync.
 */

export const TAG_COLORS = [
  'gray',
  'red',
  'orange',
  'amber',
  'green',
  'sky',
  'violet',
  'pink',
] as const

export type TagColor = (typeof TAG_COLORS)[number]

export const TAG_COLOR_CLASSES: Record<TagColor, { bg: string, text: string, border: string, dot: string }> = {
  gray: { bg: 'bg-white/10', text: 'text-white/70', border: 'border-white/15', dot: 'bg-white/60' },
  red: { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/25', dot: 'bg-red-400' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/25', dot: 'bg-orange-400' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/25', dot: 'bg-amber-400' },
  green: { bg: 'bg-green-500/15', text: 'text-green-300', border: 'border-green-500/25', dot: 'bg-green-400' },
  sky: { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/25', dot: 'bg-sky-400' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/25', dot: 'bg-violet-400' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/25', dot: 'bg-pink-400' },
}

export function isValidTagColor(value: unknown): value is TagColor {
  return typeof value === 'string' && (TAG_COLORS as readonly string[]).includes(value)
}

export function tagColorClasses(color: string): { bg: string, text: string, border: string, dot: string } {
  return TAG_COLOR_CLASSES[(isValidTagColor(color) ? color : 'gray')]
}
