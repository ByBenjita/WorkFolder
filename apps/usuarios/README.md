# Microservicio Usuarios — WorkFolder

Microservicio de gestión de usuarios y autenticación, construido con Next.js API routes. Expone una API REST conectada a Supabase e incluye documentación Swagger integrada.

- **Puerto:** 3001
- **Framework:** Next.js 14
- **Base de datos:** Supabase
- **Docs API:** http://localhost:3001/api-docs
- **Testing:** Vitest

## Prerrequisitos

- Node.js v18 o superior
- pnpm v11 o superior
- Proyecto Supabase configurado

## Variables de Entorno

Crea el archivo `apps/usuarios/.env.local` con:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
FRONTEND_URL=http://localhost:3000
```

> `SUPABASE_SERVICE_ROLE_KEY` otorga acceso completo a la base de datos. No exponerla al cliente ni commitearla.

## Instalación

Desde la raíz del monorepo:

```bash
pnpm install
```

## Desarrollo

```bash
# Desde la raíz
pnpm --filter usuarios dev

# O desde esta carpeta
pnpm dev
```

La API estará disponible en http://localhost:3001

## Build de Producción

```bash
pnpm --filter usuarios build
pnpm --filter usuarios start
```

## Tests

```bash
# Correr tests una vez
pnpm --filter usuarios test

# Correr tests con UI interactiva
pnpm --filter usuarios test:ui
```

Los tests se encuentran en `src/__tests__/`.

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| GET | `/api/users/[id]` | Obtener usuario por ID |
| PUT | `/api/users/[id]` | Actualizar usuario |
| DELETE | `/api/users/[id]` | Eliminar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/mfa/enroll` | Enrolar MFA |

La documentación completa e interactiva está en http://localhost:3001/api-docs (Swagger UI).

## Estructura

```
apps/usuarios/
├── src/
│   ├── app/
│   │   └── api/       # Rutas API (Next.js route handlers)
│   ├── lib/           # Helpers y configuración Supabase
│   ├── services/      # Lógica de negocio
│   └── __tests__/     # Tests unitarios
├── .env.local         # Variables de entorno (no commitear)
├── next.config.js
└── package.json
```
