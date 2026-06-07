<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
})

const email = ref('')
const password = ref('')
const newPassword = ref('')
const error = ref(null)
const loading = ref(false)
const step = ref('login')

let pendingCognitoUser = null

function login() {
  error.value = null
  loading.value = true

  const authDetails = new AuthenticationDetails({
    Username: email.value,
    Password: password.value,
  })

  const cognitoUser = new CognitoUser({
    Username: email.value,
    Pool: userPool,
  })

  cognitoUser.authenticateUser(authDetails, {
    onSuccess(result) {
      auth.setToken(result.getIdToken().getJwtToken())
      router.replace({ name: 'dashboard' })
    },
    onFailure(err) {
      loading.value = false
      switch (err.code) {
        case 'NotAuthorizedException':
          error.value = 'Email o contraseña incorrectos.'
          break
        case 'UserNotFoundException':
          error.value = 'No existe una cuenta con ese email.'
          break
        case 'UserNotConfirmedException':
          error.value = 'Debes confirmar tu cuenta antes de entrar.'
          break
        default:
          error.value = err.message || 'Error al iniciar sesión.'
      }
    },
    newPasswordRequired() {
      loading.value = false
      pendingCognitoUser = cognitoUser
      step.value = 'new-password'
    },
  })
}

function submitNewPassword() {
  error.value = null
  loading.value = true

  pendingCognitoUser.completeNewPasswordChallenge(newPassword.value, {}, {
    onSuccess(result) {
      auth.setToken(result.getIdToken().getJwtToken())
      router.replace({ name: 'dashboard' })
    },
    onFailure(err) {
      loading.value = false
      error.value = err.message || 'Error al establecer la contraseña.'
    },
  })
}
</script>

<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-left-inner">
        <div class="hero-brand">
          <div class="hero-mark">₿</div>
          <span>Gastos</span>
        </div>
        <h1 class="hero-title">Tus finanzas,<br/>bajo control.</h1>
        <p class="hero-sub">Importa tus extractos bancarios y visualiza tus gastos categorizados al instante.</p>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-num">35+</span>
            <span class="stat-label">Categorías</span>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <span class="stat-num">100%</span>
            <span class="stat-label">Privado</span>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <span class="stat-num">AWS</span>
            <span class="stat-label">Infraestructura</span>
          </div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-box">
        <div class="login-header">
          <h2>{{ step === 'login' ? 'Acceder' : 'Nueva contraseña' }}</h2>
          <p>{{ step === 'login' ? 'Introduce tus credenciales para continuar' : 'Establece tu contraseña definitiva' }}</p>
        </div>

        <form v-if="step === 'login'" @submit.prevent="login">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" placeholder="tu@email.com" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button class="btn-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="spinner" />
            <span v-else>Entrar</span>
          </button>
        </form>

        <form v-else @submit.prevent="submitNewPassword">
          <p class="info-msg">Debes establecer una contraseña nueva para continuar.</p>
          <div class="field">
            <label for="new-password">Nueva contraseña</label>
            <input id="new-password" v-model="newPassword" type="password" placeholder="••••••••" autocomplete="new-password" required />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button class="btn-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="spinner" />
            <span v-else>Establecer contraseña</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.login-left {
  background: var(--sidebar-bg);
  display: flex;
  align-items: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%);
  bottom: -100px;
  right: -100px;
}

.login-left-inner {
  position: relative;
  z-index: 1;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 3rem;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
}

.hero-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #ffffff;
  color: #18181b;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.hero-title {
  font-size: 2.75rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
}

.hero-sub {
  color: #a1a1aa;
  font-size: 0.975rem;
  line-height: 1.7;
  max-width: 340px;
  margin-bottom: 2.5rem;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.stat-num {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 0.75rem;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #27272a;
}

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: var(--bg);
}

.login-box {
  width: 100%;
  max-width: 380px;
}

.login-header {
  margin-bottom: 2rem;
}

.login-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.login-header p {
  color: var(--text-2);
  font-size: 0.9rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

input {
  padding: 0.8rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  color: var(--text);
  background: var(--surface);
  transition: border-color 0.15s;
  outline: none;
}

input:focus {
  border-color: var(--accent);
}

.error-msg {
  font-size: 0.85rem;
  color: var(--red);
  background: var(--red-muted);
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
}

.info-msg {
  font-size: 0.85rem;
  color: var(--blue);
  background: var(--blue-muted);
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-sm);
}

.btn-submit {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: var(--radius-sm);
  background: #18181b;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: grid;
  place-items: center;
  min-height: 48px;
  transition: background 0.15s, transform 0.05s;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) { background: #27272a; }
.btn-submit:active:not(:disabled) { transform: translateY(1px); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .login-page { grid-template-columns: 1fr; }
  .login-left { display: none; }
}
</style>
