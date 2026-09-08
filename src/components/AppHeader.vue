<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import LogoIcon from './LogoIcon.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const navLinks = [
  { label: 'الرئيسية', href: '#home', targetId: 'home', id: 'home' },
  { label: 'حول النظام', href: '#about-system', targetId: 'about-system', id: 'about-system' },
  { label: 'اللقاحات', href: '#about-system', targetId: 'about-system', id: 'vaccines' }, 
  { label: 'المصادر', href: '#footer', targetId: 'footer', id: 'footer' },
  { label: 'الأخبار', href: '#news', targetId: 'news', id: 'news' }
]

const menuOpen = ref(false)
const activeId = ref('home')
let observer = null

function closeMenu() {
  menuOpen.value = false
}

async function handleLogout() {
  await authStore.performLogout()
  router.push('/login')
}

function handleNavClick(event, link) {
  event.preventDefault()
  
  activeId.value = link.id 
  closeMenu()
  
  if (link.targetId === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {

    const section = document.getElementById(link.targetId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

onMounted(() => {
  const uniqueSectionIds = [...new Set(navLinks.map(l => l.targetId))]
  const sections = uniqueSectionIds.map(id => document.getElementById(id)).filter(Boolean)
  
  if ('IntersectionObserver' in window && sections.length) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {

          const isAboutOrVaccinesActive = activeId.value === 'about-system' || activeId.value === 'vaccines'
          if (entry.target.id === 'about-system' && isAboutOrVaccinesActive) {
            return
          }
          
          const matchedLink = navLinks.find(l => l.targetId === entry.target.id)
          if (matchedLink) {
            activeId.value = matchedLink.id
          }
        }
      })
    }, 
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 })
    
    sections.forEach(el => observer.observe(el))
  }
})
onBeforeUnmount(() => { if (observer) observer.disconnect() })
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <!-- الشعار -->
      <a href="#" class="logo">
        <span class="logo__icon">
          <LogoIcon />
        </span>
        <span class="logo__text">لقاحي</span>
      </a>

      <!-- روابط التنقل -->
      <nav class="nav" :class="{ 'nav--open': menuOpen }">
        <a
          v-for="link in navLinks"
          :key="link.id"
          :href="link.href"
          class="nav__link"
          :class="{ 'nav__link--active': activeId === link.id }"
          @click="handleNavClick($event, link)"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- أزرار الدخول -->
      <div class="auth-buttons">
        <template v-if="authStore.isLoggedIn">
          <router-link
            :to="authStore.role === 'admin' ? '/admin/dashboard' : (authStore.role === 'doctor' ? '/doctor/dashboard' : '/dashboard')"
            class="btn btn-primary"
          >
            لوحة التحكم
          </router-link>
          <button @click="handleLogout" class="btn-login" style="background: none; border: none; cursor: pointer;">
            تسجيل الخروج
          </button>
        </template>
        <template v-else>
          <router-link :to="{ name: 'login' }" class="btn-login">تسجيل الدخول</router-link>
          <router-link :to="{ name: 'signup' }" class="btn btn-primary">إنشاء حساب</router-link>
        </template>
      </div>

      <!-- زر القائمة للجوال -->
       <button
        class="burger"
        :class="{ 'burger--active': menuOpen }"
        @click="menuOpen = !menuOpen"
        :aria-expanded="menuOpen"
        aria-label="فتح القائمة"
      >
      <span></span><span></span><span></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-100);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 20px;
  color: var(--color-teal-800);
  flex-shrink: 0;
}

.logo__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-teal-800); 
}
.nav {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav__link {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-muted);
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.nav__link:hover {
  color: var(--color-teal-800);
}

.nav__link--active {
  color: var(--color-teal-800);
  font-weight: 700;
  border-bottom-color: var(--color-teal-800);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.btn-login {
  color: var(--color-teal-800);
  font-weight: 700;
  font-size: 15px;
  padding: 8px 16px;
  transition: opacity 0.2s;
}

.btn-login:hover {
  opacity: 0.7;
}

.btn-signup {
  background: var(--color-teal-800);
  color: #ffffff;
  padding: 10px 24px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(18, 119, 107, 0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-signup:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(18, 119, 107, 0.3);
}


.btn-sm {
  padding: 10px 20px;
  font-size: 14px;
}

.burger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  padding: 6px;
}

.burger span {
  width: 22px;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: transform 0.2s ease, opacity 0.2s ease; 
} 

.burger--active span:nth-child(1) {
   transform: translateY(6px) rotate(45deg); 
}

.burger--active span:nth-child(2) {
   opacity: 0; 
}

.burger--active span:nth-child(3) {
   transform: translateY(-6px) rotate(-45deg); 
}

@media (max-width: 960px) {
  .nav {
    position: absolute;
    top: 76px;
    inset-inline: 0;
    background: var(--color-white);
    flex-direction: column;
    align-items: flex-start;
    padding: 16px 24px;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    display: none;
  }

  .nav--open {
    display: flex;
  }

  .actions {
    display: none;
  }

  .burger {
    display: flex;
  }

  .auth-buttons {
    display: none;
  }
}
</style>
