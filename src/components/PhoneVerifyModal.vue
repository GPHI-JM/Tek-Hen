<script setup>
import { ref, watch } from 'vue'
import { useGameStore, FREE_TOP_UP_AMOUNT } from '../stores/gameStore'

const props = defineProps({
  show: Boolean,
  gameContext: {
    type: Object,
    default: null,
  },
  verifyEndpoint: {
    type: String,
    default: 'https://docking-635955947416.asia-east1.run.app/api/auth/game-login',
  },
})

const emit = defineEmits(['close', 'verified'])

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

function handlePhoneInput(event) {
  const nextValue = normalizeMobileDigits(event?.target?.value).slice(0, 10)
  mobileNumberInput.value = nextValue
}

function validatePhilippineMobileNumber(mobileDigits) {
  if (mobileDigits.length !== 10) {
    return 'Enter a valid Philippine mobile number with exactly 10 digits.'
  }

  if (!mobileDigits.startsWith('9')) {
    return 'Philippine mobile numbers must start with 9.'
  }

  return ''
}

async function requestPhoneVerification() {
  const digitsOnly = normalizeMobileDigits(mobileNumberInput.value)
  verifyErrorMessage.value = ''

  const validationMessage = validatePhilippineMobileNumber(digitsOnly)
  if (validationMessage) {
    verifyErrorMessage.value = validationMessage
    return
  }

  if (!props.gameContext?.game_id || !props.gameContext?.image_url) {
    verifyErrorMessage.value = 'Game information is not ready yet. Please try again.'
    return
  }

  isVerifying.value = true
  try {
    const payload = {
      game_id: props.gameContext.game_id,
      phone: digitsOnly,
      game_icon_path: props.gameContext.image_url,
      points: String(store.verificationPoints),
      is_verified: 1,
    }

    const response = await fetch(props.verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseBody = await response.json().catch(() => null)

    if (!response.ok || responseBody?.success === false) {
      verifyErrorMessage.value = responseBody?.message || 'Verification failed. Try again.'
      return
    }

    const credited = store.creditFreeTopUp(FREE_TOP_UP_AMOUNT)
    if (credited) {
      emit('verified')
    } else {
      verifyErrorMessage.value = 'Free top-up already claimed.'
    }
  } catch {
    verifyErrorMessage.value = 'Unable to verify right now. Please try again.'
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">Verify your mobile number</h2>
        <p class="modal-hint">Enter a 10-digit Philippine mobile number starting with 9.</p>
        <label class="field-label" for="phone-verify-input">Mobile</label>
        <input
          id="phone-verify-input"
          v-model="mobileNumberInput"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          class="phone-input"
          placeholder="9XXXXXXXXX"
          :disabled="isVerifying"
          @input="handlePhoneInput"
          @keyup.enter="requestPhoneVerification"
        />
        <p v-if="verifyErrorMessage" class="error-text">{{ verifyErrorMessage }}</p>
        <div class="modal-actions">
          <button type="button" class="modal-btn secondary" :disabled="isVerifying" @click="emit('close')">
            Cancel
          </button>
          <button type="button" class="modal-btn" :disabled="isVerifying" @click="requestPhoneVerification">
            {{ isVerifying ? 'Verifying...' : 'Verify Phone' }}
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
  max-width: min(420px, calc(100vw - 24px));
  box-sizing: border-box;
  background:
    radial-gradient(circle at top, rgba(255, 223, 160, 0.18), transparent 44%),
    linear-gradient(180deg, #2f1e12 0%, #4a3020 52%, #2a1a11 100%);
  border: 6px solid #8b6914;
  border-radius: 16px;
  padding: 24px 28px;
  text-align: left;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 214, 130, 0.12);
  font-family: 'Rajdhani', 'Segoe UI', system-ui, sans-serif;
}

.modal-title {
  font-family: 'Cinzel', 'Rajdhani', serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ffe7b2;
  text-align: center;
  text-transform: none;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.modal-hint {
  margin: 0 0 18px 0;
  text-align: center;
  font-size: 15px;
  line-height: 1.35;
  color: #f0d2a2;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #ffdca0;
  margin-bottom: 10px;
}

.phone-input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 18px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  border: 3px solid #b8860b;
  border-radius: 10px;
  background: linear-gradient(180deg, #fff4d2 0%, #f4e1b2 100%);
  color: #2c1b12;
  margin-bottom: 12px;
}

.phone-input:focus {
  outline: none;
  border-color: #b8860b;
  box-shadow: 0 0 0 2px rgba(255, 217, 135, 0.32);
}

.phone-input:disabled {
  opacity: 0.7;
}

.error-text {
  font-size: 14px;
  color: #ffb6a8;
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
  background: linear-gradient(180deg, #d5a028 0%, #8b6914 100%);
  color: #2a170c;
  border: 3px solid #5c4033;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.22);
}

.modal-btn.secondary {
  background: linear-gradient(180deg, #6d4b33 0%, #3c2416 100%);
  border-color: #8b6914;
  color: #ffe0af;
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

@media (max-width: 640px) {
  .modal-backdrop {
    padding: 12px;
  }

  .modal-content {
    max-width: calc(100vw - 24px);
    padding: 18px 16px 16px;
    border-width: 4px;
    border-radius: 14px;
  }

  .modal-title {
    font-size: 18px;
    margin-bottom: 6px;
  }

  .modal-hint {
    font-size: 13px;
    margin-bottom: 14px;
  }

  .phone-input {
    font-size: 18px;
    padding: 12px 14px;
    letter-spacing: 0.06em;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-btn {
    width: 100%;
  }
}
</style>
