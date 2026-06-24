# @workfolder/utils

Paquete de utilidades compartidas del monorepo WorkFolder. Actualmente expone funciones de cifrado y descifrado AES-256-GCM utilizadas por el microservicio de documentos.

## Uso

Este paquete está disponible internamente como dependencia de workspace:

```json
{
  "dependencies": {
    "@workfolder/utils": "workspace:*"
  }
}
```

## API

### `encrypt(data: string, key: string): string`

Cifra un texto plano usando AES-256-GCM. Retorna el resultado en formato `iv:authTag:ciphertext` codificado en hexadecimal.

```ts
import { encrypt } from '@workfolder/utils'

const cifrado = encrypt('contenido del documento', process.env.ENCRYPTION_KEY)
```

### `decrypt(encrypted: string, key: string): string`

Descifra un texto previamente cifrado con `encrypt`.

```ts
import { decrypt } from '@workfolder/utils'

const original = decrypt(cifrado, process.env.ENCRYPTION_KEY)
```

## Requisitos de la Clave

- La `ENCRYPTION_KEY` debe tener **exactamente 32 caracteres** (256 bits para AES-256).
- Debe definirse en el `.env.local` de cada app que use este paquete.

## Estructura

```
packages/utils/
├── src/
│   ├── encryption.ts  # Implementación AES-256-GCM
│   └── index.ts       # Exportaciones públicas
└── package.json
```

## Desarrollo

Este paquete no tiene servidor ni scripts de dev propios. Para modificarlo:

1. Edita los archivos en `src/`
2. Los cambios se reflejan automáticamente en las apps que lo importan (TypeScript resuelve directo desde `src/index.ts`)
