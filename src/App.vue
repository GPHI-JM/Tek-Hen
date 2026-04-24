<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue'
import { useGameStore, FREE_TOP_UP_AMOUNT, PAYOUT_MULTIPLIER } from './stores/gameStore'
import GameCanvas from './components/GameCanvas.vue'
import GameTimer from './components/GameTimer.vue'
import BettingTicket from './components/BettingTicket.vue'
import RoosterSelect from './components/RoosterSelect.vue'
import WinnerModal from './components/WinnerModal.vue'
import PhoneVerifyModal from './components/PhoneVerifyModal.vue'
import { installFightAudioResumeOnFirstGesture } from './game/fightSounds.js'

const store = useGameStore()
const showFight = ref(false)
const showWinnerModal = ref(false)
const showPhoneVerifyModal = ref(false)
const showScreenBlood = ref(false)
let screenBloodTimerId = null

function handleAttack(data) {
  if (!data?.isCritical) return
  if (screenBloodTimerId !== null) {
    clearTimeout(screenBloodTimerId)
  }
  showScreenBlood.value = true
  screenBloodTimerId = window.setTimeout(() => {
    showScreenBlood.value = false
    screenBloodTimerId = null
  }, 600)
}

const meronSsBolts = reactive({
  b0: false,
  b1: false,
  b2: false,
  b3: false,
})
let meronSsBoltTimerIds = []

function clearMeronSsBoltSchedulers() {
  meronSsBoltTimerIds.forEach((timerId) => clearTimeout(timerId))
  meronSsBoltTimerIds = []
  meronSsBolts.b0 = false
  meronSsBolts.b1 = false
  meronSsBolts.b2 = false
  meronSsBolts.b3 = false
}

