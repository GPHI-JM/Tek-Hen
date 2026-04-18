<script setup>
import { ref, watch } from 'vue'
import { useGameStore, FREE_TOP_UP_AMOUNT } from '../stores/gameStore'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close'])

const store = useGameStore()
const mobileNumberInput = ref('')
const isVerifying = ref(false)
const verifyErrorMessage = ref('')

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      mobileNumberInput.value = ''
      verifyErrorMessage.value = ''
      isVerifying.value = false
    }
  }
)

function normalizeMobileDigits(rawValue) {
  return String(rawValue || '').replace(/\D/g, '')
}

async function requestPhoneVerification() {
  const digitsOnly = normalizeMobileDigits(mobileNumberInput.value)
  verifyErrorMessage.value = ''

  if (digitsOnly.length < 10) {
    verifyErrorMessage.value = 'Enter a valid mobile number (at least 10 digits).'
    return
  }

  isVerifying.value = true
  try {
    const response = await verifyPhoneWithBackend(digitsOnly)
    if (response.success) {
      const credited = store.creditFreeTopUp(FREE_TOP_UP_AMOUNT)
      if (credited) {
        emit('close')
      } else {
        verifyErrorMessage.value = 'Free top-up already claimed.'
      }
    } else {
      verifyErrorMessage.value = response.message || 'Verification failed. Try again.'
    }
  } finally {
    isVerifying.value = false
  }
}

async function verifyPhoneWithBackend(mobileDigits) {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return { success: true }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">Enter your mobile number</h2>
        <label class="field-label" for="phone-verify-input">Mobile</label>
        <input
          id="phone-verify-input"
          v-model="mobileNumberInput"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          class="phone-input"
          placeholder="09XX XXX XXXX"
          :disabled="isVerifying"
          @keyup.enter="requestPhoneVerification"
        />
        <p v-if="verifyErrorMessage" class="error-text">{{ verifyErrorMessage }}</p>
        <div class="modal-actions">
          <button type="button" class="modal-btn secondary" :disabled="isVerifying" @click="emit('close')">
            Cancel
          </button>
          <button
            type="button"
            class="modal-btn"
            :disabled="isVerifying"
            @click="requestPhoneVerification"
          >
            {{ isVerifying ? 'Verifying…' : 'Verify Phone' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(2px);
}

.modal-content {
  width: 100%;
  max-width: min(440px, calc(100vw - 32px));
  box-sizing: border-box;
  background: linear-gradient(180deg, #f5e6d3 0%, #e8d4b8 100%);
  border: 6px solid #8b6914;
  border-radius: 16px;
  padding: 28px 32px;
  text-align: left;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(139, 105, 20, 0.35);
}

.modal-title {
  font-size: 22px;
  font-weight: bold;
  margin: 0 0 20px 0;
  color: #3d2914;
  text-align: center;
  text-transform: none;
  letter-spacing: 0;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #5c4033;
  margin-bottom: 10px;
}

.phone-input {
  width: 100%;
  box-sizing: border-box;
  padding: 18px 20px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  border: 3px solid #8b6914;
  border-radius: 10px;
  background: #fffef8;
  color: #2d2d2d;
  margin-bottom: 12px;
}

.phone-input:focus {
  outline: none;
  border-color: #b8860b;
  box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.35);
}

.phone-input:disabled {
  opacity: 0.7;
}

.error-text {
  font-size: 14px;
  color: #8b0000;
  margin: 0 0 16px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.modal-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(180deg, #8b6914 0%, #5c4033 100%);
  color: #fff;
  border: 3px solid #5c4033;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.secondary {
  background: linear-gradient(180deg, #9a9a9a 0%, #6a6a6a 100%);
  border-color: #555;
}

.modal-btn:hover:not(:disabled) {
  filter: brightness(1.12);
  transform: translateY(-1px);
}

.modal-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
