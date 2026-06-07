<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import api from '@/api/client'

const file = ref(null)
const dragOver = ref(false)
const status = ref('idle')
const progress = ref(0)
const errorMsg = ref(null)

const fileInfo = computed(() => {
  if (!file.value) return null
  const sizeKb = (file.value.size / 1024).toFixed(1)
  return { name: file.value.name, size: `${sizeKb} KB` }
})

function onSelect(e) {
  const f = e.target.files?.[0]
  if (f) setFile(f)
}

function onDrop(e) {
  e.preventDefault()
  dragOver.value = false
  const f = e.dataTransfer.files?.[0]
  if (f) setFile(f)
}

function setFile(f) {
  if (!f.name.toLowerCase().endsWith('.csv')) {
    errorMsg.value = 'El archivo debe tener extensión .csv'
    file.value = null
    return
  }
  file.value = f
  errorMsg.value = null
  status.value = 'idle'
  progress.value = 0
}

function reset() {
  file.value = null
  status.value = 'idle'
  progress.value = 0
  errorMsg.value = null
}

async function subir() {
  if (!file.value) return
  status.value = 'uploading'
  progress.value = 0
  errorMsg.value = null

  try {
    const { data } = await api.post('/upload-url', {
      filename: file.value.name,
      contentType: 'text/csv',
    })

    if (!data?.url) throw new Error('La API no devolvió una presigned URL')

    await axios.put(data.url, file.value, {
      headers: { 'Content-Type': 'text/csv' },
      onUploadProgress: (e) => {
        if (e.total) progress.value = Math.round((e.loaded / e.total) * 100)
      },
    })

    status.value = 'success'
    progress.value = 100
  } catch (err) {
    status.value = 'error'
    errorMsg.value = err.response?.data?.message || err.message || 'Error al subir el archivo'
  }
}
</script>

<template>
  <div class="subir">
    <div class="page-header">
      <div>
        <h1>Importar extracto</h1>
        <p class="page-sub">Sube el CSV de tu banco para procesar y categorizar tus movimientos</p>
      </div>
    </div>

    <div class="upload-layout">
      <div class="upload-main">
        <div
          class="dropzone"
          :class="{ 'drag-over': dragOver, 'has-file': !!file }"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop="onDrop"
        >
          <input id="file" type="file" accept=".csv,text/csv" @change="onSelect" hidden />

          <template v-if="!file">
            <div class="drop-inner">
              <div class="drop-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <p class="drop-title">Arrastra tu CSV aquí</p>
              <p class="drop-hint">o selecciona el archivo manualmente</p>
              <label for="file" class="btn-select">Seleccionar archivo</label>
            </div>
          </template>

          <template v-else>
            <div class="file-preview">
              <div class="file-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div class="file-meta">
                <strong>{{ fileInfo.name }}</strong>
                <span>{{ fileInfo.size }}</span>
              </div>
              <div v-if="status === 'success'" class="file-check">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>

            <div v-if="status === 'uploading'" class="progress-wrap">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: progress + '%' }" />
              </div>
              <span>{{ progress }}%</span>
            </div>

            <div class="file-actions">
              <button v-if="status !== 'uploading'" class="btn-upload" @click="subir" :disabled="status === 'success'">
                {{ status === 'success' ? '✓ Subido' : 'Subir a S3' }}
              </button>
              <button class="btn-cancel" :disabled="status === 'uploading'" @click="reset">
                {{ status === 'success' ? 'Importar otro' : 'Cancelar' }}
              </button>
            </div>
          </template>
        </div>

        <div v-if="status === 'success'" class="banner success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Archivo subido. Las transacciones se procesarán automáticamente en segundos.
        </div>

        <div v-if="errorMsg" class="banner error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMsg }}
        </div>
      </div>

      <div class="upload-info">
        <div class="info-card">
          <h3>Formato esperado</h3>
          <ul>
            <li>Separador <code>;</code> (punto y coma)</li>
            <li>Importe con coma decimal y sufijo <code>EUR</code></li>
            <li>Ejemplo: <code>-45,30EUR</code></li>
            <li>Compatible con extractos <strong>Imagin</strong></li>
          </ul>
        </div>
        <div class="info-card info-card--flow">
          <h3>¿Cómo funciona?</h3>
          <ol>
            <li><span>1</span> Sube el CSV desde aquí</li>
            <li><span>2</span> Se procesa automáticamente</li>
            <li><span>3</span> Aparece en tu dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subir {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.page-header h1 {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text);
}

.page-sub {
  color: var(--text-3);
  font-size: 0.875rem;
  margin-top: 0.15rem;
}

.upload-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.25rem;
  align-items: start;
}

.upload-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dropzone {
  background: var(--surface);
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s, background 0.15s;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone.drag-over {
  border-color: var(--accent);
  background: var(--accent-muted);
}

.dropzone.has-file {
  flex-direction: column;
  align-items: stretch;
  padding: 1.5rem;
  gap: 1rem;
  min-height: auto;
  border-style: solid;
  border-color: var(--border);
}

.drop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 2.5rem;
  text-align: center;
}

.drop-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: var(--surface-2);
  display: grid;
  place-items: center;
  color: var(--text-3);
  margin-bottom: 0.5rem;
}

.drop-title {
  font-weight: 600;
  color: var(--text);
  font-size: 1rem;
}

.drop-hint {
  color: var(--text-3);
  font-size: 0.875rem;
}

.btn-select {
  margin-top: 0.5rem;
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-sm);
  background: #18181b;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-select:hover { background: #27272a; }

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--accent-muted);
  display: grid;
  place-items: center;
  color: var(--accent-hover);
  flex-shrink: 0;
}

.file-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.file-meta strong { color: var(--text); font-size: 0.95rem; }
.file-meta span { color: var(--text-3); font-size: 0.8rem; }

.file-check {
  color: var(--green);
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-hover);
}

.progress-track {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.2s ease;
}

.file-actions {
  display: flex;
  gap: 0.6rem;
}

.btn-upload {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-sm);
  border: none;
  background: #18181b;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-upload:hover:not(:disabled) { background: #27272a; }
.btn-upload:disabled { background: var(--green); color: #fff; cursor: default; }

.btn-cancel {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-2);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover:not(:disabled) { background: var(--surface-2); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
}

.banner.success { background: var(--green-muted); color: var(--green); }
.banner.error { background: var(--red-muted); color: var(--red); }

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 1.25rem;
}

.info-card h3 {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.85rem;
}

.info-card ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-card li {
  font-size: 0.85rem;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.info-card li::before {
  content: '·';
  color: var(--accent);
  font-weight: 700;
}

code {
  background: var(--surface-2);
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.info-card--flow ol {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.info-card--flow li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-2);
}

.info-card--flow li span {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-muted);
  color: var(--accent-hover);
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .upload-layout { grid-template-columns: 1fr; }
  .upload-info { display: grid; grid-template-columns: 1fr 1fr; }
}
</style>
