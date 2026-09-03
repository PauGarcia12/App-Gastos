# App Gastos

> Aplicación web para el seguimiento y gestión de gastos personales con infraestructura serverless en AWS.

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

La autenticación con AWS se realiza mediante **OIDC** sin tener claves estáticas almacenadas.

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

---

## Por qué este proyecto

Elegí construir una app de gastos personales porque quería un proyecto que usara de verdad, con datos reales desde el primer día. No tiene sentido construir algo que no vas a utilizar.

La decisión de hacerlo 100% serverless fue consciente: quería aprender cómo funcionan las arquitecturas que usan las empresas en producción, no montar un servidor en EC2 y olvidarme. Con Lambda, API Gateway y DynamoDB aprendes a pensar de otra forma, cada función tiene una sola responsabilidad, los eventos disparan procesos automáticamente, y no pagas por recursos que no usas.

Lo que más me costó fue entender el flujo de autenticación con Cognito y el intercambio de tokens JWT. No es tan inmediato como un login tradicional, pero cuando lo entiendes ves por qué es la forma correcta de hacerlo en una arquitectura cloud.

La parte que más me gustó fue el pipeline de subida del CSV: el usuario sube el archivo, S3 dispara automáticamente la Lambda, la Lambda categoriza cada transacción y lo guarda en DynamoDB, todo sin que yo tenga que hacer nada. Eso es arquitectura event-driven real.

Si lo volviera a hacer, añadiría Terraform para definir toda la infraestructura como código desde el principio, y un sistema de alertas con SNS cuando el gasto mensual supera un presupuesto definido. Son los siguientes pasos naturales del proyecto.