/**
 * Fight SFX (Web Audio) + looping fight BGM (full `Clash_of_the_Iron_Crown.mp3`, no mid-track cut).
 */

let sharedAudioContext = null

/** @type {GainNode | null} */
let sfxGainNode = null

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null
  }
  if (!sharedAudioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor) {
      return null
    }
    sharedAudioContext = new AudioContextConstructor()
  }
  return sharedAudioContext
}

function getSfxGain(audioContext) {
  if (!sfxGainNode) {
    sfxGainNode = audioContext.createGain()
    sfxGainNode.connect(audioContext.destination)
  }
  sfxGainNode.gain.value = 0.85
  return sfxGainNode
}

function randomPanValue() {
  return (Math.random() * 2 - 1) * 0.48
}

function connectThroughPanner(audioContext, lastNode, panValue = randomPanValue()) {
  try {
    if (typeof audioContext.createStereoPanner === 'function') {
      const panner = audioContext.createStereoPanner()
      panner.pan.value = panValue
      lastNode.connect(panner)
      panner.connect(getSfxGain(audioContext))
      return
    }
  } catch {
    // Some environments lack StereoPanner; fall through.
  }
  lastNode.connect(getSfxGain(audioContext))
}

export async function resumeFightAudio() {
  const audioContext = getAudioContext()
  if (!audioContext) {
    return
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
}

/** Call from a pointer/touch handler on the game (same user-gesture stack — required on iOS Safari). */
export function tryResumeFightAudioSync() {
  const audioContext = getAudioContext()
  if (!audioContext) {
    return
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

export function installFightAudioResumeOnFirstGesture() {
  if (typeof window === 'undefined') {
    return
  }
  const primeAudioContext = () => {
    void resumeFightAudio()
  }
  window.addEventListener('pointerdown', primeAudioContext, { capture: true })
  window.addEventListener('keydown', primeAudioContext, { capture: true })
  window.addEventListener('touchend', primeAudioContext, { capture: true })
}

const FIGHT_MUSIC_URL = '/music/Clash_of_the_Iron_Crown.mp3'

/** @type {AudioBuffer | null} */
let fightMusicLoopBuffer = null
/** @type {Promise<AudioBuffer | null> | null} */
let fightMusicLoadPromise = null
/** @type {AudioBufferSourceNode | null} */
let fightMusicSourceNode = null
/** @type {GainNode | null} */
let musicGainNode = null

function getMusicGain(audioContext) {
  if (!musicGainNode) {
    musicGainNode = audioContext.createGain()
    musicGainNode.gain.value = 0.2
    musicGainNode.connect(audioContext.destination)
  }
  return musicGainNode
}

async function loadFightMusicLoopBuffer(audioContext) {
  if (fightMusicLoopBuffer) {
    return fightMusicLoopBuffer
  }
  if (!fightMusicLoadPromise) {
    fightMusicLoadPromise = (async () => {
      try {
        const response = await fetch(FIGHT_MUSIC_URL)
        if (!response.ok) {
          return null
        }
        const arrayBuffer = await response.arrayBuffer()
        const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0))
        fightMusicLoopBuffer = decoded
        return decoded
      } catch {
        return null
      } finally {
        fightMusicLoadPromise = null
      }
    })()
  }
  return fightMusicLoadPromise
}

function stopFightMusic() {
  if (!fightMusicSourceNode) {
    return
  }
  try {
    fightMusicSourceNode.stop()
  } catch {
    // already stopped
  }
  try {
    fightMusicSourceNode.disconnect()
  } catch {
    // ignore
  }
  fightMusicSourceNode = null
}

async function startFightMusicLoop(audioContext) {
  stopFightMusic()
  const loopBuffer = await loadFightMusicLoopBuffer(audioContext)
  if (!loopBuffer) {
    return
  }
  const source = audioContext.createBufferSource()
  source.buffer = loopBuffer
  source.loop = true
  source.connect(getMusicGain(audioContext))
  source.start(0)
  fightMusicSourceNode = source
}

export async function startFightAtmosphere() {
  await resumeFightAudio()
  const audioContext = getAudioContext()
  if (!audioContext || audioContext.state !== 'running') {
    return
  }
  await startFightMusicLoop(audioContext)
}

export function stopFightAtmosphere() {
  stopFightMusic()
}

function createNoiseBuffer(audioContext, durationSeconds) {
  const bufferSize = Math.floor(audioContext.sampleRate * durationSeconds)
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const channelData = buffer.getChannelData(0)
  for (let index = 0; index < bufferSize; index += 1) {
    channelData[index] = Math.random() * 2 - 1
  }
  return buffer
}

// ——— Wind-up (attack start — sells motion before impact) ———

function playWindDock(audioContext, startTime) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(36, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(130, startTime + 0.1)
  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.12, startTime + 0.025)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12)
  const lowpass = audioContext.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 380
  oscillator.connect(lowpass)
  lowpass.connect(gainNode)
  connectThroughPanner(audioContext, gainNode, -0.32)

  const stompBuffer = createNoiseBuffer(audioContext, 0.04)
  const stompSource = audioContext.createBufferSource()
  stompSource.buffer = stompBuffer
  const stompFilter = audioContext.createBiquadFilter()
  stompFilter.type = 'lowpass'
  stompFilter.frequency.value = 160
  const stompGain = audioContext.createGain()
  stompGain.gain.setValueAtTime(0.0001, startTime + 0.05)
  stompGain.gain.exponentialRampToValueAtTime(0.06, startTime + 0.055)
  stompGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1)
  stompSource.connect(stompFilter)
  stompFilter.connect(stompGain)
  connectThroughPanner(audioContext, stompGain, 0.2)
  stompSource.start(startTime + 0.05)
  stompSource.stop(startTime + 0.12)

  oscillator.start(startTime)
  oscillator.stop(startTime + 0.14)
}