function scheduleMeronSsBoltFlash(boltIndex) {
  if (typeof window === 'undefined') {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  const boltKeys = ['b0', 'b1', 'b2', 'b3']
  const boltKey = boltKeys[boltIndex]
  const delayBeforeFlashMs = Math.random() * 3200 + 900
  const flashDurationMs = 180 + Math.random() * 520
  const scheduleId = window.setTimeout(() => {
    meronSsBolts[boltKey] = true
    const hideId = window.setTimeout(() => {
      meronSsBolts[boltKey] = false
      scheduleMeronSsBoltFlash(boltIndex)
    }, flashDurationMs)
    meronSsBoltTimerIds.push(hideId)
  }, delayBeforeFlashMs)
  meronSsBoltTimerIds.push(scheduleId)
}

function startMeronSsBoltLoop() {
  clearMeronSsBoltSchedulers()
  if (typeof window === 'undefined') {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  for (let boltIndex = 0; boltIndex < 4; boltIndex += 1) {
    scheduleMeronSsBoltFlash(boltIndex)
  }
}

const walaSsBolts = reactive({
  b0: false,
  b1: false,
  b2: false,
  b3: false,
})
let walaSsBoltTimerIds = []

function clearWalaSsBoltSchedulers() {
  walaSsBoltTimerIds.forEach((timerId) => clearTimeout(timerId))
  walaSsBoltTimerIds = []
  walaSsBolts.b0 = false
  walaSsBolts.b1 = false
  walaSsBolts.b2 = false
  walaSsBolts.b3 = false
}

function scheduleWalaSsBoltFlash(boltIndex) {
  if (typeof window === 'undefined') {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  const boltKeys = ['b0', 'b1', 'b2', 'b3']
  const boltKey = boltKeys[boltIndex]
  const delayBeforeFlashMs = Math.random() * 3200 + 900
  const flashDurationMs = 180 + Math.random() * 520
  const scheduleId = window.setTimeout(() => {
    walaSsBolts[boltKey] = true
    const hideId = window.setTimeout(() => {
      walaSsBolts[boltKey] = false
      scheduleWalaSsBoltFlash(boltIndex)
    }, flashDurationMs)
    walaSsBoltTimerIds.push(hideId)
  }, delayBeforeFlashMs)
  walaSsBoltTimerIds.push(scheduleId)
}

function startWalaSsBoltLoop() {
  clearWalaSsBoltSchedulers()
  if (typeof window === 'undefined') {
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  for (let boltIndex = 0; boltIndex < 4; boltIndex += 1) {
    scheduleWalaSsBoltFlash(boltIndex)
  }
}

const freeTopUpTeaser = computed(
  () => `+ P ${FREE_TOP_UP_AMOUNT.toLocaleString()}`
)

const moreGames = [
  {
    name: 'Basketball',
    url: 'https://fb.gg/play/1431508008453701',
    image: '/more-games/basketball.png',
    alt: 'Basketball game',
    blendDark: false,
  },
  {
    name: 'Magic Hammer',
    url: 'https://fb.gg/play/4166337263499439',
    image: '/more-games/magic-hammer.png',
    alt: 'Magic hammer game',
    blendDark: false,
  },
  {
    name: 'Bingo Fiesta',
    url: 'https://fb.gg/play/1463506198613599',
    image: '/more-games/bingo-fiesta.png',
    alt: 'Bingo Fiesta game',
    blendDark: true,
  },
]

onMounted(() => {
  installFightAudioResumeOnFirstGesture()
})

watch(
  showFight,
  (isFightView) => {
    clearWalaSsBoltSchedulers()
    clearMeronSsBoltSchedulers()
    if (!isFightView) {
      startWalaSsBoltLoop()
      startMeronSsBoltLoop()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  clearWalaSsBoltSchedulers()
  clearMeronSsBoltSchedulers()
})

watch(
  () => store.fightInProgress,
  (inProgress) => {
    if (inProgress) {
      showWinnerModal.value = false
      showFight.value = true
    }
  }
)

watch(
  () => store.fightResult,
  (result) => {
    if (result !== null) {
      showFight.value = false
    }
  }
)

watch(
  () => store.betPlaced,
  (placed) => {
    if (placed && !store.fightInProgress) {
      startFight()
    }
  }
)

function handleFightEnd({ winner }) {
  store.endFight(winner)
  showFight.value = false
  showWinnerModal.value = true
}

function startFight() {
  if (!store.betPlaced) return
  store.startFight()
}

function closeWinnerModal() {
  store.resetForNewRound()
  showWinnerModal.value = false
}

function openPhoneVerifyModal(event) {
  event?.stopPropagation?.()
  if (!store.canUseFreeTopUp) {
    return
  }
  showPhoneVerifyModal.value = true
}
</script>

<template>
  <div class="app">
    <div class="cabinet-frame">
      <header class="header">
        <div class="header-left" />
        <img src="/logo.png" alt="TEK-HEN" class="logo" />
        <div class="wallet-section">
          <div class="wallet-btn-wrap">
            <span v-if="store.canUseFreeTopUp" class="wallet-btn-hot" aria-hidden="true">HOT</span>
            <button
              type="button"
              class="wallet-btn"
              :class="{ 'wallet-btn--claimed': store.freeTopUpClaimed }"
              :disabled="store.freeTopUpClaimed"
              @click.stop="openPhoneVerifyModal"
            >
              <svg class="wallet-sparkle" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2zm7 9l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4zM5 13l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1z"
                />
              </svg>
              <span class="wallet-btn-copy">
                <span class="wallet-btn-title">{{
                  store.freeTopUpClaimed ? 'TOP UP USED' : 'FREE TOP UP'
                }}</span>
                <span class="wallet-btn-sub">{{
                  store.freeTopUpClaimed ? 'One-time offer claimed' : freeTopUpTeaser
                }}</span>
              </span>
            </button>
          </div>
          <div class="balance-plate">
            <span class="balance-label">BALANCE</span>
            <span class="balance-value">{{ store.formattedBalance }}</span>
          </div>
        </div>
      </header>

      <main class="arena-layout">
        <div class="arena-section" :class="{ 'arena-section--fight': showFight }">
          <Transition name="fade" mode="out-in">
            <div v-if="showFight" key="fight" class="fight-wrapper fight-wrapper--tv">
              <div class="vintage-tv" aria-label="Fight view">
                <div class="vintage-tv__bezel">
                  <div class="vintage-tv__screen">
                    <div
                      class="screen-blood-overlay"
                      :class="{ 'screen-blood-overlay--active': showScreenBlood }"
                      aria-hidden="true"
                    />
                    <GameCanvas
                      @fight-end="handleFightEnd"
                      @attack="handleAttack"
                    />
                  </div>
                </div>
                <div class="vintage-tv__controls">
                  <div class="vintage-tv__speaker-grille" aria-hidden="true" />
                  <div class="vintage-tv__controls-spacer" aria-hidden="true" />
                  <div class="vintage-tv__knobs" aria-hidden="true">
                    <span class="vintage-tv__knob" />
                    <span class="vintage-tv__knob" />
                    <span class="vintage-tv__knob vintage-tv__knob--small" />
                  </div>
                </div>
              </div>
            </div>
            <div v-else key="lobby" class="lobby-wrapper">
              <div class="lobby-content">
                <div class="rooster-preview rooster-preview--meron">
                  <div class="lobby-rooster-anim lobby-rooster-anim--meron">
                    <div class="lobby-rooster-anim__heat" aria-hidden="true" />
                    <div class="lobby-rooster-anim__atmosphere" aria-hidden="true">
                      <span class="lobby-rooster-anim__smoke lobby-rooster-anim__smoke--a" />
                      <span class="lobby-rooster-anim__smoke lobby-rooster-anim__smoke--b" />
                      <span class="lobby-rooster-anim__smoke lobby-rooster-anim__smoke--c" />
                      <span class="lobby-rooster-anim__wind lobby-rooster-anim__wind--a" />
                      <span class="lobby-rooster-anim__wind lobby-rooster-anim__wind--b" />
                    </div>
                    <div class="rooster-img-shell rooster-img-shell--meron-ss">
                      <img src="/meron.png" alt="MERON rooster" class="rooster-placeholder" />
                      <div class="lobby-rooster-anim__ss-sparks" aria-hidden="true">
                        <svg
                          class="lobby-rooster-anim__ss-sparks-svg"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': meronSsBolts.b0 }"
                            d="M52 8 L46 22 L54 26 L44 44 L50 48 L40 68 L48 72 L42 88"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt lobby-rooster-anim__ss-bolt--thin"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': meronSsBolts.b1 }"
                            d="M38 32 L32 48 L36 52 L28 66"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt lobby-rooster-anim__ss-bolt--thin"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': meronSsBolts.b2 }"
                            d="M68 38 L74 52 L70 58 L76 74"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': meronSsBolts.b3 }"
                            d="M58 52 L52 62 L56 66 L50 82"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div class="lobby-side-label lobby-side-label--meron">
                    <div class="lobby-side-label__outer">
                      <div class="lobby-side-label__inner">
                        <span class="lobby-side-label__text">MERON</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="lobby-content__timer">
                  <GameTimer />
                </div>
                <div class="rooster-preview rooster-preview--wala">
                  <div class="lobby-rooster-anim lobby-rooster-anim--wala">
                    <div class="lobby-rooster-anim__heat" aria-hidden="true" />
                    <div class="lobby-rooster-anim__atmosphere" aria-hidden="true">
                      <span class="lobby-rooster-anim__smoke lobby-rooster-anim__smoke--a" />
                      <span class="lobby-rooster-anim__smoke lobby-rooster-anim__smoke--b" />
                      <span class="lobby-rooster-anim__smoke lobby-rooster-anim__smoke--c" />
                      <span class="lobby-rooster-anim__wind lobby-rooster-anim__wind--a" />
                      <span class="lobby-rooster-anim__wind lobby-rooster-anim__wind--b" />
                    </div>
                    <div class="rooster-img-shell rooster-img-shell--wala-ss">
                      <img src="/wala.png" alt="WALA rooster" class="rooster-placeholder" />
                      <div class="lobby-rooster-anim__ss-sparks" aria-hidden="true">
                        <svg
                          class="lobby-rooster-anim__ss-sparks-svg"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': walaSsBolts.b0 }"
                            d="M52 8 L46 22 L54 26 L44 44 L50 48 L40 68 L48 72 L42 88"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt lobby-rooster-anim__ss-bolt--thin"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': walaSsBolts.b1 }"
                            d="M38 32 L32 48 L36 52 L28 66"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt lobby-rooster-anim__ss-bolt--thin"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': walaSsBolts.b2 }"
                            d="M68 38 L74 52 L70 58 L76 74"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            pathLength="100"
                            class="lobby-rooster-anim__ss-bolt"
                            :class="{ 'lobby-rooster-anim__ss-bolt--visible': walaSsBolts.b3 }"
                            d="M58 52 L52 62 L56 66 L50 82"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div class="lobby-side-label lobby-side-label--wala">
                    <div class="lobby-side-label__outer">
                      <div class="lobby-side-label__inner">
                        <span class="lobby-side-label__text">WALA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </main>

      <footer class="footer cabinet-footer">
        <div class="footer-left-stack">
          <div class="footer-panel more-games-panel cabinet-panel">
            <div class="cabinet-panel__title">MORE GAMES</div>
            <div class="more-games-grid" role="list">
              <div class="more-games-row">
                <a
                  v-for="game in moreGames"
                  :key="game.name"
                  class="more-games-slot more-games-slot--glow more-games-slot--link"
                  role="listitem"
                  :href="game.url"
                  :aria-label="`Open ${game.name}`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    :src="game.image"
                    :alt="game.alt"
                    class="more-games-icon"
                    :class="{ 'more-games-icon--blend-dark': game.blendDark }"
                    width="56"
                    height="56"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </div>
            </div>
          </div>
          <div class="footer-panel odds-panel odds-panel--under-more-games cabinet-panel">
            <div class="cabinet-panel__title">ODDS</div>
            <div class="odds-pair">
              <div class="odds-row odds-row--meron">
                MERON x{{ PAYOUT_MULTIPLIER }}
              </div>
              <div class="odds-row odds-row--wala">
                WALA x{{ PAYOUT_MULTIPLIER }}
              </div>
            </div>
          </div>
        </div>
        <div class="footer-roosters-stack">
          <RoosterSelect />
        </div>
        <div class="footer-panel betting-ticket-wrapper cabinet-panel">
          <BettingTicket />
        </div>
      </footer>
    </div>

    <WinnerModal :show="showWinnerModal" @close="closeWinnerModal" />
    <PhoneVerifyModal :show="showPhoneVerifyModal" @close="showPhoneVerifyModal = false" />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body,
.cabinet-body {
  margin: 0;
  font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif;
  background-color: #0f0e0d;
  background-image:
    radial-gradient(
      ellipse 120% 80% at 50% 0%,
      rgba(42, 36, 32, 0.72) 0%,
      rgba(15, 14, 13, 0.88) 45%,
      rgba(8, 7, 6, 0.92) 100%
    ),
    url('https://images.stockcake.com/public/8/f/1/8f1e6b68-a241-48c6-a794-2521c815864d_large/farmhouse-rooster-wallpaper-stockcake.jpg');
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
  color: #e8e4dc;
}

@media (max-width: 900px) {
  body,
  .cabinet-body {
    background-attachment: scroll;
  }
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.cabinet-frame {
  --cabinet-amber: #d4a017;
  --cabinet-amber-glow: rgba(255, 180, 40, 0.45);
  max-width: 1120px;
  width: 100%;
  background: linear-gradient(
    165deg,
    #3d3834 0%,
    #252220 18%,
    #1a1816 50%,
    #121110 82%,
    #0d0c0b 100%
  );
  border-radius: 20px;
  border: 2px solid #1a1512;
  box-shadow:
    0 0 0 1px rgba(255, 200, 80, 0.12),
    0 0 0 3px #0a0908,
    0 0 24px var(--cabinet-amber-glow),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -20px 50px rgba(0, 0, 0, 0.45),
    0 20px 50px rgba(0, 0, 0, 0.65);
  padding: 22px 24px 28px;
  position: relative;
}

.cabinet-frame::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border-radius: 14px;
  pointer-events: none;
  border: 1px solid rgba(212, 160, 23, 0.25);
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.35);
}

.cabinet-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  pointer-events: none;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 3px,
    rgba(255, 255, 255, 0.012) 3px,
    rgba(255, 255, 255, 0.012) 4px
  );
  opacity: 0.5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding: 10px 14px;
  position: relative;
  background: linear-gradient(180deg, #34302c 0%, #1c1a18 55%, #100f0e 100%);
  border-radius: 12px;
  border: 1px solid rgba(212, 160, 23, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 8px rgba(0, 0, 0, 0.35),
    0 0 22px rgba(212, 160, 23, 0.14);
}

.header-left {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.wallet-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
}

.wallet-btn-wrap {
  position: relative;
  display: inline-block;
}

.wallet-btn-hot {
  position: absolute;
  top: -6px;
  right: -4px;
  z-index: 2;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #fff;
  background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
  border: 1px solid #fadbd8;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(192, 57, 43, 0.55);
  pointer-events: none;
}

.logo {
  height: 120px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
  animation: logo-glow-pulse 3s ease-in-out infinite;
}

@keyframes logo-glow-pulse {
  0%   {
    opacity: 0.82;
    filter:
      drop-shadow(0 0 6px rgba(255, 200, 60, 0.5))
      drop-shadow(0 0 18px rgba(255, 160, 20, 0.3));
  }
  45%  {
    opacity: 1;
    filter:
      drop-shadow(0 0 12px rgba(255, 220, 80, 0.95))
      drop-shadow(0 0 30px rgba(255, 170, 30, 0.65))
      drop-shadow(0 0 55px rgba(255, 120, 0, 0.35));
  }
  100% {
    opacity: 0.82;
    filter:
      drop-shadow(0 0 6px rgba(255, 200, 60, 0.5))
      drop-shadow(0 0 18px rgba(255, 160, 20, 0.3));
  }
}

.wallet-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 10px 14px;
  font-family: inherit;
  background: linear-gradient(165deg, #fff8dc 0%, #f4d03f 35%, #d4ac0d 70%, #9a7d0a 100%);
  color: #2c1810;
  border: 2px solid #f9e79f;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(212, 172, 13, 0.5),
    0 4px 14px rgba(0, 0, 0, 0.35),
    0 0 22px rgba(255, 215, 0, 0.35);
  animation: wallet-btn-glow 2.4s ease-in-out infinite;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.wallet-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 40%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  animation: wallet-btn-shine 3.5s ease-in-out infinite;
  pointer-events: none;
}

.wallet-btn:hover {
  transform: translateY(-2px) scale(1.02);
  filter: brightness(1.06) saturate(1.08);
  box-shadow:
    0 0 0 2px rgba(255, 236, 140, 0.85),
    0 8px 22px rgba(0, 0, 0, 0.4),
    0 0 32px rgba(255, 200, 60, 0.55);
}

.wallet-btn:active {
  transform: translateY(0) scale(0.99);
}

.wallet-btn--claimed,
.wallet-btn.wallet-btn--claimed:hover,
.wallet-btn.wallet-btn--claimed:active {
  animation: none;
  transform: none;
  filter: none;
  cursor: not-allowed;
  opacity: 0.85;
  background: linear-gradient(180deg, #8a8a8a 0%, #5a5a5a 100%);
  border-color: #666;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.25);
}

.wallet-btn--claimed::before {
  display: none;
}

.wallet-btn--claimed .wallet-sparkle {
  color: #444;
}

.wallet-btn--claimed .wallet-btn-sub {
  color: #2d2d2d;
}

.wallet-sparkle {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  color: #7d6608;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.5));
}

.wallet-btn-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.wallet-btn-title {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
}

.wallet-btn-sub {
  font-size: 11px;
  font-weight: 800;
  color: #145a32;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}

@keyframes wallet-btn-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(212, 172, 13, 0.5),
      0 4px 14px rgba(0, 0, 0, 0.35),
      0 0 18px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(255, 236, 140, 0.65),
      0 6px 18px rgba(0, 0, 0, 0.38),
      0 0 28px rgba(255, 200, 50, 0.55);
  }
}

@keyframes wallet-btn-shine {
  0% {
    transform: translateX(-120%);
  }
  40%,
  100% {
    transform: translateX(120%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wallet-btn {
    animation: none;
  }
  .wallet-btn::before {
    animation: none;
  }
}

.balance-plate {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 8px 16px;
  background: linear-gradient(180deg, #3a3836 0%, #1e1d1b 100%);
  border: 1px solid rgba(212, 160, 23, 0.5);
  border-radius: 8px;
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.45),
    0 0 12px rgba(212, 160, 23, 0.12);
}

.balance-label {
  font-size: 10px;
  font-family: 'Orbitron', sans-serif;
  color: #a09890;
  letter-spacing: 0.12em;
}
.balance-value {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Orbitron', sans-serif;
  color: #f5f0e8;
  text-shadow: 0 0 8px rgba(255, 200, 80, 0.2);
}

.cabinet-footer {
  margin-top: 8px;
  padding-top: 18px;
  border-top: 1px solid rgba(212, 160, 23, 0.25);
}

.footer-left-stack,
.footer-roosters-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  align-items: stretch;
}

.more-games-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.more-games-row {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
}

.more-games-slot {
  width: 68px;
  height: 68px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-sizing: border-box;
  background: transparent;
  border: 1px solid rgba(212, 160, 23, 0.35);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  overflow: visible;
}

.more-games-slot--link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.more-games-slot--link:focus-visible {
  outline: 2px solid rgba(100, 200, 255, 0.9);
  outline-offset: 3px;
}

.more-games-slot--glow {
  animation: more-games-slot-glow 2.5s ease-in-out infinite;
}

.more-games-icon {
  width: 100%;
  height: 100%;
  max-width: 56px;
  max-height: 56px;
  object-fit: contain;
  object-position: center;
  display: block;
  border-radius: 0;
  animation: more-games-icon-alpha-glow 2.5s ease-in-out infinite;
  filter:
    drop-shadow(0 0 5px rgba(255, 215, 140, 0.55))
    drop-shadow(0 0 14px rgba(212, 160, 23, 0.38))
    drop-shadow(0 0 24px rgba(255, 180, 60, 0.2));
}

@keyframes more-games-slot-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(212, 160, 23, 0.22),
      0 0 14px rgba(212, 160, 23, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(255, 210, 120, 0.4),
      0 0 24px rgba(255, 200, 80, 0.28),
      0 0 38px rgba(212, 160, 23, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.12);
  }
}

@keyframes more-games-icon-alpha-glow {
  0%,
  100% {
    filter:
      drop-shadow(0 0 4px rgba(255, 220, 170, 0.45))
      drop-shadow(0 0 12px rgba(212, 160, 23, 0.3))
      drop-shadow(0 0 20px rgba(255, 170, 50, 0.15));
  }
  50% {
    filter:
      drop-shadow(0 0 8px rgba(255, 240, 200, 0.75))
      drop-shadow(0 0 18px rgba(255, 200, 90, 0.5))
      drop-shadow(0 0 32px rgba(212, 160, 23, 0.35));
  }
}

.more-games-icon--blend-dark {
  mix-blend-mode: lighten;
}

@media (prefers-reduced-motion: reduce) {
  .more-games-slot--glow {
    animation: none;
  }

  .more-games-icon {
    animation: none;
    filter: drop-shadow(0 0 8px rgba(212, 160, 23, 0.35));
  }
}

.footer-left-stack {
  align-self: start;
}

.more-games-panel.footer-panel {
  min-height: auto;
  padding-top: 10px;
  padding-bottom: 40px;
}

.more-games-panel .cabinet-panel__title {
  margin-bottom: 8px;
  padding-bottom: 6px;
}

.odds-panel--under-more-games {
  min-height: unset;
  padding-top: 12px;
  padding-bottom: 12px;
}

.footer-panel {
  display: flex;
  flex-direction: column;
  min-width: 240px;
  min-height: auto;
  padding: 14px 18px;
  background: linear-gradient(165deg, #2a2826 0%, #1a1816 40%, #121110 100%);
  border: 1px solid rgba(212, 160, 23, 0.45);
  border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -8px 24px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(212, 160, 23, 0.12),
    0 6px 20px rgba(0, 0, 0, 0.4);
}

.cabinet-panel__title {
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.35em;
  text-align: center;
  color: var(--cabinet-amber, #d4a017);
  text-shadow: 0 0 10px rgba(255, 180, 40, 0.35);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 160, 23, 0.2);
}

.betting-ticket-wrapper {
  padding: 0;
  overflow: visible;
}
.betting-ticket-wrapper :deep(.betting-ticket) {
  background: transparent;
  border: none;
  box-shadow: none;
  min-width: unset;
  padding: 8px 4px 12px;
}

.odds-panel {
  gap: 8px;
  font-size: 13px;
  color: #d4cfc7;
  font-weight: 600;
}

.odds-pair {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  flex-wrap: wrap;
}

.odds-panel .odds-row {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
}

.odds-row--meron {
  color: #ff6b6b;
  text-shadow: 0 0 8px rgba(255, 80, 80, 0.25);
}

.odds-row--wala {
  color: #5dade2;
  text-shadow: 0 0 8px rgba(80, 180, 255, 0.2);
}

.payout {
  color: #228b22;
  font-size: 14px;
}

.arena-layout {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.arena-section {
  width: 100%;
  min-height: 380px;
  max-width: 1200px;
  background: url('/arena-bg.png') center / cover no-repeat;
  border: 4px solid #8b6914;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arena-section:not(.arena-section--fight) {
  border-radius: 14px 14px min(12vw, 52px) min(12vw, 52px);
}

.arena-section--fight {
  background: none;
  border: none;
}

.fight-wrapper,
.lobby-wrapper {
  width: 100%;
  height: 100%;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.fight-wrapper--tv {
  padding: 12px 8px 20px;
}

.vintage-tv {
  width: 100%;
  max-width: min(100%, 920px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  padding: 14px 18px 10px;
  background: linear-gradient(
    165deg,
    #f0ebe3 0%,
    #ddd2c4 35%,
    #c4b5a0 70%,
    #9a8b72 100%
  );
  border-radius: 22px;
  border: 3px solid #2a1f14;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.35) inset,
    0 14px 36px rgba(0, 0, 0, 0.5),
    0 4px 0 rgba(0, 0, 0, 0.15);
}

.vintage-tv__bezel {
  padding: 10px 12px 12px;
  background: linear-gradient(180deg, #3a2e22 0%, #1e1812 100%);
  border-radius: 16px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.6),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}

.vintage-tv__screen {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: #0d0d0d;
  box-shadow:
    inset 0 0 0 3px #0a0a0a,
    inset 0 0 48px rgba(0, 0, 0, 0.85),
    inset 0 0 120px rgba(80, 60, 40, 0.15);
}

.vintage-tv__screen::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 3;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.09) 0px,
    rgba(0, 0, 0, 0.09) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: multiply;
}

.vintage-tv__screen::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(
    ellipse 85% 75% at 50% 45%,
    transparent 30%,
    rgba(0, 0, 0, 0.35) 100%
  );
}

.vintage-tv__screen :deep(.game-canvas) {
  width: 100%;
  max-width: none;
  margin: 0;
  min-height: 0;
  border-radius: 0;
  background: #1a1814;
  position: relative;
  z-index: 1;
  transform: perspective(520px) rotateX(1.2deg);
  transform-origin: center center;
  filter: contrast(1.06) saturate(0.88) brightness(0.97);
}

.screen-blood-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
  opacity: 0;
  background: radial-gradient(
    ellipse 110% 110% at 50% 50%,
    transparent 38%,
    rgba(160, 0, 0, 0.45) 72%,
    rgba(200, 0, 0, 0.72) 100%
  );
  transition: opacity 0.06s ease-in;
}

.screen-blood-overlay--active {
  opacity: 1;
  animation: screen-blood-flash 0.6s ease-out forwards;
}

@keyframes screen-blood-flash {
  0%   { opacity: 1; }
  18%  { opacity: 0.85; }
  40%  { opacity: 0.6; }
  100% { opacity: 0; }
}

.vintage-tv__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 8px 4px 4px;
  gap: 10px;
}

.vintage-tv__speaker-grille {
  flex: 0;
  height: 24px;
  min-width: 80px;
  border-radius: 4px;
  background: repeating-linear-gradient(
    90deg,
    #2a2420 0px,
    #2a2420 3px,
    #1a1512 3px,
    #1a1512 5px
  );
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  border: 1px solid #0d0b09;
}

.vintage-tv__controls-spacer {
  flex: 1;
  min-height: 1px;
}

.vintage-tv__knobs {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.vintage-tv__knob {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #d8d0c8, #8a8078 45%, #4a423c 100%);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    inset 0 1px 2px rgba(255, 255, 255, 0.35);
  border: 2px solid #1a1512;
}

.vintage-tv__knob--small {
  width: 22px;
  height: 22px;
}

@media (max-width: 520px) {
  .vintage-tv {
    padding: 10px 12px 8px;
  }

  .vintage-tv__knob {
    width: 28px;
    height: 28px;
  }

  .vintage-tv__screen :deep(.game-canvas) {
    transform: none;
  }
}

.lobby-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 24px;
  width: 100%;
  flex-wrap: wrap;
}

.lobby-content__timer {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex: 0 0 auto;
  order: 0;
  width: 15rem;
  min-width: 11.5rem;
  max-width: 15rem;
  contain: layout;
}

@media (max-width: 900px) {
  .app {
    padding: 14px 10px;
    align-items: flex-start;
    max-width: 100vw;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .cabinet-frame {
    padding: 14px 12px 18px;
  }

  .header {
    flex-wrap: wrap;
    margin-bottom: 12px;
    padding: 8px 10px;
    gap: 8px;
  }

  .logo {
    height: min(88px, 18vw);
  }

  .arena-layout {
    margin-bottom: 10px;
    width: 100%;
  }

  .arena-section {
    min-height: min(300px, 48vh);
    max-width: 100%;
  }

  .lobby-wrapper {
    min-height: min(300px, 50vh);
    gap: 8px;
    padding: 0 4px;
    box-sizing: border-box;
  }

  .lobby-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 12px 10px;
    padding: 12px 8px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    align-items: start;
    justify-items: center;
  }

  .lobby-content__timer {
    grid-column: 1 / -1;
    width: 100%;
    max-width: min(20rem, 94vw);
    min-width: 0;
    flex: unset;
    justify-content: center;
    justify-self: center;
  }

  .rooster-preview--meron {
    grid-column: 1;
    width: 100%;
    max-width: 100%;
    justify-self: center;
  }

  .rooster-preview--wala {
    grid-column: 2;
    width: 100%;
    max-width: 100%;
    justify-self: center;
  }

  .rooster-img-shell {
    width: clamp(96px, 32vw, 200px);
    height: clamp(96px, 32vw, 200px);
  }

  .rooster-placeholder {
    width: clamp(96px, 32vw, 200px);
    height: clamp(96px, 32vw, 200px);
  }
}

@media (max-width: 480px) {
  .lobby-content {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 10px 6px;
  }

  .rooster-preview--meron,
  .rooster-preview--wala {
    grid-column: 1;
  }

  .arena-section {
    min-height: min(260px, 42vh);
  }

  .lobby-wrapper {
    min-height: min(260px, 44vh);
  }
}

@media (max-width: 640px) {
  .logo {
    height: min(64px, 22vw);
  }

  .wallet-btn {
    padding: 8px 12px 8px 10px;
    gap: 8px;
  }

  .rooster-img-shell {
    width: clamp(72px, 42vw, 160px);
    height: clamp(72px, 42vw, 160px);
  }

  .rooster-placeholder {
    width: clamp(72px, 42vw, 160px);
    height: clamp(72px, 42vw, 160px);
  }

  .rooster-preview {
    gap: 3px;
  }

  .lobby-side-label__outer {
    width: min(140px, 88vw);
    height: 38px;
    padding: 2px;
  }

  .lobby-side-label--meron .lobby-side-label__text,
  .lobby-side-label--wala .lobby-side-label__text {
    font-size: 18px;
    letter-spacing: 0.28em;
  }
}

.rooster-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rooster-img-shell {
  width: 300px;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rooster-placeholder {
  width: 300px;
  height: 300px;
  object-fit: cover;
  display: block;
}
.rooster-placeholder.mirrored {
  transform: scaleX(-1);
}

/* Lobby rooster previews: float + heat + alpha glow (action style) */
.lobby-rooster-anim {
  position: relative;
  display: inline-block;
  animation: lobby-rooster-float 2.85s ease-in-out infinite;
  will-change: transform;
}

@keyframes lobby-rooster-float {
  0%,
  100% {
    transform: translateY(0) rotate(-0.65deg);
  }
  50% {
    transform: translateY(-11px) rotate(0.65deg);
  }
}

.lobby-rooster-anim__atmosphere {
  position: absolute;
  z-index: 0;
  inset: -10% -20% 0 -20%;
  pointer-events: none;
  overflow: visible;
}

.lobby-rooster-anim__smoke {
  position: absolute;
  border-radius: 50%;
  filter: blur(16px);
  mix-blend-mode: soft-light;
  opacity: 0.38;
}

.lobby-rooster-anim--meron .lobby-rooster-anim__smoke {
  background: radial-gradient(ellipse 100% 100%, rgba(210, 195, 205, 0.55), transparent 72%);
}

.lobby-rooster-anim--wala .lobby-rooster-anim__smoke {
  background: radial-gradient(ellipse 100% 100%, rgba(185, 205, 225, 0.52), transparent 72%);
}

.lobby-rooster-anim__smoke--a {
  width: 58%;
  height: 30%;
  left: -8%;
  top: 32%;
  animation: lobby-smoke-drift-a 9s ease-in-out infinite;
}

.lobby-rooster-anim__smoke--b {
  width: 48%;
  height: 24%;
  right: -4%;
  top: 52%;
  animation: lobby-smoke-drift-b 11.5s ease-in-out infinite;
  animation-delay: -2s;
  opacity: 0.32;
}

.lobby-rooster-anim__smoke--c {
  width: 40%;
  height: 22%;
  left: 22%;
  top: 14%;
  animation: lobby-smoke-drift-c 8.2s ease-in-out infinite;
  animation-delay: -3.5s;
  opacity: 0.28;
}

.lobby-rooster-anim__wind {
  position: absolute;
  height: 3px;
  border-radius: 3px;
  opacity: 0.4;
  mix-blend-mode: screen;
}

.lobby-rooster-anim--meron .lobby-rooster-anim__wind {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 220, 210, 0.45),
    rgba(255, 255, 255, 0.2),
    transparent
  );
  filter: blur(0.6px);
}

.lobby-rooster-anim--wala .lobby-rooster-anim__wind {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(200, 230, 255, 0.42),
    rgba(255, 255, 255, 0.2),
    transparent
  );
  filter: blur(0.6px);
}

.lobby-rooster-anim__wind--a {
  width: 42%;
  top: 38%;
  left: 0;
  animation: lobby-wind-sweep 3.8s linear infinite;
}

.lobby-rooster-anim__wind--b {
  width: 36%;
  top: 58%;
  left: 18%;
  animation: lobby-wind-sweep 4.6s linear infinite;
  animation-delay: -1.8s;
  opacity: 0.32;
}

@keyframes lobby-smoke-drift-a {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(10%, -5%) scale(1.06);
  }
}

