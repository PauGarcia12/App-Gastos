<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import api from '@/api/client'

ChartJS.register(ArcElement, Tooltip, Legend)

const CATEGORY_COLORS = {
  alimentacion: '#10b981',
  restaurantes: '#f59e0b',
  transporte: '#3b82f6',
  suscripciones: '#8b5cf6',
  compras_online: '#ec4899',
  salud: '#ef4444',
  ocio: '#06b6d4',
  ingresos: '#22c55e',
  otros: '#94a3b8',
}

const CATEGORY_LABELS = {
  alimentacion: 'Alimentación',
  restaurantes: 'Restaurantes',
  transporte: 'Transporte',
  suscripciones: 'Suscripciones',
  compras_online: 'Compras online',
  salud: 'Salud',
  ocio: 'Ocio',
  ingresos: 'Ingresos',
  otros: 'Otros',
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const mes = ref(currentMonth())
const transacciones = ref([])
const estadisticas = ref(null)
const loading = ref(false)
const errorMsg = ref(null)
const filtro = ref(null) // null | 'gasto' | 'ingreso'

const totalGastado = computed(() => {
  if (estadisticas.value?.total_gastado != null) return Number(estadisticas.value.total_gastado)
  return transacciones.value.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Math.abs(Number(t.importe)), 0)
})

const totalIngresos = computed(() =>
  transacciones.value.filter(t => t.tipo === 'ingreso' || Number(t.importe) > 0).reduce((s, t) => s + Math.abs(Number(t.importe)), 0)
)

const porCategoria = computed(() => {
  if (estadisticas.value?.por_categoria) return estadisticas.value.por_categoria
  const map = {}
  for (const t of transacciones.value) {
    if (t.tipo !== 'gasto') continue
    const cat = t.categoria || 'otros'
    map[cat] = (map[cat] || 0) + Math.abs(Number(t.importe))
  }
  return map
})

