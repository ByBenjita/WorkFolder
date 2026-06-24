# Microservicio Documentos — WorkFolder

Microservicio de gestión de documentos con cifrado extremo a extremo. Los archivos se cifran con AES-256-GCM antes de almacenarse en Supabase Storage, usando el paquete compartido `@workfolder/utils`.

- **Puerto:** 3002
- **Framework:** Next.js 14
- **Base de datos y Storage:** Supabase
- **Cifrado:** AES-256-GCM (`@workfolder/utils`)
- **Testing:** Vitest

## Prerrequisitos

- Node.js v18 o superior
- pnpm v11 o superior
- Proyecto Supabase con un bucket de almacenamiento configurado

## Variables de Entorno

Crea el archivo `apps/documentos/.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

# Clave de cifrado AES-256-GCM (exactamente 32 caracteres)
ENCRYPTION_KEY=mi_clave_secreta_de_32_caracteres_
```

> `ENCRYPTION_KEY` debe tener exactamente 32 caracteres para AES-256. No commitear este valor en el repositorio.

## Instalación

Desde la raíz del monorepo:

```bash
pnpm install
```

## Desarrollo

```bash
# Desde la raíz
pnpm --filter documentos dev

# O desde esta carpeta
pnpm dev
```

La API estará disponible en http://localhost:3002

## Build de Producción

```bash
pnpm --filter documentos build
pnpm --filter documentos start
```

## Tests

```bash
# Correr tests una vez
pnpm --filter documentos test

# Correr tests con UI interactiva
pnpm --filter documentos test:ui
```

Los tests se encuentran en `src/__tests__/` o `__tests__/`.

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/documents` | Listar documentos del usuario |
| POST | `/api/documents/upload` | Subir y cifrar un documento |
| GET | `/api/documents/[id]` | Descargar y descifrar un documento |
| DELETE | `/api/documents/[id]` | Eliminar un documento |

## Flujo de Cifrado

```
Subida:    Archivo → cifrado AES-256-GCM → Supabase Storage
Descarga:  Supabase Storage → descifrado AES-256-GCM → Archivo original
```

## Estructura

```
apps/documentos/
├── src/
│   ├── app/
│   │   └── api/       # Rutas API (Next.js route handlers)
│   ├── lib/           # Helpers y configuración Supabase
│   └── __tests__/     # Tests unitarios
├── .env.local         # Variables de entorno (no commitear)
├── next.config.js
└── package.json
```
