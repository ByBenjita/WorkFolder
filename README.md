# WorkFolder — Bóveda Digital Segura

WorkFolder es una plataforma de gestión documental con enfoque en seguridad. Implementa cifrado AES-256-GCM extremo a extremo, auditoría inmutable y una arquitectura de microservicios en monorepo.

## Arquitectura

El proyecto es un **monorepo pnpm + Turborepo** compuesto por:

| App / Paquete | Ruta | Puerto | Descripción |
|---|---|---|---|
| Frontend | `apps/frontend` | 3000 | UI principal + BFF (Backend for Frontend) |
| Usuarios | `apps/usuarios` | 3001 | Microservicio de autenticación y usuarios |
| Documentos | `apps/documentos` | 3002 | Microservicio de gestión y cifrado de documentos |
| Facturación | `apps/facturacion` | 3003 | Microservicio de pagos (Mercado Pago) |
| Auditoría | `apps/auditoria` | 3004 | Consumidor de la cola `audit_events` (Supabase Queues) + API de logs |
| Reportes | `apps/reportes` | 3005 | Eventos de negocio en Vercel Queues + API de métricas en tiempo real |
| Utils | `packages/utils` | — | Librería compartida (cifrado AES-256-GCM) |

## Stack Tecnológico

- **Framework:** Next.js 14 (apps/routes como API y UI)
- **Base de datos y Storage:** Supabase (PostgreSQL + Buckets)
- **Pagos:** Mercado Pago SDK
- **Criptografía:** Node.js `crypto` nativo — AES-256-GCM
- **Mensajería:** Supabase Queues (pgmq) para auditoría y pub/sub; Vercel Queues (equivalente gestionado a Kafka) para streaming de eventos de negocio y métricas
- **Testing:** Vitest
- **Monorepo:** pnpm Workspaces + Turborepo

## Prerrequisitos

- Node.js v18 o superior
- pnpm v11 o superior (`npm install -g pnpm`)

## Instalación

Desde la raíz del proyecto, instala todas las dependencias de todas las apps y paquetes:

```bash
pnpm install
```

## Variables de Entorno

Cada app tiene su propio `.env.local`. Consulta el README de cada componente para ver las variables requeridas. Las variables globales utilizadas por Turborepo son:

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
FRONTEND_URL
USUARIOS_API_URL
DOCUMENTOS_API_URL
FACTURACION_API_URL
AUDITORIA_API_URL
AUDIT_WORKER_SECRET
EVENTS_WORKER_SECRET
INTERNAL_PROXY_SECRET
MP_ACCESS_TOKEN
MP_CURRENCY
MP_BACK_URL
MP_SANDBOX
REPORTES_API_URL         # productores y frontend: URL del microservicio de reportes
REPORTES_INGEST_SECRET   # productores y reportes: secreto de POST /api/eventos
SERVICIO_NOMBRE          # productores en Vercel: usuarios | documentos | facturacion
```

## Levantar el Entorno Completo

Para iniciar todas las apps en paralelo desde la raíz:

```bash
pnpm dev
```

Esto ejecuta `turbo dev` y levanta todas las apps simultáneamente:

- Frontend: http://localhost:3000
- Usuarios API: http://localhost:3001
- Documentos API: http://localhost:3002
- Facturación API: http://localhost:3003
- Auditoría API: http://localhost:3004
- Reportes API: http://localhost:3005 (dashboard en el panel enterprise → **Métricas Live**)

Detalle del flujo de eventos (Vercel Queues) en [apps/reportes/README.md](apps/reportes/README.md).

## Levantar una App Individual

```bash
# Solo el frontend
pnpm --filter frontend dev

# Solo el microservicio de usuarios
pnpm --filter usuarios dev

# Solo el microservicio de documentos
pnpm --filter documentos dev

# Solo el microservicio de facturación
pnpm --filter facturacion dev
```

## Build

```bash
# Build de todas las apps
pnpm build

# Build de una app específica
pnpm --filter frontend build
```

## Tests

```bash
# Ejecutar tests de todas las apps
pnpm --filter "*" test

# Tests de una app específica
pnpm --filter usuarios test
pnpm --filter documentos test
pnpm --filter facturacion test
pnpm --filter frontend test
```

## Estructura de Carpetas

```
WorkFolder/
├── apps/
│   ├── frontend/        # UI + BFF (puerto 3000)
│   ├── usuarios/        # API usuarios (puerto 3001)
│   ├── documentos/      # API documentos (puerto 3002)
│   ├── facturacion/     # API pagos (puerto 3003)
│   ├── auditoria/       # API auditoría + consumidor de cola (puerto 3004)
│   └── reportes/        # Vercel Queues + métricas en tiempo real (puerto 3005)
├── packages/
│   └── utils/           # Librería compartida (@workfolder/utils)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## READMEs por Componente

- [Frontend](apps/frontend/README.md)
- [Microservicio Usuarios](apps/usuarios/README.md)
- [Microservicio Documentos](apps/documentos/README.md)
- [Microservicio Facturación](apps/facturacion/README.md)
- [Microservicio Auditoría](apps/auditoria/README.md)
- [Microservicio Reportes (Vercel Queues)](apps/reportes/README.md)
- [Paquete Utils](packages/utils/README.md)