<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { createGame, destroyGame, syncFightPicksToRegistry } from '../game'
import {
  startFightAtmosphere,
  tryResumeFightAudioSync,
  warmFightAudioBuffer,
} from '../game/fightSounds.js'
import {
  primeFacebookLoadingProgress,
  syncFacebookContextToRegistry,
} from '../platform/facebookInstant.js'

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
    primeFacebookLoadingProgress(5)
    void warmFightAudioBuffer()

    requestAnimationFrame(() => {
      gameInstance = createGame(handleEmit)
      syncFightPicksToRegistry(store.selectedRoosterVariantId, store.selectedSide)
      syncFacebookContextToRegistry(gameInstance)
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
    @touchstart.passive="onGameAudioUnlock"
    @click="onGameAudioUnlock"
  />
</template>

<style scoped>
.game-canvas {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 180px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 4px;
  background: #d4b896;
  touch-action: manipulation;
  contain: layout paint size;
}

.game-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