function playWindScratch(audioContext, startTime) {
  const buffer = createNoiseBuffer(audioContext, 0.1)
  const source = audioContext.createBufferSource()
  source.buffer = buffer
  const bandpass = audioContext.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.setValueAtTime(180, startTime)
  bandpass.frequency.exponentialRampToValueAtTime(6200, startTime + 0.08)
  bandpass.Q.value = 0.85
  const gainNode = audioContext.createGain()
  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.11, startTime + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1)
  source.connect(bandpass)
  bandpass.connect(gainNode)
  connectThroughPanner(audioContext, gainNode, 0.35)

  const chirpOsc = audioContext.createOscillator()
  const chirpGain = audioContext.createGain()
  chirpOsc.type = 'sine'
  chirpOsc.frequency.setValueAtTime(220, startTime)
  chirpOsc.frequency.exponentialRampToValueAtTime(1800, startTime + 0.07)
  chirpGain.gain.setValueAtTime(0.0001, startTime)
  chirpGain.gain.exponentialRampToValueAtTime(0.05, startTime + 0.015)
  chirpGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09)
  chirpOsc.connect(chirpGain)
  connectThroughPanner(audioContext, chirpGain, -0.25)
  chirpOsc.start(startTime)
  chirpOsc.stop(startTime + 0.1)

  source.start(startTime)
  source.stop(startTime + 0.1)
}

function playWindFly(audioContext, startTime) {
  const whooshBuffer = createNoiseBuffer(audioContext, 0.22)
  const whooshSource = audioContext.createBufferSource()
  whooshSource.buffer = whooshBuffer
  const filterNode = audioContext.createBiquadFilter()
  filterNode.type = 'bandpass'
  filterNode.frequency.setValueAtTime(900, startTime)
  filterNode.frequency.exponentialRampToValueAtTime(7500, startTime + 0.12)
  filterNode.Q.value = 0.65
  const gainNode = audioContext.createGain()
  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.exponentialRampToValueAtTime(0.14, startTime + 0.04)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2)
  whooshSource.connect(filterNode)
  filterNode.connect(gainNode)
  connectThroughPanner(audioContext, gainNode, 0.15)

  const launchOsc = audioContext.createOscillator()
  const launchGain = audioContext.createGain()
  launchOsc.type = 'triangle'
  launchOsc.frequency.setValueAtTime(350, startTime)
  launchOsc.frequency.exponentialRampToValueAtTime(2400, startTime + 0.1)
  launchGain.gain.setValueAtTime(0.0001, startTime)
  launchGain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.03)
  launchGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18)
  launchOsc.connect(launchGain)
  connectThroughPanner(audioContext, launchGain, -0.2)
  launchOsc.start(startTime)
  launchOsc.stop(startTime + 0.2)

  whooshSource.start(startTime)
  whooshSource.stop(startTime + 0.60)
}

