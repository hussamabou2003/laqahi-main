// طبقة الاتصال الموحدة مع باك إند منصة لقاحي (Laravel Sanctum — Personal Access Tokens)
// تحتوي على: النقل (apiFetch/apiData) + دوال مساعدة لكل نطاق من نطاقات الباك إند

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const TOKEN_KEY = 'auth_token'

export function getToken() {
  const role = localStorage.getItem('auth_role')
  return (role && localStorage.getItem(`${TOKEN_KEY}_${role}`)) || localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, role = localStorage.getItem('auth_role')) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
  if (role) localStorage.setItem(`${TOKEN_KEY}_${role}`, token)
}

export function clearToken(role = localStorage.getItem('auth_role')) {
  localStorage.removeItem(TOKEN_KEY)
  if (role) localStorage.removeItem(`${TOKEN_KEY}_${role}`)
}

/**
 * استدعاء موحد لكل نقاط النهاية
 * يرجع محتوى JSON الكامل: { success, message, data }
 * يرمي خطأ برسالة عربية عند الفشل (e.status,e.errors)
 */
export async function apiFetch(path, { method = 'GET', body,auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  } catch {
    throw Object.assign(new Error('تعذر الاتصال بالسيرفر تأكد من تشغيله على المنفذ 8000'), { status: 0 })
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      clearToken()
      localStorage.removeItem('auth_isLoggedIn')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_user')
    }

    throw Object.assign(new Error(json?.message || `حدث خطأ غير متوقع (${res.status})`), {
      status: res.status,
      errors: json?.errors || null
    })
  }

  return json
}

/** فك تغليف استجابة الباك: يرجع حقل data مباشرة (أو null) */
export async function apiData(path, options = {}) {
  const json = await apiFetch(path, options)
  return json?.data ?? null
}

/**
 * توحيد حقول المستخدم القادمة من الباك إند (snake_case → camelCase)
 * حتى تعمل الشاشات الحالية بدون تعديل
 */
export function normalizeUser(user) {
  if (!user) return user
  return {
    ...user,
    fullName: user.name,
    nationalId: user.national_id ?? user.nationalId,
    motherName: user.mother_name ?? user.motherName,
    fatherName: user.father_name ?? user.fatherName,
    centerId: user.center_id ?? user.centerId,
    centerName: user.center?.name ?? user.centerName,
    isActive: user.is_active ?? user.isActive
  }
}

// ===================== المصادقة (Auth) =====================

/** تسجيل الدخول: { email, password, role } */
export async function loginApi(email, password, role = 'parent') {
  return apiFetch('/auth/login', { method: 'POST', auth: false, body: { email, password, role } })
}

export async function forgotPasswordSendCodeApi(email) {
  return apiFetch('/auth/forgot-password/send-code', { method: 'POST', auth: false, body: { email } })
}

export async function forgotPasswordVerifyCodeApi(email, code) {
  return apiFetch('/auth/forgot-password/verify-code', { method: 'POST', auth: false, body: { email, code } })
}

/** إنشاء حساب ولي أمر من شاشة التسجيل */
export async function registerParentApi(payload) {
  return apiFetch('/auth/register', { method: 'POST', auth: false, body: payload })
}

/** جلب بيانات المستخدم الحالي */
export async function fetchMeApi() {
  return apiFetch('/auth/me')
}

/** تسجيل الخروج (حذف التوكن من السيرفر) */
export async function logoutApi() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

// ===================== المراكز الصحية (Centers) =====================

/** قائمة المراكز العامة (لأولياء الأمور والمستخدمين) */
export async function getSharedCentersApi() { return apiData('/centers') }

/** قائمة المراكز الإدارية (للمدير مع عدد الأطباء والأطفال) */
export async function getAdminCentersApi() { return apiData('/admin/centers') }

export async function createCenterApi(data) { return apiFetch('/admin/centers', { method: 'POST', body: data }) }

export async function updateCenterApi(id, data) { return apiFetch('/admin/centers/' + id, { method: 'PUT', body: data }) }

export async function deleteCenterApi(id) { return apiFetch('/admin/centers/' + id, { method: 'DELETE' }) }

// ===================== الأطباء (Doctors) =====================

export async function getDoctorsApi(centerId) { return apiData('/admin/doctors' + (centerId ? '?center_id=' + centerId : '')) }

export async function createDoctorApi(data) { return apiFetch('/admin/doctors', { method: 'POST', body: data }) }

export async function updateDoctorApi(id, data) { return apiFetch('/admin/doctors/' + id, { method: 'PUT', body: data }) }

export async function deleteDoctorApi(id) { return apiFetch('/admin/doctors/' + id, { method: 'DELETE' }) }

export async function getAdminParentsApi() { return apiData('/admin/parents') }

export async function getAdminChildrenApi() { return apiData('/admin/children') }

// ===================== اللقاحات (Vaccines) =====================

