import Phaser from 'phaser'
import { BootScene } from './BootScene.js'
import { FightScene } from './FightScene.js'

let gameInstance = null

function resolveGameProfile() {
  if (typeof window === 'undefined') {
    return {
      width: 800,
      height: 450,
      fpsTarget: 60,
      resolution: 1,
      compact: false,
    }
  }

  const viewportWidth = window.innerWidth || 800
  const viewportHeight = window.innerHeight || 450
  const compact = viewportWidth <= 900 || viewportHeight <= 720

  return {
    width: 800,
    height: 450,
    fpsTarget: compact ? 30 : 60,
    resolution: compact ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
    compact,
  }
}

/**
 * Player breed + which side they bet (MERON/WALA). Opponent breed is random in FightScene.
 * Sync after createGame and when rooster or bet side changes.
 */
export function syncFightPicksToRegistry(roosterVariantId, betSide) {
  if (!gameInstance) {
    return
  }
  if (typeof roosterVariantId === 'string') {
    gameInstance.registry.set('playerRoosterVariantId', roosterVariantId)
  }
  if (betSide === 'meron' || betSide === 'wala') {
    gameInstance.registry.set('playerBetSide', betSide)
  } else {
    gameInstance.registry.remove('playerBetSide')
  }
}

export function createGame(emit) {
  if (gameInstance) {
    gameInstance.destroy(true)
  }

  const profile = resolveGameProfile()

  gameInstance = new Phaser.Game({
    type: Phaser.AUTO,
    width: profile.width,
    height: profile.height,
    resolution: profile.resolution,
    parent: 'game-container',
    backgroundColor: '#d4b896',
    audio: {
      pauseOnBlur: false,
    },
    emit,
    scene: [BootScene, FightScene],
    render: {
      antialias: !profile.compact,
      roundPixels: profile.compact,
      powerPreference: 'high-performance',
    },
    fps: {
      target: profile.fpsTarget,
      min: profile.compact ? 24 : 30,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: profile.width,
      height: profile.height,
    },
  })

  return gameInstance
}

export function destroyGame() {
  if (gameInstance) {
    gameInstance.destroy(true)
    gameInstance = null
  }
}
