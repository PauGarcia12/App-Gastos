# App Gastos

> Aplicación web para el seguimiento y gestión de gastos personales con infraestructura serverless en AWS.

![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?logo=amazonaws&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

---

## Descripción

App Gastos permite a los usuarios subir sus extractos bancarios en formato CSV y visualizar automáticamente un análisis detallado de sus finanzas. La aplicación clasifica los movimientos por categorías, muestra gráficos de distribución del gasto y ofrece un resumen de KPIs mensual.

Toda la infraestructura corre sobre servicios serverless de AWS, sin necesidad de gestionar servidores.

---

## Funcionalidades

- **Autenticación** — Registro e inicio de sesión con AWS Cognito. Soporte para flujo de contraseña inicial.
- **Subida de extractos** — Drag & drop de archivos CSV. La subida se realiza directamente a S3 mediante URLs prefirmadas.
- **Dashboard financiero** — KPIs de gasto, ingresos, balance y número de movimientos filtrados por mes.
- **Gráfico de categorías** — Doughnut chart con 9 categorías: alimentación, restaurantes, transporte, suscripciones, compras online, salud, ocio, ingresos y otros.
- **Tabla de movimientos** — Listado detallado con fecha, concepto, categoría y importe. Gastos en rojo, ingresos en verde.
- **Deploy automático** — Cada push a `main` despliega la app en S3 + CloudFront vía GitHub Actions.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3, Vite, Vue Router, Pinia |
| Gráficos | Chart.js, vue-chartjs |
| Autenticación | AWS Cognito |
| Almacenamiento | AWS S3 + URLs prefirmadas |
| API | AWS API Gateway + Lambda |
| CDN / Hosting | AWS CloudFront + S3 |
| CI/CD | GitHub Actions + OIDC |

---

## Arquitectura

```
Usuario
  │
  ├─▶ CloudFront ──▶ S3 (frontend estático)
  │
  ├─▶ Cognito (autenticación)
  │
  ├─▶ API Gateway ──▶ Lambda (lógica de negocio)
  │
  └─▶ S3 (almacenamiento de extractos CSV)
```

---

## Estructura del proyecto

```
gastos-app/
├── src/
│   ├── views/
│   │   ├── Login.vue        # Autenticación con AWS Cognito
│   │   ├── Subir.vue        # Subida de CSV a S3 via presigned URL
│   │   └── Dashboard.vue    # KPIs, gráficos y tabla de movimientos
│   ├── App.vue
│   └── main.js
├── public/
├── .github/
│   └── workflows/
│       └── deploy.yml       # Pipeline CI/CD
└── vite.config.js
```

---

## Instalación y desarrollo local

### Requisitos previos

- Node.js 20+
- Cuenta AWS con Cognito, S3, API Gateway y Lambda configurados

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/PauGarcia12/App-Gastos.git
cd App-Gastos

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Arrancar servidor de desarrollo
npm run dev
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_COGNITO_USER_POOL_ID=eu-south-2_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_API_URL=https://xxxxxxxxxx.execute-api.eu-south-2.amazonaws.com
VITE_S3_BUCKET=nombre-de-tu-bucket
VITE_REGION=eu-south-2
```

> El archivo `.env` está en `.gitignore` y nunca se sube al repositorio.

---

## CI/CD

El pipeline de GitHub Actions se activa en cada push a `main` y ejecuta los siguientes pasos:

1. Checkout del código
2. Setup de Node.js 20
3. `npm ci` — instalación limpia de dependencias
4. `npm run build` — build de producción con Vite
5. Sync de assets a S3 con caché agresiva (`max-age=31536000`)
6. Upload de `index.html` sin caché (`no-store`) para garantizar actualizaciones inmediatas
7. Invalidación de caché en CloudFront

La autenticación con AWS se realiza mediante **OIDC** (sin claves estáticas almacenadas).

### Secrets necesarios en GitHub

| Secret | Descripción |
|---|---|
| `AWS_ROLE_ARN` | ARN del rol IAM (Web Identity) |
| `AWS_REGION` | Región de AWS |
| `S3_BUCKET_NAME` | Bucket de hosting del frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID de la distribución CloudFront |
| `VITE_COGNITO_USER_POOL_ID` | User Pool ID de Cognito |
| `VITE_COGNITO_CLIENT_ID` | Client ID de Cognito |
| `VITE_API_URL` | URL base de la API |
| `VITE_S3_BUCKET` | Bucket de almacenamiento de extractos |
| `VITE_REGION` | Región de AWS para el frontend |

---

## Build de producción

```bash
npm run build
```

Genera los archivos optimizados en `dist/`.
