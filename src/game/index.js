import Phaser from 'phaser'
import { BootScene } from './BootScene.js'
import { FightScene } from './FightScene.js'

let gameInstance = null

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

  gameInstance = new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    backgroundColor: '#d4b896',
    audio: {
      pauseOnBlur: false,
    },
    emit,
    scene: [BootScene, FightScene],
    render: {
      antialias: true,
      powerPreference: 'high-performance',
    },
    fps: {
      target: 60,
      min: 30,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
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
