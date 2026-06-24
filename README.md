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
| Utils | `packages/utils` | — | Librería compartida (cifrado AES-256-GCM) |

## Stack Tecnológico

- **Framework:** Next.js 14 (apps/routes como API y UI)
- **Base de datos y Storage:** Supabase (PostgreSQL + Buckets)
- **Pagos:** Mercado Pago SDK
- **Criptografía:** Node.js `crypto` nativo — AES-256-GCM
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
MP_ACCESS_TOKEN
MP_CURRENCY
MP_BACK_URL
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
│   ├── auditoria/       # (pendiente)
│   └── reportes/        # (pendiente)
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
- [Paquete Utils](packages/utils/README.md)
