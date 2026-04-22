import Phaser from 'phaser'
import { FIGHT_SECONDS, REFERENCE_FIGHT_SECONDS, REFERENCE_MAX_HP } from '../../shared/fightConstants.js'
import { ROOSTER_VARIANTS } from '../../shared/roosterVariants.js'
import {
  playAttackWindUp,
  playFightSound,
  startFightAtmosphere,
  stopFightAtmosphere,
} from './fightSounds.js'

const MERON = 'meron'
const WALA = 'wala'

const MAX_HP = 5000

/** Horizontal offset from arena center to each rooster (closer = smaller — sprites are 200px wide). */
const ROOSTER_HALF_GAP = 105

/** Push name plates outward from rooster feet so MERON/WALA labels have more space between them. */
const ARENA_LABEL_OUTWARD_SHIFT = 40

const DAMAGE_SCALE =
  (MAX_HP / REFERENCE_MAX_HP) * (REFERENCE_FIGHT_SECONDS / FIGHT_SECONDS)

const ATTACK_TYPES = {
  tackle: { damage: Math.max(1, Math.round(5 * DAMAGE_SCALE)), duration: 400 },
  scratch: { damage: Math.max(1, Math.round(10 * DAMAGE_SCALE)), duration: 500 },
  flyScratch: { damage: Math.max(1, Math.round(25 * DAMAGE_SCALE)), duration: 700 },
}

const ATTACK_LABELS = {
  tackle: 'TACKLE!',
  scratch: 'SCRATCH!',
  flyScratch: 'CRITICAL!',
}

