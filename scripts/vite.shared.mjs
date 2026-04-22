import vue from '@vitejs/plugin-vue'

export function createViteConfig() {
  return {
    base: './',
    plugins: [vue()],
    build: {
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/phaser')) {
              return 'phaser'
            }
          },
        },
      },
    },
  }
}