@keyframes lobby-smoke-drift-b {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-8%, 6%) scale(1.05);
  }
}

@keyframes lobby-smoke-drift-c {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(6%, 4%) scale(1.04);
  }
}

@keyframes lobby-wind-sweep {
  0% {
    transform: translateX(-35%) skewX(-16deg);
    opacity: 0;
  }
  15% {
    opacity: 0.55;
  }
  100% {
    transform: translateX(140%) skewX(-16deg);
    opacity: 0;
  }
}

.lobby-rooster-anim__heat {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  inset: -18% -12% -14% -12%;
  border-radius: 50%;
  opacity: 0.9;
  mix-blend-mode: screen;
}

.lobby-rooster-anim--meron .lobby-rooster-anim__heat {
  inset: -20% -14% -22% -14%;
  border-radius: 0;
  mask-image: radial-gradient(
    ellipse 92% 90% at 50% 36%,
    #000 0%,
    #000 38%,
    rgba(0, 0, 0, 0.55) 58%,
    transparent 76%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 92% 90% at 50% 36%,
    #000 0%,
    #000 38%,
    rgba(0, 0, 0, 0.55) 58%,
    transparent 76%
  );
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  background:
    radial-gradient(ellipse 72% 58% at 48% 40%, rgba(255, 120, 85, 0.42), transparent 58%),
    radial-gradient(ellipse 48% 44% at 28% 46%, rgba(255, 85, 65, 0.3), transparent 52%),
    radial-gradient(ellipse 48% 44% at 72% 46%, rgba(240, 75, 55, 0.32), transparent 52%),
    radial-gradient(ellipse 38% 36% at 50% 22%, rgba(255, 220, 200, 0.18), transparent 55%);
  animation: lobby-ss-heat-meron 1.45s ease-in-out infinite;
}

