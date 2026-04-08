export type ChunkType = 'forest' | 'clearing' | 'field' | 'village'

export type ChunkBiome = 'GREEN' | 'BLUE' | 'STONE' | 'TEAL' | 'TOXIC' | 'VIOLET'

export interface WorldChunk {
  id: string
  type: ChunkType
  name: string
  biome: ChunkBiome
  startX: number
  endX: number
}

export const FOREST_LENGTH = 5000
export const VILLAGE_LENGTH = 2000

/** Forest names per biome */
export const FOREST_NAMES: Record<ChunkBiome, string[]> = {
  GREEN: ['Зелёный Лес', 'Дубравка', 'Изумрудная Роща'],
  BLUE: ['Синий Бор', 'Ледяная Чаща', 'Туманный Лес'],
  STONE: ['Каменистые Холмы', 'Серая Пустошь', 'Скалистый Перевал'],
  TEAL: ['Бирюзовая Роща', 'Малахитовый Лес', 'Нефритовая Чаща'],
  TOXIC: ['Ядовитые Топи', 'Кислотный Лес', 'Жёлтая Пустошь'],
  VIOLET: ['Лиловый Лес', 'Аметистовая Роща', 'Пурпурная Чаща'],
}

/** Clearing names per biome */
export const CLEARING_NAMES: Record<ChunkBiome, string[]> = {
  GREEN: ['Солнечная Поляна', 'Тихая Опушка', 'Светлая Просека'],
  BLUE: ['Морозная Поляна', 'Прохладная Опушка', 'Снежная Просека'],
  STONE: ['Каменная Поляна', 'Серая Опушка', 'Щебёночная Просека'],
  TEAL: ['Бирюзовая Поляна', 'Мятная Опушка', 'Изумрудная Просека'],
  TOXIC: ['Болотная Поляна', 'Гнилая Опушка', 'Мутная Просека'],
  VIOLET: ['Лиловая Поляна', 'Сиреневая Опушка', 'Пурпурная Просека'],
}

export const FIELD_NAMES = [
  'Золотое Поле', 'Пшеничная Долина', 'Солнечная Нива',
  'Янтарные Колосья', 'Хлебное Поле', 'Ржаная Пустошь',
]

export const VILLAGE_NAMES = [
  'Дубровка', 'Камнеград', 'Туманное', 'Каменка', 'Берёзовка',
  'Кристалл', 'Озёрная', 'Сосновка', 'Горняк', 'Медовка',
  'Вольная', 'Лунная', 'Ржавка', 'Тихая', 'Приют',
]
