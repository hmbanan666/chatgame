const visibleBlock = ref<'game' | 'shop' | 'profile' | 'characters' | null>(null)

function onElementVisibility(block: 'game' | 'shop' | 'profile' | 'characters') {
  visibleBlock.value = block
}

export function useNavigation() {
  return { onElementVisibility, visibleBlock }
}
