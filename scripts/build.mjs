import { build } from 'vite'
import { rm } from 'node:fs/promises'
import { createViteConfig } from './vite.shared.mjs'

await build(createViteConfig())

await rm('dist/.DS_Store', { force: true })
await rm('dist/th1.zip', { force: true })
