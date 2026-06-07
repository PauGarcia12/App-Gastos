import { defineStore } from 'pinia'

const TOKEN_KEY = 'gastos_id_token'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    idToken: localStorage.getItem(TOKEN_KEY) || null,
  }),
  getters: {
    isAuthenticated: (state) => {
      if (!state.idToken) return false
      const claims = decodeJwt(state.idToken)
      if (!claims?.exp) return false
      return claims.exp * 1000 > Date.now()
    },
    userId: (state) => {
      if (!state.idToken) return null
      return decodeJwt(state.idToken)?.sub ?? null
    },
    email: (state) => {
      if (!state.idToken) return null
      return decodeJwt(state.idToken)?.email ?? null
    },
  },
  actions: {
    setToken(token) {
      this.idToken = token
      localStorage.setItem(TOKEN_KEY, token)
    },
    logout() {
      this.idToken = null
      localStorage.removeItem(TOKEN_KEY)
    },
  },
})
