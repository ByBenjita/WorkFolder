# Frontend — WorkFolder

Aplicación Next.js que actúa como interfaz de usuario principal y BFF (Backend for Frontend). Todos los llamados a los microservicios pasan por las API routes de Next.js, nunca directamente desde el navegador.

- **Puerto:** 3000
- **Framework:** Next.js 14
- **Testing:** Vitest + Testing Library

## Prerrequisitos

- Node.js v18 o superior
- pnpm v11 o superior
- Los microservicios (`usuarios`, `documentos`, `facturacion`) deben estar corriendo para funcionalidad completa

## Variables de Entorno

Crea el archivo `apps/frontend/.env.local` con:

```env
# URLs internas de los microservicios (usadas en el BFF / API routes)
USUARIOS_API_URL=http://localhost:3001
NEXT_PUBLIC_USUARIOS_API_URL=http://localhost:3001
DOCUMENTOS_API_URL=http://localhost:3002
FACTURACION_API_URL=http://localhost:3003

# Supabase (para autenticación client-side)
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

## Instalación

Desde la raíz del monorepo:

```bash
pnpm install
```

O solo las dependencias del frontend:

```bash
pnpm --filter frontend install
```

## Desarrollo

```bash
# Desde la raíz
pnpm --filter frontend dev

# O desde esta carpeta
pnpm dev
```

La app estará disponible en http://localhost:3000

## Build de Producción

```bash
pnpm --filter frontend build
pnpm --filter frontend start
```

## Tests

```bash
# Correr tests una vez
pnpm --filter frontend test

# Correr tests con UI interactiva
pnpm --filter frontend test:ui
```

Los tests se encuentran en `src/__tests__/`.

## Estructura

```
apps/frontend/
├── src/
│   ├── app/           # Rutas Next.js (pages + API routes / BFF)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilidades y helpers
│   ├── services/      # Clientes hacia Supabase y APIs
│   └── __tests__/     # Tests unitarios
├── public/
├── .env.local         # Variables de entorno (no commitear)
├── next.config.js
└── package.json
```

## Patrón BFF

Las API routes de Next.js (`src/app/api/`) actúan como proxy entre el navegador y los microservicios. Esto evita exponer las URLs internas y credenciales al cliente.

```
Navegador → /api/usuarios/* → http://localhost:3001
Navegador → /api/documentos/* → http://localhost:3002
Navegador → /api/facturacion/* → http://localhost:3003
```
