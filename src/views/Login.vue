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
const confirmCode = ref('')
const error = ref(null)
const loading = ref(false)
const step = ref('login') // login | register | confirm | new-password

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
          error.value = 'Debes confirmar tu cuenta. Revisa tu email.'
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

function register() {
  error.value = null
  loading.value = true

  userPool.signUp(email.value, password.value, [], null, (err, result) => {
    loading.value = false
    if (err) {
      switch (err.code) {
        case 'UsernameExistsException':
          error.value = 'Ya existe una cuenta con ese email.'
          break
        case 'InvalidPasswordException':
          error.value = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.'
          break
        default:
          error.value = err.message || 'Error al crear la cuenta.'
      }
      return
    }
    pendingCognitoUser = result.user
    step.value = 'confirm'
  })
}

function confirmAccount() {
  error.value = null
  loading.value = true

  pendingCognitoUser.confirmRegistration(confirmCode.value, true, (err) => {
    loading.value = false
    if (err) {
      switch (err.code) {
        case 'CodeMismatchException':
          error.value = 'Código incorrecto. Comprueba tu email.'
          break
        case 'ExpiredCodeException':
          error.value = 'El código ha expirado. Solicita uno nuevo.'
          break
        default:
          error.value = err.message || 'Error al confirmar la cuenta.'
      }
      return
    }
    step.value = 'login'
    error.value = null
  })
}

function resendCode() {
  pendingCognitoUser.resendConfirmationCode((err) => {
    if (err) {
      error.value = 'Error al reenviar el código.'
      return
    }
    error.value = null
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
      </div>
    </div>

    <div class="login-right">
      <div class="login-box">

        <!-- LOGIN -->
        <template v-if="step === 'login'">
          <div class="login-header">
            <h2>Acceder</h2>
            <p>Introduce tus credenciales para continuar</p>
          </div>
          <form @submit.prevent="login">
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
          <p class="switch-text">
            ¿No tienes cuenta?
            <button class="link-btn" @click="step = 'register'; error = null">Crear cuenta</button>
          </p>
        </template>

        <!-- REGISTER -->
        <template v-else-if="step === 'register'">
          <div class="login-header">
            <h2>Crear cuenta</h2>
            <p>Introduce tu email y una contraseña</p>
          </div>
          <form @submit.prevent="register">
            <div class="field">
              <label for="reg-email">Email</label>
              <input id="reg-email" v-model="email" type="email" placeholder="tu@email.com" autocomplete="email" required />
            </div>
            <div class="field">
              <label for="reg-password">Contraseña</label>
              <input id="reg-password" v-model="password" type="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" required />
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
            <button class="btn-submit" type="submit" :disabled="loading">
              <span v-if="loading" class="spinner" />
              <span v-else>Crear cuenta</span>
            </button>
          </form>
          <p class="switch-text">
            ¿Ya tienes cuenta?
            <button class="link-btn" @click="step = 'login'; error = null">Iniciar sesión</button>
          </p>
        </template>

        <!-- CONFIRM EMAIL -->
        <template v-else-if="step === 'confirm'">
          <div class="login-header">
            <h2>Confirma tu email</h2>
            <p>Te hemos enviado un código a <strong>{{ email }}</strong></p>
          </div>
          <form @submit.prevent="confirmAccount">
            <div class="field">
              <label for="code">Código de verificación</label>
              <input id="code" v-model="confirmCode" type="text" placeholder="123456" autocomplete="one-time-code" required />
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
            <button class="btn-submit" type="submit" :disabled="loading">
              <span v-if="loading" class="spinner" />
              <span v-else>Confirmar cuenta</span>
            </button>
          </form>
          <p class="switch-text">
            ¿No recibiste el código?
            <button class="link-btn" @click="resendCode">Reenviar</button>
          </p>
        </template>

        <!-- NEW PASSWORD -->
        <template v-else-if="step === 'new-password'">
          <div class="login-header">
            <h2>Nueva contraseña</h2>
            <p>Establece tu contraseña definitiva</p>
          </div>
          <form @submit.prevent="submitNewPassword">
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
        </template>

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

.switch-text {
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-2);
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

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