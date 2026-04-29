import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const MERON = 'meron'
export const WALA = 'wala'

export const PAYOUT_MULTIPLIER = 1.5

export const FREE_TOP_UP_AMOUNT = 250_000

export const useGameStore = defineStore('game', () => {
  const balance = ref(250000)
  const freeTopUpClaimed = ref(false)
  const highestBalanceReached = ref(250000)
  const pointsForVerification = ref(250000)
  const betAmount = ref(10000)
  /** Your breed for the side you bet (MERON or WALA); the other side is a random other breed. */
  const selectedRoosterVariantId = ref('sweater')
  const selectedSide = ref(null)
  const betPlaced = ref(false)
  const fightInProgress = ref(false)
  const fightResult = ref(null)
  const lastPayout = ref(0)

  const canUseFreeTopUp = computed(() => !freeTopUpClaimed.value)
  const verificationPoints = computed(() => {
    return balance.value === 0 ? pointsForVerification.value : highestBalanceReached.value
  })

  const canPlaceBet = computed(() => !betPlaced.value && !fightInProgress.value)
  const formattedBalance = computed(() => `P ${balance.value.toLocaleString()}`)
  const formattedBet = computed(() => betAmount.value.toLocaleString())

  function setBalance(nextBalance) {
    const previousBalance = balance.value
    balance.value = nextBalance

    if (nextBalance > 0) {
      if (previousBalance === 0) {
        highestBalanceReached.value = nextBalance
      } else if (nextBalance > highestBalanceReached.value) {
        highestBalanceReached.value = nextBalance
      }
      return
    }

    if (nextBalance === 0) {
      pointsForVerification.value = highestBalanceReached.value
    }
  }

  function placeBet() {
    if (!canPlaceBet.value || betAmount.value > balance.value) return
    setBalance(balance.value - betAmount.value)
    betPlaced.value = true
  }

  function setBetAmount(amount) {
    const num = typeof amount === 'number' ? amount : parseInt(String(amount || 0), 10)
    betAmount.value = Math.max(0, Math.min(isNaN(num) ? 0 : num, balance.value))
  }

  function setSelectedSide(side) {
    selectedSide.value = side
  }

  function setSelectedRoosterVariantId(variantId) {
    selectedRoosterVariantId.value = variantId
  }

  function startFight() {
    fightInProgress.value = true
    fightResult.value = null
  }

  function endFight(winner, oddsMultiplier = PAYOUT_MULTIPLIER) {
    fightInProgress.value = false
    fightResult.value = winner

    if (betPlaced.value && winner === selectedSide.value) {
      const payout = Math.floor(betAmount.value * oddsMultiplier)
      lastPayout.value = payout
      setBalance(balance.value + payout)
    } else {
      lastPayout.value = 0
    }

    betPlaced.value = false
  }

  function resetBet() {
    if (fightInProgress.value) return
    if (betPlaced.value) {
      setBalance(balance.value + betAmount.value)
    }
    betPlaced.value = false
    betAmount.value = 10000
  }

  function resetForNewRound() {
    betPlaced.value = false
    fightResult.value = null
    betAmount.value = 10000
    selectedSide.value = null
  }

  function creditFreeTopUp(amount = FREE_TOP_UP_AMOUNT) {
    if (freeTopUpClaimed.value) {
      return false
    }
    setBalance(balance.value + amount)
    freeTopUpClaimed.value = true
    return true
  }

  return {
    balance,
    freeTopUpClaimed,
    canUseFreeTopUp,
    highestBalanceReached,
    pointsForVerification,
    verificationPoints,
    betAmount,
    selectedRoosterVariantId,
    selectedSide,
    betPlaced,
    fightInProgress,
    fightResult,
    lastPayout,
    canPlaceBet,
    formattedBalance,
    formattedBet,
    placeBet,
    setBetAmount,
    setSelectedSide,
    setSelectedRoosterVariantId,
    startFight,
    endFight,
    resetBet,
    resetForNewRound,
    creditFreeTopUp,
  }
})
