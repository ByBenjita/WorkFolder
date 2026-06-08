const securityBearer = [{ BearerAuth: [] }];

export function buildSwaggerSpec(baseUrl: string) {
  return {
    openapi: '3.0.0',
    info: {
      title:       'WorkFolder — API Documentos',
      description: 'Microservicio de almacenamiento cifrado de documentos (AES-256-CBC).',
      version:     '1.0.0',
    },
    servers: [{ url: baseUrl, description: 'Servidor actual' }],

    components: {
      securitySchemes: {
        BearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Token JWT obtenido en el servicio de usuarios (/api/auth/login)',
        },
      },
      schemas: {
        DocumentoMetadata: {
          type: 'object',
          properties: {
            id:              { type: 'string', format: 'uuid' },
            user_id:         { type: 'string', format: 'uuid' },
            nombre_original: { type: 'string', example: 'contrato.pdf' },
            ruta_storage:    { type: 'string' },
            tamano_bytes:    { type: 'integer' },
            tipo_mime:       { type: 'string', example: 'application/pdf' },
            creado_en:       { type: 'string', format: 'date-time' },
            actualizado_en:  { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },

    paths: {
      '/api': {
        post: {
          tags:     ['Documentos'],
          summary:  'Subir y cifrar un documento',
          security: securityBearer,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'userId', 'userKey'],
                  properties: {
                    file:    { type: 'string', format: 'binary', description: 'Archivo a subir' },
                    userId:  { type: 'string', format: 'uuid',   description: 'ID del usuario propietario' },
                    userKey: { type: 'string', minLength: 8,     description: 'Clave de cifrado (mín. 8 caracteres)' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Documento subido y cifrado correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data:    { $ref: '#/components/schemas/DocumentoMetadata' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Parámetros inválidos o clave muy corta', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado',                          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '403': { description: 'No puedes subir documentos para otro usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },

        get: {
          tags:     ['Documentos'],
          summary:  'Listar documentos del usuario o descargar uno específico',
          security: securityBearer,
          parameters: [
            { name: 'userId',     in: 'query',  description: 'ID del usuario — lista sus documentos',             schema: { type: 'string', format: 'uuid' } },
            { name: 'id',         in: 'query',  description: 'ID del documento — lo descarga (requiere x-user-key)', schema: { type: 'string', format: 'uuid' } },
            { name: 'adminAll',   in: 'query',  description: 'Si es "true" y el usuario es admin, lista todos',   schema: { type: 'string', enum: ['true'] } },
            { name: 'x-user-key', in: 'header', description: 'Clave de descifrado del usuario',                   schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Lista de documentos o archivo descargado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/DocumentoMetadata' } },
                    },
                  },
                },
                'application/octet-stream': { schema: { type: 'string', format: 'binary' } },
              },
            },
            '400': { description: 'Clave requerida o parámetros inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado',                          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '403': { description: 'Clave incorrecta o sin acceso',          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '404': { description: 'Documento no encontrado',                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },

        patch: {
          tags:     ['Documentos'],
          summary:  'Cambiar la clave de cifrado de un documento (requiere 2FA)',
          security: securityBearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['documentId', 'newKey'],
                  properties: {
                    documentId:    { type: 'string', format: 'uuid' },
                    newKey:        { type: 'string', minLength: 8, description: 'Nueva clave (mín. 8 caracteres)' },
                    mfaCode:       { type: 'string', example: '123456', description: 'Código TOTP (obligatorio si no es admin)' },
                    factorId:      { type: 'string', description: 'ID del factor MFA' },
                    adminOverride: { type: 'boolean', description: 'Si es true y el usuario es admin, omite la verificación 2FA' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Clave actualizada correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Parámetros inválidos',          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado o 2FA incorrecto', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '403': { description: 'Sin acceso o se requiere 2FA',   content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '404': { description: 'Documento no encontrado',         content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },

        delete: {
          tags:     ['Documentos'],
          summary:  'Eliminar un documento permanentemente',
          security: securityBearer,
          parameters: [
            { name: 'id', in: 'query', required: true, description: 'ID del documento a eliminar', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Documento eliminado correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'ID requerido',             content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado',            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '403': { description: 'Sin acceso al documento',  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '404': { description: 'Documento no encontrado',  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
    },
  };
}
