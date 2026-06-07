# App Gastos

Aplicación web para el seguimiento y gestión de gastos personales, construida con Vue 3 y Vite. Integra autenticación mediante AWS Cognito, almacenamiento en S3 y una API serverless con API Gateway + Lambda.

## Características

- Autenticación segura con AWS Cognito (registro, login y sesión persistente)
- Subida de archivos Excel con los gastos del usuario a AWS S3
- Dashboard con visualización de gastos mediante gráficos interactivos (Chart.js)
- API serverless con AWS API Gateway + Lambda
- Deploy automático a S3 + CloudFront mediante GitHub Actions

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3, Vite, Vue Router, Pinia |
| Gráficos | Chart.js, vue-chartjs |
| Autenticación | AWS Cognito |
| Almacenamiento | AWS S3 |
| API | AWS API Gateway + Lambda |
| CDN | AWS CloudFront |
| CI/CD | GitHub Actions |

## Estructura del proyecto

```
gastos-app/
├── src/
│   ├── views/
│   │   ├── Login.vue       # Autenticación con Cognito
│   │   ├── Subir.vue       # Subida de archivos a S3
│   │   └── Dashboard.vue   # Visualización de gastos
│   ├── App.vue
│   └── main.js
├── public/
├── .github/workflows/      # Pipeline de deploy
└── vite.config.js
```

## Requisitos previos

- Node.js 20+
- Cuenta de AWS con los siguientes servicios configurados:
  - Cognito User Pool
  - S3 Bucket para archivos de usuario
  - S3 Bucket para el hosting del frontend
  - API Gateway + Lambda
  - CloudFront

## Instalación y desarrollo local

```bash
# Clonar el repositorio
git clone https://github.com/PauGarcia12/App-Gastos.git
cd App-Gastos

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores de AWS

# Arrancar en modo desarrollo
npm run dev
```

## Variables de entorno

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
VITE_COGNITO_USER_POOL_ID=tu_user_pool_id
VITE_COGNITO_CLIENT_ID=tu_client_id
VITE_API_URL=https://tu-api.execute-api.region.amazonaws.com
VITE_S3_BUCKET=nombre-de-tu-bucket
VITE_REGION=tu-region
```

## Build de producción

```bash
npm run build
```

Los archivos generados se guardan en `dist/`.

## CI/CD

Cada push a `main` lanza automáticamente el pipeline de GitHub Actions que:

1. Instala dependencias y genera el build de producción
2. Sube los assets estáticos a S3 con caché agresiva
3. Sube `index.html` sin caché para garantizar actualizaciones inmediatas
4. Invalida la caché de CloudFront

Para configurar el pipeline necesitas los siguientes secrets en GitHub Actions:

| Secret | Descripción |
|---|---|
| `AWS_ROLE_ARN` | ARN del rol IAM con permisos S3 + CloudFront |
| `AWS_REGION` | Región de AWS |
| `S3_BUCKET_NAME` | Bucket donde se aloja el frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID de la distribución CloudFront |
| `VITE_COGNITO_USER_POOL_ID` | ID del User Pool de Cognito |
| `VITE_COGNITO_CLIENT_ID` | Client ID de Cognito |
| `VITE_API_URL` | URL base de la API |
| `VITE_S3_BUCKET` | Bucket de archivos de usuario |
| `VITE_REGION` | Región de AWS |
