export type PlanId = 'startup' | 'business' | 'enterprise';

export interface ModuloRRHH {
  titulo: string;
  extras: string[];
}

export interface Plan {
  id: PlanId;
  nombre: string;
  precio_mensual: number;
  precio_clp: number;
  iva_porcentaje: number;
  caracteristicas: string[];
  modulo_rrhh?: ModuloRRHH;
}

export const PLANES: Plan[] = [
  {
    id: 'startup',
    nombre: 'Startup',
    precio_mensual: 8,
    precio_clp: 7900,
    iva_porcentaje: 19,
    caracteristicas: [
      '50 GB Almacenamiento',
      '1 Admin + 2 Estándar',
      'Seguridad Nivel 1',
      'Soporte Básico',
    ],
  },
  {
    id: 'business',
    nombre: 'Business',
    precio_mensual: 10,
    precio_clp: 9990,
    iva_porcentaje: 19,
    caracteristicas: [
      '100 GB Almacenamiento por Usuario',
      '1 Admin + 4 Usuarios',
      'Marcas de Agua Dinámicas',
      'Seguridad Nivel 2',
    ],
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio_mensual: 15,
    precio_clp: 14990,
    iva_porcentaje: 19,
    caracteristicas: [
      '200 GB Almacenamiento por Usuario',
      '1 Admin + 5 Usuarios',
      'Módulo RRHH (Beta)',
      'Auditoría en Tiempo Real',
      'Seguridad Nivel 3',
    ],
    modulo_rrhh: {
      titulo: 'MÓDULO RRHH INCLUIDO:',
      extras: [
        '+ 3 Usuarios Receptores (Beta)',
        '+ 5 GB dedicados por receptor',
        '+ Usuario Extra RRHH: US$4 + IVA c/u',
      ],
    },
  },
];
