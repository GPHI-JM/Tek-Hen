import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import {
  initializeFacebookInstantGames,
  primeFacebookLoadingProgress,
} from './platform/facebookInstant.js'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

void initializeFacebookInstantGames()
  .then(() => {
    primeFacebookLoadingProgress(5)
  })
  .catch(() => null)
