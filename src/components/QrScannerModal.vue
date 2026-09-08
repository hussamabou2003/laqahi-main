<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>مسح رمز الطفل (QR)</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <p class="scan-instructions">قم بتوجيه الكاميرا نحو رمز الاستجابة السريعة الموجود في بطاقة الطفل.</p>
        <div id="qr-reader" class="qr-reader"></div>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

const emit = defineEmits(['close', 'scanned'])
const error = ref('')
let html5QrCode = null

onMounted(async () => {
  html5QrCode = new Html5Qrcode("qr-reader")
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText, decodedResult) => {
        // Stop scanning after success
        html5QrCode.stop().then(() => {
          emit('scanned', decodedText)
        }).catch(err => {
          console.error("Failed to stop scanner", err)
        })
      },
      (errorMessage) => {
        // Ignore constant scan errors while searching for QR
      }
    )
  } catch (err) {
    console.error("Scanner init error:", err)
    error.value = "تعذر الوصول إلى الكاميرا. يرجى التأكد من منح الصلاحيات اللازمة."
  }
})

onUnmounted(async () => {
  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop()
    } catch (err) {
      console.error("Error stopping scanner on unmount", err)
    }
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #64748b;
}
.modal-body {
  padding: 20px;
  text-align: center;
}
.scan-instructions {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 16px;
}
.qr-reader {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.error-msg {
  color: #ef4444;
  font-size: 13px;
  margin-top: 12px;
}
</style>
