const facebookContext = {
  enabled: false,
  initialized: false,
  started: false,
  loadingPercent: 0,
  playerId: null,
  playerName: null,
  photoUrl: null,
  contextId: null,
}

let initializePromise = null
let startPromise = null

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getFBInstant() {
  if (typeof window === 'undefined') {
    return null
  }
  return window.FBInstant ?? null
}

function waitForFBInstant(timeoutMs = 10000) {
  const existing = getFBInstant()
  if (existing) {
    return Promise.resolve(existing)
  }

  if (typeof window === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const startedAt = Date.now()
    const timerId = window.setInterval(() => {
      const FBInstant = getFBInstant()
      if (FBInstant) {
        clearInterval(timerId)
        resolve(FBInstant)
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timerId)
        resolve(null)
      }
    }, 50)
  })
}

export function hasFacebookInstantGames() {
  return Boolean(getFBInstant())
}

export function primeFacebookLoadingProgress(percent = 1) {
  const FBInstant = getFBInstant()
  if (!FBInstant) return
  FBInstant.setLoadingProgress(clampPercent(percent))
}

export async function initializeFacebookInstantGames() {
  if (initializePromise) {
    return initializePromise
  }

  initializePromise = (async () => {
    const FBInstant = await waitForFBInstant()
    if (!FBInstant) {
      return null
    }

    facebookContext.enabled = true
    await FBInstant.initializeAsync()
    facebookContext.initialized = true
    facebookContext.playerId = FBInstant.player?.getID?.() ?? null
    facebookContext.contextId = FBInstant.context?.getID?.() ?? null
    primeFacebookLoadingProgress(1)

    return FBInstant
  })()

  return initializePromise
}

export async function startFacebookGame() {
  if (startPromise) {
    return startPromise
  }

  startPromise = (async () => {
    const FBInstant = await initializeFacebookInstantGames()
    if (!FBInstant) {
      return null
    }

    primeFacebookLoadingProgress(100)
    await FBInstant.startGameAsync()
    facebookContext.started = true
    facebookContext.playerName = FBInstant.player?.getName?.() ?? null
    facebookContext.photoUrl = FBInstant.player?.getPhoto?.() ?? null

    return FBInstant
  })()

  return startPromise
}

export function setFacebookLoadingProgress(percent) {
  const value = clampPercent(percent)
  facebookContext.loadingPercent = value
  const FBInstant = getFBInstant()
  FBInstant?.setLoadingProgress?.(value)
}

export function syncFacebookContextToRegistry(game) {
  if (!game?.registry) {
    return
  }

  game.registry.set('facebookContext', {
    ...facebookContext,
  })
}

export function getFacebookContextSnapshot() {
  return {
    ...facebookContext,
  }
}
