<template>
  <ClientOnly>
    <div class="min-h-dvh bg-neutral-950 p-4 md:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-white">
          Pixel Editor
        </h1>
        <div class="flex items-center gap-3">
          <button
            :disabled="saving || !selectedCodename"
            class="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
            @click="saveToDb"
          >
            {{ saved ? 'Сохранено!' : saving ? 'Сохраняю...' : 'Сохранить' }}
          </button>
          <span v-if="loadedFromDb" class="text-xs text-emerald-500">БД</span>
          <span v-else-if="selectedCodename" class="text-xs text-neutral-500">файл</span>
        </div>
      </div>

      <div class="flex gap-5">
        <!-- Left sidebar: pickers + tools -->
        <div class="flex flex-col gap-4 w-44 shrink-0">
          <!-- Sprite picker -->
          <div>
            <p class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
              Спрайт
            </p>
            <select
              v-model="selectedCodename"
              class="w-full bg-neutral-800 text-white text-sm px-2 py-1.5 border border-neutral-700"
              @change="onCharacterChange"
            >
              <option value="">
                —
              </option>
              <optgroup
                v-for="group in spriteGroups"
                :key="group.type"
                :label="group.label"
              >
                <option
                  v-for="s in group.items"
                  :key="s.codename"
                  :value="s.codename"
                >
                  {{ s.codename }}
                </option>
              </optgroup>
            </select>
            <button
              class="w-full mt-1 px-2 py-1.5 text-xs font-semibold bg-neutral-800 text-emerald-400 hover:text-emerald-300"
              @click="resetAndShowNewForm"
            >
              + Новый спрайт
            </button>
            <!-- New sprite form -->
            <div v-if="showNewForm" class="mt-2 space-y-1">
              <input
                v-model="newCodename"
                class="w-full bg-neutral-900 text-white text-xs px-2 py-1.5 border border-neutral-700"
                placeholder="codename"
              >
              <select
                v-model="newSpriteType"
                class="w-full bg-neutral-900 text-white text-xs px-2 py-1.5 border border-neutral-700"
              >
                <option value="character">
                  character
                </option>
                <option value="npc">
                  npc
                </option>
                <option value="tree">
                  tree
                </option>
                <option value="building">
                  building
                </option>
                <option value="object">
                  object
                </option>
              </select>
              <button
                class="w-full px-2 py-1.5 text-xs font-semibold bg-emerald-600 text-white"
                :disabled="!newCodename.trim()"
                @click="createNew"
              >
                Создать
              </button>
            </div>
          </div>

          <!-- Type -->
          <div v-if="selectedCodename">
            <p class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
              Тип
            </p>
            <select
              v-model="newSpriteType"
              class="w-full bg-neutral-800 text-white text-xs px-2 py-1.5 border border-neutral-700"
            >
              <option value="character">
                character
              </option>
              <option value="npc">
                npc
              </option>
              <option value="tree">
                tree
              </option>
              <option value="building">
                building
              </option>
              <option value="object">
                object
              </option>
            </select>
          </div>

          <!-- Tools -->
          <div>
            <p class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
              Инструмент
            </p>
            <div class="grid grid-cols-3 gap-1">
              <button
                class="px-1 py-1.5 text-xs font-semibold"
                :class="tool === 'draw' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'"
                @click="tool = 'draw'"
              >
                Кисть
              </button>
              <button
                class="px-1 py-1.5 text-xs font-semibold"
                :class="tool === 'erase' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'"
                @click="tool = 'erase'"
              >
                Ластик
              </button>
              <button
                class="px-1 py-1.5 text-xs font-semibold"
                :class="tool === 'select' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'"
                @click="tool = 'select'"
              >
                Выдел.
              </button>
            </div>
            <button
              class="w-full mt-1 px-2 py-1.5 text-xs font-semibold bg-neutral-800 text-neutral-500 hover:text-white"
              @click="clearCanvas"
            >
              Очистить
            </button>
          </div>

          <!-- Slot palette -->
          <div>
            <p class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
              Слоты ({{ currentPalette.length }})
            </p>
            <div class="grid grid-cols-4 gap-1">
              <button
                v-for="(color, idx) in currentPalette"
                :key="idx"
                class="aspect-square border-2 flex items-center justify-center text-[10px] font-bold transition-all"
                :class="activeSlot === idx && tool === 'draw'
                  ? 'border-white scale-110 z-10'
                  : 'border-neutral-700 hover:border-neutral-500'"
                :style="{ backgroundColor: hexColor(color) }"
                :title="`${idx}: ${slotRoles[idx] ?? ''} · 2×клик=переименовать · ПКМ=удалить`"
                @click="activeSlot = idx; tool = 'draw'"
                @dblclick="renameSlot(idx)"
                @contextmenu.prevent="removeSlot(idx)"
              >
                <span :class="isLight(color) ? 'text-black/70' : 'text-white/70'">{{ idx }}</span>
              </button>
              <button
                class="aspect-square border-2 border-dashed border-neutral-700 hover:border-neutral-500 flex items-center justify-center text-neutral-500 text-sm"
                title="Добавить слот"
                @click="addSlot"
              >
                +
              </button>
            </div>
            <div v-if="editingSlot >= 0" class="flex gap-1 mt-1">
              <input
                v-model="editingSlotName"
                class="flex-1 bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 border border-neutral-600"
                @keyup.enter="confirmRenameSlot"
              >
              <button
                class="px-1.5 py-0.5 text-[10px] bg-emerald-600 text-white"
                @click="confirmRenameSlot"
              >
                OK
              </button>
            </div>
            <p v-else-if="slotRoles[activeSlot]" class="text-[10px] text-neutral-400 mt-1 truncate">
              {{ activeSlot }}: {{ slotRoles[activeSlot] }}
            </p>
          </div>
        </div>

        <!-- Center: Canvas -->
        <div class="flex-1 flex flex-col items-center">
          <!-- Floating selection controls -->
          <div v-if="floatingPixels.length" class="flex gap-2 mb-2">
            <button
              class="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white"
              @click="confirmFloating"
            >
              Применить
            </button>
            <button
              class="px-3 py-1 text-xs font-semibold bg-neutral-700 text-neutral-300"
              @click="cancelFloating"
            >
              Отмена
            </button>
          </div>
          <div v-else-if="selection" class="flex gap-2 mb-2">
            <button
              class="px-3 py-1 text-xs font-semibold bg-blue-600 text-white"
              @click="copySelection"
            >
              Копировать
            </button>
            <button
              class="px-3 py-1 text-xs font-semibold bg-neutral-700 text-neutral-300"
              @click="selection = null; draw()"
            >
              Снять
            </button>
          </div>
          <canvas
            ref="canvasRef"
            :width="GRID * PIXEL_SIZE"
            :height="GRID * PIXEL_SIZE"
            class="border border-neutral-700 cursor-crosshair"
            style="image-rendering: pixelated; width: 640px; height: 640px;"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseLeave"
            @contextmenu.prevent
          />
          <div class="flex items-center gap-4 mt-2 text-xs text-neutral-500 font-mono h-5">
            <span>{{ pixels.size }} px</span>
            <template v-if="cursorPos">
              <span>x: {{ cursorPos[0] }} <span :class="cursorPos[0] === centerX ? 'text-emerald-400' : ''">{{ cursorPos[0] === centerX ? '⬤' : '' }}</span></span>
              <span>y: {{ cursorPos[1] }} <span :class="cursorPos[1] === centerY ? 'text-emerald-400' : ''">{{ cursorPos[1] === centerY ? '⬤' : '' }}</span></span>
            </template>
          </div>

          <!-- Frame thumbnails -->
          <div v-if="frameNames.length" class="mt-4 w-full max-w-[640px]">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="name in frameNames"
                :key="name"
                class="relative group"
              >
                <button
                  class="flex flex-col items-center gap-1 p-1.5 border-2 transition-all hover:border-neutral-500"
                  :class="selectedFrame === name ? 'border-emerald-500 bg-neutral-800' : 'border-neutral-800'"
                  @click="selectedFrame = name; onFrameChange()"
                >
                  <canvas
                    :ref="(el) => { if (el) thumbRefs[name] = el as HTMLCanvasElement }"
                    :width="GRID"
                    :height="GRID"
                    class="bg-neutral-900"
                    style="image-rendering: pixelated; width: 48px; height: 48px;"
                  />
                  <span class="text-[9px] text-neutral-500 leading-none">{{ name }}</span>
                </button>
                <button
                  class="absolute -top-1.5 -right-1.5 size-4 bg-red-600 hover:bg-red-500 text-white text-[9px] leading-none items-center justify-center cursor-pointer z-10 hidden group-hover:flex"
                  title="Удалить фрейм"
                  @click.stop="deleteFrame(name)"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right sidebar: full palette -->
        <div class="w-52 shrink-0">
          <p class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
            Палитра — назначить на слот {{ activeSlot }}
          </p>
          <div class="grid grid-cols-8 gap-0.5">
            <button
              v-for="(entry, i) in paletteEntries"
              :key="i"
              class="aspect-square border border-neutral-800 hover:border-white transition-colors"
              :style="{ backgroundColor: hexColor(entry.value) }"
              :title="entry.name"
              @click="assignColorToSlot(entry.value)"
            />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { PALETTE } from '@chatgame/sprites'

