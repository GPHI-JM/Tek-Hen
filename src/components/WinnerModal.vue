<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close'])

const store = useGameStore()

const winnerLabel = computed(() => {
  const result = store.fightResult
  if (!result) return "It's a draw!"
  return `${result.toUpperCase()} WINS!`
})

const message = computed(() => {
  const result = store.fightResult
  const isWin = result === store.selectedSide
  if (!result) return 'No winner this round.'
  if (isWin) {
    const prize = store.lastPayout || Math.floor(store.betAmount * 1.5)
    return `Congratulations! You won P ${prize.toLocaleString()}`
  }
  return 'Better luck next time!'
})

const isWin = computed(() => store.fightResult === store.selectedSide && store.fightResult !== null)
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header" :class="{ win: isWin, lose: !isWin && store.fightResult }">
          <h2 class="modal-title">{{ winnerLabel }}</h2>
        </div>
        <p class="modal-message">{{ message }}</p>
        <button class="modal-btn" @click="emit('close')">PLAY AGAIN</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: linear-gradient(180deg, #f5e6d3 0%, #e8d4b8 100%);
  border: 6px solid #8b6914;
  border-radius: 16px;
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}

.modal-header.win {
  color: #228b22;
}

.modal-header.lose {
  color: #8b0000;
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.modal-message {
  font-size: 18px;
  color: #5c4033;
  margin: 0 0 24px 0;
  line-height: 1.4;
}

.modal-btn {
  padding: 14px 40px;
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(180deg, #8b6914 0%, #5c4033 100%);
  color: #fff;
  border: 3px solid #5c4033;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
