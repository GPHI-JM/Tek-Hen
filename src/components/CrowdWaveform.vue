<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationId = null
let phase = 0

function drawWaveform() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 2
  ctx.beginPath()

  const amplitude = 8
  const frequency = 0.02
  const centerY = height / 2

  for (let x = 0; x <= width; x += 2) {
    const y = centerY + Math.sin(x * frequency + phase) * amplitude
    if (x === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()
  phase += 0.1
  animationId = requestAnimationFrame(drawWaveform)
}

onMounted(() => {
  drawWaveform()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div class="crowd-panel">
    <span class="crowd-label">LIVE CROWD ROAR</span>
    <canvas ref="canvasRef" width="120" height="40" class="waveform" />
  </div>
</template>

<style scoped>
.crowd-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #5c4033 0%, #3d2914 100%);
  border: 2px solid #8b6914;
  border-radius: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.crowd-label {
  font-size: 10px;
  font-weight: bold;
  color: #d4b896;
  letter-spacing: 0.5px;
}

.waveform {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  display: block;
}
</style>
