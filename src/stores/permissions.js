// تعريف الأدوار والصلاحيات (Role-Based Access Control)
// هذا الملف هو المصدر الوحيد للحقيقة بخصوص من يستطيع فعل ماذا في الواجهة.

export const ROLES = {
  admin: { key: 'admin', label: 'مدير النظام' },
  manager: { key: 'manager', label: 'مسؤول طبي' },
  doctor: { key: 'doctor', label: 'طبيب تطعيمات' }
}

// الصلاحيات المتاحة لكل دور
export const PERMISSIONS = {
  admin: ['doctors.manage', 'centers.manage', 'reports.export', 'settings.view', 'audit.view'],
  manager: ['doctors.manage', 'centers.manage', 'reports.export', 'audit.view'],
  doctor: []
}

// الصفحات المسموحة لكل دور (فارغة = مسموحة للجميع)
export const ROUTE_ROLES = {
  settings: ['admin'],
  audit: ['admin', 'manager']
}

export function can(role, action) {
  return (PERMISSIONS[role] || []).includes(action)
}

export function roleLabel(role) {
  return ROLES[role]?.label || role
}
