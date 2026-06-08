const securityBearer = [{ BearerAuth: [] }];

export function buildSwaggerSpec(baseUrl: string) {
  return {
  openapi: '3.0.0',
  info: {
    title:       'WorkFolder — API Usuarios',
    description: 'Microservicio de autenticación, MFA y gestión de usuarios corporativos.',
    version:     '1.0.0',
  },
  servers: [{ url: baseUrl, description: 'Servidor actual' }],

  components: {
    securitySchemes: {
      BearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        description:  'Token JWT obtenido en /api/auth/login',
      },
    },
    schemas: {
      SuccessMessage: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      UserPermissions: {
        type: 'object',
        properties: {
          create_users:   { type: 'boolean' },
          view_audit:     { type: 'boolean' },
          manage_billing: { type: 'boolean' },
        },
      },
      AdminUser: {
        type: 'object',
        properties: {
          id:          { type: 'string', format: 'uuid' },
          email:       { type: 'string', format: 'email' },
          full_name:   { type: 'string', nullable: true },
          is_admin:    { type: 'boolean' },
          level:       { type: 'string', enum: ['admin_principal', 'admin_delegado', 'estandar'] },
          permissions: { $ref: '#/components/schemas/UserPermissions' },
          banned:      { type: 'boolean' },
          mfa_enabled: { type: 'boolean' },
          created_at:  { type: 'string', format: 'date-time' },
        },
      },
    },
  },

  paths: {
    // ── Auth ──────────────────────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags:    ['Auth'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'usuario@empresa.cl' },
                  password: { type: 'string', example: 'MiPassword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:       { type: 'boolean' },
                    access_token:  { type: 'string' },
                    refresh_token: { type: 'string' },
                    mfa: {
                      type: 'object',
                      properties: {
                        configured: { type: 'boolean' },
                        next_step:  { type: 'string', enum: ['verify', 'setup'] },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Credenciales incorrectas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/auth/logout': {
      post: {
        tags:     ['Auth'],
        summary:  'Cerrar sesión',
        security: securityBearer,
        responses: {
          '200': { description: 'Sesión cerrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
        },
      },
    },

    '/api/auth/session': {
      get: {
        tags:     ['Auth'],
        summary:  'Obtener sesión activa',
        security: securityBearer,
        responses: {
          '200': {
            description: 'Datos de la sesión',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user:    { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } },
                    aal: {
                      type: 'object',
                      properties: {
                        current:      { type: 'string' },
                        next:         { type: 'string' },
                        mfa_complete: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'No autorizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/auth/password/forgot': {
      post: {
        tags:    ['Auth'],
        summary: 'Solicitar restablecimiento de contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Correo enviado', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
        },
      },
    },

    '/api/auth/password/reset': {
      post: {
        tags:    ['Auth'],
        summary: 'Restablecer contraseña con token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token:    { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Contraseña restablecida', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '400': { description: 'Token inválido o expirado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/auth/password/verify-2fa': {
      post: {
        tags:    ['Auth'],
        summary: 'Verificar 2FA antes de restablecer contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['factor_id', 'code'],
                properties: {
                  factor_id: { type: 'string' },
                  code:      { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Verificación exitosa', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '401': { description: 'Código incorrecto', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    // ── MFA ───────────────────────────────────────────────────────
    '/api/mfa/enroll': {
      post: {
        tags:     ['MFA'],
        summary:  'Registrar factor MFA (genera QR)',
        security: securityBearer,
        responses: {
          '200': {
            description: 'Factor creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:   { type: 'boolean' },
                    factor_id: { type: 'string' },
                    qr_code:   { type: 'string', description: 'SVG o URL del código QR' },
                  },
                },
              },
            },
          },
          '401': { description: 'No autorizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/mfa/factor': {
      get: {
        tags:     ['MFA'],
        summary:  'Obtener factor MFA verificado del usuario',
        security: securityBearer,
        responses: {
          '200': {
            description: 'Factor encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:   { type: 'boolean' },
                    factor_id: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { description: 'Sin factor registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/mfa/verify': {
      post: {
        tags:     ['MFA'],
        summary:  'Verificar código TOTP',
        security: securityBearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['factor_id', 'code'],
                properties: {
                  factor_id: { type: 'string' },
                  code:      { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Código verificado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success:       { type: 'boolean' },
                    message:       { type: 'string' },
                    access_token:  { type: 'string' },
                    refresh_token: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { description: 'Código incorrecto', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    // ── Admin ─────────────────────────────────────────────────────
    '/api/admin/users': {
      get: {
        tags:     ['Admin'],
        summary:  'Listar todos los usuarios',
        security: securityBearer,
        responses: {
          '200': {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    users:   { type: 'array', items: { $ref: '#/components/schemas/AdminUser' } },
                  },
                },
              },
            },
          },
          '401': { description: 'No autorizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Permisos insuficientes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/admin/invite': {
      post: {
        tags:     ['Admin'],
        summary:  'Crear nuevo usuario',
        security: securityBearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:       { type: 'string', format: 'email' },
                  password:    { type: 'string', minLength: 8 },
                  fullName:    { type: 'string', example: 'Juan Pérez' },
                  level:       { type: 'string', enum: ['admin_principal', 'admin_delegado', 'estandar'], default: 'estandar' },
                  permissions: { $ref: '#/components/schemas/UserPermissions' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Usuario creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    userId:  { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '400': { description: 'Datos inválidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Permisos insuficientes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/admin/update': {
      post: {
        tags:     ['Admin'],
        summary:  'Actualizar nivel, permisos y estado de un usuario',
        security: securityBearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId:      { type: 'string', format: 'uuid' },
                  fullName:    { type: 'string' },
                  level:       { type: 'string', enum: ['admin_principal', 'admin_delegado', 'estandar'] },
                  permissions: { $ref: '#/components/schemas/UserPermissions' },
                  banned:      { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Usuario actualizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '403': { description: 'Permisos insuficientes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Usuario no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/admin/delete': {
      post: {
        tags:     ['Admin'],
        summary:  'Eliminar usuario permanentemente',
        security: securityBearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: { userId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Usuario eliminado', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '400': { description: 'No puedes eliminarte a ti mismo', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Permisos insuficientes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/admin/reset-password': {
      post: {
        tags:     ['Admin'],
        summary:  'Cambiar contraseña de cualquier usuario',
        security: securityBearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'newPassword'],
                properties: {
                  userId:      { type: 'string', format: 'uuid' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Contraseña actualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '403': { description: 'Permisos insuficientes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },

    '/api/admin/promote': {
      post: {
        tags:     ['Admin'],
        summary:  'Promover usuario a administrador',
        security: securityBearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: { userId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Usuario promovido', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessage' } } } },
          '400': { description: 'No puedes modificar tu propio rol', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Permisos insuficientes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
  },
  };
}