.lobby-rooster-anim--wala .lobby-rooster-anim__heat {
  inset: -20% -14% -22% -14%;
  border-radius: 0;
  mask-image: radial-gradient(
    ellipse 92% 90% at 50% 36%,
    #000 0%,
    #000 38%,
    rgba(0, 0, 0, 0.55) 58%,
    transparent 76%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 92% 90% at 50% 36%,
    #000 0%,
    #000 38%,
    rgba(0, 0, 0, 0.55) 58%,
    transparent 76%
  );
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  background:
    radial-gradient(ellipse 72% 58% at 48% 40%, rgba(100, 200, 255, 0.42), transparent 58%),
    radial-gradient(ellipse 48% 44% at 28% 46%, rgba(80, 170, 255, 0.3), transparent 52%),
    radial-gradient(ellipse 48% 44% at 72% 46%, rgba(70, 150, 255, 0.32), transparent 52%),
    radial-gradient(ellipse 38% 36% at 50% 22%, rgba(200, 240, 255, 0.18), transparent 55%);
  animation: lobby-ss-heat-wala 1.45s ease-in-out infinite;
}

.rooster-img-shell--wala-ss,
.rooster-img-shell--meron-ss {
  position: relative;
  z-index: 1;
}

.lobby-rooster-anim--wala .lobby-rooster-anim__ss-sparks,
.lobby-rooster-anim--meron .lobby-rooster-anim__ss-sparks {
  position: absolute;
  z-index: 2;
  inset: 10% 9% 32% 9%;
  pointer-events: none;
  mix-blend-mode: screen;
}

