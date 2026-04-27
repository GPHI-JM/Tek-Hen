<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { createGame, destroyGame, syncFightPicksToRegistry } from '../game'
import { startFightAtmosphere, tryResumeFightAudioSync } from '../game/fightSounds.js'

const emit = defineEmits(['attack', 'fightEnd'])
const store = useGameStore()

const gameContainer = ref(null)

let gameInstance = null

function handleEmit(event, data) {
  emit(event, data)
}

function onGameAudioUnlock() {
  tryResumeFightAudioSync()
  void startFightAtmosphere()
}

watch(
  () => [store.selectedRoosterVariantId, store.selectedSide],
  () => {
    syncFightPicksToRegistry(store.selectedRoosterVariantId, store.selectedSide)
  }
)

onMounted(() => {
  if (gameContainer.value) {
    window.__shabongEmit = handleEmit
    requestAnimationFrame(() => {
      gameInstance = createGame(handleEmit)
      syncFightPicksToRegistry(store.selectedRoosterVariantId, store.selectedSide)
    })
  }
})

onBeforeUnmount(() => {
  delete window.__shabongEmit
  destroyGame()
  gameInstance = null
})
</script>

<template>
  <div
    id="game-container"
    ref="gameContainer"
    class="game-canvas"
    @pointerdown="onGameAudioUnlock"
  />
</template>

<style scoped>
.game-canvas {
  width: 100%;
  height: 100%;
  max-width: none;
  min-width: 0;
  min-height: 0;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: #d4b896;
}

.game-canvas canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
