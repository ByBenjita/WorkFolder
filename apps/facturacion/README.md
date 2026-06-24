# Microservicio Facturación — WorkFolder

Microservicio de procesamiento de pagos y gestión de suscripciones. Integra el SDK de Mercado Pago para crear preferencias de pago, manejar webhooks y registrar transacciones en Supabase.

- **Puerto:** 3003
- **Framework:** Next.js 14
- **Base de datos:** Supabase
- **Pagos:** Mercado Pago SDK v2
- **Testing:** Vitest

## Prerrequisitos

- Node.js v18 o superior
- pnpm v11 o superior
- Cuenta de Mercado Pago (credenciales de prueba o producción)
- Proyecto Supabase configurado

## Variables de Entorno

Crea el archivo `apps/facturacion/.env.local` con:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

FRONTEND_URL=http://localhost:3000

# Mercado Pago
MP_ACCESS_TOKEN=TEST-<tu-access-token>   # Usar TEST- para sandbox
MP_CURRENCY=CLP
MP_BACK_URL=http://localhost:3000/admin/enterprise-panel
```

> Para pruebas, usa el `MP_ACCESS_TOKEN` que empiece con `TEST-`. Las credenciales de producción empiezan con `APP_USR-`.

## Instalación

Desde la raíz del monorepo:

```bash
pnpm install
```

## Desarrollo

```bash
# Desde la raíz
pnpm --filter facturacion dev

# O desde esta carpeta
pnpm dev
```

La API estará disponible en http://localhost:3003

## Build de Producción

```bash
pnpm --filter facturacion build
pnpm --filter facturacion start
```

## Tests

```bash
# Correr tests una vez
pnpm --filter facturacion test
```

Los tests se encuentran en `src/__tests__/`.

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/payments/create-preference` | Crear preferencia de pago en Mercado Pago |
| POST | `/api/payments/webhook` | Webhook de notificaciones de Mercado Pago |
| GET | `/api/subscriptions` | Listar suscripciones del usuario |
| POST | `/api/subscriptions` | Crear o actualizar suscripción |

## Flujo de Pago

```
1. Frontend llama a POST /api/payments/create-preference
2. Se crea una preferencia en Mercado Pago y se retorna un init_point
3. El usuario completa el pago en Mercado Pago
4. Mercado Pago notifica via webhook POST /api/payments/webhook
5. El webhook actualiza el estado de la suscripción en Supabase
6. El usuario es redirigido a MP_BACK_URL
```

## Modo Sandbox

Para probar pagos sin dinero real, usa el `MP_ACCESS_TOKEN` de tipo `TEST-`. Mercado Pago provee tarjetas de prueba en su documentación oficial.

## Estructura

```
apps/facturacion/
├── src/
│   ├── app/
│   │   └── api/       # Rutas API (Next.js route handlers)
│   ├── lib/           # Helpers y configuración Supabase / Mercado Pago
│   └── __tests__/     # Tests unitarios
├── .env.local         # Variables de entorno (no commitear)
├── next.config.js
└── package.json
```
