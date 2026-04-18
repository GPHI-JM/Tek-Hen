<script setup>
import { ROOSTER_VARIANTS } from '../../shared/roosterVariants.js'
import { useGameStore } from '../stores/gameStore'

const store = useGameStore()

function selectVariant(variantId) {
  store.setSelectedRoosterVariantId(variantId)
}
</script>

<template>
  <div class="rooster-select-panel footer-panel cabinet-panel" aria-label="Choose your rooster breed">
    <div class="cabinet-panel__title">ROOSTERS</div>
    <p class="rooster-select-panel__hint">Your bird on the side you bet — opponent random</p>
    <div class="rooster-select-panel__row" role="list">
      <button
        v-for="variant in ROOSTER_VARIANTS"
        :key="variant.id"
        type="button"
        class="rooster-tile"
        :class="{ 'rooster-tile--selected': store.selectedRoosterVariantId === variant.id }"
        :aria-pressed="store.selectedRoosterVariantId === variant.id"
        :aria-label="`Use ${variant.label} as your fighter`"
        role="listitem"
        @click="selectVariant(variant.id)"
      >
        <span class="rooster-tile__frame" aria-hidden="true" />
        <img
          class="rooster-tile__img"
          :class="{ 'rooster-tile__img--contain': variant.iconPath }"
          :src="variant.iconPath ?? variant.imagePath"
          alt=""
          width="80"
          height="80"
          loading="lazy"
          draggable="false"
        />
        <span class="rooster-tile__label">{{ variant.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.rooster-select-panel.footer-panel {
  flex: 1 1 280px;
  max-width: 440px;
  min-width: 220px;
  min-height: auto;
  gap: 8px;
  align-items: center;
  padding: 20px;
  padding-bottom: 25px;
}

.rooster-select-panel__hint {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(232, 228, 220, 0.55);
  text-align: center;
}

.rooster-select-panel__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: 12px 10px;
  width: 100%;
}

.rooster-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 92px;
  padding: 0 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font: inherit;
  border-radius: 14px;
  transition:
    transform 0.18s ease,
    filter 0.18s ease;
}

.rooster-tile:focus-visible {
  outline: 2px solid rgba(100, 200, 255, 0.9);
  outline-offset: 3px;
}

.rooster-tile:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
}

.rooster-tile:active:not(:disabled) {
  transform: translateY(-1px) scale(1.01);
}

.rooster-tile__frame {
  position: absolute;
  top: 0;
  left: 50%;
  width: 86px;
  height: 86px;
  margin-left: -43px;
  border-radius: 12px;
  pointer-events: none;
  background: linear-gradient(145deg, #1a1816 0%, #0e0d0c 100%);
  box-shadow:
    inset 0 2px 6px rgba(0, 0, 0, 0.65),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.45);
  border: 2px solid #2a2622;
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease;
}

.rooster-tile__img {
  position: relative;
  z-index: 1;
  width: 76px;
  height: 76px;
  margin-top: 5px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  user-select: none;
  pointer-events: none;
  animation: rooster-glow-idle 2.6s ease-in-out infinite;
}

.rooster-tile__img--contain {
  object-fit: contain;
  background: rgba(248, 246, 242, 0.92);
}

.rooster-tile--selected .rooster-tile__frame {
  border-color: rgba(255, 120, 100, 0.85);
  box-shadow:
    inset 0 2px 5px rgba(0, 0, 0, 0.4),
    0 0 0 2px rgba(255, 90, 80, 0.45),
    0 0 24px rgba(255, 85, 70, 0.35),
    0 0 40px rgba(255, 60, 50, 0.2);
  animation: rooster-frame-glow-selected 1.8s ease-in-out infinite;
}

.rooster-tile--selected .rooster-tile__img {
  animation: rooster-glow-selected 1.7s ease-in-out infinite;
}

.rooster-tile--selected .rooster-tile__img--contain {
  box-shadow:
    inset 0 0 0 1px rgba(255, 170, 150, 0.5),
    0 0 14px rgba(255, 110, 95, 0.35);
}

.rooster-tile__label {
  position: relative;
  z-index: 1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(220, 214, 204, 0.88);
  text-align: center;
  line-height: 1.15;
  max-width: 92px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}

.rooster-tile--selected .rooster-tile__label {
  color: #ffd4cf;
  text-shadow:
    0 0 10px rgba(255, 120, 100, 0.55),
    0 0 18px rgba(255, 80, 70, 0.35);
}

@keyframes rooster-glow-idle {
  0%,
  100% {
    filter: drop-shadow(0 0 6px rgba(255, 200, 120, 0.18)) drop-shadow(0 0 14px rgba(255, 180, 60, 0.12));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(255, 210, 140, 0.42)) drop-shadow(0 0 22px rgba(255, 190, 80, 0.22));
  }
}

@keyframes rooster-glow-selected {
  0%,
  100% {
    filter: drop-shadow(0 0 10px rgba(255, 100, 90, 0.45)) drop-shadow(0 0 20px rgba(255, 70, 60, 0.28));
  }
  50% {
    filter: drop-shadow(0 0 18px rgba(255, 130, 115, 0.72)) drop-shadow(0 0 32px rgba(255, 90, 75, 0.45));
  }
}

@keyframes rooster-frame-glow-selected {
  0%,
  100% {
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(255, 90, 80, 0.4),
      0 0 20px rgba(255, 85, 70, 0.3),
      0 0 36px rgba(255, 55, 45, 0.15);
  }
  50% {
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.38),
      0 0 0 2px rgba(255, 110, 95, 0.55),
      0 0 32px rgba(255, 100, 85, 0.48),
      0 0 48px rgba(255, 70, 60, 0.28);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rooster-tile__img,
  .rooster-tile--selected .rooster-tile__img,
  .rooster-tile--selected .rooster-tile__frame {
    animation: none;
  }

  .rooster-tile--selected .rooster-tile__frame {
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(255, 90, 80, 0.45),
      0 0 24px rgba(255, 85, 70, 0.35),
      0 0 40px rgba(255, 60, 50, 0.2);
  }

  .rooster-tile--selected .rooster-tile__img {
    filter: drop-shadow(0 0 14px rgba(255, 110, 95, 0.55));
  }

  .rooster-tile__img {
    filter: drop-shadow(0 0 10px rgba(255, 200, 130, 0.3));
  }
}
</style>
