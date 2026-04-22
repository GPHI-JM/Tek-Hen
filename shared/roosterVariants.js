/**
 * Five fight rooster looks: MERON atlas (id `manok`, UI label Pula), bulik, plus three new atlases.
 * Each fight randomly picks one variant per side (MERON / WALA).
 *
 * facesLeft: bulik-idle.png is drawn facing left; flip rules invert so MERON/WALA still face each other.
 * All other atlases are treated as facing right (default false).
 */

export function publicAssetPath(path) {
  const base = import.meta?.env?.BASE_URL ?? '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${path.replace(/^\/+/, '')}`
}

export const TALISAYIN_FRAMES = [
  't1.png',
  't2.png',
  't3.png',
  't4.png',
  't5.png',
  't6.png',
  't7.png',
  't8.png',
  't9.png',
  't10.png',
  't11.png',
  't12.png',
  't13.png',
  't14.png',
  't15.png',
  't16.png',
  't17.png',
  't18.png',
  't19.png',
  't20.png',
  't21.png',
  't22.png',
  't23.png',
  't24.png',
]

export const WHITEKELSO_FRAMES = [
  'wk1.png',
  'wk2.png',
  'wk3.png',
  'wk4.png',
  'wk5.png',
  'wk6.png',
  'wk7.png',
  'wk8.png',
  'wk10.png',
  'wk11.png',
  'wk12.png',
  'wk13.png',
  'wk14.png',
  'wk15.png',
  'wk16.png',
  'wk17.png',
  'wk19.png',
  'wk20.png',
  'wk21.png',
  'wk22.png',
  'wk23.png',
  'wk24.png',
]

export const SWEATER_FRAMES = [
  's1.png',
  's2.png',
  's3.png',
  's4.png',
  's5.png',
  's6.png',
  's7.png',
  's8.png',
  's10.png',
  's11.png',
  's12.png',
  's13.png',
  's14.png',
  's15.png',
  's16.png',
  's17.png',
  's19.png',
  's20.png',
  's21.png',
  's22.png',
  's23.png',
  's24.png',
]

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   atlasKey: string,
 *   animKey: string,
 *   firstFrame: string,
 *   facesLeft?: boolean,
 *   imagePath?: string,
 *   jsonPath?: string,
 *   frameNames: string[] | null,
 *   iconPath?: string,
 * }} RoosterVariant
 */

/** @type {RoosterVariant[]} */
export const ROOSTER_VARIANTS = [
  {
    id: 'sweater',
    label: 'Sweater',
    atlasKey: 'sweater',
    animKey: 'idle-sweater',
    firstFrame: 's1.png',
    facesLeft: false,
    imagePath: publicAssetPath('roosters/texture_sweater.png'),
    jsonPath: publicAssetPath('roosters/texture_sweater.json'),
    frameNames: SWEATER_FRAMES,
    iconPath: publicAssetPath('roosters/sweater-icon.png'),
  },
  {
    id: 'talisayin',
    label: 'Talisayin',
    atlasKey: 'talisayin',
    animKey: 'idle-talisayin',
    firstFrame: 't1.png',
    facesLeft: false,
    imagePath: publicAssetPath('roosters/texture_talisayin.png'),
    jsonPath: publicAssetPath('roosters/texture_talisayin.json'),
    frameNames: TALISAYIN_FRAMES,
    iconPath: publicAssetPath('roosters/talisayin-icon.png'),
  },
  {
    id: 'bulik',
    label: 'Bulik',
    atlasKey: 'wala',
    animKey: 'wala-idle',
    firstFrame: 'w1.png',
    facesLeft: true,
    imagePath: publicAssetPath('bulik-idle.png'),
    jsonPath: publicAssetPath('bulik-idle.json'),
    frameNames: null,
    iconPath: publicAssetPath('roosters/bulik-icon.png'),
  },
  {
    id: 'manok',
    label: 'Pula',
    atlasKey: 'meron',
    animKey: 'meron-idle',
    firstFrame: 's1.png',
    facesLeft: false,
    imagePath: publicAssetPath('manok-idle.png'),
    jsonPath: publicAssetPath('manok-idle.json'),
    frameNames: null,
    iconPath: publicAssetPath('roosters/pula-icon.png'),
  },
  {
    id: 'whitekelso',
    label: 'White Kelso',
    atlasKey: 'whitekelso',
    animKey: 'idle-whitekelso',
    firstFrame: 'wk1.png',
    facesLeft: false,
    imagePath: publicAssetPath('roosters/whitekelso.png'),
    jsonPath: publicAssetPath('roosters/texture_whitekelso.json'),
    frameNames: WHITEKELSO_FRAMES,
    iconPath: publicAssetPath('roosters/white-kelso-icon.png'),
  },
]