.lobby-rooster-anim--wala .lobby-rooster-anim__ss-sparks-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  color: #e8f6ff;
}

.lobby-rooster-anim--meron .lobby-rooster-anim__ss-sparks-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  color: #ffe8e4;
}

.lobby-rooster-anim__ss-bolt {
  stroke: currentColor;
  stroke-width: 1.15;
  fill: none;
  vector-effect: non-scaling-stroke;
  opacity: 0;
  transition: opacity 0.32s ease-in-out;
}

.lobby-rooster-anim--wala .lobby-rooster-anim__ss-bolt {
  filter:
    drop-shadow(0 0 1px rgba(230, 248, 255, 0.85))
    drop-shadow(0 0 4px rgba(100, 185, 255, 0.55))
    drop-shadow(0 0 9px rgba(50, 140, 230, 0.32));
}

.lobby-rooster-anim--meron .lobby-rooster-anim__ss-bolt {
  filter:
    drop-shadow(0 0 1px rgba(255, 240, 235, 0.85))
    drop-shadow(0 0 4px rgba(255, 120, 95, 0.55))
    drop-shadow(0 0 9px rgba(220, 50, 40, 0.32));
}

.lobby-rooster-anim__ss-bolt--thin {
  stroke-width: 0.72;
}

.lobby-rooster-anim__ss-bolt--visible {
  opacity: 1;
}

