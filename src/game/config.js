import Phaser from 'phaser'
import { FightScene } from './scenes/FightScene'

export function createGameConfig(container, callbacks) {
  return {
    type: Phaser.AUTO,
    parent: container,
    width: 800,
    height: 450,
    backgroundColor: '#8b7355',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 } },
    },
    scene: [new FightScene(callbacks)],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }
}
