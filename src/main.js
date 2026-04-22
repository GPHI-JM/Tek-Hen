import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import {
  initializeFacebookInstantGames,
  primeFacebookLoadingProgress,
  startFacebookGame,
} from './platform/facebookInstant.js'

const fbInstant = typeof window !== 'undefined' ? window.FBInstant : null

if (fbInstant) {
  await initializeFacebookInstantGames().catch(() => null)
  primeFacebookLoadingProgress(5)
  void startFacebookGame().catch(() => null)
}

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