@keyframes lobby-ss-heat-wala {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(1) translateY(0);
  }
  40% {
    opacity: 0.82;
    transform: scale(1.03) translateY(-1px);
  }
  70% {
    opacity: 0.72;
    transform: scale(1.01) translateY(0);
  }
}

@keyframes lobby-ss-heat-meron {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(1) translateY(0);
  }
  40% {
    opacity: 0.82;
    transform: scale(1.03) translateY(-1px);
  }
  70% {
    opacity: 0.72;
    transform: scale(1.01) translateY(0);
  }
}

.lobby-rooster-anim .rooster-img-shell {
  position: relative;
  z-index: 1;
  overflow: hidden;
  box-shadow: none;
}

.lobby-rooster-anim--meron .rooster-placeholder {
  animation: lobby-meron-ss-aura 1.75s ease-in-out infinite;
}

.lobby-rooster-anim--wala .rooster-placeholder {
  animation: lobby-wala-ss-aura 1.75s ease-in-out infinite;
}

@keyframes lobby-meron-ss-aura {
  0%,
  100% {
    filter:
      drop-shadow(0 0 2px rgba(255, 210, 200, 0.55))
      drop-shadow(0 0 10px rgba(255, 100, 80, 0.38))
      drop-shadow(0 0 22px rgba(220, 50, 40, 0.22))
      brightness(1.03)
      saturate(1.06);
  }
  35% {
    filter:
      drop-shadow(0 0 4px rgba(255, 230, 215, 0.65))
      drop-shadow(0 0 16px rgba(255, 120, 90, 0.48))
      drop-shadow(0 0 34px rgba(230, 60, 45, 0.3))
      brightness(1.06)
      saturate(1.1);
  }
  68% {
    filter:
      drop-shadow(0 0 3px rgba(255, 220, 205, 0.58))
      drop-shadow(0 0 12px rgba(255, 105, 75, 0.42))
      drop-shadow(0 0 28px rgba(210, 55, 40, 0.26))
      brightness(1.05)
      saturate(1.08);
  }
}

