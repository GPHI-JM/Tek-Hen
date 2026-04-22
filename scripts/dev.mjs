import { createServer } from 'vite'
import { createViteConfig } from './vite.shared.mjs'

const server = await createServer({
  ...createViteConfig(),
  server: {
    host: '0.0.0.0',
  },
})

await server.listen()
server.printUrls()