/**
 * Call when an attack animation begins (before impact SFX).
 * @param {'dock' | 'scratch' | 'flyScratch'} attackType
 */
export function playAttackWindUp(attackType) {
  const audioContext = getAudioContext()
  if (!audioContext) {
    return
  }
  tryResumeFightAudioSync()
  void resumeFightAudio().then(() => {
    if (audioContext.state !== 'running') {
      return
    }
    const startTime = audioContext.currentTime
    if (attackType === 'dock') {
      playWindDock(audioContext, startTime)
    } else if (attackType === 'scratch') {
      playWindScratch(audioContext, startTime)
    } else if (attackType === 'flyScratch') {
      playWindFly(audioContext, startTime)
    }
  })
}

// ——— Impact hits ———

function playSwordClash(audioContext, startTime) {
  const pingOne = audioContext.createOscillator()
  const gainOne = audioContext.createGain()
  pingOne.type = 'sine'
  pingOne.frequency.setValueAtTime(1480, startTime)
  pingOne.frequency.exponentialRampToValueAtTime(480, startTime + 0.07)
  gainOne.gain.setValueAtTime(0.0001, startTime)
  gainOne.gain.exponentialRampToValueAtTime(0.2, startTime + 0.003)
  gainOne.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12)
  pingOne.connect(gainOne)
  connectThroughPanner(audioContext, gainOne, 0.38)
  pingOne.start(startTime)
  pingOne.stop(startTime + 0.13)

  const pingTwo = audioContext.createOscillator()
  const gainTwo = audioContext.createGain()
  pingTwo.type = 'triangle'
  pingTwo.frequency.setValueAtTime(820, startTime + 0.01)
  pingTwo.frequency.exponentialRampToValueAtTime(280, startTime + 0.09)
  gainTwo.gain.setValueAtTime(0.0001, startTime + 0.01)
  gainTwo.gain.exponentialRampToValueAtTime(0.14, startTime + 0.014)
  gainTwo.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12)
  pingTwo.connect(gainTwo)
  connectThroughPanner(audioContext, gainTwo, -0.35)
  pingTwo.start(startTime + 0.01)
  pingTwo.stop(startTime + 0.14)

  const pingThree = audioContext.createOscillator()
  const gainThree = audioContext.createGain()
  pingThree.type = 'square'
  pingThree.frequency.setValueAtTime(2400, startTime + 0.006)
  pingThree.frequency.exponentialRampToValueAtTime(900, startTime + 0.05)
  gainThree.gain.setValueAtTime(0.0001, startTime + 0.006)
  gainThree.gain.exponentialRampToValueAtTime(0.06, startTime + 0.01)
  gainThree.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08)
  const pingFilter = audioContext.createBiquadFilter()
  pingFilter.type = 'lowpass'
  pingFilter.frequency.value = 4200
  pingThree.connect(pingFilter)
  pingFilter.connect(gainThree)
  connectThroughPanner(audioContext, gainThree, -0.08)
  pingThree.start(startTime + 0.006)
  pingThree.stop(startTime + 0.09)

  const sparkBuffer = createNoiseBuffer(audioContext, 0.06)
  const sparkSource = audioContext.createBufferSource()
  sparkSource.buffer = sparkBuffer
  const highpass = audioContext.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 2200
  const sparkGain = audioContext.createGain()
  sparkGain.gain.setValueAtTime(0.0001, startTime)
  sparkGain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.002)
  sparkGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.06)
  sparkSource.connect(highpass)
  highpass.connect(sparkGain)
  connectThroughPanner(audioContext, sparkGain, 0.42)
  sparkSource.start(startTime)
  sparkSource.stop(startTime + 0.07)

  const subOsc = audioContext.createOscillator()
  const subGain = audioContext.createGain()
  subOsc.type = 'sine'
  subOsc.frequency.setValueAtTime(72, startTime)
  subOsc.frequency.exponentialRampToValueAtTime(38, startTime + 0.14)
  subGain.gain.setValueAtTime(0.0001, startTime)
  subGain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.02)
  subGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18)
  subOsc.connect(subGain)
  connectThroughPanner(audioContext, subGain, 0)
  subOsc.start(startTime)
  subOsc.stop(startTime + 0.2)
}