/** قائمة اللقاحات الوطنية (لجميع الأدوار) */
export async function getVaccinesApi() { return apiData('/vaccines') }

// ===================== الأطفال والوالدين (Children & Parents) =====================

export async function getParentChildrenApi() { return apiData('/parent/children') }

export async function addParentChildApi(data) { return apiFetch('/parent/children', { method: 'POST', body: data }) }

export async function updateParentChildApi(childId, data) { return apiFetch('/parent/children/' + childId, { method: 'PUT', body: data }) }

export async function getParentChildQrApi(childId) { return apiData('/parent/children/' + childId + '/qr') }

export async function getDoctorChildrenApi() { return apiData('/doctor/children') }

export async function getDoctorChildDetailsApi(childId) { return apiData('/doctor/children/' + childId) }

export async function addDoctorChildApi(data) { return apiFetch('/doctor/children', { method: 'POST', body: data }) }
export async function deleteDoctorChildApi(childId) { return apiFetch('/doctor/children/' + childId, { method: 'DELETE' }) }

export async function scanChildQrApi(qrCode) { return apiData('/doctor/children/scan/' + qrCode) }

export async function getDoctorChildQrApi(childId) { return apiData('/doctor/children/' + childId + '/qr') }

export async function createParentAccountApi(data) { return apiFetch('/doctor/parents', { method: 'POST', body: data }) }
export async function updateParentAccountApi(parentId, data) { return apiFetch('/doctor/parents/' + parentId, { method: 'PUT', body: data }) }
export async function updateDoctorChildApi(childId, data) { return apiFetch('/doctor/children/' + childId, { method: 'PUT', body: data }) }

// ===================== المواعيد (Appointments) =====================

export async function getParentAppointmentsApi(childId, status) {
  const q = status ? '?status=' + status : ''
  return apiData('/parent/children/' + childId + '/appointments' + q)
}

export async function rescheduleAppointmentApi(id, data) {
  return apiFetch('/parent/appointments/' + id + '/reschedule', { method: 'PUT', body: data })
}

export async function confirmAppointmentApi(id) {
  return apiFetch('/parent/appointments/' + id + '/confirm', { method: 'PUT' })
}

export async function cancelAppointmentApi(id) {
  return apiFetch('/parent/appointments/' + id + '/cancel', { method: 'PUT' })
}

export async function getDoctorAppointmentsApi(queryObj) {
  let q = ''
  if (queryObj) {
    const params = new URLSearchParams(queryObj).toString()
    if (params) q = '?' + params
  }
  return apiData('/doctor/appointments' + q)
}

export async function completeAppointmentApi(id, data) {
  return apiFetch('/doctor/appointments/' + id + '/complete', { method: 'PUT', body: data })
}

export async function createDoctorAppointmentApi(data) {
  return apiFetch('/doctor/appointments', { method: 'POST', body: data })
}

export async function updateDoctorAppointmentApi(id, data) {
  return apiFetch('/doctor/appointments/' + id, { method: 'PUT', body: data })
}

// ===================== الإشعارات (Notifications) =====================

export async function getParentNotificationsApi() { return apiData('/parent/notifications') }

export async function markReadApi(id) { return apiFetch('/parent/notifications/' + id + '/read', { method: 'PUT' }) }

export async function markAllReadApi() { return apiFetch('/parent/notifications/read-all', { method: 'PUT' }) }

export async function getDoctorNotificationsApi() { return apiData('/doctor/notifications') }

export async function sendManualNotificationApi(data) { return apiFetch('/doctor/notifications', { method: 'POST', body: data }) }

// ===================== التقارير والتدقيق والمخزون (Admin Reports, Audit & Inventory) =====================

export async function getAdminReportsApi() { return apiData('/admin/reports') }

export async function getAuditLogsApi(queryObj) {
  let q = ''
  if (queryObj) {
    const params = new URLSearchParams(queryObj).toString()
    if (params) q = '?' + params
  }
  return apiData('/admin/audit' + q)
}

export async function getInventoryApi(centerId) {
  const q = centerId ? '?center_id=' + centerId : ''
  return apiData('/admin/inventory' + q)
}

export async function addInventoryApi(data) { return apiFetch('/admin/inventory', { method: 'POST', body: data }) }

export async function updateInventoryApi(id, data) { return apiFetch('/admin/inventory/' + id, { method: 'PUT', body: data }) }

// ===================== إعدادات ولي الأمر (Parent Settings) =====================

export async function sendPasswordResetCodeApi() {
  return apiFetch('/parent/settings/password/send-code', { method: 'POST' })
}

export async function verifyPasswordResetCodeApi(code) {
  return apiFetch('/parent/settings/password/verify-code', { method: 'POST', body: { code } })
}

export async function changePasswordApi(data) {
  return apiFetch('/parent/settings/password/change', { method: 'POST', body: data })
}

