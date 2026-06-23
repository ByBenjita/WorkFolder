const securityBearer = [{ BearerAuth: [] }];

export function buildSwaggerSpec(baseUrl: string) {
  return {
    openapi: '3.0.0',
    info: {
      title:       'WorkFolder — API Facturación',
      description: 'Microservicio de planes, suscripciones y pagos (integración con Mercado Pago).',
      version:     '1.0.0',
    },
    servers: [{ url: baseUrl, description: 'Servidor actual' }],

    components: {
      securitySchemes: {
        BearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Token JWT obtenido en el servicio de usuarios (/api/auth/login). Solo administradores pueden gestionar suscripciones y pagos.',
        },
      },
      schemas: {
        Plan: {
          type: 'object',
          properties: {
            id:               { type: 'string', enum: ['startup', 'business', 'enterprise'] },
            nombre:           { type: 'string', example: 'Enterprise' },
            precio_mensual:   { type: 'number', example: 15, description: 'Precio en USD, sin IVA' },
            precio_clp:       { type: 'number', example: 14990 },
            iva_porcentaje:   { type: 'number', example: 19 },
            caracteristicas:  { type: 'array', items: { type: 'string' } },
            modulo_rrhh:      {
              type: 'object',
              nullable: true,
              properties: {
                titulo: { type: 'string' },
                extras: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        Suscripcion: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            admin_id:     { type: 'string', format: 'uuid' },
            plan_id:      { type: 'string', enum: ['startup', 'business', 'enterprise'] },
            estado:       { type: 'string', enum: ['activo', 'pendiente', 'cancelado'] },
            creado_en:    { type: 'string', format: 'date-time' },
          },
        },
        Factura: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            suscripcion_id:   { type: 'string', format: 'uuid' },
            monto:            { type: 'number', example: 17.85 },
            moneda:           { type: 'string', example: 'USD' },
            estado:           { type: 'string', example: 'approved' },
            creado_en:        { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },

    paths: {
      '/api/planes': {
        get: {
          tags:    ['Planes'],
          summary: 'Listar los planes disponibles (Startup, Business, Enterprise)',
          security: undefined,
          responses: {
            '200': {
              description: 'Catálogo de planes',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      planes:  { type: 'array', items: { $ref: '#/components/schemas/Plan' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/api/suscripcion': {
        get: {
          tags:     ['Suscripción'],
          summary:  'Obtener la suscripción activa del administrador autenticado',
          security: securityBearer,
          responses: {
            '200': {
              description: 'Suscripción del administrador (Enterprise por defecto si no tiene una registrada)',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, suscripcion: { $ref: '#/components/schemas/Suscripcion' } } } } },
            },
            '401': { description: 'No autorizado o no es administrador', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '500': { description: 'Error interno', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
        post: {
          tags:     ['Suscripción'],
          summary:  'Crear o actualizar la suscripción del administrador (cambio de plan)',
          security: securityBearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['plan_id'],
                  properties: {
                    plan_id: { type: 'string', enum: ['startup', 'business', 'enterprise'], example: 'enterprise' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Suscripción creada o actualizada',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, suscripcion: { $ref: '#/components/schemas/Suscripcion' } } } } },
            },
            '400': { description: 'plan_id inválido',                  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado o no es administrador', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      '/api/facturas': {
        get: {
          tags:     ['Facturas'],
          summary:  'Listar las facturas asociadas a la suscripción del administrador',
          security: securityBearer,
          responses: {
            '200': {
              description: 'Lista de facturas (vacía si aún no tiene suscripción)',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, facturas: { type: 'array', items: { $ref: '#/components/schemas/Factura' } } } } } },
            },
            '401': { description: 'No autorizado o no es administrador', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '500': { description: 'Error interno', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      '/api/pago/iniciar': {
        post: {
          tags:     ['Pagos — Mercado Pago'],
          summary:  'Iniciar una preaprobación de suscripción recurrente en Mercado Pago',
          security: securityBearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['plan_id'],
                  properties: {
                    plan_id:     { type: 'string', enum: ['startup', 'business', 'enterprise'] },
                    payer_email: { type: 'string', format: 'email', description: 'Opcional. Si no se envía, se usa el email del usuario autenticado.' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Preaprobación creada. Redirigir al usuario a init_point para completar el pago.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      init_point:        { type: 'string', format: 'uri' },
                      sandbox_init_point:{ type: 'string', format: 'uri' },
                      preapproval_id:    { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': { description: 'plan_id inválido',                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado o no es administrador', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '503': { description: 'Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '500': { description: 'Mercado Pago rechazó la solicitud', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      '/api/pago/sync': {
        get: {
          tags:     ['Pagos — Mercado Pago'],
          summary:  'Sincronizar manualmente el estado de una preaprobación con Mercado Pago',
          security: securityBearer,
          parameters: [
            { name: 'preapproval_id', in: 'query', required: true, description: 'ID de la preaprobación en Mercado Pago', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Resultado de la sincronización',
              content: { 'application/json': { schema: { type: 'object', properties: { sincronizado: { type: 'boolean' }, estado: { type: 'string' }, plan_id: { type: 'string' } } } } },
            },
            '400': { description: 'Falta preapproval_id',            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado o no es administrador', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '403': { description: 'La preaprobación no pertenece al administrador autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      '/api/pago/simular': {
        post: {
          tags:     ['Pagos — Mercado Pago'],
          summary:  'Simular la activación de una suscripción en modo sandbox (solo con credenciales TEST-)',
          security: securityBearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['plan_id'],
                  properties: { plan_id: { type: 'string', enum: ['startup', 'business', 'enterprise'] } },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Suscripción simulada y activada',
              content: { 'application/json': { schema: { type: 'object', properties: { simulado: { type: 'boolean' }, plan_id: { type: 'string' } } } } },
            },
            '400': { description: 'plan_id inválido',                content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '401': { description: 'No autorizado o no es administrador', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            '403': { description: 'MP_ACCESS_TOKEN no es de sandbox (no empieza con TEST-)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },

      '/api/pago/webhook': {
        post: {
          tags:    ['Pagos — Mercado Pago'],
          summary: 'Webhook público invocado por Mercado Pago ante eventos de pago/suscripción',
          description: 'No requiere autenticación (lo invoca Mercado Pago directamente). Siempre responde 200 para evitar reintentos innecesarios de MP.',
          security: undefined,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['subscription_preapproval', 'payment'] },
                    data: { type: 'object', properties: { id: { type: 'string' } } },
                  },
                },
                example: { type: 'payment', data: { id: '123456789' } },
              },
            },
          },
          responses: {
            '200': { description: 'Notificación procesada (o ignorada si el tipo no es soportado)' },
          },
        },
      },
    },
  };
}