function playSwordSlash(audioContext, startTime) {
  const whooshBuffer = createNoiseBuffer(audioContext, 0.14)
  const whooshSource = audioContext.createBufferSource()
  whooshSource.buffer = whooshBuffer
  const bandpass = audioContext.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.setValueAtTime(7200, startTime)
  bandpass.frequency.exponentialRampToValueAtTime(650, startTime + 0.12)
  bandpass.Q.value = 1.35
  const whooshGain = audioContext.createGain()
  whooshGain.gain.setValueAtTime(0.0001, startTime)
  whooshGain.gain.exponentialRampToValueAtTime(0.17, startTime + 0.012)
  whooshGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13)
  whooshSource.connect(bandpass)
  bandpass.connect(whooshGain)
  connectThroughPanner(audioContext, whooshGain, 0.4)
  whooshSource.start(startTime)
  whooshSource.stop(startTime + 0.14)

  const sliceOsc = audioContext.createOscillator()
  const sliceGain = audioContext.createGain()
  sliceOsc.type = 'sawtooth'
  sliceOsc.frequency.setValueAtTime(8800, startTime + 0.015)
  sliceOsc.frequency.exponentialRampToValueAtTime(1100, startTime + 0.08)
  sliceGain.gain.setValueAtTime(0.0001, startTime + 0.015)
  sliceGain.gain.exponentialRampToValueAtTime(0.07, startTime + 0.022)
  sliceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.11)
  const sliceFilter = audioContext.createBiquadFilter()
  sliceFilter.type = 'lowpass'
  sliceFilter.frequency.value = 5200
  sliceOsc.connect(sliceFilter)
  sliceFilter.connect(sliceGain)
  connectThroughPanner(audioContext, sliceGain, -0.38)
  sliceOsc.start(startTime + 0.015)
  sliceOsc.stop(startTime + 0.12)

  const ringOscillator = audioContext.createOscillator()
  const ringGain = audioContext.createGain()
  ringOscillator.type = 'sine'
  ringOscillator.frequency.setValueAtTime(3100, startTime + 0.018)
  ringOscillator.frequency.exponentialRampToValueAtTime(1200, startTime + 0.1)
  ringGain.gain.setValueAtTime(0.0001, startTime + 0.018)
  ringGain.gain.exponentialRampToValueAtTime(0.09, startTime + 0.028)
  ringGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13)
  ringOscillator.connect(ringGain)
  connectThroughPanner(audioContext, ringGain, 0.12)
  ringOscillator.start(startTime + 0.018)
  ringOscillator.stop(startTime + 0.14)

  const shimmerOscillator = audioContext.createOscillator()
  const shimmerGain = audioContext.createGain()
  shimmerOscillator.type = 'sine'
  shimmerOscillator.frequency.setValueAtTime(3120, startTime + 0.02)
  shimmerGain.gain.setValueAtTime(0.0001, startTime + 0.02)
  shimmerGain.gain.exponentialRampToValueAtTime(0.04, startTime + 0.03)
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09)
  shimmerOscillator.connect(shimmerGain)
  connectThroughPanner(audioContext, shimmerGain, -0.15)
  shimmerOscillator.start(startTime + 0.02)
  shimmerOscillator.stop(startTime + 0.1)
}

