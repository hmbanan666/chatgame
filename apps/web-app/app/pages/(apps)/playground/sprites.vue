<template>
  <div class="min-h-dvh bg-neutral-950 p-8">
    <h1 class="text-2xl font-bold text-white mb-6">
      Sprite Playground
    </h1>

    <!-- Variations -->
    <section v-if="variations" class="mb-12">
      <h2 class="text-lg font-semibold text-neutral-300 mb-4">
        {{ variations.biome }} Variations ({{ variations.count }})
      </h2>

      <div
        v-for="variation in variations.variations"
        :key="variation.id"
        class="mb-6"
      >
        <div class="flex items-center gap-3 mb-2">
          <button
            class="px-2 py-0.5 rounded text-xs font-mono transition-colors"
            :class="picked.has(variation.id)
              ? 'bg-green-800 text-green-200'
              : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'"
            @click="togglePick(variation.id)"
          >
            {{ picked.has(variation.id) ? 'PICKED' : 'pick' }}
          </button>
          <span class="text-sm font-mono text-neutral-400">{{ variation.id }}</span>
          <span class="text-xs text-neutral-600">[{{ variation.leafSlots.join(', ') }}]</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="file in variation.files"
            :key="file"
            class="bg-neutral-900 border border-neutral-800 rounded-lg p-2"
            :class="{ 'border-green-700': picked.has(variation.id) }"
          >
            <img
              :src="`/static/trees/variations/${file}`"
              :alt="file"
              class="image-rendering-pixelated"
              style="width: 128px; height: 128px"
            >
          </div>
        </div>
      </div>

      <!-- Export picked -->
      <div v-if="picked.size > 0" class="mt-8 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
        <h3 class="text-sm font-semibold text-neutral-300 mb-2">
          Picked ({{ picked.size }})
        </h3>
        <pre class="text-xs text-green-400 font-mono whitespace-pre-wrap">{{ pickedExport }}</pre>
      </div>
    </section>

    <!-- Biome Trees -->
    <section v-if="manifest" class="mb-12">
      <h2 class="text-lg font-semibold text-neutral-300 mb-4">
        Biome Trees ({{ manifest.trees.length }} sprites, {{ manifest.scale }}x)
      </h2>

      <div
        v-for="biome in manifest.biomes"
        :key="biome"
        class="mb-8"
      >
        <h3 class="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
          {{ biome }}
        </h3>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="item in treesBy(biome)"
            :key="item.file"
            class="flex flex-col items-center gap-2"
          >
            <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
              <img
                :src="`/static/trees/${item.file}`"
                :alt="item.file"
                class="image-rendering-pixelated"
                :style="{ width: `${item.width}px`, height: `${item.height}px` }"
              >
            </div>
            <span class="text-xs text-neutral-600">{{ item.file }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Units -->
    <section v-if="unitCodenames.length" class="mb-12">
      <h2 class="text-lg font-semibold text-neutral-300 mb-4">
        Units ({{ unitCodenames.length }})
      </h2>
      <div class="flex flex-wrap gap-4">
        <div
          v-for="codename in unitCodenames"
          :key="codename"
          class="flex flex-col items-center gap-2"
        >
          <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
            <img
              :src="`/static/units/${codename}/128.png`"
              :alt="codename"
              class="image-rendering-pixelated"
              style="width: 128px; height: 128px"
            >
          </div>
          <span class="text-xs text-neutral-600">{{ codename }}</span>
        </div>
      </div>
    </section>

    <p v-if="!manifest && !variations" class="text-neutral-600">
      No data. Run: <code class="text-neutral-400">node packages/sprites/scripts/generate-trees.mjs</code>
    </p>
  </div>
</template>

<script setup lang="ts">
interface TreeEntry {
  file: string
  tree: number
  biome: string
  width: number
  height: number
  bytes: number
}

interface TreeManifest {
  scale: number
  frameSize: number
  biomes: string[]
  trees: TreeEntry[]
  generated: string
}

interface Variation {
  id: string
  leafSlots: string[]
  files: string[]
}

interface VariationsManifest {
  biome: string
  count: number
  scale: number
  frameSize: number
  variations: Variation[]
  generated: string
}

const manifest = ref<TreeManifest | null>(null)
const variations = ref<VariationsManifest | null>(null)
const picked = reactive(new Set<string>())

const unitCodenames = [
  'banana', 'burger', 'catchy', 'claw', 'gentleman',
  'marshmallow', 'pioneer', 'pup', 'santa', 'shape',
  'sharky', 'telegramo', 'twitchy', 'woody', 'wooly',
]

onMounted(async () => {
  const [treeData, varData] = await Promise.allSettled([
    $fetch<TreeManifest>('/static/trees/manifest.json'),
    $fetch<VariationsManifest>('/static/trees/variations/manifest.json'),
  ])
  if (treeData.status === 'fulfilled') {
    manifest.value = treeData.value
  }
  if (varData.status === 'fulfilled') {
    variations.value = varData.value
  }
})

function treesBy(biome: string) {
  return manifest.value?.trees.filter((t) => t.biome === biome) ?? []
}

function togglePick(id: string) {
  if (picked.has(id)) {
    picked.delete(id)
  } else {
    picked.add(id)
  }
}

const pickedExport = computed(() => {
  if (!variations.value) {
    return ''
  }
  const lines = variations.value.variations
    .filter((v) => picked.has(v.id))
    .map((v) => `  // ${v.id}\n  [${v.leafSlots.map((s) => `'${s}'`).join(', ')}],`)
  return `GREEN_VARIANTS: [\n${lines.join('\n')}\n]`
})
</script>

<style scoped>
.image-rendering-pixelated {
  image-rendering: pixelated;
}
</style>
