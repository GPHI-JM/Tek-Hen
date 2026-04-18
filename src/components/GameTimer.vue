<script setup>
import { computed } from 'vue'
import { FIGHT_SECONDS } from '../../shared/fightConstants.js'

const fightSecondsDisplay = computed(() => FIGHT_SECONDS)
</script>

<template>
  <div class="timer-panel-root">
    <div class="timer-panel">
      <span class="timer-label" aria-hidden="false">Fight length</span>
      <div class="timer-display">
        <span class="timer-value">{{ fightSecondsDisplay }}</span>
        <span class="timer-unit">SEC</span>
      </div>
      <p class="timer-hint">
        Pick a side, then confirm or go all in — the fight starts right away.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Outer shell: fixed footprint so flex siblings (roosters) never shift */
.timer-panel-root {
  width: 100%;
  min-width: 11.5rem;
  max-width: 15rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.timer-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px 12px;
  background: linear-gradient(180deg, #1a1510 0%, #0d0a08 100%);
  border: 2px solid rgba(139, 105, 20, 0.55);
  border-radius: 6px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.65),
    0 2px 0 rgba(255, 255, 255, 0.04);
}

.timer-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: #8a8278;
  text-transform: uppercase;
  min-height: 1.2em;
  line-height: 1.2;
  text-align: center;
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 3.25rem;
  padding: 6px 10px;
  box-sizing: border-box;
  background: #050403;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.8);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.9);
}

.timer-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  color: #ff6b4a;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
  text-align: center;
  text-shadow:
    0 0 8px rgba(255, 80, 60, 0.55),
    0 0 2px rgba(255, 200, 160, 0.3);
}

.timer-unit {
  font-family: 'Orbitron', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #5a5248;
  flex-shrink: 0;
}

.timer-hint {
  margin: 0;
  width: 100%;
  text-align: center;
  font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: #d4b896;
}

@media (max-width: 900px) {
  .timer-panel-root {
    min-width: 0;
    max-width: min(20rem, 94vw);
  }
}

@media (max-width: 640px) {
  .timer-panel-root {
    min-width: 0;
    max-width: min(17rem, 92vw);
  }

  .timer-panel {
    padding: 8px 8px 10px;
    gap: 6px;
  }

  .timer-display {
    min-height: 2.5rem;
    padding: 4px 8px;
  }

  .timer-value {
    font-size: 22px;
  }

  .timer-hint {
    font-size: 10px;
    line-height: 1.25;
  }
}
</style>
