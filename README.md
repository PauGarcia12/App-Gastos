# App Gastos — Personal Expense Tracker

> Serverless SPA for personal finance tracking built on AWS. Upload your bank CSV and get automatic transaction categorization, monthly KPIs, and spending charts.

<<<<<<< HEAD
=======
![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?logo=amazonaws&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

>>>>>>> 1b5dd937ed5a941c6a4fab893944df3653e336bc
---

## What it does

App Gastos lets you upload your bank statement CSV and instantly get a full breakdown of your finances. Transactions are automatically categorized, displayed in charts, and summarized in monthly KPIs — all secured behind AWS Cognito authentication and running entirely on serverless infrastructure.

---

## Features

- **Authentication** — Sign up and sign in with AWS Cognito Hosted UI. JWT-based session management.
- **CSV upload** — Drag & drop your bank statement. Files are uploaded directly to S3 via presigned URLs — never through the backend.
- **Financial dashboard** — Monthly KPIs: total spending, income, balance, and transaction count, filterable by month.
- **Category chart** — Doughnut chart across 9 categories: groceries, restaurants, transport, subscriptions, online shopping, health, leisure, income, and others.
- **Transaction table** — Full list with date, description, category, and amount. Expenses in red, income in green.
- **Auto-deploy** — Every push to `main` deploys the app to S3 + CloudFront via GitHub Actions.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                User (Vue 3 SPA)                 │
│           CloudFront + Route 53 + S3            │
└──────────┬──────────────────────────────────────┘
           │
   ┌───────▼────────┐
   │  AWS Cognito   │  Authentication + JWT token
   └───────┬────────┘
           │ JWT
   ┌───────▼────────┐
   │  API Gateway   │  REST API (JWT authorizer)
   └──┬─────────┬───┘
      │         │
GET /gastos  GET /estadisticas
      │         │
 ┌────▼───┐ ┌───▼────────┐
 │ Lambda │ │   Lambda   │
 │  get   │ │   stats    │
 └────┬───┘ └───┬────────┘
      └────┬────┘
     ┌─────▼──────┐
     │  DynamoDB  │  Table: gastos (userId + transactionId)
     └────────────┘

CSV Upload Flow:
─────────────────
User → POST /upload-url → Lambda (presigned URL)
                                │
                     Returns temporary S3 URL
                                │
              User uploads CSV directly to S3
                                │
                   S3 event trigger (automatic)
                                │
                   Lambda (parse CSV) → DynamoDB
```

---

## AWS Services

| Service | Purpose |
|---|---|
| **AWS Cognito** | User authentication + JWT tokens |
| **API Gateway** | REST API with JWT authorizer |
| **Lambda ×4** | Presigned URL · Parse CSV · Get expenses · Statistics |
| **DynamoDB** | NoSQL storage — partition key: `userId`, sort key: `transactionId` |
| **S3 ×2** | CSV uploads · Vue frontend hosting |
| **CloudFront** | CDN + HTTPS |
| **Route 53** | DNS + custom domain |
| **ACM** | SSL/TLS certificate |

---

## Lambda Functions

| Function | Trigger | Description |
|---|---|---|
| `gastos-presigned-url` | API Gateway POST `/upload-url` | Verifies Cognito auth and generates a temporary S3 upload URL |
| `gastos-parsear-excel` | S3 `ObjectCreated` event | Parses the CSV, auto-categorizes transactions, saves to DynamoDB |
| `gastos-obtener` | API Gateway GET `/gastos` | Returns user transactions with optional month and category filters |
| `gastos-estadisticas` | API Gateway GET `/estadisticas` | Calculates totals by category and by day for a given month |

---

## Auto-categorization

Transactions are categorized automatically based on the description field:

| Category | Keywords |
|---|---|
| `alimentacion` | Mercadona, Carrefour, Lidl, Aldi, DIA... |
| `restaurantes` | Restaurante, Glovo, Uber Eats, McDonald's... |
| `transporte` | Renfe, Cabify, Uber, Gasolinera, Repsol... |
| `suscripciones` | Netflix, Spotify, Apple, Claude.ai, ChatGPT... |
| `compras_online` | Amazon, Zalando, Zara, AliExpress... |
| `salud` | Farmacia, Dentista, Clínica, Hospital... |
| `ocio` | Cine, Steam, PlayStation, Bowling... |
| `ingresos` | Nómina, Transferencia recibida... |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Vue Router, Pinia |
| Charts | Chart.js, vue-chartjs |
| Auth | AWS Cognito (Hosted UI) |
| Storage | AWS S3 + presigned URLs |
| API | AWS API Gateway + Lambda (Python 3.14) |
| Database | AWS DynamoDB (on-demand) |
| CDN / Hosting | AWS CloudFront + S3 |
| CI/CD | GitHub Actions + OIDC |

---

## Project Structure

```
gastos-app/
├── src/
│   ├── views/
│   │   ├── Login.vue       # Redirects to Cognito Hosted UI
│   │   ├── Callback.vue    # Handles OAuth code exchange → stores JWT
│   │   ├── Subir.vue       # CSV upload via presigned URL
│   │   └── Dashboard.vue   # KPIs, charts, and transaction table
│   ├── stores/
│   │   └── auth.js         # Pinia store — token and userId
│   ├── router/
│   │   └── index.js        # Routes with auth guard
│   ├── App.vue
│   └── main.js
├── public/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
└── vite.config.js
```

---

## Local Development

### Prerequisites

- Node.js 20+
- AWS account with Cognito, S3, API Gateway, and Lambda configured

### Setup

```bash
# Clone the repository
git clone https://github.com/PauGarcia12/App-Gastos.git
cd App-Gastos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in .env with your values

# Start dev server
npm run dev
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_COGNITO_DOMAIN=https://your-domain.auth.eu-south-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=https://your-api-id.execute-api.eu-south-2.amazonaws.com
VITE_S3_BUCKET=your-csv-bucket-name
VITE_REGION=eu-south-2
```

> `.env` is listed in `.gitignore` and is never committed to the repository. In production, all variables are injected at build time via GitHub Secrets.

---

## CI/CD Pipeline

The GitHub Actions workflow triggers on every push to `main`:

1. Checkout code
2. Set up Node.js 20
3. `npm ci` — clean dependency install
4. `npm run build` — production build with Vite (env vars injected from GitHub Secrets)
5. Sync assets to S3 with aggressive caching (`max-age=31536000`)
6. Upload `index.html` with no-cache (`no-store`) to ensure immediate updates
7. Invalidate CloudFront cache

<<<<<<< HEAD
La autenticación con AWS se realiza mediante **OIDC** sin tener claves estáticas almacenadas.
=======
AWS authentication uses **OIDC** — no static AWS keys stored anywhere.
>>>>>>> 1b5dd937ed5a941c6a4fab893944df3653e336bc

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ROLE_ARN` | IAM role ARN (Web Identity / OIDC) |
| `AWS_REGION` | AWS region |
| `S3_BUCKET_NAME` | Frontend hosting bucket |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `VITE_COGNITO_DOMAIN` | Cognito Hosted UI domain |
| `VITE_COGNITO_CLIENT_ID` | Cognito app client ID |
| `VITE_REDIRECT_URI` | Production callback URL |
| `VITE_API_URL` | API Gateway base URL |
| `VITE_S3_BUCKET` | CSV storage bucket |
| `VITE_REGION` | AWS region for the frontend |

---

## Production Build

```bash
npm run build
```

<<<<<<< HEAD
Genera los archivos optimizados en `dist/`.

---

## Por qué este proyecto

Elegí construir una app de gastos personales porque quería un proyecto que usara de verdad, con datos reales desde el primer día. No tiene sentido construir algo que no vas a utilizar.

La decisión de hacerlo 100% serverless fue consciente: quería aprender cómo funcionan las arquitecturas que usan las empresas en producción, no montar un servidor en EC2 y olvidarme. Con Lambda, API Gateway y DynamoDB aprendes a pensar de otra forma, cada función tiene una sola responsabilidad, los eventos disparan procesos automáticamente, y no pagas por recursos que no usas.

Lo que más me costó fue entender el flujo de autenticación con Cognito y el intercambio de tokens JWT. No es tan inmediato como un login tradicional, pero cuando lo entiendes ves por qué es la forma correcta de hacerlo en una arquitectura cloud.

La parte que más me gustó fue el pipeline de subida del CSV: el usuario sube el archivo, S3 dispara automáticamente la Lambda, la Lambda categoriza cada transacción y lo guarda en DynamoDB, todo sin que yo tenga que hacer nada. Eso es arquitectura event-driven real.

Si lo volviera a hacer, añadiría Terraform para definir toda la infraestructura como código desde el principio, y un sistema de alertas con SNS cuando el gasto mensual supera un presupuesto definido.
=======
Generates optimized files in `dist/` ready to deploy to S3.
>>>>>>> 1b5dd937ed5a941c6a4fab893944df3653e336bc