const chartData = computed(() => {
  const entries = Object.entries(porCategoria.value).sort((a, b) => b[1] - a[1])
  return {
    labels: entries.map(([k]) => CATEGORY_LABELS[k] || k),
    datasets: [{
      data: entries.map(([, v]) => Number(v)),
      backgroundColor: entries.map(([k]) => CATEGORY_COLORS[k] || '#94a3b8'),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverBorderWidth: 3,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 10, padding: 16, font: { size: 12 }, color: '#57534e' },
    },
    tooltip: {
      callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` },
    },
  },
  cutout: '70%',
}

const topCategorias = computed(() =>
  Object.entries(porCategoria.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
)

const transaccionesFiltradas = computed(() => {
  let lista = [...transacciones.value]
  if (filtro.value === 'gasto') lista = lista.filter(t => Number(t.importe) < 0)
  if (filtro.value === 'ingreso') lista = lista.filter(t => Number(t.importe) > 0)
  return lista.sort((a, b) => a.fecha < b.fecha ? 1 : -1)
})

function toggleFiltro(tipo) {
  filtro.value = filtro.value === tipo ? null : tipo
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0)
}

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function categoryLabel(cat) { return CATEGORY_LABELS[cat] || cat || '—' }
function categoryColor(cat) { return CATEGORY_COLORS[cat] || '#94a3b8' }

async function cargar() {
  loading.value = true
  errorMsg.value = null
  try {
    const [txRes, statsRes] = await Promise.all([
      api.get('/gastos', { params: { mes: mes.value } }),
      api.get('/estadisticas', { params: { mes: mes.value } }),
    ])
    transacciones.value = Array.isArray(txRes.data) ? txRes.data : (txRes.data.gastos || txRes.data.items || [])
    estadisticas.value = statsRes.data
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Error al cargar los datos'
    transacciones.value = []
    estadisticas.value = null
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
watch(mes, cargar)
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="page-sub">Resumen financiero mensual</p>
      </div>
      <div class="month-wrap">
        <label for="mes">Periodo</label>
        <input id="mes" type="month" v-model="mes" />
      </div>
    </div>

    <div v-if="errorMsg" class="alert-error">{{ errorMsg }}</div>

    <div class="kpis">
      <div class="kpi kpi--clickable" :class="{ 'kpi--active': filtro === 'gasto' }" @click="toggleFiltro('gasto')">
        <div class="kpi-icon kpi-icon--red">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div>
          <div class="kpi-label">Gastado</div>
          <div class="kpi-value kpi-value--red">{{ formatCurrency(totalGastado) }}</div>
        </div>
      </div>
      <div class="kpi kpi--clickable" :class="{ 'kpi--active': filtro === 'ingreso' }" @click="toggleFiltro('ingreso')">
        <div class="kpi-icon kpi-icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div>
          <div class="kpi-label">Ingresos</div>
          <div class="kpi-value kpi-value--green">{{ formatCurrency(totalIngresos) }}</div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-icon kpi-icon--amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div>
          <div class="kpi-label">Balance</div>
          <div class="kpi-value" :class="totalIngresos - totalGastado >= 0 ? 'kpi-value--green' : 'kpi-value--red'">
            {{ formatCurrency(totalIngresos - totalGastado) }}
          </div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-icon kpi-icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div>
          <div class="kpi-label">Movimientos</div>
          <div class="kpi-value">{{ transacciones.length }}</div>
        </div>
      </div>
    </div>

    <div class="grid-main">
      <div class="card">
        <div class="card-header">
          <h2>Por categoría</h2>
        </div>
        <div v-if="loading" class="empty-state">Cargando…</div>
        <div v-else-if="Object.keys(porCategoria).length === 0" class="empty-state">Sin gastos este mes</div>
        <template v-else>
          <div class="chart-wrap">
            <Doughnut :data="chartData" :options="chartOptions" />
          </div>
          <div class="cat-list">
            <div v-for="[cat, val] in topCategorias" :key="cat" class="cat-row">
              <div class="cat-dot" :style="{ background: categoryColor(cat) }" />
              <span class="cat-name">{{ categoryLabel(cat) }}</span>
              <span class="cat-val">{{ formatCurrency(val) }}</span>
            </div>
          </div>
        </template>
      </div>

      <div class="card card--table">
        <div class="card-header">
          <h2>Transacciones</h2>
          <span v-if="filtro" class="badge badge--filter">
            {{ filtro === 'gasto' ? 'Solo gastos' : 'Solo ingresos' }}
            <button class="badge-clear" @click="filtro = null">✕</button>
          </span>
          <span class="badge">{{ transaccionesFiltradas.length }}</span>
        </div>
        <div v-if="loading" class="empty-state">Cargando…</div>
        <div v-else-if="transaccionesFiltradas.length === 0" class="empty-state">Sin movimientos este mes</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th class="num">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in transaccionesFiltradas" :key="t.transactionId">
                <td class="date-cell">{{ formatDate(t.fecha) }}</td>
                <td class="concept-cell">{{ t.concepto }}</td>
                <td>
                  <span class="pill" :style="{ background: categoryColor(t.categoria) + '18', color: categoryColor(t.categoria) }">
                    {{ categoryLabel(t.categoria) }}
                  </span>
                </td>
                <td class="num" :class="Number(t.importe) < 0 ? 'neg' : 'pos'">
                  {{ formatCurrency(t.importe) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

h1 {
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

.month-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.month-wrap label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.month-wrap input {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-size: 0.9rem;
  color: var(--text);
  cursor: pointer;
  outline: none;
}

.month-wrap input:focus { border-color: var(--accent); }

.alert-error {
  background: var(--red-muted);
  color: var(--red);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.kpi {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.kpi--clickable {
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.1s;
}

.kpi--clickable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.kpi--active {
  outline: 2px solid var(--text);
  outline-offset: -1px;
}

.kpi-icon--red { background: #fee2e2; color: #dc2626; }
.kpi-icon--green { background: #dcfce7; color: #16a34a; }
.kpi-icon--amber { background: #fef3c7; color: #d97706; }
.kpi-icon--blue { background: #dbeafe; color: #2563eb; }

.kpi-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.kpi-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.kpi-value--red { color: var(--red); }
.kpi-value--green { color: var(--green); }

.grid-main {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.card-header h2 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.badge {
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.badge--filter {
  background: var(--text);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.badge-clear {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
}

.badge-clear:hover { opacity: 1; }

.chart-wrap {
  height: 220px;
  padding: 1.25rem;
}

.cat-list {
  padding: 0.5rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-name {
  font-size: 0.85rem;
  color: var(--text-2);
  flex: 1;
}

.cat-val {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-3);
  font-size: 0.9rem;
}

.table-wrap { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
}

tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--surface-2); }

.date-cell { color: var(--text-3); font-size: 0.82rem; white-space: nowrap; }
.concept-cell { color: var(--text); font-weight: 500; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pill {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.num { text-align: right; font-variant-numeric: tabular-nums; }
.neg { color: var(--red); font-weight: 600; }
.pos { color: var(--green); font-weight: 600; }

@media (max-width: 1100px) {
  .kpis { grid-template-columns: repeat(2, 1fr); }
  .grid-main { grid-template-columns: 1fr; }
}
</style>
