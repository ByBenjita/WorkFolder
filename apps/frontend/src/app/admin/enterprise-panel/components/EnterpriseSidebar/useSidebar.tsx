import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import type { AdminSection } from '../../types';

export interface NavItem {
  id: AdminSection;
  label: string;
  iconName: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home',        label: 'Home',               iconName: 'Home'       },
  { id: 'usuarios',    label: 'Usuarios Corp',       iconName: 'Users',      badge: '5/5' },
  { id: 'rrhh',        label: 'Módulo RRHH',         iconName: 'UserCheck',  badge: '3/3' },
  { id: 'boveda',      label: 'Bóveda Enterprise',   iconName: 'FolderLock' },
  { id: 'seguridad',   label: 'Seguridad Nivel 3',   iconName: 'Shield'     },
  { id: 'auditoria',   label: 'Auditoría Live',      iconName: 'Activity'   },
  { id: 'facturacion', label: 'Facturación',         iconName: 'Receipt'    },
];

export const useSidebar = () => {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return { loggingOut, handleLogout };
};