@keyframes lobby-wala-ss-aura {
  0%,
  100% {
    filter:
      drop-shadow(0 0 2px rgba(200, 230, 255, 0.55))
      drop-shadow(0 0 10px rgba(90, 170, 255, 0.38))
      drop-shadow(0 0 22px rgba(45, 130, 220, 0.22))
      brightness(1.03)
      saturate(1.06);
  }
  35% {
    filter:
      drop-shadow(0 0 4px rgba(220, 245, 255, 0.65))
      drop-shadow(0 0 16px rgba(110, 195, 255, 0.48))
      drop-shadow(0 0 34px rgba(55, 150, 235, 0.3))
      brightness(1.06)
      saturate(1.1);
  }
  68% {
    filter:
      drop-shadow(0 0 3px rgba(210, 238, 255, 0.58))
      drop-shadow(0 0 12px rgba(100, 185, 255, 0.42))
      drop-shadow(0 0 28px rgba(50, 140, 225, 0.26))
      brightness(1.05)
      saturate(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lobby-rooster-anim {
    animation: none;
  }

  .lobby-rooster-anim__heat {
    animation: none !important;
    opacity: 0.55;
  }

  .lobby-rooster-anim__smoke,
  .lobby-rooster-anim__wind {
    animation: none !important;
  }

  .lobby-rooster-anim__smoke {
    opacity: 0.16;
  }

  .lobby-rooster-anim__wind {
    opacity: 0.12;
  }

  .lobby-rooster-anim__ss-sparks {
    display: none !important;
  }

  .lobby-rooster-anim--meron .rooster-placeholder,
  .lobby-rooster-anim--wala .rooster-placeholder {
    animation: none;
  }

  .lobby-rooster-anim--meron .rooster-placeholder {
    filter: drop-shadow(0 0 10px rgba(230, 70, 55, 0.35)) brightness(1.03);
  }

  .lobby-rooster-anim--wala .rooster-placeholder {
    filter: drop-shadow(0 0 10px rgba(100, 180, 255, 0.35)) brightness(1.03);
  }
}

/* Lobby MERON/WALA plates — matches FightScene createArenaLabels */
.lobby-side-label {
  flex-shrink: 0;
}

.lobby-side-label__outer {
  width: 168px;
  height: 44px;
  box-sizing: border-box;
  padding: 3px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.lobby-side-label--meron .lobby-side-label__outer {
  background: rgba(26, 8, 8, 0.96);
  border: 2px solid rgba(255, 77, 77, 0.95);
}

.lobby-side-label--meron .lobby-side-label__inner {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: rgba(45, 18, 18, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lobby-side-label--meron .lobby-side-label__text {
  font-family: 'Orbitron', Impact, 'Arial Black', sans-serif;
  font-size: 22px;
  font-weight: bold;
  font-style: normal;
  color: #ffc9c4;
  letter-spacing: 0.35em;
  line-height: 1;
  -webkit-text-stroke: 1px #2d0505;
  text-shadow:
    0 2px 6px rgba(255, 45, 45, 0.9),
    0 0 12px rgba(255, 45, 45, 0.45);
}

.lobby-side-label--wala .lobby-side-label__outer {
  background: rgba(8, 16, 24, 0.96);
  border: 2px solid rgba(93, 173, 226, 0.95);
}

.lobby-side-label--wala .lobby-side-label__inner {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background: rgba(15, 36, 48, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lobby-side-label--wala .lobby-side-label__text {
  font-family: 'Orbitron', Impact, 'Arial Black', sans-serif;
  font-size: 22px;
  font-weight: bold;
  font-style: normal;
  color: #d4eefc;
  letter-spacing: 0.35em;
  line-height: 1;
  -webkit-text-stroke: 1px #051018;
  text-shadow:
    0 2px 6px rgba(30, 111, 168, 0.9),
    0 0 12px rgba(30, 111, 168, 0.45);
}
.vs-badge {
  width: 360px;
  height: auto;
  object-fit: contain;
}

.footer {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(260px, 420px) minmax(200px, 1fr);
  gap: 14px;
  align-items: start;
  justify-content: center;
  width: 100%;
}

@media (max-width: 960px) {
  .footer {
    grid-template-columns: 1fr;
  }

  .footer-left-stack {
    order: 3;
  }

  .footer-roosters-stack {
    order: 1;
  }

  .betting-ticket-wrapper {
    order: 2;
  }

  .footer-left-stack,
  .footer-roosters-stack,
  .betting-ticket-wrapper {
    width: 100%;
  }

  .footer-panel {
    min-width: 0;
    width: 100%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

