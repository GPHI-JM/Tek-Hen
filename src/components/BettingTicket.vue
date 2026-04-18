<script setup>
import { ref, computed } from 'vue'
import { useGameStore, MERON, WALA } from '../stores/gameStore'

const store = useGameStore()

const betOptions = [1000, 5000, 10000, 25000, 50000, 100000]
const isSubmitting = ref(false)

const canBetThisRound = computed(() => store.canPlaceBet)

const canConfirm = computed(() => {
  const base = store.betAmount <= store.balance && store.betAmount > 0
  const hasSide = store.selectedSide === MERON || store.selectedSide === WALA
  return base && hasSide && canBetThisRound.value && !isSubmitting.value
})

function bringItIn() {
  store.setBetAmount(store.balance)
  if (canConfirm.value) {
    confirmBet()
  }
}

function onBetAmountInput(event) {
  const raw = event.target.value.replace(/\D/g, '')
  const amount = raw ? parseInt(raw, 10) : 0
  store.setBetAmount(amount)
}

function onBetInputEnter(event) {
  event.preventDefault()
  if (canConfirm.value) confirmBet()
}

function selectSide(side) {
  if (!canBetThisRound.value) return
  store.setSelectedSide(side)
}

function confirmBet() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    store.placeBet()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="betting-ticket">
    <div class="ticket-hero">
      <button
        type="button"
        class="side-btn side-btn--meron"
        :class="{ 'side-btn--active': store.selectedSide === MERON }"
        :disabled="!canBetThisRound"
        @click="selectSide(MERON)"
      >
        MERON
      </button>
      <div class="vs-badge">VS</div>
      <button
        type="button"
        class="side-btn side-btn--wala"
        :class="{ 'side-btn--active': store.selectedSide === WALA }"
        :disabled="!canBetThisRound"
        @click="selectSide(WALA)"
      >
        WALA
      </button>
    </div>

    <div class="bet-amount-row">
      <input
        type="text"
        inputmode="numeric"
        class="bet-amount-input"
        :value="store.betAmount || ''"
        :disabled="!canBetThisRound"
        placeholder="0"
        @input="onBetAmountInput"
        @keydown.enter="onBetInputEnter"
      />
    </div>

    <div class="quick-bets">
      <button
        v-for="amount in betOptions"
        :key="amount"
        type="button"
        class="quick-bet-btn"
        :class="{ active: store.betAmount === amount }"
        :disabled="!canBetThisRound || amount > store.balance"
        @click="store.setBetAmount(amount)"
      >
        {{ (amount / 1000).toFixed(0) }}K
      </button>
    </div>

    <div class="ticket-actions">
      <button
        type="button"
        class="action-btn action-btn--lucky"
        :disabled="!canBetThisRound || store.balance <= 0"
        @click="bringItIn"
      >
        FEELING LUCKY
      </button>
      <button
        type="button"
        class="action-btn action-btn--confirm"
        :disabled="!canConfirm"
        @click="confirmBet"
      >
        CONFIRM
      </button>
    </div>

    <button
      type="button"
      class="reset-link"
      :disabled="store.fightInProgress"
      @click="store.resetBet"
    >
      Reset bet
    </button>
  </div>
</template>

<style scoped>
.betting-ticket {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
}

.ticket-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.side-btn {
  flex: 1;
  min-height: 52px;
  padding: 12px 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.side-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.side-btn--meron {
  color: #fff;
  background: linear-gradient(165deg, #e74c3c 0%, #a93226 45%, #6e1e18 100%);
  box-shadow:
    0 4px 0 #4a1410,
    0 6px 16px rgba(180, 40, 30, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.side-btn--meron.side-btn--active {
  filter: brightness(1.12);
  box-shadow:
    0 4px 0 #4a1410,
    0 0 24px rgba(255, 100, 80, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.side-btn--wala {
  color: #fff;
  background: linear-gradient(165deg, #3498db 0%, #1f6dad 45%, #154a75 100%);
  box-shadow:
    0 4px 0 #0f3555,
    0 6px 16px rgba(40, 120, 200, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.side-btn--wala.side-btn--active {
  filter: brightness(1.12);
  box-shadow:
    0 4px 0 #0f3555,
    0 0 24px rgba(80, 180, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.side-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.side-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.vs-badge {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 900;
  color: #d4a017;
  background: radial-gradient(circle at 40% 35%, #3a3834 0%, #1a1816 100%);
  border: 2px solid rgba(212, 160, 23, 0.5);
  border-radius: 50%;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 12px rgba(212, 160, 23, 0.25);
}

.bet-amount-row {
  width: 100%;
}

.bet-amount-input {
  width: 100%;
  font-family: 'Orbitron', sans-serif;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: #f5f0e8;
  padding: 12px 14px;
  border: 1px solid rgba(212, 160, 23, 0.4);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.5);
}

.bet-amount-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.bet-amount-input:focus {
  outline: none;
  border-color: rgba(212, 160, 23, 0.75);
  box-shadow:
    inset 0 3px 10px rgba(0, 0, 0, 0.5),
    0 0 14px rgba(212, 160, 23, 0.25);
}

.quick-bets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.quick-bet-btn {
  padding: 7px 11px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #e8e4dc;
  background: linear-gradient(180deg, #4a453c 0%, #2a2824 100%);
  border: 1px solid rgba(212, 160, 23, 0.35);
  border-radius: 6px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 2px 4px rgba(0, 0, 0, 0.35);
  transition: all 0.15s ease;
}

.quick-bet-btn:hover:not(:disabled) {
  border-color: rgba(212, 160, 23, 0.6);
  color: #fff;
}

.quick-bet-btn.active {
  background: linear-gradient(180deg, #6a5530 0%, #4a3a1a 100%);
  border-color: #d4a017;
  box-shadow: 0 0 12px rgba(212, 160, 23, 0.35);
}

.quick-bet-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ticket-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  padding: 12px 20px;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    filter 0.15s ease;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.action-btn--lucky {
  color: #2a2210;
  background: linear-gradient(165deg, #f7e08a 0%, #d4a017 40%, #9a7208 100%);
  box-shadow:
    0 3px 0 #5c4506,
    0 6px 16px rgba(212, 160, 23, 0.35);
}

.action-btn--lucky:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.action-btn--confirm {
  color: #fff;
  background: linear-gradient(165deg, #27ae60 0%, #1a7a42 45%, #0d4d28 100%);
  box-shadow:
    0 4px 0 #063a1f,
    0 8px 22px rgba(30, 160, 80, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
}

.action-btn--confirm:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.action-btn:active:not(:disabled) {
  transform: translateY(2px);
}

.reset-link {
  align-self: center;
  margin-top: 4px;
  padding: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #8a8580;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.reset-link:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
