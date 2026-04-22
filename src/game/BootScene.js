import Phaser from 'phaser'
import { ROOSTER_VARIANTS, publicAssetPath } from '../../shared/roosterVariants.js'
import {
  setFacebookLoadingProgress,
  syncFacebookContextToRegistry,
} from '../platform/facebookInstant.js'

const MERON_ATLAS = 'meron'
const WALA_ATLAS = 'wala'

function buildMeronIdleAnimationFrames() {
  const frames = []
  for (let frameIndex = 1; frameIndex <= 24; frameIndex += 1) {
    frames.push({ key: MERON_ATLAS, frame: `s${frameIndex}.png` })
  }
  return frames
}

function buildWalaIdleAnimationFrames() {
  const frames = []
  for (let frameIndex = 1; frameIndex <= 24; frameIndex += 1) {
    frames.push({ key: WALA_ATLAS, frame: `w${frameIndex}.png` })
  }
  return frames
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  preload() {
    // Set initial loading progress immediately
    setFacebookLoadingProgress(15)
    
    // Set up progress listener BEFORE loading assets
    this.load.on('progress', (value) => {
      setFacebookLoadingProgress(15 + value * 80)
    })
    
    this.load.image('arena-bg', publicAssetPath('arena-bg.png'))
    this.load.atlas(MERON_ATLAS, publicAssetPath('manok-idle.png'), publicAssetPath('manok-idle.json'))
    this.load.atlas(WALA_ATLAS, publicAssetPath('bulik-idle.png'), publicAssetPath('bulik-idle.json'))

    for (const variant of ROOSTER_VARIANTS) {
      if (variant.frameNames) {
        this.load.atlas(variant.atlasKey, variant.imagePath, variant.jsonPath)
      }
    }
  }

  create() {
    void (async () => {
      this.anims.create({
        key: 'meron-idle',
        frames: buildMeronIdleAnimationFrames(),
        frameRate: 10,
        repeat: -1,
        skipMissedFrames: true,
      })

      this.anims.create({
        key: 'wala-idle',
        frames: buildWalaIdleAnimationFrames(),
        frameRate: 10,
        repeat: -1,
        skipMissedFrames: true,
      })

      for (const variant of ROOSTER_VARIANTS) {
        if (!variant.frameNames) continue
        const frames = variant.frameNames.map((frameName) => ({
          key: variant.atlasKey,
          frame: frameName,
        }))
        this.anims.create({
          key: variant.animKey,
          frames,
          frameRate: 10,
          repeat: -1,
          skipMissedFrames: true,
        })
      }

      const emit = this.game.config.emit || (typeof window !== 'undefined' && window.__shabongEmit)
      if (emit) {
        this.registry.set('emit', emit)
      }

      setFacebookLoadingProgress(100)
      syncFacebookContextToRegistry(this.game)

      this.scene.start('Fight')
    })()
  }
}
