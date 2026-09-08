<template>
  <DashboardLayout>
    <div v-if="!child" class="empty-state">
      {{ $t("dashboard.noChildren") }}
    </div>

    <template v-else>
      <div class="page-header">
        <h1>{{ $t("dashboard.title") }}</h1>
        <router-link to="/notifications" class="icon-btn notif-bell-wrapper" :aria-label="$t('dashboard.notifications')">
          <i class="ti ti-bell"></i>
          <span v-if="notificationsStore.unreadCount > 0" class="notif-dot"></span>
        </router-link>
      </div>

      <!-- Children List Selector -->
      <section class="children-selector">
        <h2 class="section-title">{{ $t("dashboard.registeredChildren") }}</h2>
        <div class="children-list-horizontal">
          <div 
            v-for="c in myChildren" 
            :key="c.id" 
            class="child-selector-card"
            :class="{ active: child && child.id === c.id }"
            @click="selectChild(c)"
          >
            <div class="child-basic">
              <div v-if="!c.photo" class="child-photo-placeholder" :class="c.gender">
                <i class="ti ti-user"></i>
              </div>
              <img v-else :src="c.photo" :alt="c.fullName" class="child-photo" />
              <div>
                <p class="child-name" @click.stop="openQrModalFor(c)" :title="$t('dashboard.showId')">
                  {{ c.fullName }}
                  <i class="ti ti-qrcode qr-icon-btn"></i>
                </p>
                <span class="child-id-badge">ID: {{ c.id }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <template v-if="child">
        <section class="child-summary-card">
          <div class="child-metrics-grid">
            <div class="metric-box">
              <span class="metric-value">{{ formatDate(child.birthDate) }}</span>
              <span class="metric-label">{{ $t("dashboard.birthDate") }}</span>
            </div>
            <div class="metric-box">
              <span class="metric-value">{{ child.weight ?? '-' }} كجم</span>
              <span class="metric-label">{{ $t("dashboard.weight") }}</span>
            </div>
            <div class="metric-box">
              <span class="metric-value">{{ child.height ?? '-' }} سم</span>
              <span class="metric-label">{{ $t("dashboard.height") }}</span>
            </div>
            <div class="metric-box">
              <span class="metric-value">{{ child.gender === 'male' ? $t('dashboard.male') : $t('dashboard.female') }}</span>
              <span class="metric-label">{{ $t("dashboard.gender") }}</span>
            </div>
          </div>
          <button type="button" class="qr-box" aria-label="عرض بيانات الطفل عبر الباركود" @click="openQrModalFor(child)">
            <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${child.id}`" alt="باركود الطفل" />
            <span>{{ $t("dashboard.idCard") }}</span>
          </button>
        </section>

        <section class="stats-row">
          <StatCard :label="$t('dashboard.overdueDoses')" :value="stats.overdue" icon="ti ti-calendar-x" icon-color="var(--color-danger)" />
          <StatCard :label="$t('dashboard.upcomingDoses')" :value="stats.upcoming" icon="ti ti-clock" icon-color="var(--color-warning)" />
          <StatCard :label="$t('dashboard.completedDoses')" :value="stats.completed" icon="ti ti-check" icon-color="var(--color-primary)" />
          <StatCard :label="$t('dashboard.totalDoses')" :value="stats.total" icon="ti ti-vaccine" icon-color="var(--color-primary)" />
        </section>

      <div class="two-col">
        <!-- قسم المواعيد القادمة والمتاحة -->
        <section id="appointments" class="card appointment-card" :class="{ highlighted: uiStore.scrollTarget === 'appointments' }">
          <h2>{{ $t("dashboard.nextAppointment") }}</h2>

          <template v-if="nextDose">
            <div class="appointment-date-box">
              <p class="date">{{ formatDate(nextDose.date) }}</p>
              <p class="time">{{ nextDose.time }}</p>
            </div>
              <p class="appointment-place">{{ selectedCenter?.name || nextDose.place || child?.preferredCenter || $t('dashboard.mainCenter') }}</p>
            <div class="appointment-actions">
              <button
                type="button"
                class="btn-primary"
                :disabled="nextDose.confirmedByParent"
                @click="confirmAttendance"
              >
                {{ nextDose.confirmedByParent ? $t('dashboard.attendanceConfirmed') : $t('dashboard.confirmAttendance') }}
              </button>
              <button type="button" class="btn-secondary" @click="reschedule">{{ $t("dashboard.reschedule") }}</button>
            </div>
          </template>

          <template v-else>
            <div v-if="selectedCenter" class="selected-center-banner">
              <i class="ti ti-building-hospital"></i>
              <span>{{ $t("dashboard.availableAt") }} <strong>{{ selectedCenter.name }}</strong></span>
              <button class="clear-center-btn" @click="selectedCenter = null">{{ $t("dashboard.change") }}</button>
            </div>
            <p v-else class="no-data">{{ $t("dashboard.chooseCenter") }}</p>

            <div v-if="availableSlots.length > 0" class="available-slots-list">
              <div v-for="slot in availableSlots" :key="slot.id" class="slot-item">
                <div class="slot-info">
                  <span class="slot-date"><i class="ti ti-calendar"></i> {{ formatDate(slot.date) }}</span>
                  <span class="slot-time"><i class="ti ti-clock"></i> {{ slot.time }}</span>
                </div>
                <button type="button" class="btn-primary btn-sm" @click="bookAvailableSlot(slot)">
                  {{ $t("dashboard.bookAppointment") }}
                </button>
              </div>
            </div>
            <p v-else-if="selectedCenter" class="no-data" style="margin-top: 10px;">{{ $t("dashboard.noAppointments") }}</p>
          </template>
        </section>

        <!-- قسم الجدول الزمني الوطني للقاحات -->
        <section id="vaccines" class="card timeline-card" :class="{ highlighted: uiStore.scrollTarget === 'vaccines' }">
          <div class="card-header-row">
            <h2>{{ $t("dashboard.vaccineTimeline") }}</h2>
            <span class="timeline-guide"><i class="ti ti-info-circle"></i> {{ $t("dashboard.vaccineGuide") }}</span>
          </div>

          <div class="custom-timeline-wrapper">
            <div class="timeline-track">
              <div class="timeline-track-line"></div>
              <div
                v-for="(step, i) in timeline"
                :key="step.stageId"
                class="timeline-step-node"
                :class="[step.status, { selected: i === activeStepIndex }]"
                @click="activeStepIndex = i"
              >
                <span class="node-age">{{ step.ageText }}</span>
                <span class="node-status-text">{{ step.statusLabel }}</span>
                <div class="node-dot">
                  <i v-if="step.status === 'done'" class="ti ti-check"></i>
                  <i v-else-if="step.status === 'current'" class="ti ti-player-play-filled"></i>
                  <i v-else-if="step.status === 'overdue'" class="ti ti-alert-circle"></i>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedStepDetail" class="timeline-detail-card" :class="selectedStepDetail.status">
            <span class="badge-status" :class="selectedStepDetail.status">
              {{ selectedStepDetail.badgeLabel }}
            </span>
            <div class="detail-content">
              <p class="dose-name">
                {{ selectedStepDetail.title }}
                <span class="dose-age-inline">({{ selectedStepDetail.ageText }})</span>
              </p>
              <ul class="dose-vaccine-list">
                <li v-for="v in selectedStepDetail.vaccines" :key="v.id">{{ v.name }}</li>
              </ul>
              <p class="dose-desc">{{ selectedStepDetail.method }}</p>
              <p v-if="selectedStepDetail.isAssumed" class="dose-assumed-note">
                <i class="ti ti-info-circle"></i>
                {{ $t("dashboard.assumedCompleted") }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div class="two-col">
        <!-- المراكز الصحية القريبة -->
        <section id="centers" class="card centers-card" :class="{ highlighted: uiStore.scrollTarget === 'centers' }">
          <h2>{{ $t("dashboard.nearbyCenters") }}</h2>
          <div class="search-box">
            <i class="ti ti-search"></i>
            <input type="text" v-model="searchQuery" :placeholder="$t('dashboard.searchCenter')" />
          </div>

          <ul class="centers-list" v-if="filteredCenters.length > 0">
            <li v-for="center in filteredCenters" :key="center.name" class="center-item-card">
              <div class="center-main-info">
                <div class="center-icon"><i class="ti ti-building-hospital"></i></div>
                <div class="center-info">
                  <p class="center-name">{{ center.name }}</p>
                  <p class="center-meta">{{ center.distance }} · <i class="ti ti-star-filled"></i> {{ center.rating }}</p>
                </div>
              </div>
              <button
                type="button"
                class="btn-select-center"
                :class="{ active: selectedCenter?.name === center.name }"
                @click="selectCenterForBooking(center)"
              >
                {{ selectedCenter?.name === center.name ? $t('dashboard.currentlySelected') : $t('dashboard.bookAppointment') }}
              </button>
            </li>
          </ul>

          <div v-else class="no-data" style="text-align: center; margin-top: 20px;">
            <p v-if="!userLocation">{{ $t("dashboard.useLocationPrompt") }}</p>
            <p v-else>{{ $t("dashboard.noCentersFound") }}</p>
          </div>
        </section>

        <section class="card map-card">
          <button
            type="button"
            class="use-location-btn"
            @click="getUserLocation"
            :disabled="isLocating"
          >
            <i class="ti" :class="isLocating ? 'ti-loader spinning' : 'ti-current-location'"></i>
            {{ isLocating ? $t('dashboard.locating') : $t('dashboard.useMyLocation') }}
          </button>

          <iframe
            v-if="mapUrl"
            :src="mapUrl"
            width="100%"
            height="200"
            style="border:0; border-radius: 8px;"
            allowfullscreen=""
            loading="lazy"
          ></iframe>

          <div v-else class="map-placeholder">
            <i class="ti ti-map-pin-filled"></i>
          </div>
        </section>
      </div>
      </template>

      <div v-else class="empty-selection-state">
        <div class="empty-content">
          <i class="ti ti-hand-click"></i>
          <p>{{ $t("dashboard.pleaseSelectChild") }}</p>
        </div>
      </div>

    </template>

    <ChildQrModal v-if="showQrModal" :child="qrChild" @close="showQrModal = false" />
    <RescheduleModal
      v-if="showRescheduleModal"
      :child-name="child.fullName"
      @close="showRescheduleModal = false"
      @select="handleRescheduleSelect"
    />
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { i18n } from '../i18n'
window.appI18n = i18n
import DashboardLayout from '../layouts/DashboardLayout.vue'
import StatCard from '../components/StatCard.vue'
import ChildQrModal from '../components/ChildQrModal.vue'
import RescheduleModal from '../components/RescheduleModal.vue'
import { useChildrenStore } from '../stores/children'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import { useAvailabilityStore } from '../stores/availability'
import { useNotificationsStore } from '../stores/notifications'

const route = useRoute()
const childrenStore = useChildrenStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const availabilityStore = useAvailabilityStore()
const notificationsStore = useNotificationsStore()

const showQrModal = ref(false)
const showRescheduleModal = ref(false)
const isLocating = ref(false)
const mapUrl = ref('')
const userLocation = ref(null)
const centers = ref([])
const searchQuery = ref('')

const selectedCenter = ref(null)
const activeStepIndex = ref(0)

const myChildren = computed(() => childrenStore.children)

const selectedChildId = ref(
  route.query.childId || route.params.childId || null
)

const child = computed(() => {
  if (!myChildren.value.length) return null
  if (selectedChildId.value) {
    const found = myChildren.value.find((c) => String(c.id) === String(selectedChildId.value))
    if (found) return found
  }
  return null // Do not default to first child, wait for user selection
})

function selectChildFromRoute() {
  const targetId = route.query.childId || route.params.childId
  if (targetId) {
    selectedChildId.value = targetId
  }
}

function selectChild(c) {
  selectedChildId.value = c.id
}

const qrChild = ref(null)
function openQrModalFor(c) {
  qrChild.value = c
  showQrModal.value = true
}

watch(
  () => [route.query.childId, route.params.childId, myChildren.value],
  () => {
    selectChildFromRoute()
  },
  { immediate: true }
)

onMounted(async () => {
  await childrenStore.fetchParentChildren()
  await notificationsStore.fetchParentNotifications()
  selectChildFromRoute()
  if (!route.query.section) {
    uiStore.scrollTarget = null
  }
})

watch(() => route.query.childId, () => {
  selectChildFromRoute()
})

const availableSlots = computed(() => {
  if (!availabilityStore.slots) return []
  let slots = availabilityStore.slots.filter(s => !s.isBooked)
  if (selectedCenter.value) {
    slots = slots.filter(s => s.centerName === selectedCenter.value.name || !s.centerName)
  }
  return slots
})

const filteredCenters = computed(() => {
  if (!searchQuery.value) return centers.value
  const query = searchQuery.value.toLowerCase()
  return centers.value.filter(center => center.name.toLowerCase().includes(query))
})

const stats = computed(() => childrenStore.getStats(child.value?.id))
const nextDose = computed(() => childrenStore.getNextDose(child.value?.id))

const METHOD_DESCRIPTIONS = {
  birth: 'تُعطى دفعة واحدة عند الولادة مباشرة أو خلال الأيام الأولى في المستشفى أو المركز الصحي.',
  m2: 'حقنة عضلية في الفخذ مع جرعة فموية للروتا، تبدأ عند إتمام الشهرين من العمر.',
  m4: 'استكمال الجرعة الثانية من السلسلة الأساسية لتعزيز الحماية المبكرة.',
  m6: 'الجرعة الثالثة والأخيرة من السلسلة الأساسية للقاح الخماسي.',
  m7: 'جرعة فموية داعمة للمناعة والنمو، تُعطى ضمن الحملات الوطنية في المراكز الصحية.',
  m9: 'حقنة تحت الجلد للوقاية من الحصبة قبل بدء سلسلة الثلاثي الفيروسي.',
  y1: 'يغطي الحصبة والنكاف والحصبة الألمانية، إلى جانب جرعة داعمة من فيتامين أ.',
  y1h: 'جرعات منشطة لتعزيز المناعة المكتسبة من السلسلة الأساسية.'
}

function getStatusLabel(status) {
  if (status === 'done') return 'تمت'
  if (status === 'current') return 'حالية'
  if (status === 'overdue') return 'متأخرة'
  return 'قادمة'
}

function getBadgeLabel(status, isAssumed) {
  if (status === 'done') return isAssumed ? 'مكتملة (افتراضيًا)' : 'تم التطعيم'
  if (status === 'current') return 'متاح الآن'
  if (status === 'overdue') return 'متأخر'
  return 'قادم'
}

const timeline = computed(() => {
  if (!child.value) return []
  return childrenStore.getChildTimeline(child.value.id).map((step) => ({
    ...step,
    method: METHOD_DESCRIPTIONS[step.stageId],
    statusLabel: getStatusLabel(step.status),
    badgeLabel: getBadgeLabel(step.status, step.isAssumed)
  }))
})

watch(
  timeline,
  (newTimeline) => {
    if (newTimeline.length === 0) return
    const idx = newTimeline.findIndex(s => s.status === 'current' || s.status === 'overdue')
    activeStepIndex.value = idx !== -1 ? idx : 0
  },
  { immediate: true }
)

const selectedStepDetail = computed(() => {
  return timeline.value[activeStepIndex.value] || timeline.value[0] || null
})

function selectCenterForBooking(center) {
  selectedCenter.value = center

  if (child.value) {
    const childItem = childrenStore.children.find(c => c.id === child.value.id)
    if (childItem && childItem.doses) {
      const upcomingDose = childItem.doses.find(d => d.status === 'upcoming' || d.status === 'overdue')
      if (upcomingDose) {
        upcomingDose.place = center.name
        childItem.preferredCenter = center.name
        childItem.doses = [...childItem.doses]
      } else {
        childItem.preferredCenter = center.name
      }
    }
  }

  document.getElementById('appointments')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function getVaccineByAge(birthDateStr) {
  if (!birthDateStr) return 'لقاح دوري'
  const birthDate = new Date(birthDateStr)
  const today = new Date()
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
  if (today.getDate() < birthDate.getDate()) months--

  if (months < 2) return 'التطعيم الخماسي (الجرعة الأولى)'
  if (months >= 2 && months < 4) return 'التطعيم الخماسي + شلل الأطفال'
  if (months >= 4 && months < 6) return 'تطعيم 4 أشهر (الخماسي + المكورات)'
  if (months >= 6 && months < 9) return 'التطعيم السداسي (الجرعة الثالثة)'
  return 'تطعيم المتابعة الدورية'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function confirmAttendance() {
  if (!child.value || !nextDose.value) return
  try {
    const res = await childrenStore.confirmParentAttendance(child.value.id, nextDose.value.id)
    notificationsStore.add({
      type: 'info',
      title: 'تأكيد حضور موعد',
      desc: `تم تأكيد حضور موعد (${nextDose.value.name}) للطفل "${child.value.fullName}" بنجاح.`
    })
  } catch (error) {
    console.error('Failed to confirm attendance:', error)
  }
}

function reschedule() {
  showRescheduleModal.value = true
}

function handleRescheduleSelect(slot) {
  if (!child.value || !nextDose.value) return
  childrenStore.rescheduleDose(child.value.id, nextDose.value.id, slot.date, slot.time)
  availabilityStore.bookSlot(slot.id)
  showRescheduleModal.value = false
}

// دالة {{ $t("dashboard.bookAppointment") }} المتاحة من قبل ولي الأمر (محدثة لإرسال الإشعار وتظهر في الأعلى فوراً)
function bookAvailableSlot(slot) {
  if (!child.value) return
  const autoVaccineName = getVaccineByAge(child.value.birthDate)
  availabilityStore.bookSlot(slot.id)

  const childItem = childrenStore.children.find(c => c.id === child.value.id)
  if (childItem) {
    if (!childItem.doses) childItem.doses = []
    const upcomingDose = childItem.doses.find(d => d.status === 'upcoming' || d.status === 'overdue')
    const centerName = selectedCenter.value ? selectedCenter.value.name : window.appI18n.global.t('dashboard.mainCenter')

    if (upcomingDose) {
      upcomingDose.name = autoVaccineName
      upcomingDose.date = slot.date
      upcomingDose.time = slot.time
      upcomingDose.place = centerName
      upcomingDose.status = 'upcoming'
      upcomingDose.confirmedByParent = false
    } else {
      childItem.doses.push({
        id: 'dose_' + Date.now(),
        name: autoVaccineName,
        date: slot.date,
        time: slot.time,
        status: 'upcoming',
        place: centerName,
        confirmedByParent: false
      })
    }
    childItem.doses = [...childItem.doses]
  }

  // إرسال الإشعار للطبيب مع توقيت زمني دقيق لضمان ظهوره في الأعلى
  notificationsStore.add({
    type: 'info',
    createdAt: Date.now(),
    title: 'تم حجز موعد جديد',
    desc: `تم حجز موعد (${autoVaccineName}) للطفل "${child.value.fullName}" في ${selectedCenter.value?.name || 'المركز الصحي'} بتاريخ ${formatDate(slot.date)}`
  })
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

function getUserLocation() {
  if (!navigator.geolocation) return
  isLocating.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      userLocation.value = { lat: latitude, lng: longitude }
      mapUrl.value = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`

      try {
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:5000,${latitude},${longitude})["amenity"~"clinic|hospital|doctors"];out 10;`
        const response = await fetch(overpassUrl)
        const data = await response.json()

        if (data.elements && data.elements.length > 0) {
          centers.value = data.elements
            .filter(item => item.tags && item.tags.name)
            .map(item => {
              const dist = calculateDistance(latitude, longitude, item.lat, item.lon)
              return {
                name: item.tags['name:ar'] || item.tags.name,
                distance: `${dist} كم`,
                distValue: parseFloat(dist),
                rating: (4.0 + Math.random() * 0.9).toFixed(1)
              }
            })
            .sort((a, b) => a.distValue - b.distValue)
        }
      } catch (err) {
        console.error(err)
      } finally {
        isLocating.value = false
      }
    },
    () => { isLocating.value = false },
    { enableHighAccuracy: true }
  )
}
</script>

<style scoped>
.avatar-circle { width: 64px; height: 64px; border-radius: 50%; border: 2px solid; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; flex-shrink: 0; }
.custom-timeline-wrapper { overflow-x: auto; padding-bottom: 4px; margin: 22px 0 18px; }
.timeline-track { position: relative; display: inline-flex; gap: 22px; padding: 0 12px; min-width: 100%; }
.timeline-track-line { position: absolute; top: 52px; left: 20px; right: 20px; height: 3px; background: #e2e8f0; z-index: 0; }
.timeline-step-node { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; cursor: pointer; flex: 0 0 auto; width: 74px; }
.node-age { font-size: 12px; font-weight: 700; color: #94a3b8; white-space: nowrap; }
.node-status-text { font-size: 11px; font-weight: 600; color: #a1a1aa; margin-top: 2px; margin-bottom: 10px; white-space: nowrap; }
.node-dot { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; color: #a1a1aa; font-size: 13px; transition: all 0.2s ease; }
.timeline-step-node.done .node-dot { background: #005e54; border-color: #005e54; color: #ffffff; }
.timeline-step-node.done .node-age, .timeline-step-node.done .node-status-text { color: #005e54; }
.timeline-step-node.current .node-dot { width: 36px; height: 36px; background: #80e5d8; border-color: #00a896; color: #005e54; box-shadow: 0 0 0 4px rgba(128, 229, 216, 0.4); }
.timeline-step-node.current .node-age, .timeline-step-node.current .node-status-text { color: #00a896; font-weight: 800; }
.timeline-step-node.overdue .node-dot { background: #ef4444; border-color: #ef4444; color: #ffffff; }
.timeline-step-node.overdue .node-age, .timeline-step-node.overdue .node-status-text { color: #ef4444; font-weight: 800; }
.timeline-step-node.upcoming .node-dot { background: #f1f5f9; border-color: #cbd5e1; color: #cbd5e1; }
.timeline-step-node.upcoming .node-age, .timeline-step-node.upcoming .node-status-text { color: #94a3b8; }
.timeline-step-node.selected .node-dot { transform: scale(1.12); }
.timeline-detail-card { background: var(--color-surface-muted); border-radius: 12px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 16px; border-right: 4px solid #00a896; margin-top: 20px; }
.timeline-detail-card.done { border-right-color: #005e54; }
.timeline-detail-card.overdue { border-right-color: #ef4444; }
.timeline-detail-card.upcoming { border-right-color: #94a3b8; }
.badge-status { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
.badge-status.current { background: #008075; color: #fff; }
.badge-status.done { background: #005e54; color: #fff; }
.badge-status.overdue { background: #ef4444; color: #fff; }
.badge-status.upcoming { background: #cbd5e1; color: #475569; }
.detail-content { flex: 1; }
.dose-name { margin: 0 0 8px; font-weight: 800; font-size: 15px; color: var(--color-text); }
.dose-age-inline { font-weight: 500; font-size: 12px; color: #64748b; }
.dose-vaccine-list { margin: 0 0 8px; padding-right: 18px; display: flex; flex-direction: column; gap: 3px; }
.dose-vaccine-list li { font-size: 12.5px; color: var(--color-text); }
.dose-desc { margin: 0; font-size: 12px; color: var(--color-text-muted); line-height: 1.6; }
.dose-assumed-note { margin: 8px 0 0; font-size: 11.5px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.6; }
.center-item-card { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.center-main-info { display: flex; align-items: center; gap: 10px; }
.btn-select-center { background: #e0f2fe; color: #0369a1; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-select-center.active { background: #0f766e; color: #fff; }
.selected-center-banner { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.clear-center-btn { margin-right: auto; background: transparent; border: none; color: #ef4444; cursor: pointer; text-decoration: underline; font-size: 11px; }
.available-slots-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.slot-item { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
.slot-info { display: flex; gap: 10px; font-size: 12px; }
.btn-sm { padding: 4px 10px; font-size: 11px; }
.empty-state { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 40px; text-align: center; color: var(--color-text-muted); }
.empty-selection-state { display: flex; align-items: center; justify-content: center; padding: 60px 20px; background: var(--color-card); border: 1px dashed var(--color-border); border-radius: var(--radius-lg); margin-top: 20px; }
.empty-content { text-align: center; color: var(--color-text-muted); }
.empty-content i { font-size: 48px; color: #cbd5e1; margin-bottom: 16px; display: inline-block; }

.children-selector { margin-bottom: 24px; }
.section-title { font-size: 16px; font-weight: 700; margin: 0 0 16px; color: var(--color-text); }
.children-list-horizontal { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }
.children-list-horizontal::-webkit-scrollbar { height: 6px; }
.children-list-horizontal::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
.children-list-horizontal::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.child-selector-card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; min-width: 200px; cursor: pointer; transition: all 0.2s; position: relative; }
.child-selector-card:hover { border-color: var(--color-primary-light); background: #f8fafc; }
.child-selector-card.active { border-color: var(--color-primary); box-shadow: 0 4px 12px rgba(15, 118, 110, 0.1); background: #f0fdfa; }
.child-selector-card .child-basic { gap: 12px; }
.child-photo.sm, .child-photo-placeholder.sm { width: 48px; height: 48px; font-size: 20px; }
.qr-icon-btn { color: #64748b; font-size: 16px; cursor: pointer; transition: 0.2s; padding: 4px; border-radius: 6px; }
.qr-icon-btn:hover { color: var(--color-primary); background: #e2e8f0; }
.child-selector-card .child-name { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.child-selector-card .child-name:hover { color: var(--color-primary); }

.no-data { color: var(--color-text-muted); font-size: 13px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h1 { font-size: 20px; margin: 0; }
.icon-btn { background: var(--color-card); border: 1px solid var(--color-border); border-radius: 8px; width: 36px; height: 36px; cursor: pointer; }
.qr-box { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px; cursor: pointer; }
.qr-box img { width: 64px; height: 64px; }
.qr-box span { font-size: 11px; color: var(--color-text-muted); }
.notif-bell-wrapper { position: relative; text-decoration: none; }
.notif-dot { position: absolute; top: 8px; right: 10px; width: 9px; height: 9px; background-color: #ef4444; border-radius: 50%; border: 2px solid #fff; }
.child-summary-card { background: var(--color-card); border-radius: var(--radius-lg); padding: 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
.child-metrics-grid { display: flex; gap: 12px; flex: 2; justify-content: center; }
.metric-box { background: var(--color-bg); border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; align-items: center; min-width: 90px; }
.metric-value { font-weight: 700; font-size: 14px; color: var(--color-text); margin-bottom: 4px; }
.metric-label { font-size: 12px; color: var(--color-text-muted); }
.child-basic { display: flex; align-items: center; gap: 16px; }
.child-photo, .child-photo-placeholder { width: 64px; height: 64px; border-radius: 50%; }
.child-photo-placeholder { display: flex; justify-content: center; align-items: center; font-size: 26px; color: white; }
.child-photo-placeholder.male { background: #4F8EF7; }
.child-photo-placeholder.female { background: #F472B6; }
.child-name { margin: 0 0 6px; font-weight: 700; font-size: 18px; }
.child-id-badge { font-size: 13px; background: var(--color-primary-light); color: var(--color-primary-dark); padding: 4px 10px; border-radius: 6px; }
.stats-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.two-col { display: grid; grid-template-columns: 1.2fr 2.4fr; gap: 20px; margin-bottom: 20px; align-items: stretch; }
.appointment-card { padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
.appointment-card h2 { font-size: 17px; font-weight: 700; margin-bottom: 16px; text-align: center; }
.appointment-date-box { background: #ccfbf1; border: 1px solid #99f6e4; border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 14px; }
.appointment-date-box .date { margin: 0 0 6px; font-size: 17px; font-weight: 800; color: #0f766e; }
.appointment-date-box .time { margin: 0; font-size: 14px; font-weight: 600; color: #0d9488; direction: ltr; display: inline-block; }
.appointment-place { font-size: 14px; font-weight: 600; color: #475569; text-align: center; margin-bottom: 18px; }
.appointment-actions { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
.appointment-actions .btn-primary { padding: 12px; font-size: 14px; font-weight: 700; border-radius: 12px; background: #0f766e; }
.appointment-actions .btn-secondary { padding: 12px; font-size: 14px; font-weight: 600; border-radius: 12px; border: 1px solid #e2e8f0; color: #334155; }
.card { background: var(--color-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; }
.card h2 { font-size: 15px; margin: 0 0 12px; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.timeline-guide { font-size: 12px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }
.use-location-btn { background: var(--color-card); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.map-placeholder { height: 200px; border-radius: var(--radius-md); background: var(--color-primary-dark); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; }
.search-box { display: flex; align-items: center; gap: 8px; border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; background-color: var(--color-card); }
.search-box input { border: none !important; outline: none !important; background: transparent !important; color: var(--color-text); width: 100%; font-family: inherit; }
.search-box input::placeholder { color: var(--color-text-muted); }
.centers-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }
.center-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; }
.center-info { flex: 1; }
.center-name { margin: 0; font-size: 13px; font-weight: 500; }
.center-meta { margin: 0; font-size: 12px; color: var(--color-text-muted); }
.card.highlighted { border: 2px solid #0f766e !important; box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.15) !important; animation: pulse-border 1.5s ease-in-out; }
@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(15, 118, 110, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(15, 118, 110, 0.2); }
  100% { box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.15); }
}
@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
  .child-summary-card { flex-direction: column; }
  .timeline-detail-card { flex-direction: column; }
}
</style>