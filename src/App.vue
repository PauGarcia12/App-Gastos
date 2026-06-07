<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const showChrome = computed(() => !route.meta.public)

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <aside v-if="showChrome" class="sidebar">
      <div class="sidebar-top">
        <router-link to="/dashboard" class="brand">
          <div class="brand-mark">₿</div>
          <div class="brand-text">
            <span class="brand-name">Gastos</span>
            <span class="brand-sub">Personal Finance</span>
          </div>
        </router-link>

        <nav class="sidebar-nav">
          <router-link to="/dashboard" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/subir" class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Subir CSV</span>
          </router-link>
        </nav>
      </div>

      <div class="sidebar-bottom">
        <div class="user-card">
          <div class="user-avatar">{{ auth.email?.[0]?.toUpperCase() }}</div>
          <div class="user-info">
            <span class="user-email">{{ auth.email }}</span>
          </div>
        </div>
        <button class="btn-logout" @click="logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Salir
        </button>
      </div>
    </aside>

    <main :class="{ 'main-content': showChrome }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
}

.sidebar-top {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #ffffff;
  color: #18181b;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.brand-sub {
  font-size: 0.7rem;
  color: var(--sidebar-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: #fff;
}

.nav-item.router-link-active {
  background: rgba(255,255,255,0.08);
  color: #ffffff;
}

.sidebar-bottom {
  padding: 1rem;
  border-top: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.25rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3f3f46;
  color: #e4e4e7;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.user-info {
  overflow: hidden;
}

.user-email {
  font-size: 0.78rem;
  color: var(--sidebar-text);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--sidebar-border);
  background: transparent;
  color: var(--sidebar-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn-logout:hover {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
  color: #f87171;
}

.main-content {
  margin-left: 240px;
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: calc(1200px + 240px);
}

@media (max-width: 768px) {
  .sidebar { width: 200px; }
  .main-content { margin-left: 200px; padding: 1.25rem 1rem; }
}
</style>