export class FightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Fight' })
  }

  create() {
    this.isCompactViewport = this.scale.width <= 720 || this.scale.height <= 405
    this.meronHp = MAX_HP
    this.walaHp = MAX_HP
    this.timeRemaining = FIGHT_SECONDS
    this.isFighting = true
    this.emit = this.registry.get('emit') || this.game.config.emit

    this.createArena()
    this.ensureClashParticleTextures()
    this.createRoosters()
    this.createArenaLabels()
    this.createHpBars()
    this.updateHpBars()
    this.createCountdown()
    this.createAttackQueue()
    this.scheduleNextAttack()
    this.time.delayedCall(16, () => this.startCountdown())

    void startFightAtmosphere()
  }

  shutdown() {
    stopFightAtmosphere()
  }

  createArena() {
    const { width, height } = this.cameras.main
    const bg = this.add.image(width / 2, height / 2, 'arena-bg')
    bg.setDisplaySize(width, height)
    bg.setDepth(-2)
  }

  ensureClashParticleTextures() {
    if (this.textures.exists('clash-dust')) {
      return
    }
    const graphics = this.make.graphics({ x: 0, y: 0, add: false })

    graphics.fillStyle(0xe8dcc8, 1)
    graphics.fillCircle(14, 14, 14)
    graphics.generateTexture('clash-dust', 28, 28)
    graphics.clear()

    graphics.fillStyle(0xc4b49a, 1)
    graphics.fillCircle(10, 10, 10)
    graphics.generateTexture('clash-dust-grit', 20, 20)
    graphics.clear()

    graphics.fillStyle(0xa89890, 0.92)
    graphics.fillCircle(18, 18, 18)
    graphics.generateTexture('clash-smoke', 36, 36)
    graphics.clear()

    // Small round drop for blood spray
    graphics.fillStyle(0xcc1111, 1)
    graphics.fillCircle(5, 5, 5)
    graphics.generateTexture('blood-drop', 10, 10)
    graphics.clear()

    // Elongated streak for blood spatter
    graphics.fillStyle(0xaa0000, 1)
    graphics.fillRect(0, 0, 10, 3)
    graphics.generateTexture('blood-streak', 10, 3)

    graphics.destroy()
  }

  /**
   * Dust and smoke at foot level between birds so clashes read clearly on the arena floor.
   */
  spawnClashGroundFx(attackerSprite, defenderSprite, isCritical) {
    this.ensureClashParticleTextures()

    const clashX = (attackerSprite.x + defenderSprite.x) / 2
    const footOffsetY = Math.max(attackerSprite.displayHeight, defenderSprite.displayHeight) * 0.5
    const footY = Math.min(attackerSprite.y, defenderSprite.y) + footOffsetY

    const dustCount = this.isCompactViewport ? (isCritical ? 16 : 10) : isCritical ? 28 : 16
    const gritCount = this.isCompactViewport ? (isCritical ? 8 : 5) : isCritical ? 12 : 7
    const smokeCount = this.isCompactViewport ? (isCritical ? 8 : 5) : isCritical ? 14 : 8

    const dustEmitter = this.add.particles(0, 0, 'clash-dust', {
      maxParticles: this.isCompactViewport ? 36 : 64,
      lifespan: { min: 420, max: 920 },
      speed: { min: 140, max: 320 },
      angle: { min: 195, max: 345 },
      gravityY: 320,
      rotate: { min: 0, max: 360 },
      scale: { start: 1.15, end: 0.06 },
      alpha: { start: 1, end: 0 },
      tint: [0xf0e4d0, 0xd4c4a8, 0xb89a78],
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    })
    dustEmitter.setDepth(21)
    dustEmitter.explode(dustCount, clashX, footY)

    const gritEmitter = this.add.particles(0, 0, 'clash-dust-grit', {
      maxParticles: this.isCompactViewport ? 20 : 32,
      lifespan: { min: 280, max: 620 },
      speed: { min: 180, max: 420 },
      angle: { min: 195, max: 345 },
      gravityY: 420,
      rotate: { min: 0, max: 360 },
      scale: { start: 0.95, end: 0.04 },
      alpha: { start: 1, end: 0 },
      tint: [0xc9b89a, 0x8b7355],
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    })
    gritEmitter.setDepth(21)
    gritEmitter.explode(gritCount, clashX, footY)

    const smokeEmitter = this.add.particles(0, 0, 'clash-smoke', {
      maxParticles: this.isCompactViewport ? 24 : 40,
      lifespan: { min: 650, max: 1500 },
      speed: { min: 20, max: 95 },
      angle: { min: 245, max: 295 },
      gravityY: -12,
      rotate: { min: 0, max: 360 },
      scale: { start: 0.55, end: 1.85 },
      alpha: { start: 0.88, end: 0 },
      tint: [0xf2eee6, 0xc8c0b4, 0x9a948c],
      blendMode: Phaser.BlendModes.SCREEN,
      emitting: false,
    })
    smokeEmitter.setDepth(21)
    smokeEmitter.explode(smokeCount, clashX, footY)

    const cleanupDelayMs = 1800
    this.time.delayedCall(cleanupDelayMs, () => {
      dustEmitter.destroy()
      gritEmitter.destroy()
      smokeEmitter.destroy()
    })
  }

  createRoosters() {
    const { width } = this.cameras.main
    const centerX = width / 2

    const playerVariantId = this.registry.get('playerRoosterVariantId')
    const playerBetSide = this.registry.get('playerBetSide')
    const playerBreedVariant =
      typeof playerVariantId === 'string'
        ? ROOSTER_VARIANTS.find((variant) => variant.id === playerVariantId)
        : undefined
    const resolvedPlayerBreed = playerBreedVariant ?? Phaser.Math.RND.pick(ROOSTER_VARIANTS)
    const opponentChoices = ROOSTER_VARIANTS.filter((variant) => variant.id !== resolvedPlayerBreed.id)
    if (opponentChoices.length === 0) {
      throw new Error('At least two rooster variants are required for MERON vs WALA.')
    }
    const opponentBreedVariant = Phaser.Math.RND.pick(opponentChoices)

    const placePlayerBirdOnWala = playerBetSide === WALA
    const meronBreedVariant = placePlayerBirdOnWala ? opponentBreedVariant : resolvedPlayerBreed
    const walaBreedVariant = placePlayerBirdOnWala ? resolvedPlayerBreed : opponentBreedVariant

    this.meronSprite = this.createCharacterSprite(
      centerX - ROOSTER_HALF_GAP,
      300,
      MERON,
      meronBreedVariant
    )
    this.walaSprite = this.createCharacterSprite(
      centerX + ROOSTER_HALF_GAP,
      300,
      WALA,
      walaBreedVariant
    )
  }

  createArenaLabels() {
    const labelDepthPlate = 24
    const labelDepthText = 26
    const plateWidth = this.isCompactViewport ? 138 : 168
    const plateHeight = this.isCompactViewport ? 36 : 44
    const offsetBelowCenter = this.isCompactViewport ? 100 : 118
    const fontSize = this.isCompactViewport ? 18 : 22
    const strokeThickness = this.isCompactViewport ? 4 : 5
    const letterSpacing = this.isCompactViewport ? 4 : 6

    const meronX = this.meronSprite.x - ARENA_LABEL_OUTWARD_SHIFT
    const walaX = this.walaSprite.x + ARENA_LABEL_OUTWARD_SHIFT
    const labelY = this.meronSprite.y + offsetBelowCenter

    this.add
      .rectangle(meronX, labelY, plateWidth, plateHeight, 0x1a0808, 0.96)
      .setStrokeStyle(2, 0xff4d4d, 0.95)
      .setOrigin(0.5)
      .setDepth(labelDepthPlate)

    this.add
      .rectangle(meronX, labelY, plateWidth - 6, plateHeight - 8, 0x2d1212, 0.85)
      .setOrigin(0.5)
      .setDepth(labelDepthPlate - 1)

    this.add
      .text(meronX, labelY, 'MERON', {
        fontFamily: 'Orbitron, Impact, "Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: '#ffc9c4',
        stroke: '#2d0505',
        strokeThickness,
        letterSpacing,
      })
      .setOrigin(0.5)
      .setDepth(labelDepthText)
      .setShadow(0, 2, '#ff2d2d', 6, true, true)

    this.add
      .rectangle(walaX, labelY, plateWidth, plateHeight, 0x081018, 0.96)
      .setStrokeStyle(2, 0x5dade2, 0.95)
      .setOrigin(0.5)
      .setDepth(labelDepthPlate)

    this.add
      .rectangle(walaX, labelY, plateWidth - 6, plateHeight - 8, 0x0f2430, 0.85)
      .setOrigin(0.5)
      .setDepth(labelDepthPlate - 1)

    this.add
      .text(walaX, labelY, 'WALA', {
        fontFamily: 'Orbitron, Impact, "Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: '#d4eefc',
        stroke: '#051018',
        strokeThickness,
        letterSpacing,
      })
      .setOrigin(0.5)
      .setDepth(labelDepthText)
      .setShadow(0, 2, '#1e6fa8', 6, true, true)
  }

  createCharacterSprite(x, y, side, variant) {
    const sprite = this.add.sprite(x, y, variant.atlasKey, variant.firstFrame)
    sprite.setDisplaySize(200, 200)
    // Right-facing art: MERON no flip, WALA flip. Left-facing (bulik-idle): MERON flip, WALA no flip.
    const facesLeftTexture = variant.facesLeft === true
    sprite.setFlipX(facesLeftTexture ? side === MERON : side === WALA)
    sprite.setData('side', side)
    sprite.setData('hp', MAX_HP)
    sprite.setDepth(20)
    sprite.play(variant.animKey)

    return sprite
  }

  createHpBars() {
    const { width } = this.cameras.main
    const barWidth = this.isCompactViewport ? 160 : 200
    const leftX = this.isCompactViewport ? 92 : 120
    const rightX = width - (this.isCompactViewport ? 252 : 320)

    this.hpLayout = { barWidth, leftX, rightX }

    this.meronHpBar = this.createHpBar(leftX, 30, 0xc41e3a, barWidth)
    this.walaHpBar = this.createHpBar(rightX, 30, 0xf5deb3, barWidth)

    const hpNameStyle = {
      fontFamily: 'Orbitron, Impact, "Arial Black", sans-serif',
      fontSize: this.isCompactViewport ? '13px' : '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: this.isCompactViewport ? 4 : 5,
      letterSpacing: this.isCompactViewport ? 1 : 2,
    }

    this.meronHpText = this.add
      .text(leftX, 55, 'MERON', hpNameStyle)
      .setDepth(22)
      .setShadow(0, 2, '#000000', 4, true, true)

    this.walaHpText = this.add
      .text(rightX, 55, 'WALA', hpNameStyle)
      .setDepth(22)
      .setShadow(0, 2, '#000000', 4, true, true)

    const hpPercentStyle = {
      fontFamily: 'Orbitron, Impact, sans-serif',
      fontSize: this.isCompactViewport ? '11px' : '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: this.isCompactViewport ? 3 : 4,
    }

    this.meronHpPercent = this.add
      .text(leftX + barWidth / 2, 40, '100%', hpPercentStyle)
      .setOrigin(0.5)
      .setDepth(23)
      .setShadow(0, 1, '#000000', 3, true, true)

    this.walaHpPercent = this.add
      .text(rightX + barWidth / 2, 40, '100%', hpPercentStyle)
      .setOrigin(0.5)
      .setDepth(23)
      .setShadow(0, 1, '#000000', 3, true, true)
  }

  createHpBar(x, y, color, width = 200) {
    const bg = this.add.rectangle(x, y, width, 20, 0x333333, 0.5).setOrigin(0).setDepth(20)
    const bar = this.add.rectangle(x, y, width, 20, color, 0.9).setOrigin(0).setDepth(21)
    return { bg, bar }
  }

  updateHpBars() {
    const { width } = this.cameras.main
    const barWidth = this.hpLayout?.barWidth ?? 200
    const meronFill = barWidth * (this.meronHp / MAX_HP)
    const walaFill = barWidth * (this.walaHp / MAX_HP)
    this.meronHpBar.bar.width = meronFill
    this.walaHpBar.bar.width = walaFill
    const meronPct = Math.round((this.meronHp / MAX_HP) * 100)
    const walaPct = Math.round((this.walaHp / MAX_HP) * 100)
    this.meronHpPercent.setText(`${meronPct}%`)
    const leftX = this.hpLayout?.leftX ?? 120
    const rightX = this.hpLayout?.rightX ?? (width - 320)
    const meronCenter = meronFill > 0 ? leftX + meronFill / 2 : leftX + barWidth / 2
    this.meronHpPercent.setPosition(meronCenter, 40)
    this.walaHpPercent.setText(`${walaPct}%`)
    const walaCenter = walaFill > 0 ? rightX + walaFill / 2 : rightX + barWidth / 2
    this.walaHpPercent.setPosition(walaCenter, 40)
  }

  createCountdown() {
    const { width } = this.cameras.main
    this.countdownText = this.add
      .text(width / 2, 60, String(FIGHT_SECONDS), {
        fontSize: this.isCompactViewport ? 40 : 48,
        color: '#8b0000',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(50)
  }

  createAttackQueue() {
    this.attackTypes = Object.keys(ATTACK_TYPES)
  }

  scheduleNextAttack() {
    if (!this.isFighting) return

    const attacker = Phaser.Math.RND.pick([MERON, WALA])
    const attackType = Phaser.Math.RND.pick(this.attackTypes)
    const delay = Phaser.Math.Between(800, 1800)

    this.time.delayedCall(delay, () => {
      if (this.isFighting) {
        this.performAttack(attacker, attackType)
        this.scheduleNextAttack()
      }
    })
  }

  performAttack(attacker, attackType) {
    const config = ATTACK_TYPES[attackType]
    const defender = attacker === MERON ? WALA : MERON
    const attackerSprite = attacker === MERON ? this.meronSprite : this.walaSprite
    const defenderSprite = attacker === MERON ? this.walaSprite : this.meronSprite

    const isCritical = attackType === 'flyScratch'
    playAttackWindUp(attackType)
    if (isCritical) {
      this.showCriticalStrike()
    }
    this.showAttackShout(attackerSprite, attackType)

    const onHit = () => {
      if (attackType === 'tackle') {
        playFightSound('dock')
      } else if (attackType === 'scratch') {
        playFightSound('scratch')
      } else if (attackType === 'flyScratch') {
        playFightSound('flyScratch')
      }

      this.playHitShake(defenderSprite, isCritical)
      this.applyDamage(defender, config.damage)
      this.emitAttack(defender, config.damage, isCritical)
      this.spawnClashGroundFx(attackerSprite, defenderSprite, isCritical)
      if (attackType === 'scratch' || attackType === 'flyScratch') {
        this.showSwordSlice(defenderSprite, isCritical)
        this.spawnBloodParticles(defenderSprite.x, defenderSprite.y - 20, isCritical)
      }
      if (isCritical) {
        this.showScreenBloodSplatter()
      }
      this.spawnFeathers(defenderSprite.x, defenderSprite.y)
    }

    if (attackType === 'flyScratch') {
      this.animateFlyScratch(attackerSprite, defenderSprite, config.duration, onHit)
    } else if (attackType === 'tackle') {
      this.animateDock(attackerSprite, defenderSprite, config.duration, onHit)
    } else {
      this.animateScratch(attackerSprite, defenderSprite, config.duration, onHit)
    }
  }

  playHitShake(defenderSprite, isCritical) {
    const camera = this.cameras.main
    const durationMs = isCritical ? 220 : 130
    const intensity = isCritical ? 0.012 : 0.006
    camera.shake(durationMs, intensity)

    const baseX = defenderSprite.x
    const baseY = defenderSprite.y
    const wobbleStrength = isCritical ? 14 : 9
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: isCritical ? 200 : 140,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const progress = tween.getValue()
        const damp = 1 - progress
        const phase = progress * Math.PI * 7
        const offsetX = Math.sin(phase) * wobbleStrength * damp
        const offsetY = Math.cos(phase * 0.9) * (wobbleStrength * 0.45) * damp
        defenderSprite.setPosition(baseX + offsetX, baseY + offsetY)
      },
      onComplete: () => {
        defenderSprite.setPosition(baseX, baseY)
      },
    })
  }

  /**
   * Draws a manga-style impact burst with spiky polygon + bold outlined text.
   * Punches in with a scale pop, holds briefly, then fades out.
   */
  showAttackShout(attackerSprite, attackType) {
    const label = ATTACK_LABELS[attackType] || attackType.toUpperCase()
    const isCritical = attackType === 'flyScratch'
    const isDock = attackType === 'tackle'

    const burstX = attackerSprite.x
    const burstY = attackerSprite.y - 88

    // Per-attack color themes
    const burstFillColor = isCritical ? 0xffffff : isDock ? 0xff8800 : 0xffee00
    const burstStrokeColor = isCritical ? 0xcc0000 : 0x111111
    const burstStrokeWidth = isCritical ? 2 : 1.5
    const textColor = isCritical ? '#cc0000' : '#111111'
    const textStrokeColor = isCritical ? '#ffffff' : '#ffffff'

    // Spike geometry — criticals get more, longer spikes
    const spikeCount = isCritical ? 22 : isDock ? 12 : 16
    const outerRadius = isCritical ? 78 : isDock ? 46 : 58
    const innerRadius = outerRadius * (isCritical ? 0.58 : 0.52)
    const fontSize = this.isCompactViewport ? (isCritical ? 20 : isDock ? 14 : 16) : isCritical ? 24 : isDock ? 17 : 20
    // Slight random tilt for energy; deterministic per call so it doesn't jitter
    const tiltDeg = isDock ? 0 : isCritical ? -6 : Phaser.Math.Between(-10, 10)

    // --- Draw spiky burst ---
    const burstGraphics = this.add.graphics().setDepth(89)

    burstGraphics.fillStyle(burstFillColor, 1)
    burstGraphics.lineStyle(burstStrokeWidth, burstStrokeColor, 1)
    burstGraphics.beginPath()

    const totalPoints = spikeCount * 2
    for (let pointIndex = 0; pointIndex < totalPoints; pointIndex++) {
      const angle = (pointIndex / totalPoints) * Math.PI * 2 - Math.PI / 2
      const radius = pointIndex % 2 === 0 ? outerRadius : innerRadius
      const pointX = burstX + Math.cos(angle) * radius
      const pointY = burstY + Math.sin(angle) * radius
      if (pointIndex === 0) {
        burstGraphics.moveTo(pointX, pointY)
      } else {
        burstGraphics.lineTo(pointX, pointY)
      }
    }

    burstGraphics.closePath()
    burstGraphics.fillPath()
    burstGraphics.strokePath()

    // Inner accent ring for critical — double-outline feel
    if (isCritical) {
      burstGraphics.lineStyle(2, 0xcc0000, 0.55)
      burstGraphics.strokeCircle(burstX, burstY, outerRadius * 0.48)
    }

    // --- Bold outlined impact text ---
    const shoutText = this.add
      .text(burstX, burstY, label, {
        fontFamily: 'Impact, "Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: textColor,
        stroke: textStrokeColor,
        strokeThickness: isCritical ? 7 : 5,
        letterSpacing: isCritical ? 3 : 1,
      })
      .setOrigin(0.5)
      .setDepth(90)
      .setAngle(tiltDeg)

    // Group burst + text so they scale together as one unit
    const impactContainer = this.add.container(burstX, burstY)
    burstGraphics.x -= burstX
    burstGraphics.y -= burstY
    shoutText.x -= burstX
    shoutText.y -= burstY
    impactContainer.add([burstGraphics, shoutText])
    impactContainer.setDepth(89)
    impactContainer.setScale(0.05)

    // Punch-in: snap to slightly over-scale, then settle, then fade
    this.tweens.add({
      targets: impactContainer,
      scale: 1.18,
      duration: 110,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: impactContainer,
          scale: 1,
          duration: 70,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: impactContainer,
              alpha: 0,
              duration: isCritical ? 380 : 280,
              delay: isCritical ? 320 : 200,
              ease: 'Power2',
              onComplete: () => impactContainer.destroy(),
            })
          },
        })
      },
    })
  }

  animateFlyScratch(attackerSprite, defenderSprite, duration, onHit) {
    const startX = attackerSprite.x
    const startY = attackerSprite.y
    const targetX = (attackerSprite.x + defenderSprite.x) / 2
    const targetY = defenderSprite.y
    const peakY = Math.min(startY, targetY) - 120
    const durationOut = duration * 0.5
    const durationBack = duration * 0.5

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: durationOut,
      ease: 'Power2.In',
      onUpdate: (tween) => {
        const progress = tween.getValue()
        attackerSprite.x = startX + (targetX - startX) * progress
        const arc = 4 * progress * (1 - progress)
        attackerSprite.y = startY + (targetY - startY) * progress + (peakY - (startY + targetY) / 2) * arc
      },
      onComplete: () => {
        onHit()
        this.tweens.add({
          targets: attackerSprite,
          x: startX,
          y: startY,
          duration: durationBack,
          ease: 'Power2.Out',
        })
      },
    })
  }

  animateDock(attackerSprite, defenderSprite, duration, onHit) {
    const startX = attackerSprite.x
    const startY = attackerSprite.y
    const targetX = (attackerSprite.x + defenderSprite.x) / 2
    const durationOut = duration * 0.35
    const durationBack = duration * 0.65

    this.tweens.add({
      targets: attackerSprite,
      x: targetX,
      y: startY + 25,
      duration: durationOut,
      ease: 'Power2.In',
      onComplete: () => {
        onHit()
        this.tweens.add({
          targets: attackerSprite,
          x: startX,
          y: startY,
          duration: durationBack,
          ease: 'Power2.Out',
        })
      },
    })
  }

  animateScratch(attackerSprite, defenderSprite, duration, onHit) {
    const startX = attackerSprite.x
    // Strike deeper into the defender's space for more impact
    const targetX = attackerSprite.x + (defenderSprite.x - attackerSprite.x) * 0.7 
    
    // 1. Wind-up (Anticipation)
    this.tweens.add({
      targets: attackerSprite,
      x: startX - 15, // Pull back slightly
      duration: duration * 0.2,
      ease: 'Sine.easeOut',
      onComplete: () => {
        
        // 2. The Strike
        this.tweens.add({
          targets: attackerSprite,
          x: targetX,
          duration: duration * 0.3,
          ease: 'Expo.easeIn', // Violent snap forward
          onComplete: () => {
            onHit()

            // 3. Hit-stop & Return (Follow-through)
            this.tweens.add({
              targets: attackerSprite,
              x: startX,
              duration: duration * 0.5,
              delay: 40, // Micro-pause on impact to sell the weight of the hit
              ease: 'Back.easeOut', // Bouncy, organic return
            })
          },
        })
      }
    })
  }

  /**
   * Draws a single diagonal sword-slice sweep with motion trail afterimages.
   * The slash animates from top-left to bottom-right across the defender's torso,
   * then fades quickly. A brief white hit-flash on the defender confirms the impact.
   */
  showSwordSlice(defenderSprite, isCritical = false) {
    const centerX = defenderSprite.x
    const centerY = defenderSprite.y - 20

    // Slash diagonal: top-left → bottom-right at ~-50° to mimic a claw/talon slash
    const slashAngleDeg = -50
    const slashAngleRad = (slashAngleDeg * Math.PI) / 180
    const halfLength = isCritical ? 60 : 42

    const slashFromX = centerX - Math.cos(slashAngleRad) * halfLength
    const slashFromY = centerY - Math.sin(slashAngleRad) * halfLength
    const slashToX = centerX + Math.cos(slashAngleRad) * halfLength
    const slashToY = centerY + Math.sin(slashAngleRad) * halfLength

    // Afterimage layers: index 0 = furthest behind (dimmest), last = main blade
    const trailLayers = isCritical ? 4 : 3
    const trailGraphics = []
    for (let layerIndex = 0; layerIndex < trailLayers; layerIndex++) {
      const layer = this.add.graphics().setDepth(85 + layerIndex)
      layer.setBlendMode(Phaser.BlendModes.ADD)
      trailGraphics.push(layer)
    }

    const sweepAnim = { progress: 0 }
    const sweepDurationMs = isCritical ? 90 : 110

    this.tweens.add({
      targets: sweepAnim,
      progress: 1,
      duration: sweepDurationMs,
      ease: 'Expo.easeOut',
      onUpdate: () => {
        const currentTipX = slashFromX + (slashToX - slashFromX) * sweepAnim.progress
        const currentTipY = slashFromY + (slashToY - slashFromY) * sweepAnim.progress

        trailGraphics.forEach((layer, layerIndex) => {
          layer.clear()

          // Each trail layer is slightly shorter and dimmer than the main blade
          const trailFraction = (layerIndex + 1) / trailLayers
          const trailAlpha = trailFraction * (isCritical ? 0.95 : 0.85)
          const trailThickness = trailFraction * (isCritical ? 4.5 : 3.5)
          const trailColor = isCritical ? 0xff4444 : 0xff2020

          // The trail tip lags behind the main tip proportionally
          const trailLag = (1 - trailFraction) * 0.35
          const trailProgress = Math.max(0, sweepAnim.progress - trailLag)
          const trailTipX = slashFromX + (slashToX - slashFromX) * trailProgress
          const trailTipY = slashFromY + (slashToY - slashFromY) * trailProgress

          layer.lineStyle(trailThickness, trailColor, trailAlpha)
          layer.beginPath()
          layer.moveTo(slashFromX, slashFromY)
          layer.lineTo(trailTipX, trailTipY)
          layer.strokePath()

          // Bright tip spark on the main blade layer
          if (layerIndex === trailLayers - 1 && sweepAnim.progress > 0.05) {
            const sparkRadius = isCritical ? 6 : 4
            layer.fillStyle(0xffffff, 0.9)
            layer.fillCircle(currentTipX, currentTipY, sparkRadius)
          }
        })
      },
      onComplete: () => {
        // Hit flash: briefly tint the defender white to confirm impact
        defenderSprite.setTint(0xffffff)
        this.time.delayedCall(70, () => defenderSprite.clearTint())

        // Hold the fully-drawn slash for a moment, then fade out
        this.time.delayedCall(60, () => {
          trailGraphics.forEach((layer) => {
            this.tweens.add({
              targets: layer,
              alpha: 0,
              duration: isCritical ? 280 : 200,
              ease: 'Power2',
              onComplete: () => layer.destroy(),
            })
          })
        })
      },
    })
  }

  /**
   * Full blood splatter: three emitter passes for a juicy impact —
   *   1. Big chunky drops that arc outward and fall with gravity
   *   2. Fine mist that scatters in a wide 360° burst
   *   3. Elongated streaks that shoot fast and short
   * Critical hits roughly double all counts and add extra speed.
   */
  spawnBloodParticles(hitX, hitY, isCritical) {
    this.ensureClashParticleTextures()

    // --- 1. Chunky arcing drops ---
    const chunkDropCount = this.isCompactViewport ? (isCritical ? 16 : 8) : isCritical ? 28 : 14
    const chunkDropEmitter = this.add.particles(0, 0, 'blood-drop', {
      maxParticles: this.isCompactViewport ? 36 : 60,
      lifespan: { min: 500, max: 1000 },
      speed: { min: 140, max: isCritical ? 380 : 260 },
      // Full upper hemisphere + sides so drops arc realistically
      angle: { min: 180, max: 360 },
      gravityY: 480,
      rotate: { min: 0, max: 360 },
      scale: { start: 1.4, end: 0.05 },
      alpha: { start: 1, end: 0 },
      tint: [0xdd0000, 0xaa0000, 0xff3333, 0x880000],
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    })
    chunkDropEmitter.setDepth(88)
    chunkDropEmitter.explode(chunkDropCount, hitX, hitY)

    // --- 2. Fine blood mist — full 360° so it feels like an explosive burst ---
    const mistCount = this.isCompactViewport ? (isCritical ? 12 : 6) : isCritical ? 22 : 10
    const mistEmitter = this.add.particles(0, 0, 'blood-drop', {
      maxParticles: this.isCompactViewport ? 24 : 40,
      lifespan: { min: 200, max: 480 },
      speed: { min: 40, max: isCritical ? 160 : 100 },
      angle: { min: 0, max: 360 },
      gravityY: 120,
      rotate: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.75, end: 0 },
      tint: [0xff2222, 0xcc0000],
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    })
    mistEmitter.setDepth(87)
    mistEmitter.explode(mistCount, hitX, hitY)

    // --- 3. Fast elongated streaks shooting outward ---
    const streakCount = this.isCompactViewport ? (isCritical ? 8 : 4) : isCritical ? 14 : 7
    const streakEmitter = this.add.particles(0, 0, 'blood-streak', {
      maxParticles: this.isCompactViewport ? 16 : 28,
      lifespan: { min: 300, max: 650 },
      speed: { min: 200, max: isCritical ? 480 : 320 },
      angle: { min: 185, max: 355 },
      gravityY: 500,
      rotate: { min: -80, max: 80 },
      scale: { start: 1.8, end: 0.05 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xbb0000, 0x990000, 0xee1111],
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    })
    streakEmitter.setDepth(88)
    streakEmitter.explode(streakCount, hitX, hitY)

    const cleanupDelayMs = 1400
    this.time.delayedCall(cleanupDelayMs, () => {
      chunkDropEmitter.destroy()
      mistEmitter.destroy()
      streakEmitter.destroy()
    })
  }

  /**
   * Stamps irregular blood blob shapes near the screen edges using a RenderTexture,
   * then fades the whole overlay out. Gives a physical "blood on the lens" feel.
   */
  showScreenBloodSplatter() {
    const { width, height } = this.cameras.main

    const splatterOverlay = this.add.renderTexture(0, 0, width, height)
    splatterOverlay.setDepth(150)

    // Temporary graphics used only for stamping blobs into the render texture
    const blobGraphics = this.make.graphics({ x: 0, y: 0, add: false })

    const blobCount = this.isCompactViewport ? Phaser.Math.Between(3, 6) : Phaser.Math.Between(6, 10)

    for (let blobIndex = 0; blobIndex < blobCount; blobIndex++) {
      // Pick a random point biased toward the screen edges
      const edgeSide = Phaser.Math.Between(0, 3)
      let blobX, blobY
      if (edgeSide === 0) {
        blobX = Phaser.Math.Between(0, width * 0.25)
        blobY = Phaser.Math.Between(0, height)
      } else if (edgeSide === 1) {
        blobX = Phaser.Math.Between(width * 0.75, width)
        blobY = Phaser.Math.Between(0, height)
      } else if (edgeSide === 2) {
        blobX = Phaser.Math.Between(0, width)
        blobY = Phaser.Math.Between(0, height * 0.25)
      } else {
        blobX = Phaser.Math.Between(0, width)
        blobY = Phaser.Math.Between(height * 0.75, height)
      }

      const blobRadius = Phaser.Math.Between(18, 48)
      const blobAlpha = Phaser.Math.FloatBetween(0.55, 0.9)
      const blobColor = Phaser.Math.RND.pick([0xcc0000, 0xaa0000, 0xee1111, 0x990000])

      blobGraphics.clear()
      blobGraphics.fillStyle(blobColor, blobAlpha)

      // Draw an irregular splat: a main circle with smaller satellite drops
      blobGraphics.fillCircle(blobX, blobY, blobRadius)

      const satelliteCount = Phaser.Math.Between(2, 5)
      for (let satelliteIndex = 0; satelliteIndex < satelliteCount; satelliteIndex++) {
        const satelliteAngle = Math.random() * Math.PI * 2
        const satelliteDistance = blobRadius * Phaser.Math.FloatBetween(0.7, 1.6)
        const satelliteRadius = blobRadius * Phaser.Math.FloatBetween(0.2, 0.55)
        const satelliteX = blobX + Math.cos(satelliteAngle) * satelliteDistance
        const satelliteY = blobY + Math.sin(satelliteAngle) * satelliteDistance
        blobGraphics.fillCircle(satelliteX, satelliteY, satelliteRadius)
      }

      splatterOverlay.draw(blobGraphics, 0, 0)
    }

    blobGraphics.destroy()

    // Hold briefly then fade out
    this.tweens.add({
      targets: splatterOverlay,
      alpha: 0,
      duration: 700,
      delay: 180,
      ease: 'Power2',
      onComplete: () => splatterOverlay.destroy(),
    })
  }

  spawnFeathers(x, y) {
    const featherCount = this.isCompactViewport ? 3 : 5
    for (let i = 0; i < featherCount; i++) {
      const feather = this.add.ellipse(x + Phaser.Math.Between(-30, 30), y, 8, 15, 0xd2b48c)
      this.tweens.add({
        targets: feather,
        y: feather.y - 80,
        alpha: 0,
        duration: 600,
        onComplete: () => feather.destroy(),
      })
    }
  }

  showCriticalStrike() {
    playFightSound('criticalBanner')

    const { width } = this.cameras.main
    const text = this.add
      .text(width / 2, this.isCompactViewport ? 110 : 120, 'CRITICAL STRIKE!', {
        fontSize: this.isCompactViewport ? 28 : 36,
        color: '#8b0000',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(100)

    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1.2,
      duration: 150,
      yoyo: true,
      hold: 300,
      onComplete: () => text.destroy(),
    })
  }

  applyDamage(defender, damage) {
    if (defender === MERON) {
      this.meronHp = Math.max(0, this.meronHp - damage)
    } else {
      this.walaHp = Math.max(0, this.walaHp - damage)
    }
    this.updateHpBars()
    this.checkEndFight()
  }

  emitAttack(defender, damage, isCritical) {
    if (this.emit) {
      this.emit('attack', { defender, damage, isCritical })
    }
  }

  checkEndFight() {
    if (this.meronHp <= 0 || this.walaHp <= 0) {
      this.isFighting = false
      this.countdownTimer?.destroy()
      this.showKO()
      this.time.delayedCall(900, () => this.endFight())
    }
  }

  showKO() {
    playFightSound('ko')

    const { width, height } = this.cameras.main
    const koText = this.add
      .text(width / 2, height / 2 - 40, 'KO', {
        fontSize: 72,
        color: '#8b0000',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(150)

    this.tweens.add({
      targets: koText,
      alpha: 1,
      scale: 1.3,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      hold: 400,
    })
  }

  startCountdown() {
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--
        this.countdownText.setText(this.timeRemaining.toString())

        if (this.timeRemaining <= 0) {
          this.endFight()
        }
      },
      repeat: FIGHT_SECONDS - 1,
    })
  }

  endFight() {
    this.isFighting = false
    this.countdownTimer?.destroy()
    stopFightAtmosphere()

    let winner = null
    if (this.meronHp > this.walaHp) {
      winner = MERON
    } else if (this.walaHp > this.meronHp) {
      winner = WALA
    }

    if (this.emit) {
      this.emit('fightEnd', { winner, meronHp: this.meronHp, walaHp: this.walaHp })
    }
  }
}