function playEpicSwordStrike(audioContext, startTime) {
  const whooshBuffer = createNoiseBuffer(audioContext, 0.22)
  const whooshSource = audioContext.createBufferSource()
  whooshSource.buffer = whooshBuffer
  const sweepFilter = audioContext.createBiquadFilter()
  sweepFilter.type = 'bandpass'
  sweepFilter.frequency.setValueAtTime(8200, startTime)
  sweepFilter.frequency.exponentialRampToValueAtTime(320, startTime + 0.18)
  sweepFilter.Q.value = 0.95
  const whooshGain = audioContext.createGain()
  whooshGain.gain.setValueAtTime(0.0001, startTime)
  whooshGain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.025)
  whooshGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2)
  whooshSource.connect(sweepFilter)
  sweepFilter.connect(whooshGain)
  connectThroughPanner(audioContext, whooshGain, 0.35)
  whooshSource.start(startTime)
  whooshSource.stop(startTime + 0.22)

  const clangFrequencies = [660, 990, 1320, 1760]
  clangFrequencies.forEach((frequency, index) => {
    const clangOscillator = audioContext.createOscillator()
    const clangGain = audioContext.createGain()
    clangOscillator.type = 'triangle'
    const delay = startTime + index * 0.014
    clangOscillator.frequency.setValueAtTime(frequency, delay)
    clangOscillator.frequency.exponentialRampToValueAtTime(frequency * 0.45, delay + 0.16)
    clangGain.gain.setValueAtTime(0.0001, delay)
    clangGain.gain.exponentialRampToValueAtTime(0.12 - index * 0.018, delay + 0.005)
    clangGain.gain.exponentialRampToValueAtTime(0.0001, delay + 0.22)
    clangOscillator.connect(clangGain)
    connectThroughPanner(audioContext, clangGain, index % 2 === 0 ? 0.3 : -0.3)
    clangOscillator.start(delay)
    clangOscillator.stop(delay + 0.24)
  })

  const subOscillator = audioContext.createOscillator()
  const subGain = audioContext.createGain()
  subOscillator.type = 'sine'
  subOscillator.frequency.setValueAtTime(105, startTime)
  subOscillator.frequency.exponentialRampToValueAtTime(36, startTime + 0.22)
  subGain.gain.setValueAtTime(0.0001, startTime)
  subGain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.035)
  subGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.32)
  subOscillator.connect(subGain)
  connectThroughPanner(audioContext, subGain, 0)
  subOscillator.start(startTime)
  subOscillator.stop(startTime + 0.35)

  const metalNoiseBuffer = createNoiseBuffer(audioContext, 0.1)
  const metalNoiseSource = audioContext.createBufferSource()
  metalNoiseSource.buffer = metalNoiseBuffer
  const metalFilter = audioContext.createBiquadFilter()
  metalFilter.type = 'peaking'
  metalFilter.frequency.value = 2800
  metalFilter.Q.value = 3.5
  const metalGain = audioContext.createGain()
  metalGain.gain.setValueAtTime(0.0001, startTime + 0.03)
  metalGain.gain.exponentialRampToValueAtTime(0.11, startTime + 0.04)
  metalGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14)
  metalNoiseSource.connect(metalFilter)
  metalFilter.connect(metalGain)
  connectThroughPanner(audioContext, metalGain, -0.22)
  metalNoiseSource.start(startTime + 0.03)
  metalNoiseSource.stop(startTime + 0.15)

  const stingOsc = audioContext.createOscillator()
  const stingGain = audioContext.createGain()
  stingOsc.type = 'square'
  stingOsc.frequency.setValueAtTime(2400, startTime + 0.02)
  stingOsc.frequency.exponentialRampToValueAtTime(400, startTime + 0.12)
  stingGain.gain.setValueAtTime(0.0001, startTime + 0.02)
  stingGain.gain.exponentialRampToValueAtTime(0.05, startTime + 0.03)
  stingGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14)
  const stingFilter = audioContext.createBiquadFilter()
  stingFilter.type = 'lowpass'
  stingFilter.frequency.value = 6000
  stingOsc.connect(stingFilter)
  stingFilter.connect(stingGain)
  connectThroughPanner(audioContext, stingGain, 0.25)
  stingOsc.start(startTime + 0.02)
  stingOsc.stop(startTime + 0.16)
}