const GRID = 32
const PIXEL_SIZE = 20

const canvasRef = ref<HTMLCanvasElement>()
const pixels = reactive(new Map<string, number>())
const activeSlot = ref(0)
const tool = ref<'draw' | 'erase' | 'select'>('draw')
const painting = ref(false)

const selectedCodename = ref('')
const selectedFrame = ref('')
const frameNames = ref<string[]>([])
const currentPalette = reactive<number[]>([])
const slotRoles = reactive<string[]>([])
const saving = ref(false)
const saved = ref(false)
const loadedFromDb = ref(false)
const thumbRefs = reactive<Record<string, HTMLCanvasElement>>({})
const spriteId = ref('')

let currentFrames: Record<string, [number, number, number][]> = {}

interface SpriteListItem {
  codename: string
  type: string
}

const spriteList = ref<SpriteListItem[]>([])

const TYPE_LABELS: Record<string, string> = {
  character: 'Персонажи',
  npc: 'NPC',
  tree: 'Деревья',
  building: 'Здания',
  object: 'Объекты',
}

const spriteGroups = computed(() => {
  const groups = new Map<string, SpriteListItem[]>()
  for (const s of spriteList.value) {
    const list = groups.get(s.type) ?? []
    list.push(s)
    groups.set(s.type, list)
  }
  return Array.from(groups.entries()).map(([type, items]) => ({
    type,
    label: TYPE_LABELS[type] ?? type,
    items,
  }))
})

