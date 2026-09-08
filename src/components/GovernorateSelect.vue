<template>
  <div class="governorate-select" ref="wrapperRef">
    <input
      v-model="query"
      type="text"
      placeholder="اكتب اسم المحافظة أو اختر من القائمة"
      autocomplete="off"
      @focus="isOpen = true"
      @input="isOpen = true"
    />
    <ul v-if="isOpen && filteredList.length" class="dropdown-list">
      <li v-for="gov in filteredList" :key="gov" @mousedown.prevent="selectGovernorate(gov)">
        {{ gov }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const GOVERNORATES = [
  'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية',
  'طرطوس', 'إدلب', 'درعا', 'السويداء', 'القنيطرة',
  'دير الزور', 'الرقة', 'الحسكة'
]

const query = ref(props.modelValue || '')
const isOpen = ref(false)
const wrapperRef = ref(null)

watch(() => props.modelValue, (val) => {
  if (val !== query.value) query.value = val || ''
})

const filteredList = computed(() => {
  if (!query.value) return GOVERNORATES
  return GOVERNORATES.filter((g) => g.startsWith(query.value.trim()))
})

function selectGovernorate(gov) {
  query.value = gov
  emit('update:modelValue', gov)
  isOpen.value = false
}

function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.governorate-select {
  position: relative;
}

.governorate-select input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: 0;
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 30;
  list-style: none;
  margin: 0;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.dropdown-list li {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-list li:hover {
  background: var(--color-primary-light);
}
</style>