function playCriticalBannerSting(audioContext, startTime) {
  const chordFrequencies = [392, 493.88, 587.33]
  chordFrequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.type = 'sawtooth'
    const delay = startTime + index * 0.02
    oscillator.frequency.setValueAtTime(frequency, delay)
    gainNode.gain.setValueAtTime(0.0001, delay)
    gainNode.gain.exponentialRampToValueAtTime(0.055 - index * 0.008, delay + 0.04)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, delay + 0.48)
    const filterNode = audioContext.createBiquadFilter()
    filterNode.type = 'lowpass'
    filterNode.frequency.value = 2400
    oscillator.connect(filterNode)
    filterNode.connect(gainNode)
    connectThroughPanner(audioContext, gainNode, (index - 1) * 0.2)
    oscillator.start(delay)
    oscillator.stop(delay + 0.52)
  })

  const leadOscillator = audioContext.createOscillator()
  const leadGain = audioContext.createGain()
  leadOscillator.type = 'square'
  leadOscillator.frequency.setValueAtTime(783.99, startTime)
  leadOscillator.frequency.setValueAtTime(987.77, startTime + 0.08)
  leadOscillator.frequency.exponentialRampToValueAtTime(587.33, startTime + 0.35)
  leadGain.gain.setValueAtTime(0.0001, startTime)
  leadGain.gain.exponentialRampToValueAtTime(0.07, startTime + 0.05)
  leadGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.42)
  const leadFilter = audioContext.createBiquadFilter()
  leadFilter.type = 'lowpass'
  leadFilter.frequency.value = 4200
  leadOscillator.connect(leadFilter)
  leadFilter.connect(leadGain)
  connectThroughPanner(audioContext, leadGain, 0.15)
  leadOscillator.start(startTime)
  leadOscillator.stop(startTime + 0.44)
}

function playKoGong(audioContext, startTime) {
  const bodyOscillator = audioContext.createOscillator()
  const bodyGain = audioContext.createGain()
  bodyOscillator.type = 'sine'
  bodyOscillator.frequency.setValueAtTime(155, startTime)
  bodyOscillator.frequency.exponentialRampToValueAtTime(38, startTime + 0.75)
  bodyGain.gain.setValueAtTime(0.0001, startTime)
  bodyGain.gain.exponentialRampToValueAtTime(0.44, startTime + 0.05)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.85)
  bodyOscillator.connect(bodyGain)
  connectThroughPanner(audioContext, bodyGain, -0.1)
  bodyOscillator.start(startTime)
  bodyOscillator.stop(startTime + 0.9)

  const metalOscillator = audioContext.createOscillator()
  const metalGain = audioContext.createGain()
  metalOscillator.type = 'triangle'
  metalOscillator.frequency.setValueAtTime(220, startTime)
  metalOscillator.frequency.exponentialRampToValueAtTime(90, startTime + 0.5)
  metalGain.gain.setValueAtTime(0.0001, startTime)
  metalGain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.02)
  metalGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65)
  metalOscillator.connect(metalGain)
  connectThroughPanner(audioContext, metalGain, 0.12)
  metalOscillator.start(startTime)
  metalOscillator.stop(startTime + 0.7)
}

/**
 * @param {'dock' | 'scratch' | 'flyScratch' | 'criticalBanner' | 'ko'} soundId
 */
export function playFightSound(soundId) {
  const audioContext = getAudioContext()
  if (!audioContext) {
    return
  }
  tryResumeFightAudioSync()
  void resumeFightAudio().then(() => {
    if (audioContext.state !== 'running') {
      return
    }
    const startTime = audioContext.currentTime
    switch (soundId) {
      case 'dock':
        playSwordClash(audioContext, startTime)
        break
      case 'scratch':
        playSwordSlash(audioContext, startTime)
        break
      case 'flyScratch':
        playEpicSwordStrike(audioContext, startTime)
        break
      case 'criticalBanner':
        playCriticalBannerSting(audioContext, startTime)
        break
      case 'ko':
        playKoGong(audioContext, startTime)
        break
      default:
        break
    }
  })
}