const FRAME_NAME_RE = /^(?:IDLE|MOVING|HEAD)_?\d*$/
const FRAME_SUFFIX_RE = /_?\d+$/

// Full palette entries for color picker
const paletteEntries = Object.entries(PALETTE)
  .filter(([, v]) => typeof v === 'number')
  .map(([name, value]) => ({ name, value: value as number }))

function hexColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`
}

function isLight(c: number): boolean {
  const r = (c >> 16) & 0xFF
  const g = (c >> 8) & 0xFF
  const b = c & 0xFF
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150
}

// --- Cursor ---

const cursorPos = ref<[number, number] | null>(null)
const centerX = Math.floor(GRID / 2)
const centerY = Math.floor(GRID / 2)

// --- Selection & clipboard ---

interface SelectionRect { x1: number, y1: number, x2: number, y2: number }

const selection = ref<SelectionRect | null>(null)
const selectionStart = ref<[number, number] | null>(null)
const clipboard = ref<[number, number, number][]>([])
const floatingPixels = ref<[number, number, number][]>([])
const floatingOffset = ref({ x: 0, y: 0 })
const draggingFloating = ref(false)
const dragStart = ref({ x: 0, y: 0 })

function normalizeSelection(s: SelectionRect): SelectionRect {
  return {
    x1: Math.min(s.x1, s.x2),
    y1: Math.min(s.y1, s.y2),
    x2: Math.max(s.x1, s.x2),
    y2: Math.max(s.y1, s.y2),
  }
}

function copySelection() {
  if (!selection.value) {
    return
  }
  const s = normalizeSelection(selection.value)
  const copied: [number, number, number][] = []
  for (let y = s.y1; y <= s.y2; y++) {
    for (let x = s.x1; x <= s.x2; x++) {
      const slot = pixels.get(`${x},${y}`)
      if (slot !== undefined) {
        copied.push([x - s.x1, y - s.y1, slot])
      }
    }
  }
  clipboard.value = copied
  selection.value = null
  draw()
}

function pasteClipboard() {
  if (!clipboard.value.length) {
    return
  }
  floatingPixels.value = [...clipboard.value]
  floatingOffset.value = { x: 0, y: 0 }
  draw()
}

function confirmFloating() {
  const ox = floatingOffset.value.x
  const oy = floatingOffset.value.y
  for (const [x, y, slot] of floatingPixels.value) {
    const nx = x + ox
    const ny = y + oy
    if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID) {
      pixels.set(`${nx},${ny}`, slot)
    }
  }
  floatingPixels.value = []
  draw()
}

function cancelFloating() {
  floatingPixels.value = []
  draw()
}

// --- Drawing ---

function draw() {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Pixels
  for (const [key, slot] of pixels) {
    const [x, y] = key.split(',').map(Number)
    const color = currentPalette[slot]
    if (color !== undefined) {
      ctx.fillStyle = hexColor(color)
      ctx.fillRect(x! * PIXEL_SIZE, y! * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
    }
  }

  // Grid
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath()
    ctx.moveTo(i * PIXEL_SIZE + 0.5, 0)
    ctx.lineTo(i * PIXEL_SIZE + 0.5, GRID * PIXEL_SIZE)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * PIXEL_SIZE + 0.5)
    ctx.lineTo(GRID * PIXEL_SIZE, i * PIXEL_SIZE + 0.5)
    ctx.stroke()
  }

  // Floating pixels
  if (floatingPixels.value.length) {
    const ox = floatingOffset.value.x
    const oy = floatingOffset.value.y
    ctx.globalAlpha = 0.8
    for (const [x, y, slot] of floatingPixels.value) {
      const color = currentPalette[slot]
      if (color !== undefined) {
        ctx.fillStyle = hexColor(color)
        ctx.fillRect((x + ox) * PIXEL_SIZE, (y + oy) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
      }
    }
    ctx.globalAlpha = 1
    // Floating bounding box
    let minX = GRID
    let minY = GRID
    let maxX = 0
    let maxY = 0
    for (const [x, y] of floatingPixels.value) {
      if (x + ox < minX) {
        minX = x + ox
      }
      if (y + oy < minY) {
        minY = y + oy
      }
      if (x + ox > maxX) {
        maxX = x + ox
      }
      if (y + oy > maxY) {
        maxY = y + oy
      }
    }
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.strokeRect(minX * PIXEL_SIZE, minY * PIXEL_SIZE, (maxX - minX + 1) * PIXEL_SIZE, (maxY - minY + 1) * PIXEL_SIZE)
    ctx.setLineDash([])
  }

  // Selection rect
  if (selection.value) {
    const s = normalizeSelection(selection.value)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.strokeRect(s.x1 * PIXEL_SIZE, s.y1 * PIXEL_SIZE, (s.x2 - s.x1 + 1) * PIXEL_SIZE, (s.y2 - s.y1 + 1) * PIXEL_SIZE)
    ctx.setLineDash([])
  }
}

// --- Mouse ---

function getGridPos(e: MouseEvent): [number, number] | null {
  const canvas = canvasRef.value
  if (!canvas) {
    return null
  }
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = Math.floor((e.clientX - rect.left) * scaleX / PIXEL_SIZE)
  const y = Math.floor((e.clientY - rect.top) * scaleY / PIXEL_SIZE)
  if (x < 0 || x >= GRID || y < 0 || y >= GRID) {
    return null
  }
  return [x, y]
}

function paint(e: MouseEvent) {
  const pos = getGridPos(e)
  if (!pos) {
    return
  }
  const [x, y] = pos
  const key = `${x},${y}`
  const isErase = tool.value === 'erase' || e.buttons === 2

  if (isErase) {
    pixels.delete(key)
  } else {
    pixels.set(key, activeSlot.value)
  }
  draw()
}

function onMouseDown(e: MouseEvent) {
  const pos = getGridPos(e)
  if (!pos) {
    return
  }

  // Dragging floating selection
  if (floatingPixels.value.length) {
    draggingFloating.value = true
    dragStart.value = { x: pos[0] - floatingOffset.value.x, y: pos[1] - floatingOffset.value.y }
    return
  }

  // Selection tool
  if (tool.value === 'select' && e.buttons === 1) {
    selectionStart.value = pos
    selection.value = { x1: pos[0], y1: pos[1], x2: pos[0], y2: pos[1] }
    draw()
    return
  }

  painting.value = true
  paint(e)
}

function onMouseMove(e: MouseEvent) {
  const pos = getGridPos(e)
  cursorPos.value = pos
  if (!pos) {
    return
  }

  // Drag floating
  if (draggingFloating.value) {
    floatingOffset.value = {
      x: pos[0] - dragStart.value.x,
      y: pos[1] - dragStart.value.y,
    }
    draw()
    return
  }

  // Expand selection
  if (selectionStart.value && tool.value === 'select') {
    selection.value = {
      x1: selectionStart.value[0],
      y1: selectionStart.value[1],
      x2: pos[0],
      y2: pos[1],
    }
    draw()
    return
  }

  if (painting.value) {
    paint(e)
  }
}

function onMouseUp() {
  painting.value = false
  draggingFloating.value = false
  selectionStart.value = null
}

function onMouseLeave() {
  onMouseUp()
  cursorPos.value = null
}

// --- Character loading ---

async function onCharacterChange() {
  showNewForm.value = false
  newCodename.value = ''

  if (!selectedCodename.value) {
    return
  }

  // Try loading from DB first
  try {
    const data = await $fetch<{
      id: string
      codename: string
      type: string
      frameSize: number
      slotRoles: string[]
      defaultPalette: number[]
      frames: { name: string, pixels: [number, number, number][] }[]
    }>(`/api/sprite/${selectedCodename.value}`)

    spriteId.value = data.id
    newSpriteType.value = data.type
    currentFrames = {}
    for (const frame of data.frames) {
      currentFrames[frame.name] = frame.pixels
    }
    currentPalette.length = 0
    currentPalette.push(...data.defaultPalette)
    slotRoles.length = 0
    slotRoles.push(...data.slotRoles)
    loadedFromDb.value = true
  } catch {
    // Fallback to static import
    const sprites = await import('@chatgame/sprites')
    const mod = (sprites as Record<string, unknown>)[selectedCodename.value] as Record<string, unknown>
    if (!mod) {
      return
    }

    currentPalette.length = 0
    currentPalette.push(...(mod.DEFAULT_PALETTE as number[]))
    slotRoles.length = 0
    if (mod.SLOT_ROLES) {
      slotRoles.push(...(mod.SLOT_ROLES as string[]))
    }

    currentFrames = {}
    for (const [key, value] of Object.entries(mod)) {
      if (FRAME_NAME_RE.test(key) && Array.isArray(value)) {
        currentFrames[key] = value as [number, number, number][]
      }
    }
    loadedFromDb.value = false
  }

  const names = Object.keys(currentFrames).sort((a, b) => {
    const order = ['IDLE', 'MOVING', 'HEAD']
    const aPrefix = a.replace(FRAME_SUFFIX_RE, '')
    const bPrefix = b.replace(FRAME_SUFFIX_RE, '')
    return order.indexOf(aPrefix) - order.indexOf(bPrefix) || a.localeCompare(b)
  })
  frameNames.value = names
  selectedFrame.value = names[0] ?? ''
  onFrameChange()
  drawThumbnails()
}

let previousFrame = ''

function onFrameChange() {
  // Save edits to previous frame before switching
  if (previousFrame && previousFrame !== selectedFrame.value) {
    syncFrameTo(previousFrame)
  }

  if (!selectedFrame.value || !currentFrames[selectedFrame.value]) {
    return
  }
  previousFrame = selectedFrame.value
  loadPixels(currentFrames[selectedFrame.value]!)
}

async function saveToDb() {
  if (!selectedCodename.value) {
    return
  }

  syncCurrentFrame()
  saving.value = true

  try {
    // Save sprite metadata
    const sprite = await $fetch<{ id: string }>('/api/sprite', {
      method: 'POST',
      body: {
        codename: selectedCodename.value,
        type: newSpriteType.value,
        frameSize: GRID,
        slotRoles: [...slotRoles],
        defaultPalette: [...currentPalette],
      },
    })
    spriteId.value = sprite.id

    // Save each frame
    for (const [name, pixels] of Object.entries(currentFrames)) {
      await $fetch('/api/sprite/frame', {
        method: 'POST',
        body: { spriteId: sprite.id, name, pixels },
      })
    }

    saved.value = true
    loadedFromDb.value = true
    await loadSpriteList()
    setTimeout(() => {
      saved.value = false
    }, 2000)
  } catch (e) {
    console.error('Save failed:', e)
  } finally {
    saving.value = false
  }
}

function pixelsToArray(): [number, number, number][] {
  return Array.from(pixels.entries())
    .map(([key, slot]) => {
      const [x, y] = key.split(',').map(Number)
      return [x, y, slot] as [number, number, number]
    })
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
}

function syncFrameTo(frameName: string) {
  currentFrames[frameName] = pixelsToArray()
}

function syncCurrentFrame() {
  if (selectedFrame.value) {
    syncFrameTo(selectedFrame.value)
  }
}

function loadPixels(data: [number, number, number][]) {
  pixels.clear()
  for (const [x, y, s] of data) {
    pixels.set(`${x},${y}`, s)
  }
  draw()
}

function drawThumbnails() {
  nextTick(() => {
    for (const name of frameNames.value) {
      const canvas = thumbRefs[name]
      const frameData = currentFrames[name]
      if (!canvas || !frameData) {
        continue
      }
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#171717'
      ctx.fillRect(0, 0, GRID, GRID)
      for (const [x, y, slot] of frameData) {
        const color = currentPalette[slot]
        if (color !== undefined) {
          ctx.fillStyle = hexColor(color)
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
  })
}

async function deleteFrame(name: string) {
  // Delete from DB if loaded
  if (spriteId.value && loadedFromDb.value) {
    try {
      await $fetch('/api/sprite/frame-delete', {
        method: 'POST',
        body: { spriteId: spriteId.value, name },
      })
    } catch (e) {
      console.error('Delete failed:', e)
      return
    }
  }

  delete currentFrames[name]
  delete thumbRefs[name]
  frameNames.value = frameNames.value.filter((n) => n !== name)
  if (selectedFrame.value === name) {
    selectedFrame.value = frameNames.value[0] ?? ''
    onFrameChange()
  }
}

function clearCanvas() {
  pixels.clear()
  draw()
}

const editingSlot = ref(-1)
const editingSlotName = ref('')

function renameSlot(idx: number) {
  editingSlot.value = idx
  editingSlotName.value = slotRoles[idx] ?? ''
}

function confirmRenameSlot() {
  if (editingSlot.value >= 0 && editingSlotName.value.trim()) {
    slotRoles[editingSlot.value] = editingSlotName.value.trim()
  }
  editingSlot.value = -1
}

function removeSlot(idx: number) {
  if (currentPalette.length <= 1) {
    return
  }
  currentPalette.splice(idx, 1)
  slotRoles.splice(idx, 1)

  // Remap pixels: remove pixels using this slot, shift higher slots down
  for (const [key, slot] of pixels) {
    if (slot === idx) {
      pixels.delete(key)
    } else if (slot > idx) {
      pixels.set(key, slot - 1)
    }
  }

  // Remap all frames in memory too
  for (const [name, frameData] of Object.entries(currentFrames)) {
    currentFrames[name] = frameData
      .filter(([, , s]) => s !== idx)
      .map(([x, y, s]) => [x, y, s > idx ? s - 1 : s])
  }

  if (activeSlot.value >= currentPalette.length) {
    activeSlot.value = currentPalette.length - 1
  }
  draw()
  drawThumbnails()
}

function addSlot() {
  const idx = currentPalette.length
  currentPalette.push(PALETTE.white)
  slotRoles.push(`color_${idx}`)
  activeSlot.value = idx
  tool.value = 'draw'
}

function assignColorToSlot(color: number) {
  if (activeSlot.value >= 0 && activeSlot.value < currentPalette.length) {
    currentPalette[activeSlot.value] = color
    draw()
  }
}

async function loadSpriteList() {
  try {
    spriteList.value = await $fetch<SpriteListItem[]>('/api/sprite')
  } catch {
    spriteList.value = []
  }
}

const showNewForm = ref(false)
const newCodename = ref('')

function resetAndShowNewForm() {
  // Clear everything before showing form
  selectedCodename.value = ''
  spriteId.value = ''
  currentFrames = {}
  frameNames.value = []
  selectedFrame.value = ''
  loadedFromDb.value = false
  pixels.clear()
  currentPalette.length = 0
  slotRoles.length = 0
  newSpriteType.value = 'character'
  newCodename.value = ''
  showNewForm.value = true
  draw()
}

function createNew() {
  if (!newCodename.value.trim()) {
    return
  }

  // Reset editor state
  spriteId.value = ''
  selectedCodename.value = newCodename.value.trim()
  showNewForm.value = false
  newCodename.value = ''
  currentFrames = { IDLE_1: [] }
  frameNames.value = ['IDLE_1']
  selectedFrame.value = 'IDLE_1'
  loadedFromDb.value = false

  // Default palette
  currentPalette.length = 0
  currentPalette.push(
    PALETTE.darkPurple, PALETTE.violet1, PALETTE.magenta2, PALETTE.brown1,
    PALETTE.violet2, PALETTE.brown2, PALETTE.hotPink, PALETTE.violet3,
    PALETTE.peach, PALETTE.cream, PALETTE.white,
  )
  slotRoles.length = 0
  slotRoles.push('outline', 'color_1', 'color_2', 'color_3', 'color_4', 'color_5', 'color_6', 'color_7', 'color_8', 'color_9', 'highlight')

  pixels.clear()
  draw()
  drawThumbnails()
}

// --- Init ---

const newSpriteType = ref('character')

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection.value) {
    e.preventDefault()
    copySelection()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.value.length) {
    e.preventDefault()
    pasteClipboard()
  }
  if (e.key === 'Escape') {
    if (floatingPixels.value.length) {
      cancelFloating()
    } else if (selection.value) {
      selection.value = null
      draw()
    }
  }
  if (e.key === 'Enter' && floatingPixels.value.length) {
    confirmFloating()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  currentPalette.push(
    PALETTE.darkPurple, PALETTE.violet1, PALETTE.magenta2, PALETTE.brown1,
    PALETTE.violet2, PALETTE.brown2, PALETTE.hotPink, PALETTE.violet3,
    PALETTE.peach, PALETTE.cream, PALETTE.white,
  )
  slotRoles.push('outline', 'cloth_dark', 'detail', 'hair_dark', 'cloth_mid', 'hair_light', 'accent', 'cloth_light', 'skin', 'skin_light', 'highlight')
  draw()
  await loadSpriteList()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
